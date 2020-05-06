"use strict";

const { Subcommand } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, { description: "Clears all moderator roles." });
    }
  
    async run(message) {
        let baseCommand = this.client.commands.get("modrole");
        let modroles = (await baseCommand.query(message, "roles"))?.roles;

        if (modroles?.length) {
            await this.client.db.run(`DELETE FROM modroles WHERE guildID = ?`, [message.guildID]);

            baseCommand.updateSettings(message.guildID, []);

            return message.channel.createMessage("The moderator roles list has been cleared.");
        }

        return message.channel.createMessage("This server has no moderator roles.");
    }
};