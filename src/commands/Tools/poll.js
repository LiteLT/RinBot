"use strict";

const { Util, Command, Constants } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<question>",
            description: "Creates a poll for members to react yes/no to.",
            cooldown: 5,
            requiredArgs: 1,
            guildOnly: true
        });
    }

    async run(message, args) {
        let msg = await message.channel.createMessage(Util.stringLimit(`**${Util.userTag(message.author)} asks**: ${args
            .join(" ")}`, Constants.Discord.MAX_MESSAGE_LENGTH));

        await msg.addReaction(Constants.Emojis.THUMBS_UP);
        await msg.addReaction(Constants.Emojis.THUMBS_DOWN);
    }
};