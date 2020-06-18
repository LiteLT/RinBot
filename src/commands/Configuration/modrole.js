"use strict";

const { Command } = require("../../index.js");
const { modrole } = require("../../../assets/database/settings.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<view|add|remove|clear> (role)",
            description: modrole.summary,
            fullDescription: modrole.description,
            cooldown: 5,
            guildOnly: true,
            protected: true,
            memberPermissions: ["manageGuild"]
        });
    }

    async run(message) {
        return this.subcommands.get("view").run(message);
    }

    async query(message, props = "*") {
        let modroleData = await this.client.db.get(`SELECT ${props} FROM modroles WHERE guildID = ?`, [
            message.guildID
        ]) || null;

        if (modroleData) {
            modroleData.roles = modroleData.roles.split(",").filter((roleID) => message.channel.guild.roles.has(roleID))
                .filter((role) => role);
        }

        return modroleData;
    }

    updateSettings(guildID, roles) {
        let guildSettings = this.client.guildSettings.get(guildID);
        guildSettings.moderation.roles = roles;

        this.client.guildSettings.set(guildID, guildSettings);
    }
};