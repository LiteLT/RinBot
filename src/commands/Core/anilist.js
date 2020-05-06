"use strict";

const { Command } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<anime|manga|character|stats> (...search)",
            description: "Search AniList.co",
            fullDescription: "By default, the `anime` subcommand is chosen.",
            requiredArgs: 1,
            aliases: ["al"],
            flags: [
                {
                    name: "noembed",
                    description: "Sends the message in plain text instead of an embed. This is " +
                    "automatically selected if I do not have permission to `Embed Links`."
                },
                {
                    name: "all",
                    description: "Displays up to 10 anime with similar title names. This is " +
                    "useful for when you don't remember the exact name of an anime. Select an " +
                    "anime by picking a number between one and the number of anime shown " +
                    "(1 - 10). **Not every subcommand supports this flag.**"
                }
            ]
        });
    }

    async run(message, args) {
        return this.subcommands.get("anime").run(message, args);
    }
};