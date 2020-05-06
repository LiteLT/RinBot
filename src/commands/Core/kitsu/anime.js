"use strict";

const { Util, Constants, Endpoints, Subcommand, CommandError, KitsuMedia } = require("../../../index.js");
const dateformat = require("dateformat");
const fetch = require("node-fetch");

/**
 * @typedef {import("eris").Message} Message
 */
module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<...search>",
            description: "Search for an anime.",
            requiredArgs: 1
        });
    }
  
    async run(message, args) {
        let flags = Util.messageFlags(message, this.client);
        let fields = [
            "nsfw",
            "status",
            "titles",
            "endDate",
            "subtype",
            "synopsis",
            "ageRating",
            "startDate",
            "userCount",
            "ratingRank",
            "posterImage",
            "episodeCount",
            "averageRating",
            "episodeLength",
            "favoritesCount",
            "popularityRank",
            "youtubeVideoId",
            "abbreviatedTitles",

            // Relationships.
            "genres",
            "categories"
        ];
        let ageRating = message.channel.nsfw ? "G,PG,R,R18" : "G,PG,R";
        let mediaData = (await this._request(encodeURIComponent(args.join(" ")), flags.all ? 10 : 1, fields
            .join(","), ageRating)).data;
        let media = null;

        if (mediaData.length) {
            if (flags.all) {
                media = await this.prompt(message, flags, mediaData, args.join(" "));
            } else {
                [media] = mediaData;
            }
        } else {
            return CommandError.ERR_NOT_FOUND(message, "anime", args.join(" "));
        }

        if (media) {
            media = new KitsuMedia(media);

            return this.result(message, flags, media);
        }
    }

    /**
     * The rest of the command.
     * @param {Message} message The message to reference.
     * @param {Object} flags The flags used with the message.
     * @param {KitsuMedia} media The media to reference.
     * @returns {Promise<void>}
     */
    async result(message, flags, media) {
        let sendType = this.sendType(message, flags);
        let invisibleSpace = "​ ";
        let content = null;
        let embedStructure = {
            title: [
                media.getTitle(),
                media.nsfw ? Constants.Emojis.UNDERAGE : null
            ].filter((label) => label !== null).join(" "),
            url: Endpoints.KITSU_ANIME(media.id),
            color: Util.base10(Constants.Colors.KITSU),
            thumbnail: { url: media.posterImage }
        };

        const mediaType = (type) => ({
            OVA: "OVA",
            ONA: "ONA",
            TV: "TV",
            movie: "Movie",
            music: "Music",
            special: "Special"
        })[type] || null;

        const mediaStatus = (status) => ({
            current: "Current",
            finished: "Finished",
            tba: "To be Announced",
            unreleased: "Unreleased",
            upcoming: "Upcoming"
        })[status] || null;

        const mediaAgeRating = (ageRating) => ({
            G: "General Audience", // eslint-disable-line id-length
            PG: "Parental Guidance Suggested",
            R: "Restricted", // eslint-disable-line id-length
            R18: "Explicit 18+"
        })[ageRating] || null;

        if (sendType === "embed") {
            content = {
                embed: {
                    ...embedStructure,
                    description: media.synopsis,
                    fields: [
                        {
                            name: "Rankings",
                            value: [
                                `**Categories**: ${(await media.getCategories()).map((category) => category.name)
                                    .join(", ") || "None"}\n`,
                                // NOTE: Change this once you're done with the file.
                                `${Constants.Emojis.HEART} **Rank #${media.rankings.rating} (Most Popular Anime)**`,
                                `${Constants.Emojis.STAR} **Rank #${media.rankings.popularity} (Highest Rated Anime)**`
                            ].join("\n")
                        },
                        {
                            name: "Anime Details",
                            value: [
                                `Type: **${mediaType(media.format) || "?"}**`,
                                `Episodes: **${media.episode.count || "?"}** (${media.episode.length} minutes each)`,
                                `Status: **${mediaStatus(media.status) || "?"}**`,
                                `Aired: **${[
                                    media.startDate ? dateformat(media.startDate, "mediumDate") : null,
                                    media.endDate ? dateformat(media.endDate, "mediumDate") : null
                                ].filter((date) => date !== null).join("** to **") || "?"}**`,
                                `Rating: **${media.ageRating
                                    ? `${media.ageRating} — ${mediaAgeRating(media.ageRating)}`
                                    : "?"}**`,
                                "Titles:\n" + [
                                    media.title.english ? `English: \`${media.title.english}\`` : null,
                                    media.title.romaji ? `Romaji: \`${media.title.romaji}\`` : null,
                                    media.title.japanese ? `Japanese: \`${media.title.japanese}\`` : null,
                                    media.title.alternativeTitles.length
                                        ? `Synonyms: \`${media.title.alternativeTitles.join("`, `")}\``
                                        : null
                                ].filter((prop) => prop !== null)
                                    .map((str) => `${invisibleSpace.repeat(3)} ○ ${str}`)
                                    .join("\n")
                            ].map((str) => `» ${str}`).join("\n")
                        }
                    ]
                }
            };
        } else if (sendType === "plain") {
            let header = `__**${embedStructure.title}**__ (<${embedStructure.url}>)\n`;
            let description = media.synopsis;
            let stats = "\n\n" + [
                // NOTE: Change this once you're done with the file.
                `${Constants.Emojis.HEART} **Rank #${media.rankings.rating} (Most Popular Anime)**`,
                `${Constants.Emojis.STAR} **Rank #${media.rankings.popularity} (Highest Rated Anime)**`
            ].join("\n") + "\n\n" + [
                `Type: **${mediaType(media.format) || "?"}**`,
                `Episodes: **${media.episode.count || "?"}** (${media.episode.length} minutes each)`,
                `Status: **${mediaStatus(media.status) || "?"}**`,
                `Aired: **${[
                    media.startDate ? dateformat(media.startDate, "mediumDate") : null,
                    media.endDate ? dateformat(media.endDate, "mediumDate") : null
                ].filter((date) => date !== null).join("** to **")}**`,
                `Rating: **${media.ageRating
                    ? `${media.ageRating} — ${mediaAgeRating(media.ageRating)}`
                    : "?"}**`,
                `Categories: **${(await media.getCategories()).map((category) => category.name)
                    .join("**, **") || "None"}**`,
                "Titles:\n" + [
                    media.title.english ? `English: \`${media.title.english}\`` : null,
                    media.title.romaji ? `Romaji: \`${media.title.romaji}\`` : null,
                    media.title.japanese ? `Japanese: \`${media.title.japanese}\`` : null,
                    media.title.alternativeTitles.length
                        ? `Synonyms: \`${media.title.alternativeTitles.join("`, `")}\``
                        : null
                ].filter((prop) => prop !== null)
                    .map((str) => `${invisibleSpace.repeat(3)} ○ ${str}`)
                    .join("\n")
            ].map((str) => `» ${str}`).join("\n");

            content = header + Util.stringLimit(description, Constants.Discord
                .MAX_MESSAGE_LENGTH - stats.length - header.length) + stats;
        }

        let msg = await message.channel.createMessage(content);

        if (sendType === "embed") {
            // ...
        }
    }
    
    async prompt(message, flags, media, search) {
        const mediaTitle = (title) => title.en || title.en_us || title.en_jp || title.ja_jp || "?";
        let sendType = this.sendType(message, flags);
        let titlePrefix = `Search Results — `;
        let content = null;

        if (sendType === "embed") {
            content = {
                embed: {
                    color: Util.base10(Constants.Colors.KITSU),
                    title: `${titlePrefix}"${search.substring(0, Constants.Discord.MAX_EMBED_TITLE_LENGTH - titlePrefix
                        .length - 2)}"`,
                    description: media.map(({ id: mediaID, attributes: media }, index) => {
                        return `**${index + 1}.** [${mediaTitle(media.titles)
                            .replace(/\[|\]/g, (str) => `\\${str}`)}](${Endpoints.KITSU_ANIME(mediaID)})`;
                    }).join("\n"),
                    footer: { text: `Select a number between 1 and ${media.length}.` }
                }
            };
        } else if (sendType === "plain") {
            content = `__**${titlePrefix}"${search.substring(0, Constants.Discord.MAX_EMBED_TITLE - titlePrefix
                .length - 2)}"**__\n` + media.map(({ id: mediaID, attributes: media }, index) => {
                return `**${index + 1}.** ${mediaTitle(media.titles)} (<${Endpoints.KITSU_ANIME(mediaID)}>)`;
            }).join("\n") + `\n\nSelect a number between 1 and ${media.length}.`;
        }

        let msg = await Util.messagePrompt(message, message.channel, this
            .client, content, 30000, [...Array(media.length + 1).keys()].slice(1))
            .catch(() => null);

        if (msg === null) {
            return null;
        }

        return media[parseInt(msg.content, 10) - 1];
    }

    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel
            .permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }
        
        
        return "plain";
    }

    _request(text, limit, fields, ageRating) {
        return fetch(Endpoints.KITSU_API_MEDIA(text, limit, fields, ageRating), {
            headers: {
                Accept: "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json"
            }
        }).then(this.checkStatus);
    }
};