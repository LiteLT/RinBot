"use strict";

const { Util, Command } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<create|delete> (emoji)",
            description: "Manages guild emojis.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["emote"],
            memberPermissions: ["manageEmojis"],
            clientPermissions: ["manageEmojis"]
        });
    }

    async run(message) {
        return Util.reply(message, `invalid subcommand. Use \`${message.prefix}help ${this.name}\` for subcommands.`);
    }

    findEmoji(guild, query) {
        for (const emoji of guild.emojis) {
            if (emoji.id === query) {
                return emoji;
            }

            let emojiText = `<${[
                emoji.animated ? "a" : "",
                emoji.name,
                emoji.id
            ].join(":")}>`;

            console.log;

            if (emojiText === query) {
                return emoji;
            }
        }

        return null;
    }
};