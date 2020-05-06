"use strict";

const { Constants, Subcommand } = require("../../../index.js");
const { prefix: prefixSettings } = require("../../../../assets/database/settings.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<prefix>",
            description: "Adds a new prefix.",
            fullDescription: `The server can have up to **${prefixSettings.maximumAmount}** prefixes. A prefix cannot` +
            ` be longer than **${prefixSettings.length.max}** characters or have spaces.`,
            requiredArgs: 1
        });
    }
  
    async run(message, [prefix]) {
        prefix = prefix.toLowerCase();
        let prefixes = (await this.client.commands.get("prefix").query(message.guildID, "prefixes"))?.prefixes ?? [];
        let hasEntry = false;

        if (prefixes.length) {
            if (prefixes[0] === "") {
                prefixes = [];
            }

            hasEntry = true;

            if (prefixes.includes(prefix)) {
                return message.channel.createMessage("That prefix already exists.");
            }

            if (prefix.length > prefixSettings.length.max) {
                return message.channel.createMessage("The prefix cannot be 15+ characters long.");
            }

            if (prefixes.length > prefixSettings.maximumAmount) {
                return message.channel.createMessage(`The server cannot have more than **${prefixSettings
                    .maximumAmount}** prefixes.`);
            }

            prefixes.push(prefix);
        } else {
            if (Constants.BOT_PREFIXES.includes(prefix)) {
                return message.channel.createMessage("That prefix already exists.");
            }

            if (prefix.length > prefixSettings.length.max) {
                return message.channel.createMessage("The prefix cannot be 15+ characters long.");
            }

            prefixes = [...Constants.BOT_PREFIXES, prefix];
            // If no prefixes, create a new array of the default prefixes and the new prefix.
        }

        this.client.commands.get("prefix").updateSettings(message.guildID, prefixes);
        
        prefixes = prefixes.map((prefix) => prefix.replace(/,/g, "%2C"));
        
        if (hasEntry) {
            await this.client.db.run("UPDATE prefixes SET prefixes = ? WHERE guildID = ?", [
                prefixes.join(","),
                message.guildID
            ]);
        } else {
            await this.client.db.run("INSERT INTO prefixes (prefixes, guildID) VALUES (?, ?)", [
                prefixes.join(","),
                message.guildID
            ]);
        }
        

        return message.channel.createMessage(`The \`${prefix}\` prefix has been added.`);
    }
};