"use strict";

const { Command } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, { description: "Pong!" });
    }
  
    async run(message) {
        let start = Date.now();

        return message.channel.createMessage("Pinging...").then((msg) => {
            let time = Date.now() - start;
            
            return msg.edit(`Pong! (Took: ${time}ms)`);
        });
    }
};