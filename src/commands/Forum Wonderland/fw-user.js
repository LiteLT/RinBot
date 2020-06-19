"use strict";

const { Util, Command, Constants, Endpoints, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<user>",
            description: "Fetches the profile URL a user is linked to.",
            fullDescription: "To use this command, you must be a member in the **Forum Wonderland** server.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["fwuser"],
            validatePermissions: (msg) => msg.guildID === Constants.GUILD_FORUM_WONDERLAND ||
                this.category.onUsageInWrongGuild()
        });
    }

    /**
     * Runs the command.
     *
     * @param {Eris.Message} message The message the command was called on.
     * @param {Array<String>} args Arguments passed to the command.
     */
    async run(message, args) {
        let target = this.findMember(message, args, { strict: true });

        if (!target) {
            if (Util.isSnowflake(args[0])) {
                target = this.client.getRESTUser(args[0]).catch((err) => err);
            }

            if (!target || target instanceof Error) {
                return CommandError.ERR_NOT_FOUND(message, "guild member", args.join(" "));
            }
        }

        let column = await this.client.db.get("SELECT forumID FROM fw_verified WHERE guildID = ? AND userID = ?", [
            message.guildID,
            target.id
        ]);

        if (column) {
            return message.channel.createMessage(`**${Util.userTag(target)}** is linked to the profile <${Endpoints
                .HYPIXEL_FORUMS_PROFILE(column.forumID)}>`);
        }

        return Util.reply(message, `**${Util.userTag(target)}** is not verified.`);
    }
};