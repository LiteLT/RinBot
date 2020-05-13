const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Hypixel BedWars category is a collection of commands that can only be used in the **Hypixel" +
            " BedWars** server.");
    }
};