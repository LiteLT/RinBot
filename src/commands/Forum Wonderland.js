const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Forum Wonderland category is a collection of commands that can only be used in the **Forum" +
            " Wonderland** Discord server.");

        this.roles = {
            member: "477607937976696864",
            serverStaff: "514935357826007061"
        };
    }

    /**
     * Returns a string when the user runs the command in the wrong server.
     *
     * @return {string} The string.
     */
    onUsageInWrongGuild() {
        return "You must be in the **Forum Wonderland** server to run this command.";
    }
};