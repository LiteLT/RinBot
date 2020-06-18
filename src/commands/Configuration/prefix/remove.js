"use strict";

const { Util, Constants, Subcommand } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<prefix>",
            description: "Removes an existing prefix.",
            fullDescription: "**Tip**: You can remove default prefixes.",
            requiredArgs: 1
        });
    }

    async run(message, [prefix]) {
        prefix = prefix.toLowerCase();
        let prefixes = (await this.client.commands.get("prefix").query(message.guildID, "prefixes"))?.prefixes ?? [];

        if (prefixes[0] === "") {
            return message.channel.createMessage("This server has no prefixes.");
        }

        if (prefixes.length) {
            let prefixIndex = prefixes.indexOf(prefix);

            if (prefixIndex === -1) {
                return message.channel.createMessage("That prefix does not exist.");
            }

            prefixes.splice(prefixIndex, 1);
        } else {
            prefixes = [...Constants.BOT_PREFIXES];
            let prefixIndex = prefixes.indexOf(prefix);

            // Current work area.
            if (prefixIndex === -1) {
                return message.channel.createMessage("That prefix does not exist.");
            }

            prefixes.splice(prefixIndex, 1);
        }

        this.client.commands.get("prefix").updateSettings(message.guildID, prefixes);

        prefixes = prefixes.map((prefix) => prefix.replace(/,/g, "%2C"));

        await this.client.db.run("UPDATE prefixes SET prefixes = ? WHERE guildID = ?", [
            prefixes.join(","),
            message.guildID
        ]);

        return message.channel.createMessage(`The \`${prefix}\` prefix has been removed. ${(prefixes.length
            ? ""
            : `You need to mention me to set a new one (\`@${Util.userTag(this.client.user)} prefix\`).`)}`);
    }
};