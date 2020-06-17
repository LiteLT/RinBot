"use strict";

const { Command } = require("../../index.js");
const { prefix } = require("../../../assets/database/settings.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<view|add|remove|clear|reset> (prefix)",
            description: prefix.summary,
            fullDescription: prefix.description,
            cooldown: 5,
            guildOnly: true,
            protected: true,
            memberPermissions: ["manageGuild"]
        });
    }

    async run(message) {
        return this.subcommands.get("view").run(message);
    }

    async query(guildID, props = "*") {
        let prefixData = await this.client.db.get(`SELECT ${props} FROM prefixes WHERE guildID = ?`, [
            guildID
        ]);

        if (prefixData.length) {
            prefixData.prefixes = prefixData.prefixes.split(",").map((str) => str.replace(/%2C/g, ","));
        }

        return prefixData;
    }

    updateSettings(guildID, prefixes) {
        let guildSettings = this.client.guildSettings.get(guildID);
        guildSettings.prefixes = prefixes;

        this.client.guildSettings.set(guildID, guildSettings);
    }
};