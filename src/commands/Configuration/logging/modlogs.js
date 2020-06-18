"use strict";

const { Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<channel>",
            description: "Sets the modlogs channel.",
            fullDescription: "The modlogs channel stores punishments given out by the bot. Punishments like warns, " +
            "mutes, bans etc. will be dispensed to this channel.",
            requiredArgs: 1
        });
    }

    async run(message, args) {
        let baseCommand = this.client.commands.get("logging");
        let channel = baseCommand.findChannel(message, args, { type: "text" });

        if (channel) {
            let modlogsChannel = await baseCommand.query(message, "modlogs");

            if (modlogsChannel?.modlogs === channel.id) {
                return message.channel.createMessage("The server's modlogs channel is already set to that.");
            }

            if (modlogsChannel) {
                await this.client.db.run("UPDATE guildOptions SET modlogs = ? WHERE guildID = ?", [
                    channel.id,
                    message.guildID
                ]);
            } else {
                await this.client.db.run("INSERT INTO guildOptions (guildID, modlogs) VALUES (?, ?)", [
                    message.guildID,
                    channel.id
                ]);

            }

            baseCommand.updateSettings(message.guildID, "modlogs", channel.id, "moderation");

            return message.channel.createMessage(`The server's modlogs channel has been set to ${channel
                .mention} (\`${channel.name}\`).`);
        }

        return CommandError.ERR_NOT_FOUND(message, "channel", args.join(" "));
    }
};