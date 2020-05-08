const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Moderation category allows you to moderate your Discord server easily. In order to use " +
        "commands such as `warn` and `mute`, your server will need a moderator role (or several) and other " +
        "moderation settings. To configure the category, check out the Configuration category.");
    }
};