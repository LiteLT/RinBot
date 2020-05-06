"use strict";

const { Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<emoji> <name>",
            description: "Renames an emoji.",
            requiredArgs: 2
        });
    }
  
    async run(message, [emojiArg, ...name]) {
        name = name.join(" ");

        if (name.length < 2 || name.length > 32) {
            return CommandError.ERR_INVALID_RANGE(message, "name", "emoji name", 2, 32);
        }

        let emoji = this.client.commands.get("emoji").findEmoji(message.channel.guild, emojiArg);

        if (emoji) {
            await message.channel.guild.editEmoji(emoji.id, { name });

            return message.channel.createMessage(`The \`:${emoji.name}:\` emoji has been renamed to \`:${name}:\``);
        }

        return CommandError.ERR_NOT_FOUND(message, "emoji", emojiArg);
    }
};