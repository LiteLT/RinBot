const Endpoints = require("../../src/utils/Endpoints.js");
const fetch = require("node-fetch");

"use strict";

/**
 * The data for a category.
 * @typedef {Object} MediaCategoryData
 * @property {Number} id the ID of the category.
 * @property {String} name The name of the category.
 * @property {String} description The description describing the category.
 * @property {Number} usageCount The number of media that use this category.
 * @property {Boolean} nsfw Whether or not the category is for R18 anime.
 */
/**
 * The title data for the episode.
 * @typedef {Object} MediaEpisodeTitleData
 * @property {String} [english] The title in English.
 * @property {String} [romaji] The title in Romaji.
 * @property {String} [japanese] The title in Japanese.
 */
/**
 * The episode data.
 * @typedef {Object} MediaEpisodeData
 * @property {Number} id The ID of the episode.
 * @property {MediaEpisodeTitleData} title The titles for the episode.
 * @property {Number} season The season the episode was aired in.
 * @property {Number} episode The episode number.
 * @property {String} [synopsis] The short summary of the episode for the reader.
 * @property {Date} airedAt The date when the episode aired.
 * @property {Number} length The length of the episode.
 * @property {String} [thumbnail] The thumbnail of the episode. May or may not be black and white.
 * @property {Object} relationships Relationships/reference links for other data.
 */
/**
 * The character's name.
 * @typedef {Object} CharacterNameData
 * @property {String} english The name in English.
 * @property {String} japanese The name in Japanese.
 */
/**
 * The character data.
 * @typedef {Object} CharacterData
 * @property {Number} id the ID of the character.
 * @property {CharacterNameData} name The character's name.
 * @property {Array<String>} alternativeNames Other names the character may be referred to as.
 * @property {String} [description] The description of the character.
 * @property {String} [image] An image of the character.
 */
/**
 * Represents a helper class for anime/manga data from Kitsu.
 */
class KitsuMedia {
    constructor({ id, type, relationships, attributes: media }) {
        /**
         * The ID of the entry.
         * @type {Number}
         */
        this.id = id;

        /**
         * The type of media.
         * @type {"anime"|"manga"}
         */
        this.type = type;

        /**
         * The short synopsis of the anime/manga.
         * @type {String}
         */
        this.synopsis = media.synopsis || null;

        /**
         * The titles of the anime in different languages.
         * @typedef {Object} MediaTitleData
         * @property {String} english The title in English.
         * @property {String} romaji The title in Romaji.
         * @property {String} japanese The title in Japanese.
         * @property {Array<String>} alternativeTitles Other titles the media may go by.
         */

        /**
         * The title in different languages.
         * @type {MediaTitleData}
         */
        this.title = {
            english: media.titles.en || media.titles.en_us || null,
            romaji: media.titles.en_jp || null,
            japanese: media.titles.ja_jp || null,
            alternativeTitles: media.abbreviatedTitles
        };

        /**
         * The average score of the entry.
         * @type {Number}
         */
        this.averageRating = parseFloat(media.averageRating, 10) || null;

        /**
         * The number of Kitsu members with the anime/manga on their list.
         * @type {Number}
         */
        this.userCount = media.userCount;

        /**
         * The number of Kitsu members with the anime/manga marked as one of their favorites.
         * @type {Number}
         */
        this.favoritesCount = media.favoritesCount;

        /**
         * The date of when the media started releasing.
         * @type {Date}
         */
        this.startDate = media.startDate ? new Date(media.startDate) : null;

        /**
         * The date fo when the media finished releasing.
         * @type {Date}
         */
        this.endDate = media.endDate ? new Date(media.endDate) : null;

        /**
         * The global ranking for the anime/manga on the site.
         * @typedef {Object} MediaRankingData
         * @property {Number} rating The rank by its rating.
         * @property {Number} popularity The rank by popularity/how many Kitsu members have the media on their list.
         */

        /**
         * The ranking for the anime/manga on the site.
         * @type {MediaRankingData}
         */
        this.rankings = {
            rating: media.ratingRank,
            popularity: media.popularityRank
        };

        /**
         * The age rating for the anime. `null` for manga.
         * @type {"G"|"PG"|"R"|"R18"}
         */
        this.ageRating = media.ageRating || null;

        /**
         * The current status of the media.
         * @type {"current"|"finished"|"tba"|"unreleased"|"upcoming"}
         */
        this.status = media.status || null;

        /**
         * The subtype of the anime. `null` for manga.
         * @type {"OVA"|"ONA"|"TV"|"movie"|"music"|"special"|"doujin"|"manga"|"manhua"|"manhwa"|"novel"|"oel"|"oneshot"}
         */
        this.format = media.subtype || null;

        /**
         * The poster image.
         * @type {String}
         */
        this.posterImage = media.posterImage.large;

        /**
         * The episode info for the anime.
         * @typedef {Object} MediaEpisodeListData
         * @property {Number} count The amount of episodes.
         * @property {Number} length The length of each episode.
         */

        /**
         * The episode info for the anime. `null` for manga.
         * @type {MediaEpisodeListData}
         */
        this.episode = type === "anime" ? {
            count: media.episodeCount,
            length: media.episodeLength
        } : null;

        /**
         * The chapter info of the manga.
         * @typedef {Object} MediaChapterListData
         * @property {Number} chapters The amount of chapters.
         * @property {Number} volumes The amount of volumes.
         */
        
        /**
         * The chapter info for the manga. `null` for anime.
         * @type {MediaChapterListData}
         */
        this.chapter = type === "manga" ? {
            chapters: media.chapterCount,
            volumes: media.volumeCount
        } : null;

        /**
         * The serializer of the manga. `null` on an anime.
         * @type {String}
         */
        this.serializer = media.serialization || null;

        /**
         * An external link's metadata.
         * @typedef {Object} MediaExternalLinkData
         * @property {String} site The name of the website.
         * @property {String} url The URL to the external link.
         */

        /**
         * The external links.
         * @type {Array<MediaExternalLinkData>}
         */
        this.externalLinks = [];

        if (media.youtubeVideoId) {
            this.externalLinks.push({ site: "YouTube Trailer", url: Endpoints.YOUTUBE_VIDEO(media.youtubeVideoId) });
        }

        /**
         * Whether or not the media is R18/Hentai.
         * @type {Boolean}
         */
        this.nsfw = media.nsfw;

        this._relationships = {};

        for (const [type, { links: relation }] of Object.entries(relationships)) {
            this._relationships[type] = relation.related;
        }

        // Properties that are not set by default.

        /**
         * The genres for the anime.
         * @type {Array<String>}
         */
        this.genres = [];

        /**
         * @type {Array<MediaCategoryData>}
         */
        this.categories = [];
        
        /**
         * The episodes for the anime. `null` for manga.
         * @type {Array<MediaEpisodeData>}
         */
        this.episodes = [];
    }

    /**
     * Get a title for the media.
     * @param {Array<String>} [order=["english", "romaji", "japanese"]] The order to look for results.
     * @returns {String} The title, or a question mark (if no title was found).
     */
    getTitle(order = ["english", "romaji", "japanese"]) {
        for (const lang of order) {
            let title = this.title[lang];

            if (title) {
                return title;
            }
        }

        return "?";
    }

    /**
     * Get all the genres for the media.
     * @returns {Promise<Array<String>>} An array of strings, representing each genre.
     */
    async getGenres() {
        if (this.genres.length) {
            return this.genres;
        }

        let genres = (await fetch(this._relationships.genres + "?fields[genres]=name")
            .then(this.checkStauts)).data
            .map((genre) => genre.attributes.name);

        this.genres = genres;

        return genres;
    }

    /**
     * Get all the categories for the media.
     * @returns {Promise<Array<MediaCategoryData>>}
     */
    async getCategories() {
        if (this.categories.length) {
            return this.categories;
        }

        let fields = ["nsfw", "title", "description", "totalMediaCount"];
        let categories = (await fetch(`${this._relationships.categories}?fields[categories]=${fields.join(",")}`)
            .then(this.checkStatus)).data
            .map(({ id, attributes: category }) => ({
                id,
                nsfw: category.nsfw,
                name: category.title,
                description: category.description,
                usageCount: category.totalMediaCount
            }));
        
        this.categories = categories;

        return categories;
    }

    /**
     * Get all episodes for the anime.
     * @returns {Promise<Array<MediaEpisodeData>>}
     */
    async getEpisodes() {
        if (this.episodes.length) {
            return this.episodes;
        }

        let fields = [
            "length",
            "number",
            "titles",
            "airdate",
            "synopsis",
            "thumbnail",
            "seasonNumber",

            // Relationships
            "media",
            "videos"
        ];
        let episodes = (await fetch(`${this._relationships.episodes}?fields[episodes]=${fields.join(",")}`)
            .then(this.checkStatus)).data
            .map(({ id, relationships, attributes: episode }) => ({
                id,
                episode: episode.number,
                season: episode.seasonNumber,
                length: episode.length || null,
                synopsis: episode.synopsis || null,
                // NOTE: Change this once you're done with the file.
                thumbnail: episode.thumbnail.original || null,
                airedAt: episode.airdate ? new Date(episode.airdate) : null,
                title: {
                    english: episode.titles.en_us || null,
                    romaji: episode.titles.en_jp || null,
                    japanese: episode.titles.ja_jp || null
                },
                relationships: (() => {
                    let relates = {};

                    for (const [type, { links: relation }] of Object.entries(relationships)) {
                        relates[type] = relation.related;
                    }

                    return relates;
                })()
            }));
                
        this.episodes = episodes;

        return episodes;
    }
        
    /**
     * Check the status sent by an HTTP(s) request.
     * @param {Response} res The response sent back.
     * @param {String} [convert=json] The type of value to convert the response to. 
     * @param {Array<Number>} [statusCodes=[]] An array of valid status codes. The method checks if the response was OK
     * (code >= 200 && code <= 300), so there's no need to pass codes in the 200 range.
     */
    checkStatus(res, convert = "json", statusCodes = []) {
        if (res.ok || statusCodes.includes(res.status)) {
            return res[convert]();
        }
      
        let err = new Error(`${res.status} ${res.statusText}`);
        err.code = res.status;
      
        throw err;
    }
}

module.exports = KitsuMedia;