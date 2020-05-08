const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Developer category is for commands only bot developers are allowed to run. These commands " +
        "hold the power to cause a mismatch exception in the universe, therefore creating a ripple through time and " +
        "space.");
    }
};