"use strict";

const { Util, Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            description: "Reload a category.",
            fullDescription: "This is useful when both a command and category share the same " +
            "name.",
            requiredArgs: 1,
            enabled: true
        });
    }
  
    async run(message, [arg]) {
        let search = arg.toLowerCase();
        let categories = Util.arrayUnique(this.client.commands.map((command) => command.category));
        let category = categories.find((category) => category.toLowerCase() === search);
      
        if (category) {
            return this.command._reloadCategory(message, category);
        }
      
        return CommandError.ERR_NOT_FOUND(message, "category", arg);
    }
};