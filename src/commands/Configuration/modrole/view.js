"use strict";

const { Subcommand } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, { description: "Displays all configured moderator roles." });
    }
  
    async run(message) {
        let roles = (await this.client.commands.get("modrole").query(message, "roles"))?.roles
            .map((roleID) => message.channel.guild.roles.get(roleID).name) ?? [];

        if (roles.length) {
            return message.channel.createMessage(`**Moderator Role${roles.length === 1 ? "" : "s"}**: \`${roles
                .join("`, `")}\``);
        }

        return message.channel.createMessage("This server has no moderator role(s) set.");
    }
};