"use strict";

const { Subcommand } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, { description: "Displays all enabled logging types mapped by their channels." });
    }
  
    async run(message) {
        let types = {
            modlogs: {
                name: "Modlogs",
                type: "channel"
            }
        };

        let logSettings = await this.client.commands.get("logging")
            .query(message, Object.keys(types).join(", ")) || null;

        if (logSettings) {
            return message.channel.createMessage(Object.entries(logSettings).map(([key, value]) => {
                let typeData = types[key];

                return `**${typeData.name}** — ${this.parseType(message, typeData.type, value)}`;
            }).join("\n"));
        }

        return message.channel.createMessage("This server has no configured logging channels.");
    }

    parseType(message, type, value) {
        switch (type) {
            case "channel": {
                let channel = message.channel.guild.channels.get(value);

                if (channel) {
                    return `${channel.mention} (\`${channel.name}\`)`;
                }

                return `??? (ID: ${value})`;
            }

            default: {
                return null;
            }
        }
    }
};