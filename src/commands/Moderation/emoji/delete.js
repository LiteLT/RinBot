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
        if (!message.channel.permissionsOf(message.author.id).has("manageEmojis")) {
            return message.channel.createMessage("You do not have permission to run this command.\n\n" +
            "Missing: `Manage Emojis`.");
        } else if (!message.channel.permissionsOf(this.client.user.id).has("manageEmojis")) {
            return message.channel.createMessage("I do not have permission to perform this action.\n\n" +
            "Missing: `Manage Emojis`.");
        }

        let emoji = this.client.commands.get("emoji").findEmoji(message.channel.guild, emojiArg);

        if (emoji) {
            await message.channel.guild.deleteEmoji(emoji.id);

            return message.channel.createMessage(`The \`:${emoji.name}:\` emoji has been deleted.`);
        }

        return CommandError.ERR_NOT_FOUND(message, "emoji", emojiArg);
    }
};