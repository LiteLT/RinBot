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
                    description: "Displays up to 10 results based on the title/name. Select an item from the list by " +
                    "picking a number between one and the number of results shown."
                }
            ]
        });
    }

    async run(message, args) {
        return this.subcommands.get("anime").run(message, args);
    }
};