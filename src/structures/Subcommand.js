"use strict";

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const Turndown = require("turndown");

/**
 * @typedef {import("../Rin.js")} Client
 * @typedef {import("./Command.js")} Command
 */
class Subcommand {
    /**
     * @param {Client} client The client instance.
     * @param {Command} command The parent command.
     * @param {String} subcommandFile The file name of the subcommand file.
     * @param {Object} options Optional options for the subcommand.
     * @param {Boolean} [options.enabled=true] Whether the subcommand is enabled or not.
     * @param {String} [options.usage=""] The usage/syntax on how to use the subcommand.
     * @param {Number} [options.requiredArgs=0] The number of arguments required to pass
     * before running the command.
     * @param {String} [options.description=""] The short description for the subcommand.
     * @param {String} [options.fullDescription=""] The full description for the subcommand.
     */
    constructor(client, command, subcommandFile, options) {
        /**
         * The client instance.
         * @type {Client}
         */
        this.client = client;

        /**
         * The parent command.
         * @type {Command}
         */
        this.command = command;

        /**
         * The name of the subcommand.
         * @type {String}
         */
        this.name = subcommandFile.replace(".js", "");

        /**
         * Whether or not the subcommand is enabled.
         * @type {Boolean}
         */
        this.enabled = has(options, "enabled") ? options.enabled : true;

        /**
         * The syntax on how to use the subcommand.
         * @type {String}
         */
        this.usage = options.usage || "";

        /**
         * How many arguments are required in order to use the subcommand.
         * @type {Number}
         */
        this.requiredArgs = options.requiredArgs || 0;

        /**
         * The short description for the subcommand.
         * @type {String}
         */
        this.description = options.description || "";

        /**
         * The full description for the subcommand.
         * @type {String}
         */
        this.fullDescription = options.fullDescription || "";

        /**
         * The Turndown instance.
         * @type {TurndownService}
         */
        this.markdown = new Turndown({ hr: "- - -", fence: "```", codeBlockStyle: "fenced" });

        // noinspection JSValidateTypes
        /**
         * Escapes text that should not be present. This method is overwritten to allow markdown to be displays in
         * Discord embeds.
         * @param {String} str The string to escape.
         * @returns {String} The new string.
         */
        this.markdown.escape = (str) => str;
    }

    // noinspection JSCommentMatchesSignature
    /**
     * Runs the subcommand.
     * @param {Eris.Message} message The message instance.
     * @param {?Array<String>} args Arguments passed to the command (excluding the subcommand name).
     * @returns {Promise<*>} The value returned from the command execution.
     */
    async run() {
        this.client.logger.warn(`Subcommand ${this.command.name}/${this.name} (${this.command.category
            .name}) has no run method.`);
    }

    /**
     * Checks the status code of an HTTP(s) request.
     * @param {Response} res The response sent back.
     * @param {String} [convert=json] The type of value to convert the response to.
     * @param {Array<Number>} [statusCodes=[]] An array of valid status codes. The method checks if
     * the response was OK (code >= 200 && code <= 300), so there's no need to pass codes
     * in the 200 range.
     */
    checkStatus(res, convert = "json", statusCodes = []) {
        if (res.ok || statusCodes.includes(res.status)) {
            return res[convert]();
        }

        let err = new Error(`${res.status} ${res.statusText}`);
        err.code = res.status;

        throw err;
    }

    /**
     * Parses AniList-flavored markdown text.
     * @param {String} text The string of text to parse.
     * @param {Object} options The options to use when parsing. All options are optional.
     * @param {"remove"|"toHTML"} [options.linebreak="remove"] How to handle
     * parsing linebreaks.
     * @param {"remove"|"keep"} [options.longUnderline="remove"] How to handle parsing underlined
     * text longer than two characters.
     * @param {"replace"|"remove"|"snip"} [options.spoilers="replace"] How to handle parsing text
     * contained in spoilers. Replacing them will convert them to Discord-flavored spoilers
     * (||text||).
     * @param {"remove"|"keep"} [options.alignment="remove"] How to handle parsing aligned text.
     * @param {"remove"|"snip"} [options.images="remove"] How to handle parsing images.
     * @param {"replace"|"remove"} [options.youtubeLinks="replace"] How to handle parsing YouTube
     * video links.
     */
    parseALMarkdown(text, options = {}) {
        options = Object.assign({
            spoilers: "replace",
            linebreak: "remove",
            alignment: "remove",
            longUnderline: "remove",
            images: "remove",
            youtubeLinks: "replace"
        }, options);

        // noinspection JSValidateTypes
        let output = this.markdown.turndown(options.linebreak === "toHTML" ? text.replace(/\n/g, "<br>") : text);

        if (options.longUnderline === "remove") {
            output = output.replace(/_{3,}/g, "");
        }

        if (options.spoilers === "remove") {
            output = output.replace(/~!([^!]+[^~]+)~/g, "");
        } else if (options.spoilers === "snip") {
            output = output.replace(/~!([^!]+[^~]+)~/g, "<spoiler snip>");
        } else if (options.spoilers === "replace") {
            output = output.replace(/~!|!~/g, "||");
        }

        if (options.alignment === "remove") {
            output = output.replace(/~{3}/g, "");
        }

        if (options.images === "remove") {
            //noinspection LongLine
            output = output.replace(/(img(\d{1,4}%?)?|webm)\(\bhttps?:\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]\)/gi, "");
        } else if (options.images === "snip") {
            //noinspection LongLine
            output = output.replace(/(img(\d{1,4}%?)?|webm)\(\bhttps?:\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]\)/gi, "<image snip>");
        }

        if (options.youtubeLinks === "remove") {
            //noinspection LongLine
            output = output.replace(/youtube\(https?:\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w_-]{11})\)/g, "");
        } else if (options.youtubeLinks === "replace") {
            //noinspection LongLine
            output = output.replace(/youtube\(https?:\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w_-]{11})\)/g, (_txt, match) => `[YouTube](https://youtu.be/${match})`);
        }

        return output;
    }
}

module.exports = Subcommand;