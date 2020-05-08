"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<...guild>",
            description: "Leaves a guild, or several guilds.",
            requiredArgs: 1,
            protected: true,
            validatePermissions: (message) => Constants.BOT_STAFF.includes(message.author.id)
        });
    }

    async run(message, args) {
        let [guilds, notFoundIDs] = Util.arrayPartition(args.map((guildID) => {
            return this.client.guilds.get(guildID) || guildID;
        }), (guildOrID) => typeof guildOrID !== "string");

        if (guilds.every((guild) => !guild)) {
            return CommandError.ERR_NOT_FOUND(message, "guilds with the ID(s)", args
                .join("\", \""));
        }

        let notice = [
            `Are you sure you want me to leave the following guilds?\n${guilds
                .map((guild) => `- **${guild.name}** (\`${guild.id}\`)`)}`,
            notFoundIDs.length
                ? `I was unable to find any guilds with the following ID(s): \`${notFoundIDs
                    .join("`, `")}\``
                : null,
            "Type [Y/N] to process. This will expire in **30** seconds..."
        ].filter((prop) => prop !== null).join("\n\n");

        let msg = await Util.messagePrompt(message, message.channel, this
            .client, notice, 30000, ["y", "yes", "n", "no", "stop"]).catch(() => null);

        if (msg === null) {
            return;
        }

        if (["n", "no", "stop"].includes(msg.content.toLowerCase())) {
            return message.channel.createMessage("Canceled.");
        }

        guilds.forEach((guild) => guild.leave());

        return message.channel.createMessage(`Left the following guilds:\n${guilds
            .map((guild) => `- **${guild.name}** (\`${guild.id}\`)`)}`);
    }
};