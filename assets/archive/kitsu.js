"use strict";

const { Command } = require("../../src/index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<anime>",
            description: "Search Kitsu.io",
            fullDescription: "By default, the `anime` subcommand is chosen.",
            requiredArgs: 1,
            aliases: ["kit"],
            flags: [
                {
                    name: "noembed",
                    description: "Sends the message in plain text instead of an embed. This is automatically " +
                    "selected if I do not have permission to `Embed Links`."
                },
                {
                    name: "all",
                    description: "Displays up to 10 titles with similar names. This is useful when you don't " +
                    "remember the exact name of an item/entry. Select a response by picking a number between one and " +
                    "the number of titles shown (1 - 10)."
                }
            ]
        });
    }

    async run(message, args) {
        return this.subcommands.get("anime").run(message, args);
    }
};