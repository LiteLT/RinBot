"use strict";

const { Command } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<player|guild|bans|key> (...args)",
            description: "Look up stats from Hypixel.",
            fullDescription: "By default, the `player` subcommand is chosen.",
            cooldown: 5,
            requiredArgs: 1,
            aliases: ["hy"],
            flags: [{
                name: "noembed",
                description: "Sends the message in plain text instead of an embed. This is " +
                "automatically selected if I do not have permission to `Embed Links`."
            }]
        });
    }

    async run(message, args) {
        return this.subcommands.get("player").run(message, args);
    }
};