"use strict";

const { Util, Command, Constants, Endpoints, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<member> <profile>",
            description: "Verifies",
            fullDescription: "To use this command, you must be a staff member in the **Forum Wonderland** server." +
                " This command will only add the `Member` role to the target member. You (the staff member) are" +
                " responsible for applying the corresponding roles to the member's Hypixel forums profile and" +
                " player stats.",
            requiredArgs: 2,
            guildOnly: true,
            aliases: ["fwforcify", "fw-verify", "fwverify"],
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
                let existingEntry = await this.client.db.get("SELECT userID FROM fw_verified WHERE guildID = ? AND" +
                    " forumID " +
                    "= ?", [message.guildID, forumID]);

                if (existingEntry && existingEntry.userID !== member.id) {
                    let verifiedMember = message.channel.guild.members.get(existingEntry.userID);

                    return message.channel.createMessage(`This profile is already linked to the user ${verifiedMember
                        ?.mention || `ID \`${existingEntry.userID}\``}.`);
                }

                existingEntry = await this.client.db.get("SELECT forumID FROM fw_verified WHERE guildID = ? AND" +
                    " userID = ?", [message.guildID, member.id]);

                await member.edit({ roles: Util.arrayUnique([...member.roles, this.category.roles.member]) });

                if (existingEntry) {
                    return message.channel.createMessage(`${Constants.CustomEmojis.CHECKMARK} **${Util
                        .userTag(member)}** is already verified, so I've applied their roles for you. They are ` +
                        `linked to <${Endpoints.HYPIXEL_FORUMS_PROFILE(existingEntry.forumID)}>.`);
                }

                await this.client.db.run("INSERT INTO fw_verified (guildID, userID, forumID, createdTimestamp, " +
                    "editedTimestamp) VALUES (?, ?, ?, ?, ?)", [
                    message.guildID,
                    member.id,
                    forumID,
                    Date.now(),
                    null
                ]);

                return message.channel.createMessage(`${Constants.CustomEmojis
                    .CHECKMARK} Successfully force-verified **${Util.userTag(member)}**.`);
            }

            return message.channel.createMessage("Malformed profile URL.");
        }

        return CommandError.ERR_NOT_FOUND(message, "guild member", memberArg);
    }
};