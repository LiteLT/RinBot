const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The General category is the basic category that contains general information about the bot. " +
        "To learn more about the bot, try taking the interactive lesson on the about command (`about --learn`).");
    }
};