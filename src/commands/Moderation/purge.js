"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");
const ratelimits = new Set();

module.exports = class extends Command {
    constructor(...args) {
        //noinspection JSStringConcatenationToES6Template
        super(...args, {
            usage: "<amount> (member) [...flags]",
            description: "Removes/clears messages from the channel.",
            fullDescription: "The purge command removes messages from the channel it was used " +
            "in. It has the power to filter what type of messages are removed, from a single " +
            "member to the content in a message. A number in the range of **2** to **1000** " +
            "can be used.\n\n" +

            "Most flags support a `value` field being the limit for how many messages " +
            "to purge for the flag. For example, if you passed `--bots=3`, the bot would purge " +
            "at most `3` messages from bots and no more. Flags not supporting the limit field " +
            "will have another flag starting with the name, and ending with `limit`.\n\n" +

            "Beware of the amount of filters you apply. The amount you supply is the amount of " +
            "messages to fetch. For example, if you ask for 100 messages to be purged with the " +
            "`--bots` flag for only bots and there were only 30 messages from bots from the " +
            "fetched messages, only 30 messages will be removed. The bot won't be able to remove " +
            "messages further from that.\n\n" +

            "Examples:\n" + [
                "100` - Removes 100 messages, not including pins. Pinned messages **cannot** be " +
                "purged.",
                "20 Ayaya` - Removes up to 20 messages from a single member named \"Ayaya\".",
                "100 --bots` - Removes up to 100 messages from bots only.",
                "100 --bots=5` - Removes, at most, 5 messages from bots.",
                "100 --contains=frick` - Removes up to 100 messages containing \"frick\".",
                "100 --contains=frick --containslimit=30` - Removes, at most, 30 messages " +
                "containing \"frick\"."
            ].map((str) => `• \`${Constants.PRIMARY_PREFIX}purge ${str}`).join("\n"),
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["clear"],
            memberPermissions: ["manageMessages"],
            clientPermissions: ["manageMessages"],
            validatePermissions: (message) => {
                if (ratelimits.has(message.channel.id)) {
                    return `${Constants.Emojis
                        .STOPWATCH} The channel is currently being purged. Try again later.`;
                }

                return true;
            },
            flags: [
                {
                    name: "user",
                    value: "userID",
                    description: "Deletes messages from a user not in the guild. This is " +
                    "useful for if the user left the server. You must supply the ID of the user, " +
                    "which can be found by enabling Developer Mode (Settings -> Appearance -> " +
                    "Developer Mode). Right click the user's avatar and press, \"Copy ID\"."

                },
                {
                    name: "bots",
                    value: "number",
                    description: "Remove messages sent from bots (not webhooks)."
                },
                {
                    name: "humans",
                    value: "number",
                    description: "Remove messages from non-bots."
                },
                {
                    name: "webhooks",
                    value: "number",
                    description: "Remove messages from webhooks."
                },
                {
                    name: "contains",
                    value: "content",
                    description: "Remove messages containing a phrase."
                },
                {
                    name: "containsnot",
                    value: "content",
                    description: "Remove messages not containing a phrase. The inverted " +
                    "flag option for `contains`."
                },
                {
                    name: "startswith",
                    value: "content",
                    description: "Remove messages starting with a phrase."
                },
                {
                    name: "endswith",
                    value: "content",
                    description: "Removes messages ending with a phrase."
                },
                {
                    name: "links",
                    value: "number",
                    description: "Removes messages containing links. The link must start with a " +
                    "protocol (ex: https://...) to be counted as a link."
                },
                {
                    name: "invites",
                    value: "number",
                    description: "Removes messages containing invite links. At the moment, only " +
                    "Discord invite links (e.g. `discord.gg`) will be counted."
                },
                {
                    name: "images",
                    value: "number",
                    description: "Removes messages containing attachments (excluding embed images)."
                },
                {
                    name: "mentions",
                    value: "number",
                    description: "Removes message containing user mentions. In order to " +
                    "remove messages containing mentions like channels and `@ everyone`, use the " +
                    "`contains` flag instead."
                },
                {
                    name: "embeds",
                    value: "number",
                    description: "Remove messages containing rich embeds (sent from bots)."
                },
                {
                    name: "files",
                    value: "number",
                    description: "Remove messages containing file attachments (including images)."
                }
            ]
        });
    }

    /**
     * Runs the command.
     * @param {Eris.Message} message The message the command was called on.
     * @param {Number} amountArg The number of messages to purge.
     * @param {Array<String>} [memberSearch=[]] The search input for searching for a guild member.
     * @return {Promise<Eris.Message|*>}
     */
    async run(message, [amountArg, ...memberSearch]) {
        const flags = Util.messageFlags(message, this.client);
        let member = memberSearch.length ? null : "NONE";

        if (!member) {
            if (flags.user) {
                try {
                    member = await this.client.getRESTUser(memberSearch[0]);
                } catch (ex) {
                    if (ex.code === 10013) {
                        return message.channel.createMessage("No user with the user ID \"" +
                        `${memberSearch[0]}" found. Are you sure you supplied a user ID?`);
                    }

                    return this.handleException(message, ex);
                }
            } else {
                member = this.findMember(message, memberSearch, { strict: true });
            }
        }

        let amount = parseInt(amountArg, 10);

        if (isNaN(amount)) {
            return CommandError.ERR_INVALID_ARG_TYPE(message, "Amount", "number");
        }

        if (amount < 2 || amount > 1000) {
            if (amount < 2) {
                return message.channel
                    .createMessage("Invalid Usage: `Amount` cannot be under 2 messages.");
            } else if (amount === Infinity) {
                return message.channel.createMessage("Invalid Usage: `Amount` cannot be a " +
                "very large number (infinity).");
            }

            return message.channel.createMessage("Invalid Usage: `Amount` cannot be " +
            "over 1000 messages.");
        }

        if (member !== "NONE" && !member) {
            return CommandError.ERR_NOT_FOUND(message, "guild member", memberSearch.join(" "));
        }

        let badFlags = Object.keys(flags).filter((flag) => this.flags.find((flagInfo) => {
            // If the flag was found, the value was not a number (e.g. requires `<Flag>Limit`)
            // and the flag value from the `flags` object was the same, return true as the user.
            // needs to specify actual content.
            return flagInfo.name === flag && flagInfo.value !== "number" && flag === flags[flag];
        }));

        if (badFlags.length) {
            return message.channel.createMessage(`Invalid Usage: Flags \`${badFlags
                .join("`, ")}\` require input. Call each flag with a value field like \`--` +
                "flagName=banana`.");
        }

        let max = {
            bots: parseInt(flags.bots || flags.bot, 10) || amount,
            humans: parseInt(flags.humans || flags.human, 10) || amount,
            webhooks: parseInt(flags.webhooks || flags.webhook, 10) || amount,
            contains: parseInt(flags.containslimit || flags.containlimit, 10) || amount,
            containsnot: parseInt(flags.containsnotlimit || flags.containnotlimit, 10) || amount,
            startswith: parseInt(flags.startswithlimit || flags.startwithlimit, 10) || amount,
            startswithnot: parseInt(flags.startswithnotlimit || flags
                .startwithnotlimit, 10) || amount,
            endswith: parseInt(flags.endswithlimit || flags.endwithlimit, 10) || amount,
            endswithnot: parseInt(flags.endswithnotlimit || flags.endwithnotlimit, 10) || amount,
            links: parseInt(flags.links || flags.link, 10) || amount,
            invites: parseInt(flags.invites || flags.invite, 10) || amount,
            images: parseInt(flags.images || flags.image, 10) || amount,
            mentions: parseInt(flags.mentions || flags.mention, 10) || amount,
            embeds: parseInt(flags.embeds || flags.embed, 10) || amount,
            files: parseInt(flags.files || flags.file || flags.attachments || flags
                .attachments, 10) || amount
        };

        ratelimits.add(message.channel.id);
        let purgedMessages = [];

        try {
            await message.delete();
            await message.channel.purge(amount, (msg) => {
                if (this.checkMessage(msg, member, flags, max)) {
                    purgedMessages.push(msg);

                    return true;
                }

                return false;
            });
        } catch (ex) {
            if (ex.code === 50013 || ex.code === 50001) {
                return message.channel
                    .createMessage("I do not have permission to perform this action.");
            } else if (ex.code === 10008) {
                return;
            }

            return this.handleException(message, ex);
        } finally {
            ratelimits.delete(message.channel.id);
        }

        let history = {};

        for (const msg of purgedMessages) {
            if (history[msg.author.id]) {
                history[msg.author.id]++;
            } else {
                history[msg.author.id] = 1;
            }
        }

        let cleanHistory = Object.keys(history).map((userID) => {
            let member = message.channel.guild.members.get(userID);

            if (member) {
                return `**${Util.userTag(member)}**: ${history[userID]}`;
            }

            return `**???**: ${history[userID]}`;
        }).join("\n");

        return message.channel.createMessage(`${Constants.CustomEmojis.CHECKMARK} Successfully purged **${purgedMessages
            .length}** messages.\n\n${cleanHistory}`.substring(0, 2000))
            .then((msg) => Util.deleteMessage(msg, { time: 2500 }))
    }

    /**
     * Checks if a message passes the filter.
     *
     * @param {Eris.Message} msg The message instance.
     * @param {Eris.Member} [member] The member to restrict messages to as a filter.
     * @param {Object} flags The flags to use when filtering. Flags can have a value signaling
     * the maximum number of items for the filter to collect from that type.
     * @param {Object} max The object to use for filtering (`{ key: number }`).
     * @returns {Boolean} Whether the message passed the filter or not.
     */
    checkMessage(msg, member, flags, max) {
        if (msg.pinned || member && member !== "NONE" && msg.author.id !== member.user.id) {
            return false;
        }

        let escaped = false;

        for (const flag of Object.keys(flags)) {
            switch (flag) {
                case "bot":
                case "bots": {
                    if (max.bots - 1 >= 0 && msg.author.bot &&
                        msg.author.discriminator !== "0000") {
                        --max.bots;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "human":
                case "humans": {
                    if (max.humans - 1 >= 0 && !msg.author.bot) {
                        --max.humans;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "webhook":
                case "webhooks": {
                    if (max.webhooks - 1 >= 0 && msg.author.bot &&
                        msg.author.discriminator === "0000") {
                        --max.webhooks;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "contain":
                case "contains": {
                    let search = (flags.contain || flags.contains).toLowerCase();

                    if (max.contains - 1 >= 0 && msg.content.toLowerCase().includes(search)) {
                        --max.contains;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "containnot":
                case "containsnot": {
                    let search = (flags.containnot || flags.containsnot).toLowerCase();

                    if (max.containsnot - 1 >= 0 && !msg.content.toLowerCase().includes(search)) {
                        --max.containsnot;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "startwith":
                case "startswith": {
                    let search = (flags.startswith || flags.startwith).toLowerCase();

                    if (max.startswith - 1 >= 0 && msg.content.toLowerCase().startsWith(search)) {
                        --max.startswith;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "startwithnot":
                case "startswithnot": {
                    let search = (flags.startswithnot || flags.startwithnot).toLowerCase();

                    if (max.startswithnot - 1 >= 0 &&
                        !msg.content.toLowerCase().startsWith(search)) {
                        --max.startswithnot;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "endwith":
                case "endswith": {
                    let search = (flags.endswith || flags.endwith).toLowerCase();

                    if (max.endswith - 1 >= 0 && msg.content.toLowerCase().endsWith(search)) {
                        --max.endswith;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "endwithnot":
                case "endswithnot": {
                    let search = (flags.endswithnot || flags.endwithnot).toLowerCase();

                    if (max.endswithnot - 1 >= 0 && !msg.content.toLowerCase().endsWith(search)) {
                        --max.endswithnot;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "link":
                case "links": {
                    //noinspection LongLine
                    let matches = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/i
                        .test(msg.content);

                    if (max.links - 1 >= 0 && matches) {
                        --max.links;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "invite":
                case "invites": {
                    let matches = /(?:https?:\/\/)?discord(?:app\.com\/invite\/|\.gg\/).+/i
                        .test(msg.content);

                    if (max.invites - 1 >= 0 && matches) {
                        --max.invites;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "image":
                case "images": {
                    if (max.images - 1 >= 0 && msg.attachments.length &&
                        msg.attachments.some((attachment) => attachment.width)) {
                        --max.images;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "mention":
                case "mentions": {
                    if (max.mentions - 1 >= 0 && msg.mentions.length) {
                        --max.mentions;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "embed":
                case "embeds": {
                    if (max.embeds - 1 >= 0 && msg.embeds.length &&
                        msg.embeds.some((embed) => embed.type === "rich")) {
                        --max.embeds;

                        return true;
                    }

                    escaped = true;
                    break;
                }

                case "file":
                case "files":
                case "attachment":
                case "attachments": {
                    if (max.files - 1 >= 0 && msg.attachments.length &&
                        msg.attachments.some((attachment) => !attachment.width)) {
                        --max.attachments;

                        return true;
                    }

                    escaped = true;
                    break;
                }
            }
        }

        return !escaped;
    }
};