"use strict";

const { Util, Command, Constants, Endpoints, CommandError } = require("../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<member> <username>",
            description: "Verifies a user.",
            fullDescription: "To use this command, you must be a staff member on the **Hypixel BedWars** server.\n\n" +
                "When a user is forcified, the bot skips checking if a user's tag on Discord is the same one linked " +
                "on the Hypixel server. All other checks are enforced.",
            requiredArgs: 2,
            guildOnly: true,
            aliases: ["bwforcify", "bw-forceverify", "bwforceverify"],
            clientPermissions: ["manageRoles", "manageNicknames"],
            validatePermissions: (msg) => {
                if (msg.guildID === Constants.GUILD_HYPIXEL_BEDWARS) {
                    return msg.member.roles.includes(this.category.roles.rankGiver);
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
    async run(message, [memberArg, username]) {
        let member = this.findMember(message, [memberArg], { strict: true });

        if (!member) {
            return CommandError.ERR_NOT_FOUND(message, "guild member", memberArg);
        }

        let existingEntry = await this.client.db.get("SELECT minecraftUUID FROM bw_verified WHERE guildID = ? " +
            "AND userID = ?", [message.guildID, member.id]) || null;

        if (existingEntry) {
            let mcUsername = await this._fetchMcUsername(existingEntry.minecraftUUID);

            this._logUpdate(message, member, {
                username: mcUsername,
                uuid: existingEntry.minecraftUUID
            }, "This member is already verified.", false);

            return Util.reply(message, "this member is already verified.");
        }

        if (!/^\w{1,16}$/.test(username)) {
            this._logUpdate(message, member, {username}, "The username is not valid.", false);

            return Util.reply(message, "the username you entered is malformed. A Minecraft username can only contain" +
                " letters and numbers.");
        }

        let player = await this._fetchHypixelPlayer(username).catch((err) => err);

        if (player instanceof Error) {
            this._logUpdate(message, member, {username}, "Hypixel API error.", false);

            return Util.reply(message, "there seems to be an issue with the Hypixel API. Try again?");
        }

        if (player == null) {
            this._logUpdate(message, member, {username}, "The player could not be found on Hypixel.", false);

            return Util.reply(message, "the username you entered could not be found on Hypixel. Make sure the" +
                " spelling is correct or check the name history for recent changes.");
        }

        let playerMetadata = {username, uuid: player.uuid};
        existingEntry = (await this.client.db.get("SELECT COUNT(*) FROM bw_blacklisted WHERE guildID = ? AND" +
            " minecraftUUID = ?", [message.guildID, player.uuid]))["COUNT(*)"];

        if (existingEntry) { // The return!
            this._logUpdate(message, member, playerMetadata, "This Minecraft account is blacklisted.", false);

            return Util.reply(message, "the Minecraft account you tried verifying is blacklisted.");
        }

        existingEntry = await this.client.db.get("SELECT userID FROM bw_verified WHERE guildID = ? AND minecraftUUID" +
            " = ?", [message.guildID, player.uuid]);

        if (existingEntry) { // Third!
            let existingMember = message.channel.guild.members.get(existingEntry.userID);
            let who = existingMember
                ? `${Util.userTag(existingMember)} | ${existingMember.id}`
                : `ID: ${existingEntry.userID}`;

            this._logUpdate(message, member, playerMetadata, "This Minecraft account is verified to a different" +
                ` user (${who}).`, false);

            return Util.reply(message, "the Minecraft account you tried verifying this user under is already linked " +
                `to another user (${who}).`);
        }

        if (!player.achievements?.bedwars_level) {
            this._logUpdate(message, member, playerMetadata, "This player has never played a game of " +
                "BedWars.", false);

            return Util.reply(message, "this player has never played a game of BedWars. To apply roles, please ask" +
                " the member to play at least one game.");
        }

        return this._verify(message, member, player, playerMetadata);
    }

    /**
     * Verifies the member.
     *
     * @param {Eris.Message} message The message to reference.
     * @param {Eris.Member} member The target member.
     * @param {Object} player The player from Hypixel.
     * @param {{ username: string, uuid: string }} playerMetadata The player's basic metadata.
     * @return {void} Nothing.
     * @private
     */
    async _verify(message, member, player, playerMetadata) {
        let bedwarsLevel = player.achievements.bedwars_level;
        let bedwarsStar = this.category.getPlayerStar(bedwarsLevel);
        let bedwarsRole = this.category.getPlayerRole(message, bedwarsLevel);

        if (bedwarsLevel < 10) {
            bedwarsLevel = `0${bedwarsLevel}`;
        }

        let nickname = `[${bedwarsLevel} ${bedwarsStar}] ${player.displayname}`;
        let roles = [bedwarsRole.id, ...member.roles.filter((roleID) => !Object
            .values(this.category.ranks).some((rank) => rank.role === roleID) && ![
                this.category.roles.needUsernames,
                this.category.roles.needUsername
            ].includes(roleID))];

        switch (player.rank) {
            case "HELPER": {
                roles.push(this.category.roles.helper, this.category.roles.hypixelStaff);

                break;
            }

            case "MODERATOR": {
                roles.push(this.category.roles.moderator, this.category.roles.hypixelStaff);

                break;
            }

            case "ADMIN": {
                roles.push(this.category.roles.admin, this.category.roles.hypixelStaff);

                break;
            }

            case "YOUTUBER": {
                roles.push(this.category.roles.youtuber);

                break;
            }

            default: {
                if (player.buildTeam) {
                    roles.push(this.category.roles.buildTeam);
                }

                break;
            }
        }

        let memberRoles = [];

        for (const roleID of roles) {
            if (!memberRoles.includes(roleID)) {
                memberRoles.push(roleID);
            }
        }

        await this.client.db.run("INSERT INTO bw_verified (guildID, userID, minecraftUUID, createdTimestamp," +
            " editedTimestamp) VALUES ($guildID, $userID, $minecraftUUID, $createdTimestamp, $editedTimestamp)", {
            $guildID: message.guildID,
            $userID: member.id,
            $minecraftUUID: player.uuid,
            $createdTimestamp: Date.now(),
            $editedTimestamp: null
        });
        await this._logUpdate(message, member, playerMetadata, "Member was successfully force-verified.", true);

        let isManageable = await Util.isManageable(member, this.client);
        await member.edit({ roles: memberRoles, nick: isManageable ? nickname : undefined });
        await this.category.purgeMessages(message, member);
        await message.channel.createMessage(`${Constants.Emojis.BLUE_CHECK} Successfully force-verified **${Util
            .userTag(member)}**.`);

        return true;
    }

    /**
     * Logs when a user runs this command and what the result was.
     *
     * @param {Eris.Message} message The message to reference.
     * @param {Eris.Member} member The target member.
     * @param {{ username: string, uuid: ?string }} player The player the staff member tried linking the member to.
     * @param {string} reason The result of the command.
     * @param {boolean} successful Whether or not the user was successfully verified.
     * @return {void} Nothing.
     * @throws {Error} If the verification channel could not be found.
     * @private
     */
    _logUpdate(message, member, player, reason, successful) {
        let channel = message.channel.guild.channels.get(this.category.channels.verificationLogs);
        let sendType = this.sendType(message);

        if (!channel) {
            throw new Error("Verification logs channel not found.");
        }

        if (sendType === "embed") {
            channel.createMessage({
                embed: {
                    description: reason,
                    timestamp: new Date(),
                    title: successful ? "Member Verified" : "Verification Failed",
                    color: Util.base10(Constants.Colors[successful ? "GREEN" : "YELLOW"]),
                    fields: [
                        {
                            name: "Member",
                            value: `${Util.userTag(member)} (${member.mention})`,
                            inline: true
                        },
                        {
                            name: "Moderator",
                            value: `${Util.userTag(message.author)} (${message.author.mention})`,
                            inline: true
                        },
                        {
                            name: "Minecraft Account",
                            value: player.uuid
                                ? `[${player.username}](${Endpoints.PLANCKE_PLAYER(player.uuid)})`
                                : `? (input: \`${player.username}\`)`,
                            inline: true
                        }
                    ]
                }
            });
        } else {
            let content;

            if (successful) {
                content = `${Constants.Emojis.INPUT_TRAY} **${Util.userTag(member)}** (${member.id}) was verified by ` +
                    `**${Util.userTag(message.author)}** (${message.author.id}).`;
            } else {
                content = `${Constants.Emojis.X_EMOJI} **${Util.userTag(message.author)}** (${message.author
                    .id}) tried to verify **${Util.userTag(member)}** (${member
                    .id}), but failed for the following reason: ${reason}`;
            }

            content += `\n- Minecraft account: ${player.uuid
                ? `[${player.username}](${Endpoints.PLANCKE_PLAYER(player.uuid)})`
                : `? (input: \`${player.username}\`)`}`;

            channel.createMessage(content);
        }
    }

    /**
     * Fetches a player from Hypixel by their username.
     *
     * @param {string} username The username of the player. The username will only apply to the latest username the
     * player had since their last login.
     * @return {Promise<Object>} The player data.
     * @private
     */
    _fetchHypixelPlayer(username) {
        return fetch(Endpoints.HYPIXEL_API_PLAYER_USERNAME(Constants.HYPIXEL_API_KEY, encodeURIComponent(username)))
            .then(this.checkStatus)
            .then((player) => player.player);
    }

    /**
     * Fetches a player's most recent username by UUID.
     *
     * @param {string} uuid The Minecraft account UUID.
     * @return {Promise<string>} The Minecraft username.
     * @private
     */
    _fetchMcUsername(uuid) {
        return fetch(Endpoints.MINECRAFT_UUID_NAMEHISTORY(uuid))
            .then(this.checkStatus)
            .then((usernames) => usernames.pop().name);
    }
};