"use strict";

const { Command } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<...character>",
            description: "Search for a character.",
            fullDescription: "By default, AniList is chosen as the provider for anime/manga character info.",
            requiredArgs: 1,
            aliases: ["char", "c"],
            flags: [
                {
                    name: "noembed",
                    description: "Sends the message in plain text instead of an embed. This is automatically " +
                    "selected if I do not have permission to `Embed Links`."
                },
                {
                    name: "all",
                    description: "Displays up to 10 characters with similar names. Select a character by picking a " +
                    "number between one and the number of results shown."
                }
            ]
        });
    }

    async run(message, args) {
        return this.client.commands.get("anilist").subcommands.get("character").run(message, args);
    }
};