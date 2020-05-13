"use strict";

const { modrole: modroleSettings } = require("../../../../assets/database/settings.js");
const { Util, Subcommand } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<...role>",
            description: "Adds a moderator role, or several mod roles.",
            fullDescription: `The server can have up to **${modroleSettings.maximumAmount}** moderator roles. To add ` +
            "several mod roles in one command, separate each role by a comma.",
            requiredArgs: 1
        });
    }

    async run(message, args) {
        let [roles, notFoundRoles] = Util.arrayPartition(args.join(" ").split(/, */).map((arg) => {
            return this.command.findRole(message, [arg], { strict: true }) || arg;
        }), (role) => typeof role !== "string");

        if (notFoundRoles.length) {
            return message.channel.createMessage(`Could not find the following roles: "${notFoundRoles
                .join("\", \"")}"`);
        }

        let modroles = (await this.command.query(message, "roles"))?.roles ?? [];
        let hasEntry = false;

        if (modroles.length) {
            hasEntry = true;

            let alreadyModRoles = roles.filter((role) => modroles.includes(role.id));

            if (alreadyModRoles.length === modroles.length) {
                return message.channel.createMessage(`The \`${roles.map((role) => role.name)
                    .join("`, `")}\` ${roles.length > 1
                        ? "roles are already marked as moderator roles."
                        : "role is already marked as moderator roles."}`);
            }

            roles = roles.filter((role) => !modroles.includes(role.id));

            if (modroles.length + roles.length > modroleSettings.maximumAmount) {
                return message.channel.createMessage(`The server cannot have more than **${modroleSettings
                    .maximumAmount}** moderator roles.`);
            }

            modroles.push(...roles.map((role) => role.id));
        } else {
            if (roles.length > modroleSettings.maximumAmount) {
                return message.channel.createMessage(`The server cannot have more than **${modroleSettings
                    .maximumAmount}** moderator roles.`);
            }

            modroles.push(...roles.map((role) => role.id));
        }

        if (hasEntry) {
            await this.client.db.run("UPDATE modroles SET roles = ? WHERE guildID = ?", [
                modroles.join(","),
                message.guildID
            ]);
        } else {
            await this.client.db.run(`INSERT INTO modroles (roles, guildID) VALUES (?, ?)`, [
                modroles.join(","),
                message.guildID
            ]);
        }

        this.command.updateSettings(message.guildID, modroles);

        return message.channel.createMessage(`The \`${roles.map((role) => role.name)
            .join("`, `")}\` ${roles.length > 1
                ? "roles have been marked as moderator roles."
                : "role has been marked as a moderator role."}`);
    }
};