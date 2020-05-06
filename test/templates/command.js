"use strict";

const { Command } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "",
            description: "",
            fullDescription: "",
            cooldown: 3,
            requiredArgs: 0,
            nsfw: false,
            enabled: true,
            guildOnly: false,
            protected: false,
            aliases: [],
            memberPermissions: [],
            clientPermissions: [],
            validatePermissions: (message) => true,
            flags: [{
                name: "",
                value: "",
                description: ""
            }]
        });
    }
};