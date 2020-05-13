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
            usage: "<...search>",
            description: "Search for a manga.",
            requiredArgs: 1
        });
    }

    async run(message, args) {
        const flags = Util.messageFlags(message, this.client);
        let adult = message.channel.nsfw ? "" : ", isAdult: false";
        let query = `
        query MangaData($search: String!, $perPage: Int!, $plain: Boolean!, $reviewLimit: Int!) {
            Page(perPage: $perPage) {
                media(type: MANGA, search: $search${adult}) {
                    ...media
                    idMal @skip(if: $plain)
                    format
                    genres @skip(if: $plain)
                    status
                    volumes
                    chapters
                    synonyms
                    favourites
                    popularity
                    averageScore
                    source(version: 2)
                    description(asHtml: false)
                    startDate { ...fuzzyDate }
                    endDate { ...fuzzyDate }
                    rankings { rank type year allTime }
                    trailer @skip(if: $plain) { id site }
                    externalLinks @skip(if: $plain) { url site }
                    tags @skip(if: $plain) { name isMediaSpoiler }
                    coverImage @skip(if: $plain) { color extraLarge }
                    recommendations(sort: RATING_DESC) @skip(if: $plain) {
                        nodes { rating mediaRecommendation { ...media } }
                    }
                    reviews(limit: $reviewLimit, sort: [RATING_DESC]) @skip(if: $plain) {
                        nodes { id score rating summary ratingAmount }
                    }
                    relations @skip(if: $plain) { 
                        edges { relationType(version: 2) node { ...media } }
                    }
                    staff @skip(if: $plain) { edges { role node { siteUrl name { full native } } } }
                    characters(sort: [ROLE, FAVOURITES_DESC]) @skip(if: $plain) {
                        edges { role node { siteUrl name { full native } } }
                    }
                }
            }
        }
          
        fragment fuzzyDate on FuzzyDate { day month year }          
        fragment media on Media { siteUrl isAdult isLocked title { english romaji native } }
        `;

        let sendType = this.sendType(message, flags);
        let variables = {
            search: args.join(" "),
            perPage: flags.all ? 10 : 1,
            plain: sendType === "plain",
            reviewLimit: Constants.Discord.MAX_EMBED_FIELD_SIZE
        };
        let mangaData = (await this._request(query, variables)).data.Page.media;
        let media = null;

        if (mangaData.length) {
            if (flags.all) {
                media = await this.prompt(message, flags, mangaData, variables.search);
            } else {
                [media] = mangaData;
            }
        } else {
            return CommandError.ERR_NOT_FOUND(message, "manga", args.join(" "));
        }

        if (media) {
            media.siteUrl += `/${this.mediaTitle(media.title)
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}`;

            if (!message.channel.nsfw && !variables.plain) {
                media.relations.edges = media.relations.edges
                    .filter(({ node: media }) => !media.isAdult);
            }

            if (media.idMal) {
                media.externalLinks.push({
                    site: "MyAnimeList",
                    url: Endpoints.MYANIMELIST_MANGA(media.idMal)
                });
            }

            if (media.trailer) {
                let whitelisted = {
                    youtube: (videoID) => Endpoints.YOUTUBE_VIDEO(videoID),
                    dailymotion: (videoID) => Endpoints.DAILYMOTION_VIDEO(videoID)
                };

                let resolveURL = whitelisted[media.trailer.site];

                if (resolveURL) {
                    media.externalLinks.push({
                        site: "Trailer",
                        url: resolveURL(media.trailer.id)
                    });
                }
            }

            if (!variables.plain && media.reviews.nodes.length) {
                media.reviews.nodes.forEach((review, index) => {
                    media.reviews.nodes[index].siteUrl = Endpoints.ANILIST_REVIEW(review.id);
                });
            }

            return this.result(message, flags, media, sendType);
        }
    }

    async result(message, flags, media, sendType) {
        if (this.sendType(message, flags) !== sendType) {
            return; // Noop.
        }

        let embedTemplate = {
            url: media.siteUrl,
            color: sendType === "embed"
                ? Util.base10(media.coverImage.color || Constants.Colors.ANILIST)
                : null,
            thumbnail: sendType === "embed"
                ? { url: media.coverImage.extraLarge }
                : null,
            title: [
                this.mediaTitle(media.title),
                media.isAdult ? Constants.Emojis.UNDERAGE : null,
                media.isLocked ? Constants.Emojis.LOCK : null
            ].filter((prop) => prop !== null).join(" ")
        };
        let rankedScore = media.rankings.find((rank) => {
            return rank.type === "RATED" && (rank.allTime || rank.year);
        });
        let rankedPopularity = media.rankings.find((rank) => {
            return rank.type === "POPULAR" && (rank.allTime || rank.year);
        });

        let invisibleSpace = "​ ";
        let bulletChar = "»";
        let emdash = "—";
        let msg = null;

        const mediaFormat = (format) => {
            let types = {
                TV: "TV",
                TV_SHORT: "TV Short",
                MOVIE: "Movie",
                SPECIAL: "Special",
                OVA: "OVA (Original Video Animation)",
                ONA: "ONA (Original Net Animation)",
                MUSIC: "Music",
                MANGA: "Manga",
                NOVEL: "Light Novel",
                ONE_SHOT: "One Shot"
            };

            return types[format] || null;
        };

        const mediaStatus = (status) => {
            let types = {
                FINISHED: "Finished",
                RELEASING: "Releasing",
                NOT_YET_RELEASED: "Not Yet Released",
                CANCELLED: "Canceled" // Watch the double Ls
            };

            return types[status] || null;
        };

        const mediaDate = (fuzzyDate) => {
            if (fuzzyDate.day) {
                let date = new Date(fuzzyDate.year, fuzzyDate.month, fuzzyDate.day);

                return dateformat(date, "mmmm dS, yyyy");
            } else if (fuzzyDate.month) {
                let date = new Date(fuzzyDate.year, fuzzyDate.month);

                return dateformat(date, "mmmm yyyy");
            } else if (fuzzyDate.year) {
                let date = new Date(fuzzyDate.year);

                return dateformat(date, "yyyy");
            }

            return null;
        };

        const mediaSource = (source) => {
            let types = {
                ORIGINAL: "Original",
                MANGA: "Manga",
                LIGHT_NOVEL: "Light Novel",
                VISUAL_NOVEL: "Visual Novel",
                VIDEO_GAME: "Video Game",
                OTHER: "Other",
                NOVEL: "Novel",
                DOUJINSHI: "Doujinshi",
                ANIME: "Anime"
            };

            return types[source] || null;
        };

        const mediaRank = (rank) => {
            let type = rank.type === "RATED" ? "Highest Rated" : "Most Popular";

            if (rank.allTime) {
                return `#${rank.rank} ${type} All Time`;
            }

            return `#${rank.rank} ${type} ${rank.year}`;
        };

        if (sendType === "embed") {
            msg = await message.channel.createMessage({
                embed: {
                    ...embedTemplate,
                    description: Util.stringLimit(this.markdown.turndown(media
                        .description || "\u200b"), Constants.Discord.MAX_EMBED_DESCRIPTION_LENGTH),
                    fields: [
                        {
                            name: "Information",
                            value: [
                                `Format: **${mediaFormat(media.format) || "Unknown"}**`,
                                `Status: **${mediaStatus(media.status) || "Unknown"}**`,
                                `Chapters: **${media.chapters || "N/A"}**`,
                                `Volumes: **${media.volumes || "N/A"}**`,
                                `Source: **${mediaSource(media.source) || "N/A"}**`,
                                `Start Date: **${mediaDate(media.startDate) || "N/A"}**`,
                                `End Date: **${mediaDate(media.endDate) || "N/A"}**`,
                                `Alternative Titles:\n` + [
                                    media.title.romaji ? `Romaji: \`${media.title.romaji}\`` : null,
                                    media.title.english ? `English: \`${media.title
                                        .english}\`` : null,
                                    media.title.native ? `Native: \`${media.title.native}\`` : null,
                                    media.synonyms.length
                                        ? `Synonyms: \`${media.synonyms.join("`, `")}\``
                                        : null
                                ].filter((prop) => prop !== null)
                                    .map((str) => `${invisibleSpace.repeat(3)} ○ ${str}`)
                                    .join("\n") + "\n",
                                `**Genres**: ${media.genres.join(", ") || "None"}`,
                                `**Tags**: ${media.tags.map((tag) => {
                                    let spoilerText = tag.isMediaSpoiler ? "||" : "";

                                    return spoilerText + tag.name + spoilerText;
                                }).join(", ") || "None"}`
                            ].map((str) => `${bulletChar} ${str}`).join("\n")
                        },
                        {
                            name: "Stats",
                            value: [
                                `Average Score: **${media.averageScore ? media
                                    .averageScore + "%" : "N/A"}**`,
                                `Popularity: **${Util.commaify(media.popularity)}** ${media
                                    .favourites ? `(**${Util.commaify(media
                                        .favourites)}** favorites)` : ""}`,
                                rankedScore
                                    ? `Ranked Score: **${mediaRank(rankedScore)}** ${Constants
                                        .Emojis.STAR}`
                                    : null,
                                rankedPopularity
                                    ? `Ranked Popularity: **${mediaRank(rankedPopularity)}** ` +
                                    Constants.Emojis.HEART
                                    : null
                            ].filter((field) => field !== null).map((str) => `${bulletChar} ${str}`)
                                .join("\n")
                        }
                    ]
                }
            });
        } else if (sendType === "plain") {
            let header = `__**${embedTemplate.title}**__ (<${embedTemplate.url}>)\n`;
            let description = this.markdown.turndown(media.description || "\u200b");
            let infoStats = "\n\n**Information**\n" + [
                `Format: **${mediaFormat(media.format) || "Unknown"}**`,
                `Status: **${mediaStatus(media.status) || "Unknown"}**`,
                `Chapters: **${media.chapters || "N/A"}**`,
                `Volumes: **${media.volumes || "N/A"}**`,
                `Source: **${mediaSource(media.source) || "N/A"}**`,
                `Start Date: **${mediaDate(media.startDate) || "N/A"}**`,
                `End Date: **${mediaDate(media.endDate) || "N/A"}**`,
                `Alternative Titles:\n` + [
                    media.title.romaji ? `Romaji: \`${media.title.romaji}\`` : null,
                    media.title.english ? `English: \`${media.title
                        .english}\`` : null,
                    media.title.native ? `Native: \`${media.title.native}\`` : null,
                    media.synonyms.length
                        ? `Synonyms: \`${media.synonyms.join("`, `")}\``
                        : null
                ].filter((prop) => prop !== null)
                    .map((str) => `${invisibleSpace.repeat(3)} ○ ${str}`)
                    .join("\n")
            ].map((str) => `${bulletChar} ${str}`).join("\n") +
            "\n\n**Stats**\n" + [
                    `Average Score: **${media.averageScore ? media
                        .averageScore + "%" : "N/A"}**`,
                    `Popularity: **${Util.commaify(media.popularity)}** ${media
                        .favourites ? `(**${Util.commaify(media
                            .favourites)}** favorites)` : ""}`,
                    rankedScore
                        ? `Ranked Score: **${mediaRank(rankedScore)}** ${Constants
                            .Emojis.STAR}`
                        : null,
                    rankedPopularity
                        ? `Ranked Popularity: **${mediaRank(rankedPopularity)}** ` +
                        Constants.Emojis.HEART
                        : null
            ].filter((field) => field !== null).map((str) => `${bulletChar} ${str}`).join("\n");

            let content = header + Util.stringLimit(description, Constants.Discord
                .MAX_MESSAGE_LENGTH - infoStats.length - header.length) + infoStats;

            return message.channel.createMessage(content);
        }

        if (msg && [undefined, true].includes(message.channel.permissionsOf?.(this.client.user.id)
            .has("addReactions"))) {
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
                    if (Util.hasChannelPermission(msg.channel, this.client
                        .user, "manageMessages")) {
                        msg.removeReactions().catch(() => {});
                    }

                    return;
                }
            }

            const mediaRelation = (relationType) => {
                let types = {
                    ADAPTATION: "Adaptation",
                    PREQUEL: "Prequel",
                    SEQUEL: "Sequel",
                    PARENT: "Parent",
                    SIDE_STORY: "Side Story",
                    CHARACTER: "Character",
                    SUMMARY: "Summary",
                    ALTERNATIVE: "Alternative",
                    SPIN_OFF: "Spin Off",
                    OTHER: "Other",
                    SOURCE: "Source",
                    COMPILATION: "Compilation",
                    CONTAINS: "Contains"
                };

                return types[relationType] || null;
            };

            let pageNumber = 1;
            let isAwaitingResponse = false;
            let pageLayouts = [
                {
                    ...msg.embeds[0],
                    title: `${embedTemplate.title} > Overview`
                },
                media.relations.edges.length || media.externalLinks.length ? {
                    ...embedTemplate,
                    title: `${embedTemplate.title} > Relations`,
                    fields: (() => {
                        let fields = Util.arrayUnique(media.relations.edges
                            .map((edge) => edge.relationType))
                            .map((relationType) => ({
                                name: mediaRelation(relationType),
                                value: Util.arrayJoinLimit(media.relations.edges
                                    .filter((edge) => edge.relationType === relationType)
                                    .map(({ node: media }) => {
                                        let title = [
                                            this.mediaTitle(media.title),
                                            media.isAdult ? Constants.Emojis.UNDERAGE : null,
                                            media.isLocked ? Constants.Emojis.LOCK : null
                                        ].filter((prop) => prop !== null).join(" ");

                                        return `[${title}](${media.siteUrl})`;
                                    }), ` ${emdash} `, Constants.Discord
                                    .MAX_EMBED_FIELD_VALUE_LENGTH)
                            }));

                        if (media.externalLinks.length) {
                            fields.push({
                                name: "External Links",
                                value: `**${media.externalLinks
                                    .map((link) => `[${link.site}](${link.url})`)
                                    .join(" | ")}**`
                            });
                        }

                        return fields;
                    })()
                } : null,
                media.characters.edges.length ? {
                    ...embedTemplate,
                    url: `${embedTemplate.url}/characters`,
                    title: `${embedTemplate.title} > Characters`,
                    fields: Util.arrayUnique(media.characters.edges.map((edge) => edge.role))
                        .map((role) => ({
                            name: Util.toTitleCase(role),
                            value: Util.arrayJoinLimit(media.characters.edges
                                .filter((edge) => edge.role === role)
                                .map(({ node: character }) => {
                                    return `[${this.personName(character.name)}](${character
                                        .siteUrl})`;
                                }), ` ${emdash} `, Constants.Discord.MAX_EMBED_FIELD_VALUE_LENGTH)
                        }))
                } : null,
                media.staff.edges.length ? {
                    ...embedTemplate,
                    url: `${embedTemplate.url}/staff`,
                    title: `${embedTemplate.title} > Staff`,
                    description: Util.arrayJoinLimit(media.staff.edges
                        .map(({ node: staff, role }) => {
                            return `${bulletChar} [${this.personName(staff.name)}](${staff
                                .siteUrl}) ${emdash} ${role}`;
                        }), "\n", Constants.Discord.MAX_EMBED_DESCRIPTION_LENGTH)
                } : null,
                media.reviews.nodes.length ? {
                    ...embedTemplate,
                    url: `${embedTemplate.url}/reviews`,
                    title: `${embedTemplate.title} > reviews`,
                    fields: media.reviews.nodes.map((review) => ({
                        name: review.summary.substring(0, Constants.Discord
                            .MAX_EMBED_FIELD_NAME_LENGTH),
                        value: [
                            `[Read Review](${review.siteUrl})`,
                            `Score: **${review.score}%**`,
                            `**${review.rating}**/**${review.ratingAmount}** (**${(review
                                .rating / review.ratingAmount * 100)
                                .toFixed(0)}%**) liked this review.`
                        ].join(" | ")
                    }))
                } : null,
                media.recommendations.nodes.length ? {
                    ...embedTemplate,
                    title: `${embedTemplate.title} > Recommendations`,
                    description: Util.arrayJoinLimit(media.recommendations.nodes
                        .map(({ rating, mediaRecommendation: media }) => {
                            let title = [
                                this.mediaTitle(media.title),
                                media.isAdult ? Constants.Emojis.UNDERAGE : null,
                                media.isLocked ? Constants.Emojis.LOCK : null
                            ].filter((prop) => prop !== null).join(" ");

                            rating = rating > 0 ? `+${rating}` : rating;

                            return `${bulletChar} [${title}](${media.siteUrl}) (\`${rating}\`)`;
                        }), "\n", Constants.Discord.MAX_EMBED_DESCRIPTION_LENGTH)
                } : null
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
                if (message.channel.guild &&
                    message.channel.permissionsOf(this.client.user.id).has("manageMessages")) {
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

                let page = pageLayouts[pageNumber - 1];
                page.footer = { text: `Page ${pageNumber}/${pageLayouts.length}` };

                return msg.edit({ embed: page });
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

    async prompt(message, flags, media, search) {
        let sendType = this.sendType(message, flags);
        let emdash = "—";
        let prefix = `Search Results ${emdash} `;
        let content = sendType === "embed"
            ? {
                embed: {
                    color: Util.base10(Constants.Colors.ANILIST),
                    title: prefix + `"${search.substring(0, Constants.Discord
                        .MAX_EMBED_TITLE_LENGTH - prefix.length - 2)}"`,
                    description: media.map((media, index) => {
                        return `**${index + 1}.** [${this.mediaTitle(media.title)
                            .replace(/[\[\]]/g, (str) => `\\${str}`)}](${media.siteUrl})`;
                    }).join("\n"),
                    footer: {
                        text: `Select a number between 1 and ${media.length}.`
                    }
                }
            }
            : `__**${prefix}"${search.substring(0, Constants.Discord.MAX_EMBED_TITLE - prefix
                .length - 2)}"**__\n` + media.map((media, index) => {
                return `**${index + 1}.** ${this.mediaTitle(media.title)} (<${media.siteUrl}>)`;
            }).join("\n") + `\n\nSelect a number between 1 and ${media.length}.`;

        let msg = await Util.messagePrompt(message, message.channel, this
            .client, content, 30000, [...Array(media.length + 1).keys()].slice(1))
            .catch(() => null);

        if (msg === null) {
            return null;
        }

        return media[parseInt(msg.content, 10) - 1];
    }

    mediaTitle(title) {
        return title.english || title.romaji || title.native || "?";
    }

    personName(name) {
        let cleanName = "";

        if (name.full) {
            cleanName = name.full.trim();
        }

        if (name.native) {
            if (cleanName) {
                cleanName += ` (${name.native.trim()})`;
            } else {
                cleanName = name.native.trim();
            }
        }

        return cleanName || "?";
    }

    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel
            .permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }

        return "plain";
    }


    _request(query, variables) {
        return fetch(Endpoints.ANILIST_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({ query, variables })
        }).then(this.checkStatus);
    }
};