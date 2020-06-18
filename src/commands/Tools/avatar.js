"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "(member|user)",
            description: "Get a user's avatar.",
            fullDescription: "When used in a DM, the bot will always display your own avatar.",
            aliases: ["av"],
            flags: [{
                name: "noembed",
                description: "Sends the avatar as plain text (no embed). This is automatically " +
                "selected when I lack permission to `Embed Links`. If I lack permission to " +
                "`Attach Files`, the link to the avatar will be sent instead."
            }]
        });
    }

    async run(message, args) {
        let user = args.length && message.channel.guild
            ? this.findMember(message, args)
            : message.author;

        if (user) {
            if (user.user) {
                user = user.user;
            }
        } else {
            if (Util.isSnowflake(args[0])) {
                user = this.client.users.get(args[0]);

                if (!user) {
                    try {
                        user = await this.client.getRESTUser(args[0]);
                    } catch (ex) {
                        if (ex.code === 10013) {
                            return CommandError.ERR_INVALID_ARG_TYPE(message, args[0], "user ID");
                        }

                        return this.handleException(message, ex);
                    }
                }
            }
        }

        if (!user) {
            return CommandError.ERR_NOT_FOUND(message, "guild member", args.join(" "));
        }

        return this.result(message, user);
    }

    async result(message, user) {
        let flags = Util.messageFlags(message, this.client);

        /**
         * @enum {"embed"|"attach"|"plain"}
         */
        let sendType = this.sendType(message, flags);

        if (sendType === "embed") {
            return message.channel.createMessage({
                embed: {
                    timestamp: new Date(),
                    color: Util.base10(Constants.Colors.DEFAULT),
                    description: [
                        `[png](${user.dynamicAvatarURL("png", this.client.options.defaultImageSize)})`,
                        `[jpg](${user.dynamicAvatarURL("jpg", this.client.options.defaultImageSize)})`,
                        user.avatarURL === user.staticAvatarURL
                            ? null
                            : `[gif](${user.dynamicAvatarURL("gif", this.client.options.defaultImageSize)})`,
                        `[webp](${user.dynamicAvatarURL("webp", this.client.options.defaultImageSize)})`
                    ].filter((imageType) => imageType !== null).join(" | "),
                    image: { url: user.avatarURL },
                    author: { name: Util.userTag(user) },
                    footer: { text: `User ID: ${user.id}` }
                }
            });
        } else if (sendType === "attach") {
            let ext = user.avatarURL === user.staticAvatarURL ? this.client.options.defaultImageFormat : "gif";

            return message.channel.createMessage(`${Constants.Emojis.FRAME_PHOTO} **${Util
                .userTag(user)}'s avatar**`, {
                name: `avatar.${ext}`,
                file: await fetch(user.avatarURL).then((res) => res.buffer())
            });
        } else if (sendType === "plain") {
            return message.channel.createMessage(`${Constants.Emojis.FRAME_PHOTO} **${Util
                .userTag(user)}'s Avatar:**\n${user.avatarURL}`);
        }
    }

    sendType(message, flags) {
        let sendType;

        if (flags.noembed) {
            sendType = "attach";
        } else {
            sendType = "embed";
        }

        if (message.channel.guild) {
            if (sendType !== "attach" &&
                message.channel.permissionsOf(this.client.user.id).has("embedLinks")) {
                sendType = "embed";
            } else if (message.channel.permissionsOf(this.client.user.id).has("attachFiles")) {
                sendType = "attach";
            } else {
                sendType = "plain";
            }
        }

        return sendType;
    }
};