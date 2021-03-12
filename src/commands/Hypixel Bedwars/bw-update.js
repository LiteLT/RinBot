"use strict";

const { Util, Command, Constants, Endpoints, CommandError } = require("../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "(member)",
            description: "Updates your nickname & roles.",
            fullDescription: "To use this command, you must be a staff member on the **Hypixel BedWars** server.\n\n" +
                "This command will get your most recent Hypixel BedWars level from Hypixel and update your nickname" +
                " and roles accordingly. A staff member can forcibly run this command on a member as the first" +
                " argument.",
            cooldown: 5,
            guildOnly: true,
            aliases: ["bwupdate"],
            clientPermissions: ["manageRoles", "manageNicknames"],
            validatePermissions: (message) => message.guildID === Constants.GUILD_HYPIXEL_BEDWARS ||
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
        let member = args.length && message.member.roles.includes(this.category.roles.discordStaff)
            || message.author.id === "345539839393005579"
            ? this.findMember(message, args, { strict: true })
            : message.member;

        if (!member) {
            return CommandError.ERR_NOT_FOUND(message, "guild member", args.join(" "));
        }

        let forced = args.length && member !== message.member;
        let existingEntry = await this.client.db.get("SELECT minecraftUUID FROM bw_verified WHERE guildID = ? " +
            "AND userID = ?", [message.guildID, member.id]);

        if (!existingEntry) {
            await this._logUpdate(message, member, {}, "This user is not verified.", forced, false);

            return Util.reply(message, forced
                ? `**${Util.userTag(member)}** is not verified.`
                : "your account is not verified. Run the `bwverify` command to verify your account.");
        }

        let player = await this._fetchHypixelPlayer(existingEntry.minecraftUUID).catch((err) => err);

        if (player instanceof Error) {
            this._logUpdate(message, member, {
                uuid: existingEntry.minecraftUUID
            }, "Hypixel API error.", forced, false);

            return Util.reply(message, "there seems to be an issue with the Hypixel API. Try again?");
        }

        if (!player.achievements?.bedwars_level) { // I'm going to assume the staff member was in vanish.
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, "The Minecraft account has never played a game of BedWars.");

            return Util.reply(message, forced
                ? `It seems **${Util.userTag(member)}** has never played a game of BedWars. Are they possibly a ` +
                "staff member in vanish?"
                : "It seems you've never played a game of BedWars. Try playing one game then run this command again" +
                " (are you in vanish?)");
        }

        return this._update(message, member, player, forced);
    }

    /**
     * Updates a member's nickname and roles.
     *
     * @param {Eris.Message} message The message to reference.
     * @param {Eris.Member} member The member who's being updated.
     * @param {Object} player The player.
     * @param {boolean} forced Whether or not a staff member used this command on the user.
     * @return {Promise<void>} Nothing.
     * @private
     */
    async _update(message, member, player, forced) {
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

        await this._logUpdate(message, member, {
            username: player.displayname,
            uuid: player.uuid
        }, "Member was successfully updated.", forced, true);

        let isManageable = await Util.isManageable(member, this.client);
        await member.edit({ roles: memberRoles, nick: isManageable ? nickname : undefined });
        await this.category.purgeMessages(message, member);
        await message.channel.createMessage(`${Constants.Emojis.BLUE_CHECK} ${(forced
            ? `Successfully updated **${Util.userTag(member)}**'s nickname and roles`
            : "Your nickname and roles have been updated")}.`)
            .then((msg) => Util.deleteMessage(msg, { time: 3000 }));
    }

    /**
     * Logs when a user runs this command and what the result was.
     *
     * @param {Eris.Message} message The message to reference.
     * @param {Eris.Member} member The target member.
     * @param {{ username: string, uuid: ?string }} player The player the staff member tried linking the member to.
     * @param {string} reason The result of the command.
     * @param {boolean} forced Whether or not the update was forcibly updated.
     * @param {boolean} successful Whether or not the user was successfully verified.
     * @return {void} Nothing.
     * @throws {Error} If the verification channel could not be found.
     * @private
     */
    _logUpdate(message, member, player, reason, forced, successful) {
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
                    title: successful ? "Member Updated" : "Update Failed",
                    color: Util.base10(Constants.Colors[successful ? "GREEN" : "YELLOW"]),
                    fields: [
                        {
                            name: "Member",
                            value: `${Util.userTag(member)} (${member.mention})`,
                            inline: true
                        },
                        {
                            name: "Moderator",
                            value: forced
                                ? `${Util.userTag(message.author)} (${message.author.mention})`
                                : `${Util.userTag(this.client.user)} (${this.client.user.mention})`,
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
                content = `${Constants.Emojis.INPUT_TRAY} **${Util.userTag(member)}** (${member.id})'s nickname and ` +
                    `roles were updated by **${Util.userTag(message.author)}** (${message.author.id}).`;
            } else {
                content = `${Constants.Emojis.X_EMOJI} **${Util.userTag(member)}** (${member
                    .id}) tried updating their nickname and roles, but failed for the following reason: ${reason}`;
            }

            content += `\n- Minecraft account: ${player.uuid
                ? `[${player.username}](${Endpoints.PLANCKE_PLAYER(player.uuid)})`
                : `? (input: \`${player.username}\`)`}`;

            channel.createMessage(content);
        }
    }

    /**
     * Fetches a player from Hypixel by their UUID.
     *
     * @param {string} uuid The player's Minecraft UUID.
     * @return {Promise<Object>} The player data.
     * @private
     */
    _fetchHypixelPlayer(uuid) {
        return fetch(Endpoints.HYPIXEL_API_PLAYER_UUID(Constants.HYPIXEL_API_KEY, uuid))
            .then(this.checkStatus)
            .then((player) => player.player);
    }
};