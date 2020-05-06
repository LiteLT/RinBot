"use strict";

const { Util, Command, Constants } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<add|remove> <member> (...role)",
            description: "Add/remove roles from a member or group of members.",
            fullDescription: "`@someone` refers to the member you want to add/remove roles from/to.\n\n" + [
                "`add @someone Member` — Adds the `Member` role to someone. If the member already has the role, this " +
                "command will fail.",

                "`remove @someone Member` — Removes the `Member` role from someone. If the member already has the " +
                "role, this command will fail.",

                "`add @someone Member, Special` — Adds the `Member` and `Special` role to someone. You can add as " +
                "many roles as you want separated by a comma. If the member already has one of the roles, the role " +
                "won't be added. The command will continue to run unless all roles are already added.",

                "`remove @someone Member, Special` — Removes the `Member` and `Special` role from someone. You can " +
                "remove as many roles as you want separated by a comma. If the member doesn't have one of the roles, " +
                "the role won't be removed. The command will continue to run unless the member doesn't have any of " +
                "the roles."
            ].map((str) => `${Constants.Emojis.WHITE_MEDIUM_SQUARE} ${str}`).join("\n"),
            cooldown: 5,
            guildOnly: true,
            memberPermissions: ["manageRoles"],
            clientPermissions: ["manageRoles"]
        });
    }

    async run(message) {
        return Util.reply(message, `invalid subcommand. Use \`${message.prefix}help ${this.name}\` for subcommands.`);
    }
};