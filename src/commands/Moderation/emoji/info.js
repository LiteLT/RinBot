"use strict";

const { Util, Constants, Endpoints, Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<emoji>",
            description: "Displays information on an emoji.",
            fullDescription: "To get the URL of an emoji, use the `--icon` flag. The `--noembed` flag is supported.",
            requiredArgs: 1
        });
    }

    async run(message, [emojiArg]) {
        let emoji = this.command.findEmoji(message.channel.guild, emojiArg);

        if (emoji) {
            let flags = Util.messageFlags(message, this.client);
            let type = emoji.animated ? "gif" : "png";

            if (flags.icon || flags.iconurl) {
                return message.channel.createMessage(`Icon URL: ${Endpoints.DISCORD_EMOJI_ICON_URL(emoji.id, type)}`);
            }

            let sendType = this.sendType(message, flags);
            let { ENABLED: onEmoji, DISABLED: offEmoji } = Constants.CustomEmojis;

            if (sendType === "embed") {
                return message.channel.createMessage({
                    embed: {
                        title: emoji.name,
                        color: Util.base10(Constants.Colors.DEFAULT),
                        description: [
                            `${emoji.managed ? onEmoji : offEmoji} Managed.`,
                            `${emoji.animated ? onEmoji : offEmoji} Animated.`
                        ].join("\n"),
                        footer: { text: `Emoji ID: ${emoji.id}` },
                        thumbnail: { url: Endpoints.DISCORD_EMOJI_ICON_URL(emoji.id, type) },
                        fields: emoji.roles.length ? [{
                            name: "Roles",
                            value: emoji.roles.map((roleID) => message.channel.guild.roles.get(roleID))
                                .filter((role) => role !== null)
                                .map((role) => role.mention)
                                .join(" ")
                        }] : null
                    }
                });
            } else if (sendType === "plain") {
                let content = `**${emoji.name}** <${[
                    emoji.animated ? "a" : "",
                    emoji.name,
                    emoji.id
                ].join(":")}>\n` +
                `» Emoji ID: \`${emoji.id}\`\n\n` + [
                    `${emoji.managed ? onEmoji : offEmoji} Managed.`,
                    `${emoji.animated ? onEmoji : offEmoji} Animated.\n`
                ].join("\n");

                return message.channel.createMessage(content);
            }
        }

        return CommandError.ERR_NOT_FOUND(message, "emoji", emojiArg);
    }

    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild ||
            message.channel.permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }

        return "plain";
    }
};