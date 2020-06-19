require("dotenv").config();

//noinspection SpellCheckingInspection
module.exports = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    HYPIXEL_API_KEY: process.env.HYPIXEL_API_KEY,

    PRIMARY_PREFIX: "r.",
    BOT_OWNER: "345539839393005579",
    BOT_ID: "345539839393005579",
    BOT_PREFIXES: ["r."],
    BOT_STAFF: ["345539839393005579", "492459066900348958"],
    BOT_DEVELOPERS: ["345539839393005579", "492459066900348958"],
    BOT_SUPPORT_SERVER_INVITE: "https://discord.gg/rpGQyb8",
    REPORT_EXCEPTION_CHANNEL_ID: "707760635722596462",

    GUILD_FORUM_WONDERLAND: "473952725063696385",
    GUILD_HYPIXEL_BEDWARS: "384804710110199809",

    MAX_PUNISHMENT_REASON_LENGTH: 800,

    Discord: {
        MAX_MESSAGE_LENGTH: 2000,
        MAX_EMBED_TITLE_LENGTH: 256,
        MAX_EMBED_DESCRIPTION_LENGTH: 2048,
        MAX_EMBED_FIELD_SIZE: 25,
        MAX_EMBED_FIELD_NAME_LENGTH: 256,
        MAX_EMBED_FIELD_VALUE_LENGTH: 1024
    },

    Colors: {
        DEFAULT: "EE8D98",
        GRAY: "808080",
        GREEN: "4CCA51",
        MODLOGS_MUTE: "EF881A", // Same aa ORANGE.
        MODLOGS_WARN: "FAC10C", // Same as YELLOW.
        ORANGE: "EF881A",
        RED: "DD2E44",
        YELLOW: "FAC10C",

        ANILIST: "3DB4F2",
        HYPIXEL: "E2BB60",
        KITSU: "F75239"
    },

    CustomEmojis: {
        BOOST: "<:boost:633034592797982740>",
        BOT: "<:bot:633129812441038869>",
        CHECKMARK: "<:checkmark:619130247677214750>",
        DISABLED: "<:disabled:690594952920563712>",
        DISCORD_LOGO: "<:discordLogo:698306239230378075>",
        DO_NOT_DISTURB: "<:dnd:631479017735979018>",
        ENABLED: "<:enabled:684609842689605741>",
        GUILD_OWNER: "<:owner:633132002245083146>",
        HYPIXEL_ONLINE: "<:hypixelOnline:698268072267481169>",
        HYPIXEL_OFFLINE: "<:hypixelOffline:698268125057122404>",
        IDLE: "<:idle:631479017714876456>",
        LOADING: "<a:loading:698942515335659621>",
        OFFLINE: "<:offline:631479017723133972>",
        ONLINE: "<:online:631479018859921438>",
        OUTAGE: "<:outage:688767864240340994>",
        STAFF: "<:botstaff:633351245645611018>",
        SYSTEM: "<:system:697528841891086400>"
    },

    Emojis: {
        X_EMOJI: "❌",
        ARROW_BACKWARDS: "◀️",
        ARROW_FORWARD: "▶️",
        BLUE_CHECK: "☑️",
        BOOK: "📖",
        COMPUTER: "💻",
        FLAG_BRAZIL: "🇧🇷",
        FLAG_ENGLAND: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        FLAG_EUROPE: "🇪🇺",
        FLAG_GERMANY: "🇩🇪",
        FLAG_HONGKONG: "🇭🇰",
        FLAG_INDIA: "🇮🇳",
        FLAG_JAPAN: "🇯🇵",
        FLAG_RUSSIA: "🇷🇺",
        FLAG_NETHERLANDS: "🇳🇱",
        FLAG_SINGAPORE: "🇸🇬",
        FLAG_SOUTH_AFRICA: "🇿🇦",
        FLAG_SOUTH_KOREA: "🇰🇷",
        FLAG_SYNDEY: "🇦🇺",
        FLAG_UNITED_ARAB_EMIRATES: "🇦🇪",
        FLAG_UNITED_STATES: "🇺🇸",
        FRAME_PHOTO: "🖼️",
        HEART: "❤️",
        INPUT_TRAY: "📥",
        LARGE_ORANGE_DIAMOND: "🔶",
        LOCK: "🔒",
        ONE_TWO_THREE_FOUR: "🔢",
        OUTPUT_TRAY: "📤",
        PAPER_PENCIL: "📝",
        PHONE: "📱",
        STAR: "⭐",
        STOPWATCH: "⏱️",
        STOP_BUTTON: "⏹️",
        THUMBS_UP: "👍",
        THUMBS_DOWN: "👎",
        TRACK_PREVIOUS: "⏮️",
        TRACK_NEXT: "⏭️",
        UNDERAGE: "🔞",
        WARNING: "⚠️",
        WHITE_MEDIUM_SQUARE: "◻️",
        WOMAN_TIPPING_HAND: "💁‍♀️",
        ZIPPER_MOUTH: "🤐"
    }
};