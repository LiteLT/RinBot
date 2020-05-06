"use strict";

const { Subcommand } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            description: "Displays all guild prefixes.",
            fullDescription: "Note: The bot can always be mentioned as a prefix. You cannot remove the @ mention " +
            "prefix."
        });
    }
  
    async run(message) {
        let prefixes = (await this.client.commands.get("prefix").query(message.guildID, "prefixes"))?.prefixes ?? [];

        if (prefixes[0]) {
            return message.channel.createMessage(`**Guild Prefixes:** \`${prefixes.join("`, `")}\``);
        }

        return message.channel.createMessage("This server has no custom prefixes.");
    }
};