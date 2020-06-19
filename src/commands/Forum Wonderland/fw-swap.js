"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<member> <profile>",
            description: "Updates a member's profile URL.",
            fullDescription: "To use this command, you must be a staff member in the **Forum Wonderland** server." +
            "Under the hood, this command is a shortcut for `unverify` + `verify`.",
            requiredArgs: 2,
            guildOnly: true,
            aliases: ["fwswap"],
            clientPermissions: ["manageRoles"],
            validatePermissions: (msg) => {
                if (msg.guildID === Constants.GUILD_FORUM_WONDERLAND) {
                    return msg.member.roles.includes(this.category.roles.serverStaff);
                }

                return this.category.onUsageInWrongGuild();
            }
        });
    }

    /**
     * Runs the command.
     *
     * @param {Eris.Message} message The message the command was called on.
     * @param {Array<String>} args Arguments passed to the command.
     */
    async run(message, [memberArg, profileUrlArg]) {
        let member = this.findMember(message, [memberArg], { strict: true });

        if (member) {
            let forumID = profileUrlArg.match(/^https:\/\/(?:www\.)?hypixel\.net\/members\/(?:[^.]+\.)?(\d+)\/?$/)?.[1];

            if (forumID) {
                // Select the user ID from the Forum Wonderland verified table where the guild ID is the same server,
                // the forum ID is the same as the supplied profile and the user ID is not the target member.
                let existingEntry = await this.client.db.get("SELECT userID FROM fw_verified WHERE guildID = ? AND" +
                    " forumID = ? AND NOT userID = ?", [message.guildID, forumID, member.id]);

                if (existingEntry) {
                    let existingMember = message.channel.guild.members.get(existingEntry.userID);

                    return Util.reply(message, `the profile URL supplied is bound to the user ${existingMember
                        ?.mention || `ID \`${existingEntry.userID}\``}.`);
                }

                let column = await this.client.db.run("INSERT OR REPLACE INTO fw_verified (guildID, userID, forumID," +
                    " createdTimestamp, editedTimestamp) VALUES (?, ?, ?, ?, ?)", [
                    message.guildID,
                    member.id,
                    forumID,
                    Date.now(),
                    null
                ]);

                if (!member.roles.includes(this.category.roles.member)) {
                    await member.edit({ roles: [...member.roles, this.category.roles.member] });
                }

                if (column.changes > 0) {
                    return message.channel.createMessage(`${Constants.CustomEmojis
                        .CHECKMARK} Successfully updated **${Util.userTag(member)}**'s linked profile.`);
                }

                return Util.reply(message, `**${Util.userTag(member)}**'s state has not changed (no swapping was ` +
                    "done).");
            }

            return message.channel.createMessage("Malformed profile URL.");
        }

        return CommandError.ERR_NOT_FOUND(message, "guild member", memberArg);
    }
};