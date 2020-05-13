"use strict";

const { Util, Command, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<info|create|delete|rename> (emoji)",
            description: "Manages guild emojis.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["emote"]
        });
    }

    async run(message) {
        return Util.reply(message, `invalid subcommand. Use \`${message.prefix}help ${this.name}\` for subcommands.`);
    }

    /**
     * Finds an emoji in a guild.
     * @param {Eris.Guild} guild The guild.
     * @param {String} query The search string.
     * @return {?Eris.Emoji} The emoji. `null` if not found.
     */
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

            if (emojiText === query) {
                return emoji;
            }
        }

        return null;
    }

    /**
     * Checks pre-conditions with the command.
     * @param {Eris.Message} message The message instance.
     * @param {?Array<String>} args Arguments to pass to the command.
     * @return {Boolean} Whether or not the check passed successfully.
     */
    check(message, args) {
        if (!message.channel.permissionsOf(message.author.id).has("manageEmojis")) {
            message.channel.createMessage("You do not have permission to run this command.\n\n" +
            "Missing: `Manage Emojis`.");

            return false;
        } else if (!message.channel.permissionsOf(this.client.user.id).has("manageEmojis")) {
            message.channel.createMessage("I do not have permission to perform this action.\n\n" +
            "Missing: `Manage Emojis`.");

            return false;
        }

        if (args) {
            let name = args.join(" ");

            if (name.length < 2 || name.length > 32) {
                CommandError.ERR_INVALID_RANGE(message, "name", "emoji name", 2, 32);

                return false;
            }
        }

        return true;
    }
};