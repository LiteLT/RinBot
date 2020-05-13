"use strict";

const {
    Util,
    Constants,
    Endpoints,
    Subcommand,
    CommandError,
    ReactionCollector
} = require("../../../index.js");
const dateformat = require("dateformat");
const fetch = require("node-fetch");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<guild>",
            description: "Displays info on a guild.",
            fullDescription: "In order to search for a guild by the player, you must use the " +
            "`--player` flag.",
            requiredArgs: 1
        });
    }

    async run(message, args) {
        let flags = Util.messageFlags(message, this.client);
        let input = flags.player ? args[0].replace(/-/g, "") : args.join(" ");
        let msg = await message.channel.createMessage(`${Constants.CustomEmojis
            .LOADING} Loading (this may take a while)...`);
        let guildData = await this._request(input, flags.player ? "PLAYER" : "GUILD")
            .catch((err) => err);

        if (guildData instanceof Error) {
            switch (guildData.code) {
                case 404: {
                    switch (guildData.error || guildData.message) {
                        case "Not Found": {
                            await msg.delete().catch(() => {});

                            return CommandError.ERR_NOT_FOUND(message, "guild", input);
                        }

                        case "Failed to get player uuid":
                        case "Invalid username or UUID!": {
                            await msg.delete().catch(() => {});

                            return CommandError.ERR_NOT_FOUND(message, "player", input);
                        }

                        case "Player is not in a guild": {
                            return msg.edit("That player is not in a guild.");
                        }

                        default: {
                            if (!guildData.error) { // Yeah
                                throw new Error(`Slothpixel API Error: ${guildData.error}`);
                            }

                            return msg.edit(guildData.error);
                        }
                    }
                }

                case 422: {
                    return msg.edit("The UUID you entered is not a valid " +
                    "UUID.");
                }

                default: {
                    await msg.delete().catch(() => {});

                    return CommandError.ERR_API_ERROR(message, "Hypixel API");
                }
            }
        }

        if (guildData.success === false) {
            switch (guildData.cause) {
                case "Invalid API key": {
                    return msg.edit("There seems to be no API key present. " +
                    "Please join the support server and contact a staff member.");
                }

                default: {
                    if (!guildData.cause) { // Yes, this is intentional.
                        throw new Error(`Hypixel API Error Cause: ${guildData.cause}`);
                    }

                    return msg.edit(guildData.cause);
                }
            }
        }

        return this.result(message, flags, guildData, msg);
    }

    /**
     * Sends the result of the command to the user.
     * @param {Eris.Message} message The message the command was called on.
     * @param {Object<String, String>} flags An object of command flags.
     * @param {Object<String, Object>} guild The Hypixel guild data.
     * @param {Eris.Message} msg The loading message to be edited.
     * @return {Promise<void>}
     */
    async result(message, flags, guild, msg) {
        const { ENABLED: onEmoji, DISABLED: offEmoji } = Constants.CustomEmojis;
        let sendType = this.sendType(message, flags);
        let guildMaster = guild.members.find((member) => member.rank === "Guild Master").profile;
        let embedTemplate = {
            timestamp: new Date(guild.created),
            color: Util.base10(Constants.Colors.HYPIXEL),
            title: `${guild.name} ${guild.tag ? `[${guild.tag}]` : ""}`,
            url: Endpoints.PLANCKE_GUILD(encodeURIComponent(guild.name)),
            footer: { text: "Created" }
        };

        if (sendType === "embed") {
            msg = await msg.edit({
                content: "",
                embed: {
                    ...embedTemplate,
                    description: guild.description,
                    fields: [{
                        name: "Attributes",
                        value: [
                            `Level: **${guild.level}**`,
                            guild.legacy_ranking
                                ? `Legacy Rank: **${Util.commaify(guild.legacy_ranking)}**`
                                : null,
                            `Member Count: **${guild.members.length}**`,
                            `Guild Master: ${guildMaster ? `[${guildMaster.username}](${Endpoints
                                .PLANCKE_PLAYER(guildMaster.uuid)})` : "**???**"}`,
                            "",
                            `${guild.public ? onEmoji : offEmoji} Public.`,
                            `${guild.joinable ? onEmoji : offEmoji} Joinable.`
                        ].filter((prop) => prop !== null).join("\n")
                    }]
                }
            });
        } else if (sendType === "plain") {
            let bulletChar = "»";
            let content = `**${guild.name} ${guild.tag ? `[${guild.tag}]` : ""}**\n${guild
                .description.replace(/https?:\/\/[^ ]+/g, (str) => `<${str}>`)}\n\n` + [
                `Level: **${guild.level}**`,
                guild.legacy_ranking
                    ? `Legacy Rank: **${Util.commaify(guild.legacy_ranking)}**`
                    : null,
                `Member Count: **${guild.members.length}**`,
                `Guild Master: **${guildMaster?.username || "???"}**`,
                `Creation Date: **${dateformat(guild.created, "mmmm dS, yyyy")}**`
            ].filter((prop) => prop !== null).map((str) => `${bulletChar} ${str}`)
                .join("\n") + "\n\n" + [
                `${guild.public ? onEmoji : offEmoji} Public.`,
                `${guild.joinable ? onEmoji : offEmoji} Joinable.`
            ].join("\n");

            msg = await msg.edit(content);
        }

        if (message.channel.permissionsOf(this.client.user.id).has("addReactions") &&
            (guild.members.length > 1 || Object.values(guild.exp_by_game).length)) {
            let emojis = [
                Constants.Emojis.TRACK_PREVIOUS,
                Constants.Emojis.ARROW_BACKWARDS,
                Constants.Emojis.ARROW_FORWARD,
                Constants.Emojis.TRACK_NEXT,
                Constants.Emojis.STOP_BUTTON,
                Constants.Emojis.ONE_TWO_THREE_FOUR
            ];

            try {
                for (const emoji of emojis) {
                    await Util.sleep(1000);
                    await msg.addReaction(emoji);
                }
            } catch (ex) {
                if (ex.code === 10008 || ex.code === 30010 ||
                    ex.code === 50013 || ex.code === 90001) {
                    if (message.channel.permissionsOf(this.client.user.id).has("manageMessages")) {
                        msg.removeReactions().catch(() => {});
                    }

                    return;
                }
            }

            let emdash = "—";
            let pageNumber = 1;
            let isAwaitingResponse = false;
            let pageLayouts = [
                // I'm sorry...
                (pageNum) => ({
                    embed: {
                        content: "",
                        embed: {
                            ...embedTemplate,
                            description: guild.description,
                            footer: {
                                text: `Page ${pageNum}/${pageLayouts.length} | ${embedTemplate
                                    .footer.text}`
                            },
                            fields: [{
                                name: "Attributes",
                                value: [
                                    `Level: **${guild.level}**`,
                                    guild.legacy_ranking
                                        ? `Legacy Rank: **${Util.commaify(guild.legacy_ranking)}**`
                                        : null,
                                    `Member Count: **${guild.members.length}**`,
                                    `Guild Master: ${guildMaster ? `[${guildMaster.username}](${Endpoints
                                        .PLANCKE_PLAYER(guildMaster.uuid)})` : "**???**"}`,
                                    "",
                                    `${guild.public ? onEmoji : offEmoji} Public.`,
                                    `${guild.joinable ? onEmoji : offEmoji} Joinable.`
                                ].filter((prop) => prop !== null).join("\n")
                            }]
                        }
                    },
                    plain: (() => {
                        // I'm sorry...
                        let bulletChar = "»";

                        if (!guild.description) {
                            guild.description = "";
                        }

                        return `**${embedTemplate.title}**\n` +
                        guild.description.replace(/https?:\/\/[^ ]+/g, (str) => `<${str}>`) +
                            "\n\n" + [
                            `Page: **${pageNum}**/**${pageLayouts.length}**`,
                            `Level: **${guild.level}**`,
                            guild.legacy_ranking
                                ? `Legacy Rank: **${Util.commaify(guild.legacy_ranking)}**`
                                : null,
                            `Member Count: **${guild.members.length}**`,
                            `Guild Master: **${guildMaster?.username || "???"}**`,
                            `Creation Date: **${dateformat(guild.created, "mmmm dS, yyyy")}**`
                        ].filter((prop) => prop !== null).map((str) => `${bulletChar} ${str}`)
                            .join("\n") + "\n\n" + [
                            `${guild.public ? onEmoji : offEmoji} Public.`,
                            `${guild.joinable ? onEmoji : offEmoji} Joinable.`
                        ].join("\n");
                    })()
                }),
                guild.members.length > 1 ? (pageNum) => ({
                    embed: {
                        content: "",
                        embed: {
                            ...embedTemplate,
                            title: `${embedTemplate.title} > Members (${guild.members.length})`,
                            description: guildMaster ? null : "Unable to fetch guild members at this time. Try again " +
                                "later.",
                            footer: {
                                text: `Page ${pageNum}/${pageLayouts.length} | ${embedTemplate
                                    .footer.text}`
                            },
                            fields: guildMaster ? Util.arrayUnique(guild.members.map((member) => member.rank))
                                .map((guildRank) => {
                                    let rank = guild.ranks.find((rank) => rank.name === guildRank);

                                    return {
                                        name: guildRank,
                                        tag: rank ? rank.tag : null,
                                        priority: rank ? rank.priority : -1,
                                        members: guild.members
                                            .filter((member) => member.rank === guildRank)
                                    };
                                }).sort((a, b) => b.priority - a.priority).map((rank) => ({
                                    name: `${rank.name} ${rank.tag ? `[${rank.tag}]` : ""}`,
                                    value: (() => {
                                        let prefix = `**${rank.members.length}** ${emdash} `;
                                        let gMembers = rank.members
                                            .map((member) => `${member.profile.username
                                                .replace(/_/g, "\\_")}`);
                                        let members = Util.arrayJoinLimit(gMembers, ", ", Constants
                                            .Discord.MAX_EMBED_FIELD_VALUE_LENGTH - prefix.length);

                                        return prefix + members;
                                    })()
                                })) : null
                        }
                    },
                    plain: (() => {
                        let bulletChar = "»";

                        return `**${embedTemplate.title} > Members**\n` +
                        Util.arrayUnique(guild.members.map((member) => member.rank))
                            .map((guildRank) => {
                                let rank = guild.ranks.find((rank) => rank.name === guildRank);

                                return {
                                    name: guildRank,
                                    priority: rank ? rank.priority : -1,
                                    members: guild.members
                                        .filter((member) => member.rank === guildRank)
                                };
                            }).sort((a, b) => b.priority - a.priority)
                            .map((rank) => `${bulletChar} ${rank.name} ${emdash} **${rank
                                .members.length}** members.`).join("\n") + "\n\n" +
                            "**Note**: In order to see every guild member's username, the embed " +
                            "version of this command is required (Embed Links).";
                    })()
                }) : null,
                (pageNum) => ({
                    embed: {
                        content: "",
                        embed: {
                            ...embedTemplate,
                            title: `${embedTemplate.title} > EXP & Games`,
                            description: `Guild EXP: **${this.abbreviateNumber(guild.exp)}**`,
                            footer: {
                                text: `Page ${pageNum}/${pageLayouts.length} | ${embedTemplate
                                    .footer.text}`
                            },
                            fields: [
                                Object.values(guild.exp_history).some((exp) => exp > 0) ? {
                                    name: "Weekly EXP",
                                    value: Object.keys(guild.exp_history)
                                        .map((date) => guild.exp_history[date]
                                            ? `${dateformat(date, "dddd, mmmm dS")} ` +
                                            `${emdash} **${this.abbreviateNumber(guild
                                                .exp_history[date])}**`
                                            : null)
                                        .join("\n")
                                } : null,
                                Object.values(guild.exp_by_game).some((exp) => exp > 0) ? {
                                    name: "Game EXP",
                                    value: (() => {
                                        let gameNames = {
                                            Quake: "Quake",
                                            Walls: "Walls",
                                            Paintball: "Paintball",
                                            Blitz: "Blitz Survival Games",
                                            TNT: "TNT Games",
                                            VampireZ: "VampireZ",
                                            MegaWalls: "Mega Walls",
                                            Arcade: "Arcade",
                                            Arena: "Arena",
                                            UHC: "UHC Champions",
                                            CvC: "Cops and Criminals",
                                            Warlords: "Warlords",
                                            Smash: "Smash Heroes",
                                            TKR: "Turbo Kart Racers",
                                            Housing: "Housing",
                                            SkyWars: "SkyWars",
                                            CrazyWalls: "Crazy Walls",
                                            SpeedUHC: "Speed UHC",
                                            SkyClash: "SkyClash",
                                            Classic: "Classic Games",
                                            Prototype: "Prototype",
                                            BedWars: "Bed Wars",
                                            MurderMystery: "Murder Mystery",
                                            BuildBattle: "Build Battle",
                                            Duels: "Duels",
                                            SkyBlock: "SkyBlock",
                                            Pit: "The Pit"
                                        };

                                        return Util.arrayJoinLimit(Object.keys(guild.exp_by_game)
                                            .map((gameDBName) => {
                                                return `${gameNames[gameDBName]}: **${this
                                                    .abbreviateNumber(guild
                                                        .exp_by_game[gameDBName])}**`;
                                            }), "\n", Constants.Discord
                                            .MAX_EMBED_FIELD_VALUE_LENGTH);
                                    })()
                                } : null
                            ].filter((field) => field !== null)
                        }
                    },
                    plain: `**${embedTemplate.title} > Guild Experience**\nTotal: **${this
                        .abbreviateNumber(guild.exp)}**\n\n` +
                        (Object.values(guild.exp_history).some((exp) => exp > 0)
                            ? `**Weekly EXP**\n${Object.keys(guild.exp_history)
                                .map((date) => guild.exp_history[date]
                                    ? `${dateformat(date, "dddd, mmmm dS")} ${emdash} ` +
                                `**${this.abbreviateNumber(guild.exp_history[date])}**`
                                    : null).filter((day) => day !== null).join("\n")}`
                            : "")
                })
            ].filter((page) => page !== null);
            let collector = new ReactionCollector(this.client, (_msg, emoji, userID) => {
                return userID === message.author.id && emojis.includes(emoji.name);
            }, {
                time: 300000,
                messageID: msg.id,
                allowedTypes: ["ADD"],
                restartTimerOnCollection: true
            });

            collector.on("reactionAdd", async (msg, emoji, userID) => {
                if (message.channel.permissionsOf?.(this.client.user.id).has("manageMessages")) {
                    await msg.removeReaction(emoji.name, userID);
                }

                if (isAwaitingResponse) {
                    return;
                }

                switch (emoji.name) {
                    case Constants.Emojis.TRACK_PREVIOUS: {
                        if (pageNumber === 1) {
                            return;
                        }

                        pageNumber = 1;
                        break;
                    }

                    case Constants.Emojis.ARROW_BACKWARDS: {
                        if (pageNumber === 1) {
                            return;
                        }

                        pageNumber -= 1;
                        break;
                    }

                    case Constants.Emojis.ARROW_FORWARD: {
                        if (pageNumber === pageLayouts.length) {
                            return;
                        }

                        pageNumber += 1;
                        break;
                    }

                    case Constants.Emojis.TRACK_NEXT: {
                        if (pageNumber === pageLayouts.length) {
                            return;
                        }

                        pageNumber = pageLayouts.length;
                        break;
                    }

                    case Constants.Emojis.STOP_BUTTON: {
                        return collector.stop("stop");
                    }

                    case Constants.Emojis.ONE_TWO_THREE_FOUR: {
                        isAwaitingResponse = true;
                        let text = `What page would you like to jump to (1 - ${pageLayouts
                            .length})?`;
                        let response = await Util.messagePrompt(message, msg.channel, this
                            .client, text, 30000, [...Array(pageLayouts.length + 1).keys()]
                            .slice(1)).catch(() => null);

                        isAwaitingResponse = false;

                        if (response === null) {
                            return;
                        }

                        let newPage = parseInt(response.content, 10);

                        if (pageNumber === newPage) {
                            return;
                        }

                        pageNumber = newPage;
                        break;
                    }

                    default: {
                        return;
                    }
                }

                return msg.edit(pageLayouts[pageNumber - 1](pageNumber)[this.sendType(msg, flags)]);
            });

            collector.once("end", async (_collected, reason) => {
                if (reason === "cache") {
                    try {
                        msg = await msg.channel.getMessage(msg.id);
                    } catch {
                        return;
                    }
                }

                msg.removeReactions().catch(() => {});
            });
        }
    }

    abbreviateNumber(num) {
        let newValue = num;

        if (num >= 1000) {
            let suffixes = ["", "k", "m", "b", "t"];
            let suffixNum = Math.floor(("" + num).length / 3);
            let shortValue = "";

            for (let precision = 2; precision >= 1; precision--) {
                shortValue = parseFloat((suffixNum !== 0 ? num / 1000 ** suffixNum : num)
                    .toPrecision(precision));
                let dotLessShortValue = (shortValue + "").replace(/[^a-z0-9]+/gi, "");

                if (dotLessShortValue.length <= 2) {
                    break;
                }
            }

            if (shortValue % 1 !== 0) {
                shortValue = shortValue.toFixed(1);
            }

            newValue = shortValue + suffixes[suffixNum];
        }

        return newValue;
    }

    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel
            .permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }


        return "plain";
    }

    _request(input, type) {
        if (type === "PLAYER") {
            return fetch(Endpoints.SLOTHPIXEL_GUILD_PLAYERS(input)).then(this.checkStatus);
        } else if (type === "GUILD") {
            return fetch(Endpoints.HYPIXEL_API_GUILD_GUILD(Constants.HYPIXEL_API_KEY, input))
                .then(this.checkStatus)
                .then((guildData) => {
                    if (guildData.guild === null) {
                        let err = new Error("Not Found");
                        err.code = 404;

                        throw err;
                    } else if (!guildData.success) {
                        throw new Error("Failed.");
                    }

                    return fetch(Endpoints.SLOTHPIXEL_GUILD_PLAYERS(guildData.guild.members[0]
                        .uuid));
                }).then(this.checkStatus);
        }
    }
};