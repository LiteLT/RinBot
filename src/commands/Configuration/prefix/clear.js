"use strict";

const { Util, Subcommand } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            description: "Removes all prefixes.",
            fullDescription: "All prefixes (including default ones) will be removed. If you want to reset to the " +
            "original state, use the `reset` command instead. You'll need to mention the bot to use it (`@Bot " +
            "prefix`)."
        });
    }
  
    async run(message) {
        let prefixes = (await this.client.commands.get("prefix").query(message.guildID, "prefixes"))?.prefixes ?? [];

        if (prefixes[0]) {
            this.client.commands.get("prefix").updateSettings(message.guildID, []);

            await this.client.db.run("UPDATE prefixes SET prefixes = ? WHERE guildID = ?", ["", message.guildID]);
            
            return message.channel.createMessage("The server prefixes have been cleared. You need to mention me to " +
            `set a new one (\`@${Util.userTag(this.client.user)} prefix\`).`);
        }

        return message.channel.createMessage("This server has no prefixes.");
    }
};