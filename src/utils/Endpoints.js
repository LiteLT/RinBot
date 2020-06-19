const SLOTHPIXEL_URL = "https://api.slothpixel.me/api";
const DISCORD_CDN_URL = "https://cdn.discordapp.com";
const THE_COLOR_API_URL = "http://thecolorapi.com";
const HYPIXEL_API_URL = "https://api.hypixel.net";
const MYANIMELIST_URL = "https://myanimelist.net";
const VISAGE_URL = "https://visage.surgeplay.com";
const PLANCKE_URL = "https://plancke.io/hypixel";
const DUMMY_IMAGE_URL = "https://dummyimage.com";
const MOJANG_API_URL = "https://api.mojang.com";
const ANILIST_URL = "https://anilist.co";
const HYPIXEL_FORUMS_URL = "https://hypixel.net";

module.exports = {
    ANILIST_GRAPHQL: "https://graphql.anilist.co/",
    ANILIST_REVIEW: (reviewID) => `${ANILIST_URL}/review/${reviewID}`,
    ANILIST_SITE_STATS: `${ANILIST_URL}/site-stats`,

    DAILYMOTION_VIDEO: (videoID) => `https://dailymotion.com/video/${videoID}`,

    DISCORD_EMOJI_ICON_URL: (emojiID, type = "png") => `${DISCORD_CDN_URL}/emojis/${emojiID}.${type}?v=1`,

    DUMMY_IMAGE_IMAGE: (hex, name) => `${DUMMY_IMAGE_URL}/300x300/${hex}.png&text=${name}`,

    HYPIXEL_API_KEY: (key) => `${HYPIXEL_API_URL}/key?key=${key}`,
    HYPIXEL_API_GUILD_PLAYER: (key, uuid) => `${HYPIXEL_API_URL}/guild?player=${uuid}&key=${key}`,
    HYPIXEL_API_GUILD_GUILD: (key, guild) => `${HYPIXEL_API_URL}/guild?name=${guild}&key=${key}`,
    HYPIXEL_API_PLAYER_UUID: (key, uuid) => `${HYPIXEL_API_URL}/player?uuid=${uuid}&key=${key}`,
    HYPIXEL_API_PLAYER_USERNAME: (key, name) => `${HYPIXEL_API_URL}/player?name=${name}&key=${key}`,
    HYPIXEL_FORUMS_PROFILE: (forumID) => `${HYPIXEL_FORUMS_URL}/members/${forumID}/`,

    MINECRAFT_UUID_NAMEHISTORY: (uuid) => `${MOJANG_API_URL}/user/profiles/${uuid}/names`,

    MYANIMELIST_ANIME: (animeID) => `${MYANIMELIST_URL}/anime/${animeID}`,
    MYANIMELIST_MANGA: (mangaID) => `${MYANIMELIST_URL}/manga/${mangaID}`,

    PLANCKE_PLAYER: (nameOrUUID) => `${PLANCKE_URL}/player/stats/${nameOrUUID}`,
    PLANCKE_GUILD: (guildName) => `${PLANCKE_URL}/guild/name/${guildName}`,
    PLANCKE_WATCHDOG: `${PLANCKE_URL}/watchdog`,

    SLOTHPIXEL_BANS: `${SLOTHPIXEL_URL}/bans`,
    SLOTHPIXEL_GUILD_PLAYERS: (username) => `${SLOTHPIXEL_URL}/guilds/${username}?populatePlayers`,

    THE_COLOR_API_ID: (type, value) => `${THE_COLOR_API_URL}/id?${type}=${value}&format=json`,

    VISAGE_BUST: (uuid, size = 600) => `${VISAGE_URL}/bust/${size}/${uuid}`,

    YOUTUBE_VIDEO: (videoID) => `https://youtube.com/watch?v=${videoID}`
};