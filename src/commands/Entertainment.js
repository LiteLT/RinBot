const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Entertainment category is for commands that don't fit into Utility (or aren't as useful as " +
        "they are), and don't fit in other categories. You can use these random commands to ease your boredom.");
    }
};