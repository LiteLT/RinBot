"use strict";

const { Constants, Subcommand } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            description: "Resets the server prefixes to their original state.",
            fullDescription: `The default prefixes are \`${Constants.BOT_PREFIXES.join("`, `")}\``
        });
    }
  
    async run(message) {
        let prefixes = (await this.client.commands.get("prefix").query(message.guildID, "prefixes"))?.prefixes ?? [];

        if (prefixes.length) {
            this.client.commands.get("prefix").updateSettings(message.guildID, null);

            await this.client.db.run(`DELETE FROM prefixes WHERE guildID = ?`, [message.guildID]);

            return message.channel.createMessage("The server prefixes have been reset.");
        }

        return message.channel.createMessage("This server has no prefixes.");
    }
};