"use strict";

const { Util, Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<category>",
            description: "Reload a category.",
            fullDescription: "This is useful when both a command and category share the same name.",
            requiredArgs: 1,
            enabled: true
        });
    }

    async run(message, args) {
        let category = Util.arrayUnique(this.client.commands.map((command) => command.category.name))
            .find((category) => category === Util.toTitleCase(args.join(" ")));

        if (category) {
            return this.command._reloadCategory(message, category);
        }

        return CommandError.ERR_NOT_FOUND(message, "category", args.join(" "));
    }
};