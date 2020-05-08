const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Configuration category allows you to configure parts of the bot to your liking. The " +
        "configurable parts of the bot usually play a major role in how a command behaves (e.g. moderation roles). ");
    }
};