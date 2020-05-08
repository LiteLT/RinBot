const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Core category contains all the anime commands for the bot. As the bot is an anime girl, " +
        "it would be fun to add support for it's main purpose. :)\n\n" +
        
        "At the moment, only AniList (<https://anilist.co/>) is supported. There are no plans in the future to add " +
        "integration for sites like MyAnimeList, Kitsu, Anime-Planet, etc.");
    }
};