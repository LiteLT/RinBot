const { Constants, Client: Client } = require("./src/index.js");
const { open: openDB } = require("sqlite");
const sqlite3 = require("sqlite3");
const bot = new Client(Constants.DISCORD_TOKEN, {
    defaultImageFormat: "png",
    messageLimit: 50,
    defaultImageSize: 1024,
    latencyThreshold: 15000,
    maxReconnectAttempts: 10,
    restMode: true,
    allowedMentions: { roles: false, users: true, everyone: false },
    disableEvents: { TYPING_START: true }
}, {
    schedule: {
        interval: 10000
    }
});

(async () => {
    try {
        bot.db = await openDB({
            filename: "./database.db",
            driver: sqlite3.cached.Database
        });
        bot.init();
    } catch (ex) {
        bot.logger.error(ex);
        bot.gracefulExit(1);
    }
})();