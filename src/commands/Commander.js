const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Commander category is a set of commands only bot staff members can use. This is not to be " +
        "confused with moderation category, which is for server moderators only.");
    }
};