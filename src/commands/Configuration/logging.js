"use strict";

const { Command } = require("../../index.js");
const { logging } = require("../../../assets/database/settings.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<type> <channel>",
            description: logging.summary,
            fullDescription: logging.description,
            guildOnly: true,
            protected: true,
            memberPermissions: ["manageGuild"],
            flags: [{ name: "delete", description: "Removes the channel for the log type." }]
        });
    }

    async run(message) {
        return this.subcommands.get("view").run(message);
    }

    async query(message, props) {
        return this.client.db.get(`SELECT ${props} FROM guildOptions WHERE guildID = ?`, [message.guildID]);
    }

    updateSettings(guildID, name, value, category = "options") {
        let guildSettings = this.client.guildSettings.get(guildID);
        guildSettings[category][name] = value;

        this.client.guildSettings.set(guildID, guildSettings);
    }
};