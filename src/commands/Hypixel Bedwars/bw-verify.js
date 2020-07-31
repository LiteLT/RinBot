"use strict";

const { Util, Command, Constants, Endpoints } = require("../../index.js");
const fetch = require("node-fetch");
const VERIFY_STEPS = `${[
    "Go to any lobby.",
    "Right click your player head.",
    "Click the social media menu (Twitter icon).",
    "Click the Discord icon.",
    "Paste your Discord tag when asked (e.g. `Lite#0001`).",
    `Head back to \`#verification\` and run \`${Constants.PRIMARY_PREFIX}bwverify <username>\` with \`username\` ` +
    "being your Minecraft username."
].map((str, index) => `**${index + 1}.** ${str}`).join("\n")}\n\nExample: \`${Constants
    .PRIMARY_PREFIX}bwverify LiteLT\``;

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<username>",
            description: "Links your Minecraft account to your Discord account.",
            fullDescription: `${VERIFY_STEPS}\n\nIf the command fails, you'll see an error message in bold. Read the ` +
                "instructions on how to properly verify your account before contacting a staff member. If you still " +
                "have difficulty, try watching this video: https://youtu.be/uN702veuKHw",
            cooldown: 5,
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["bwverify"],
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
    async run(message, [username]) {
        username = username.replace(/^<([^>]+)>$/, (str, match) => match);

        let existingEntry = await this.client.db.get("SELECT minecraftUUID FROM bw_verified WHERE guildID = ? " +
            "AND userID = ?", [message.guildID, message.author.id]);

        if (existingEntry) {
            let mcUsername = await this._requestUsername(existingEntry.minecraftUUID);

            await this.logVerify(message, {
                username: mcUsername,
                uuid: existingEntry.minecraftUUID
            }, "This member's account is already verified.", false);

            return Util.reply(message, "**your account is already verified.**\n\n" +
                `Your Discord account is currently verified under the Minecraft account, \`${mcUsername}\`.\n` + [
                    `If you'd like to verify under this player, run \`${message.prefix}bwupdate\`.`,
                    "If you'd like to verify under a different Minecraft or Discord account, contact a staff member."
                ].map((str) => `   - ${str}`).join("\n"));
        }

        if (!/^\w{1,16}$/.test(username)) {
            await this.logVerify(message, { username }, "The username is malformed.", false);

            return Util.reply(message, "**invalid username.**\n\n" +
                "The username you entered is not a valid Minecraft username. A valid username can only contain" +
                " letters and numbers up to 16 characters long.");
        }

        let player = await this._requestHypixelPlayerData(username);

        if (player.player === null) {
            await this.logVerify(message, { username }, "The player could not be found on Hypixel.", false);

            return Util.reply(message, "**player not found.**\n\n" +
                "The username you entered could not be found on Hypixel.\n" + [
                    "Make sure you typed your username correctly (the casing does not matter).",
                    "Try joining Hypixel before running this command again. If you can't connect (e.g., \"failed to" +
                    " authenticate\"), try signing out of Minecraft from the launcher, signing back in, and" +
                    " rejoin Hypixel.",

                    "Make sure you typed your Minecraft username and not your Discord username/tag."
                ].map((str) => `   - ${str}`).join("\n")) + "\n\n" +
                "If you continue having issues with this error message and you've tried all three options, contact a" +
                " staff member.";
        }

        player = player.player;
        existingEntry = await this.client.db.get("SELECT minecraftUUID FROM bw_blacklisted WHERE guildID = ? AND" +
            " minecraftUUID = ?", [message.guildID, player.uuid]);

        if (existingEntry) {
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, "This Minecraft player is blacklisted from joining.", false);

            return Util.reply(message, "**this account is blacklisted.**\n\n" +
                `You're not allowed to verify under the player, \`${player.displayname}\`.`);
        }

        existingEntry = await this.client.db.get("SELECT userID, minecraftUUID FROM bw_verified WHERE guildID = ?" +
            " AND minecraftUUID = ?", [message.guildID, player.uuid]) || null;

        if (existingEntry) {
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, "This member tried verifying under a Minecraft account that's already verified (linked " +
                `user ID: \`${existingEntry.userID}\`).`, false);

            let target = this.findMember(message, [existingEntry.userID], { strict: true }) ||
                await this.client.getRESTUser(existingEntry.userID).catch(() => null);

            return Util.reply(message, "**this Minecraft account is already registered.**\n\n" +
                `The Minecraft account (${player.displayname}) you entered is linked to another Discord user (${target
                    ? Util.userTag(target)
                    : `(user ID: \`${existingEntry.userID}\`)`})\n\n` +
                "If you own the account and wish to verify under it on this account, contact a staff member.");
        }

        let discordTag = player.socialMedia?.links?.DISCORD?.trim() || null;
        let shortID = `${message.author.id.slice(-6)}#${message.author.discriminator}`;

        if (discordTag === null) {
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, "The player's account has not linked a Discord tag to their account.", false);

            return Util.reply(message, "**this player has not linked a Discord tag.**\n\n" +
                `This player (\`${player.displayname}\`) has not linked a Discord account on Hypixel. To link your ` +
                `account, follow the following steps:\n\n${VERIFY_STEPS}\n\n` +
                "If you see a message like, \"The URL isn't valid!\", check if you typed it correctly or if you have" +
                ` special characters in your Discord username. If so, link your Discord tag as \`${shortID}\` in ` +
                "chat when prompted.");
        }

        if (discordTag !== Util.userTag(message.author) && discordTag !== shortID) {
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, `The Discord tag linked on Hypixel (\`${discordTag}\`) does not match the member's Discord ` +
                "tag.", false);

            return Util.reply(message, "**this player's Discord tag does not match your current tag.**\n\n" +
                `The Discord tag (\`${discordTag}\`) on Hypixel does not match your current tag (\`${Util
                    .userTag(message.author)}\`), or short ID form (\`${shortID}\`). If you don't know how to ` +
                `verify, run \`${message.prefix}help ${this.name}\` for steps on how to update your tag.`);
        }

        if (!player.achievements?.bedwars_level) {
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, "The Minecraft account has never played a game of BedWars.");

            return Util.reply(message, "**you've never played a game of BedWars.**\n\n" +
                "In order to verify your account, it's required you've played at least 1 game of Hypixel BedWars." +
                "Once you've done so, run this command again.");
        }

        return this.verify(message, player);
    }

    /**
     * Verifies the user.
     *
     * @param {Eris.Message} message The message to reference.
     * @param {Object} player The player data from Hypixel.
     */
    async verify(message, player) {
        let bedwarsLevel = player.achievements.bedwars_level;
        let bedwarsStar = this.category.getPlayerStar(bedwarsLevel);
        let bedwarsRole = this.category.getPlayerRole(message, bedwarsLevel);

        if (bedwarsLevel < 10) {
            bedwarsLevel = `0${bedwarsLevel}`;
        }

        let nickname = `[${bedwarsLevel} ${bedwarsStar}] ${player.displayname}`;
        let roles = [bedwarsRole.id, ...message.member.roles.filter((roleID) => !Object
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
            $userID: message.author.id,
            $minecraftUUID: player.uuid,
            $createdTimestamp: Date.now(),
            $editedTimestamp: null
        });

        await this.logVerify(message, {
            uuid: player.uuid,
            username: player.displayname
        }, "Member has successfully verified.", true);

        let isManageable = await Util.isManageable(message.member, this.client);

        await message.member.edit({
            roles: memberRoles,
            nick: isManageable ? nickname : undefined
        });

        await this.category.purgeMessages(message, message.member);
        await message.channel.createMessage(`${Constants.Emojis
            .BLUE_CHECK} Your account has been verified as **${player.displayname}**.`)
            .then((msg) => Util.deleteMessage(msg, { time: 3000 }));

        return true;
    }

    /**
     * Logs when a member tries to verify but passes/fails.
     *
     * @param {Eris.Message} message The message to reference.
     * @param {{ username: String, uuid: String }} player The Hypixel player data. May not be up-to-date with Mojang.
     * @param {String} reason The reason to be seen by moderators.
     * @param {Boolean} passed Whether or not the user successfully verified.
     * @return {Promise<Message> | Boolean} Returns the newly created message, or `false` if the sendType was not
     * supported.
     * @throws {Error} Will throw if the verification channel is not found (defined in Constants.js).
     */
    logVerify(message, player, reason, passed) {
        let channel = message.channel.guild.channels.get(this.category.channels.verificationLogs);
        let sendType = this.sendType(message);

        if (channel) {
            if (sendType === "embed") {
                return channel.createMessage({
                    embed: {
                        timestamp: new Date(),
                        title: passed ? "Member Verified" : "Verification Failed",
                        color: Util.base10(Constants.Colors[passed ? "GREEN" : "YELLOW"]),
                        description: reason,
                        fields: [
                            {
                                name: "Member",
                                value: `${Util.userTag(message.author)} (${message.author.mention})`,
                                inline: true
                            },
                            {
                                name: "Moderator",
                                value: `${Util.userTag(this.client.user)} (${this.client.user.mention})`,
                                inline: true
                            },
                            {
                                name: "Minecraft Account",
                                value: player.uuid
                                    ? `[${player.username}](${Endpoints.PLANCKE_PLAYER(player.uuid)})`
                                    : `??? (input: \`${player.username}\`)`,
                                inline: true
                            }
                        ]
                    }
                });
            } else if (sendType === "plain") {
                let content = `${Constants.Emojis[passed ? "INPUT_TRAY" : "X_EMOJI"]} **${Util.userTag(message
                        .author)}** (${message.author.mention}) ${passed
                    ? `has been verified by **${Util.userTag(this.client.user)}** (${this.client.user.id}).`
                    : `failed to verify their account for the following reason: ${reason}`}\n\nMinecraft Account: ` +
                    (player.uuid
                        ? `**${player.username}** (<${Endpoints.PLANCKE_PLAYER(player.uuid)}>)`
                        : `??? (input: \`${player.username}\`)`);

                return channel.createMessage(content);
            }

            return false;
        }

        throw new Error("Verification logs channel not found");
    }

    /**
     * Checks what type of message the bot should send to the channel.
     *
     * @param {Eris.Message} message The message to reference.
     * @return {"embed" | "plain"} The send type.
     */
    sendType(message) {
        if (message.channel.permissionsOf?.(this.client.user.id).has("embedLinks")) {
            return "embed";
        }

        return "plain";
    }

    /**
     * Sends a request to Hypixel for a player's info.
     *
     * @param {String} username The player's username.
     * @returns {Promise<Object>} The player data.
     * @private
     */
    _requestHypixelPlayerData(username) {
        return fetch(Endpoints.HYPIXEL_API_PLAYER_USERNAME(Constants.HYPIXEL_API_KEY, encodeURIComponent(username)))
            .then(this.checkStatus);
    }

    /**
     * Sends a request to Mojang for a player's most recent username.
     *
     * @param {String} uuid The UUID of the player.
     * @returns {Promise<String>} The player's username.
     * @private
     */
    _requestUsername(uuid) {
        return fetch(Endpoints.MINECRAFT_UUID_NAMEHISTORY(uuid))
            .then(this.checkStatus)
            .then((names) => names.pop().name);
    }
};