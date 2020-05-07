"use strict";

const { Util, Endpoints, Subcommand, CommandError } = require("../../../index.js");
const fetch = require("node-fetch");
const discordEmojiFileTypes = ["png", "jpg", "jpeg", "gif", "webp"];

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<emoji|url> <name>",
            description: "Creates an emoji.",
            fullDescription: "For security reasons, the URL must be a link to a Discord emoji and the emoji must be " +
            "an existing Discord emoji. To upload an image by its URL, you must download the image yourself and " +
            "upload it manually through server settings (`Server Settings` -> `Emojis` -> `Upload Emoji`).\n\n" +

            "To upload an emoji, paste the emoji in chat (for nitro users). To upload an emoji by its URL, hover on " +
            "an emoji and press, \"Copy Link\". Make sure the URL you paste is the emoji URL and not the message URL.",
            requiredArgs: 2
        });
    }
  
    async run(message, [emoji, ...name]) {
        if (!message.channel.permissionsOf(message.author.id).has("manageEmojis")) {
            return message.channel.createMessage("You do not have permission to run this command.\n\n" +
            "Missing: `Manage Emojis`.");
        } else if (!message.channel.permissionsOf(this.client.user.id).has("manageEmojis")) {
            return message.channel.createMessage("I do not have permission to perform this action.\n\n" +
            "Missing: `Manage Emojis`.");
        }

        name = name.join(" ");
        
        if (name.length < 2 || name.length > 32) {
            return CommandError.ERR_INVALID_RANGE(message, "name", "emoji name", 2, 32);
        }

        let base64Image = null;
        let emojiInfo = Util.parseCustomEmoji(emoji);

        if (new RegExp(`^https?://cdn\\.discordapp\\.com/emojis/\\d+\\.(?:${discordEmojiFileTypes
            .join("|")})(?:\\?(?:v=\\d+)?)?$`, "g").test(emoji)) {
            let emojiRegex = new RegExp(`^https?://cdn\\.discordapp\\.com/emojis/\\d+\\.(${discordEmojiFileTypes
                .join("|")})(?:\\?(?:v=\\d+)?)?$`, "g");
            let [emojiURL, type] = emoji.match(emojiRegex);

            base64Image = await this._requestEmoji(emojiURL, type).catch((err) => err);
        } else if (emojiInfo) {
            let type = emojiInfo.animated ? "gif" : "png";
            base64Image = await this._requestEmoji(Endpoints.DISCORD_EMOJI_ICON_URL(emojiInfo
                .id, type), type).catch((err) => err);
        }

        if (typeof base64Image === "string") {
            let emoji = await message.channel.guild.createEmoji({ name, image: base64Image });
            this.client.logger.log(emoji);

            return message.channel.createMessage(`The <${[
                emoji.animated ? "a" : "",
                emoji.name,
                emoji.id
            ].join(":")}> emoji has been created.`);
        } else if (base64Image instanceof Error) {
            throw base64Image;
        }

        return CommandError.ERR_INVALID_ARG_TYPE(message, "emoji", "HTTP(s) URL or custom emoji");
    }

    _requestEmoji(siteUrl, type) {
        return fetch(siteUrl)
            .then((res) => this.checkStatus(res, "buffer"))
            .then((buffer) => `data:image/${type};base64,${buffer.toString("base64")}`);
    }
};