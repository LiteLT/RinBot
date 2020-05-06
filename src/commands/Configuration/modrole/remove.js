"use strict";

const { Util, Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<...role>",
            description: "Removes a moderator role, or several mod roles.",
            requiredArgs: 1
        });
    }
  
    async run(message, args) {
        let baseCommand = this.client.commands.get("modrole");
        let [roles, notFoundRoles] = Util.arrayPartition(args.join(" ").split(/, */).map((arg) => {
            return baseCommand.findRole(message, [arg], { strict: true }) || arg;
        }), (role) => typeof role !== "string");

        if (notFoundRoles.length) {
            return CommandError.ERR_NOT_FOUND(message, "roles", notFoundRoles.join("\", \""));
        }

        let modroles = (await baseCommand.query(message, "roles"))?.roles;

        if (modroles) {
            if (roles.every((role) => !modroles.includes(role.id))) {
                return CommandError.ERR_NOT_FOUND(message, "moderator roles", roles.map((role) => role.name)
                    .join("\", \""));
            }

            let removedRoles = roles.filter((role) => modroles.includes(role.id));
            modroles = modroles.filter((roleID) => roles.every((role) => role.id !== roleID));

            if (modroles.length) {
                await this.client.db.run(`UPDATE modroles SET roles = ? WHERE guildID = ?`, [
                    modroles.join(","),
                    message.guildID
                ]);
            } else {
                await this.client.db.run(`DELETE FROM modroles WHERE guildID = ?`, [message.guildID]);
            }

            baseCommand.updateSettings(message.guildID, modroles);

            return message.channel.createMessage(`The \`${removedRoles.map((role) => role.name)
                .join("`, `")}\` ${removedRoles.length > 1
                    ? "roles are no longer moderator roles."
                    : "role is no longer a moderator role."}`);
        }

        return message.channel.createMessage("This server has no moderator roles.");
    }
};