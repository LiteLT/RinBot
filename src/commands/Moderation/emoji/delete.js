"use strict";

const { Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<emoji>",
            description: "Deletes an emoji",
            requiredArgs: 1
        });
    }

    async run(message, [emojiArg]) {
        let res = this.command.check(message, null);

        if (!res) {
            return;
        }

        let emoji = this.command.findEmoji(message.channel.guild, emojiArg);

        if (emoji) {
            await message.channel.guild.deleteEmoji(emoji.id);

            return message.channel.createMessage(`The \`:${emoji.name}:\` emoji has been deleted.`);
        }

        return CommandError.ERR_NOT_FOUND(message, "emoji", emojiArg);
    }
};