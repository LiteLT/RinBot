"use strict";

const { Command } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            description: "Flip a coin.",
            fullDescription: "Heads or tails?",
            cooldown: 2
        });
    }

    async run(message) {
        let decision = Math.random() > 0.5 ? "heads" : "tails";

        return message.channel.createMessage(`It's **${decision}**!`);
    }
};