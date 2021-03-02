"use strict";

const { Util, Constants, EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    /**
     * Runs the event listener.
     * @param {Eris.Message} message The created message.
     */
    async run(message) {
        if (message.author.bot || message.channel.id === "398621245685497856") {
            return;
        }

        for (const collector of this.client.messageMonitors) {
            collector.check(message);
        }

        if (message.guildID) {
            if (message.channel.guild.unavailable) {
                return;
            }

            if (message.channel.permissionsOf(this.client.user.id).has("sendMessages")) {
                if (message.member) {
                    if (new RegExp(`^<@!?${this.client.user.id}>`).test(message.content)) {
                        if (new RegExp(`^<@!?${this.client.user.id}>$`).test(message.content)) {
                            return Util.reply(message, `my prefix is \`${Constants
                                .PRIMARY_PREFIX}\` — Try out some commands (e.g. \`${Constants
                                .PRIMARY_PREFIX}help\`).`);
                        }

                        message.prefix = this.client.user.mention + " ";
                    }
                }
            } else {
                return;
            }

            if (!this.client.guildSettings.has(message.guildID)) {
                await this.loadSettings(message);
            }
        }

        message.prefix = message.prefix || Util.messagePrefix(message, this.client);

        if (message.prefix) {
            let command = Util.messageCommand(message, this.client);
            let args = Util.messageArgs(message, this.client);


            if (command) {
                try {
                    let res = await command.validate(message);

                    if (res === null) {
                        return; // Silently reject. Used for stuff like `<Command>.enabled`
                    }

                    if (args.length) {
                        let subcommand = command.subcommands.get(args[0].toLowerCase());

                        if (subcommand) {
                            args = args.slice(1);

                            return await subcommand.run(message, args);
                        }
                    }

                    return await command.run(message, args);
                } catch (ex) {
                    if (ex.friendly) {
                        return message.channel.createMessage(ex.message);
                    }

                    return command.handleException(message, ex);
                }
            }
        }
    }

    async loadSettings(message) {
        let prefixData = await this.client.db.get("SELECT prefixes FROM prefixes WHERE guildID = ?", [
            message.guildID
        ]) || null;

        if (prefixData) {
            prefixData.prefixes = prefixData.prefixes.split(",").map((str) => str.replace(/%2C/g, ","));

            if (prefixData.prefixes[0] === "") {
                prefixData.prefixes = [];
            }
        }

        let modroles = (await this.client.db.get("SELECT roles FROM modroles WHERE guildID = ?", [
            message.guildID
        ]) ?? { roles: "" }).roles.split(",").filter((roleID) => message.channel.guild.roles.has(roleID))
            .filter((role) => role);

        let guildOptions = (await this.client.db.get("SELECT * FROM guildOptions WHERE guildID = ?", [
            message.guildID
        ]) ?? {
            modlogs: null
        });

        this.client.guildSettings.set(message.guildID, {
            prefixes: prefixData?.prefixes || null,
            categories: { disabled: [] },
            commands: { disabled: [] },
            subcommands: { disabled: [] },
            moderation: {
                roles: modroles,
                channel: guildOptions.modlogs
            }
        });
    }
};