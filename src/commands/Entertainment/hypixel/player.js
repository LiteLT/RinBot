"use strict";

const {
    Util,
    Constants,
    Endpoints,
    Subcommand,
    CommandError,
    HypixelLeveling
} = require("../../../index.js");
const dateformat = require("dateformat");
const fetch = require("node-fetch");
const ms = require("ms");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<username|uuid>",
            description: "Search for a player by their username or UUID.",
            fullDescription: "You can find the UUID of a player on a site like NameMC.\n\n" +
            "If the username of a player is not working, try using their previous username and " +
            "make sure the spelling is correct.",
            requiredArgs: 1
        });
    }

    async run(message, args) {
        let type = args[0].length > 16 ? "UUID" : "USERNAME";
        let usernameOrUUIDSafe = encodeURIComponent(args[0]);
        let playerData = await this._request(Constants.HYPIXEL_API_KEY, usernameOrUUIDSafe, type)
            .catch((err) => err);

        if (playerData instanceof Error) {
            if (playerData.code === 422) {
                return message.channel.createMessage("The UUID you entered is not a valid UUID.");
            }

            return CommandError.ERR_API_ERROR(message, "Hypixel API");
        }

        if (playerData.success === false) {
            switch (playerData.cause) {
                case "Invalid API key": {
                    return message.channel.createMessage("There seems to be no API key present. " +
                    "Please join the support server and contact a staff member.");
                }

                default: {
                    if (!playerData.cause) { // Yes, this is intentional.
                        throw new Error(`Hypixel API Error Cause: ${playerData.cause}`);
                    }

                    return message.channel.createMessage(playerData.cause);
                }
            }
        }

        if (playerData.player === null) {
            return CommandError.ERR_NOT_FOUND(message, `${type === "UUID"
                ? "player with UUID"
                : "player"}`, args[0]);
        }

        playerData = playerData.player;

        let guildData = await this._request(Constants.HYPIXEL_API_KEY, playerData.uuid, "GUILD")
            .catch((err) => err);

        if (guildData instanceof Error) {
            return CommandError.ERR_API_ERROR(message, "Hypixel API");
        }

        if (guildData.success === false) {
            if (!guildData.cause) { // Yes, this is intentional.
                throw new Error(`Hypixel API Error Cause: ${guildData.cause}`);
            }

            return message.channel.createMessage(guildData.cause);
        }

        return this.result(message, playerData, guildData.guild);
    }

    result(message, player, guild) {
        let flags = Util.messageFlags(message, this.client);
        let sendType = this.sendType(message, flags);
        let online = player.lastLogin > player.lastLogout;
        let rank = (player.prefix || player.rank || player.newPackageRank ||
        player.packageRank || "NONE")
            .replace(/_PLUS/g, "+")
            .replace(/§[a-f0-9]/gi, "");
        let colors = {
            VIP: "54FF54",
            VIP_PLUS: "54FF54",
            MVP: "55FFFF",
            MVP_PLUS: "55FFFF",
            MVP_PLUS_PLUS: "FFAA00",
            HELPER: "5555FF",
            MODERATOR: "00AA00",
            ADMIN: "FF5554",
            YOUTUBER: "FF5554"
        };

        let embedColor = rank && colors[player.rank || player.newPackageRank || player
            .packageRank] || null;

        if (rank === "MVP+" && player.mostRecentMonthlyPackageRank === "SUPERSTAR") {
            embedColor = colors.MVP_PLUS_PLUS;
            rank = "MVP++";
        }

        if (rank === "NONE") {
            rank = null;
        } else if (!rank.includes("[")) {
            rank = `[${rank}]`;
        }

        if (sendType === "embed") {
            let socialMedia = player.socialMedia && player.socialMedia.links;

            return message.channel.createMessage({
                embed: {
                    title: [
                        rank,
                        player.displayname,
                        guild && guild.tag ? `[${guild.tag.replace(/§[a-f0-9]/gi, "")}]` : null
                    ].filter((prop) => prop !== null).join(" "),
                    timestamp: new Date(player.firstLogin),
                    url: Endpoints.PLANCKE_PLAYER(player.uuid),
                    color: Util.base10(embedColor || Constants.Colors.HYPIXEL),
                    thumbnail: { url: Endpoints.VISAGE_BUST(player.uuid) },
                    footer: {
                        text: `${online ? "Online" : "Offline"} | First Login`,
                        icon_url: Endpoints.DISCORD_EMOJI_ICON_URL(Util.parseCustomEmoji(online
                            ? Constants.CustomEmojis.HYPIXEL_ONLINE
                            : Constants.CustomEmojis.HYPIXEL_OFFLINE).id)
                    },
                    fields: [
                        {
                            name: "Level",
                            value: `\`${HypixelLeveling.getExactLevel(player.networkExp)
                                .toFixed(2)}\``,
                            inline: true
                        },
                        {
                            name: "Karma",
                            value: `\`${Util.commaify(player.karma || 0)}\``,
                            inline: true
                        },
                        {
                            name: "Last Login",
                            value: `${dateformat(player.lastLogin, "mmmm dS, yyyy")} ${player
                                .lastLogin
                                ? `(${ms(Date.now() - player.lastLogin, { long: true })} ago)`
                                : ""}`,
                            inline: true
                        },
                        {
                            name: "Minecraft Version",
                            value: `\`${player.mcVersionRp || "Unknown"}\``,
                            inline: true
                        },
                        {
                            name: "Achievement Points",
                            value: `\`${Util.commaify(player.achievementPoints || 0)}\``,
                            inline: true
                        },
                        {
                            name: "Guild",
                            value: guild
                                ? `[${guild.name}](${Endpoints
                                    .PLANCKE_GUILD(encodeURIComponent(guild.name))})`
                                : "None",
                            inline: true
                        },
                        {
                            name: "Social Media",
                            value: socialMedia && Object.keys(socialMedia).length
                                ? `**${Object.keys(socialMedia).map((mediaName) => {
                                    if (mediaName === "DISCORD") {
                                        let discord = socialMedia[mediaName];

                                        if (/(?:https?:\/\/)?(?:www\.)?discord.gg\/\w+/
                                            .test(discord)) {
                                            if (!discord.startsWith("http")) { // Yeah, ask Hypixel.
                                                discord = `https://${discord}`;
                                            }

                                            return `[Discord Server](${discord})`;
                                        }

                                        return `${Constants.CustomEmojis
                                            .DISCORD_LOGO} ${discord}`;
                                    } else if (mediaName === "TWITTER") {
                                        let twitter = socialMedia[mediaName];

                                        if (/https?:\/\//.test(twitter)) {
                                            socialMedia[mediaName] = `https://twitter.com/${twitter}`;
                                        }
                                    } else if (mediaName === "YOUTUBE") {
                                        let youtube = socialMedia[mediaName];

                                        if (/https?:\/\//.test(youtube)) {
                                            socialMedia[mediaName] = `https://www.youtube.com/user/${youtube}`;
                                        }
                                    }

                                    let mediaTitles = {
                                        HYPIXEL: "Hypixel Forums",
                                        TWITTER: "Twitter",
                                        YOUTUBE: "YouTube",
                                        INSTAGRAM: "Instagram",
                                        TWITCH: "Twitch",
                                        MIXER: "Mixer"
                                    };
                                    let socialMediaURL = socialMedia[mediaName];

                                    return `[${mediaTitles[mediaName] || "?"}](${socialMediaURL})`;
                                }).sort((a, b) => {
                                    return b.startsWith(Constants.CustomEmojis.DISCORD_LOGO)
                                        ? 1
                                        : -1;
                                }).join(" | ")}**`
                                : "None"
                        }
                    ]
                }
            });
        } else if (sendType === "plain") {
            let title = [
                player.displayname,
                guild && guild.tag ? `[${guild.tag.replace(/§[a-f0-9]/gi, "")}]` : null
            ].filter((prop) => prop !== null).join(" ");

            let bulletChar = "»";
            let { ENABLED: onEmoji, DISABLED: offEmoji } = Constants.CustomEmojis;
            let content = `**${title}**\n` + [
                `Rank: **${rank || "None"}**`,
                `Last Login: **${dateformat(player.lastLogin, "mmmm dS, yyyy")}** ${player.lastLogin
                    ? `(${ms(Date.now() - player.lastLogin, { long: true })} ago)`
                    : ""}`,
                `First Login: **${dateformat(player.firstLogin, "mmmm dS, yyyy")}**`
            ].map((str) => `${bulletChar} ${str}`).join("\n") + "\n\n" + [
                `${online ? `${onEmoji} Online` : `${offEmoji} Offline`}`
            ].join("\n");

            return message.channel.createMessage(content);
        }
    }

    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel
            .permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }

        return "plain";
    }

    _request(key, input, type = "USERNAME") {
        if (type === "USERNAME") {
            return fetch(Endpoints.HYPIXEL_API_PLAYER_USERNAME(key, input)).then(this.checkStatus);
        } else if (type === "UUID") {
            return fetch(Endpoints.HYPIXEL_API_PLAYER_UUID(key, input)).then(this.checkStatus);
        } else if (type === "GUILD") {
            return fetch(Endpoints.HYPIXEL_API_GUILD_PLAYER(key, input)).then(this.checkStatus);
        }
    }
};