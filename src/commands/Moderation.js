const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Moderation category allows you to moderate your Discord server easily. In order to use " +
        "commands such as `warn` and `mute`, your server will need a moderator role (or several) and other " +
        "moderation settings.\n\n" +
        
        "To configure the category (such as setting a modlogs channel), check the Configuration category for " +
        "commands.");
    }
};