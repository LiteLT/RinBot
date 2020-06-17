"use strict";

const { Util, Command, Constants, Endpoints } = require("../../index.js");
const fetch = require("node-fetch");
const VERIFY_STEPS = `${[
    "Go to any lobby.",
    "Right click your player head.",
    "Click the social media menu (Twitter icon).",
    "Click the Discord icon.",
    "Paste your Discord username when asked (e.g. `Kinolite#0001`).",
    `Head back to \`#verification\` and run \`${Constants.PRIMARY_PREFIX}bwverify <username>\` with \`username\` ` +
    "being your Minecraft username."
].map((str, index) => `**${index + 1}.** ${str}`).join("\n")}\n\nExample: \`${Constants
    .PRIMARY_PREFIX}bwverify Kinolite\``;

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<username>",
            description: "Links your Minecraft account to your Discord account.",
            fullDescription: `${VERIFY_STEPS}\n\nIf the command fails, you'll see an error message in bold. Read the ` +
                "instructions on how to properly verify your account before contacting a staff member.",
            cooldown: 5,
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["bwverify"],
            clientPermissions: ["manageRoles", "manageNicknames"],
            validatePermissions: (message) => message.guildID === Constants.GUILD_HYPIXEL_BEDWARS ||
                this.category.onUsageInWrongGuild(),
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
            }, "This member's Discord account is already verified.", false);

            return Util.reply(message, "**Your Discord Account is Already Verified.**\n\n" +
            `Your Discord account is currently verified under the Minecraft account, \`${mcUsername}\`.\n` + [
                `If you'd like to verify under this Minecraft account, do \`${message.prefix}bwupdate\`.`,
                "If you'd like to verify under a different Minecraft or Discord, contact a staff member.",
            ].map((str) => `   - ${str}`).join("\n"));
        }

        if (!/^\w{1,16}$/.test(username)) {
            await this.logVerify(message, { username }, "The username is not a valid Minecraft " +
                "username.", false);

            return Util.reply(message, "**Invalid Username**\n\n" +
                "The Minecraft username you entered is not a valid Minecraft username. A valid username can only" +
                " contain letters A-Z and numbers 0-9.");
        }

        let player = await this._requestHypixelPlayerData(username);

        if (player.player === null) {
            await this.logVerify(message, { username }, "The username could not be found on " +
                "Hypixel.", false);

            return Util.reply(message, "**Username Not Found.**\n\n" +
                "The username you entered could not be found on Hypixel.\n" + [
                    "Make sure the username you typed in is correct. Usernames are **not** case-sensitive.",
                    "Try logging into the server. If you can't connect, try signing out and signing back into" +
                    " Minecraft through the Minecraft launcher.",
                    "Make sure the username you entered is your Minecraft username (not your Discord username)."
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
            }, "The Minecraft account this member used is **blacklisted**.", false);

            return Util.reply(message, "**This Minecraft Account is Blacklisted.**\n\n" +
            `You're not allowed to verify under the account \`${player.displayname}\`.`);
        }

        existingEntry = await this.client.db.get("SELECT userID, minecraftUUID FROM bw_verified WHERE guildID = ?" +
            " AND minecraftUUID = ?", [message.guildID, player.uuid]) || null;

        if (existingEntry) {
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, "This member attempted to verify under a Minecraft account that's already verified (linked " +
            `user ID: \`${existingEntry.userID}\`).`, false);

            let target = this.findMember(message, [existingEntry.userID], { strict: true }) ||
                await this.client.getRESTUser(existingEntry.userID).catch(() => null);

            return Util.reply(message, "**This Minecraft Account is Already Registered.**\n\n" +
            `The Minecraft account (${player.displayname}) you entered is linked to another Discord account (${target
                ? Util.userTag(target)
                : `??? (user ID: \`${existingEntry.userID}\`)`})\n\n` +
                "If you want to link the Minecraft account to this current Discord account, contact a staff member.");
        }

        let discordTag = player.socialMedia?.links?.DISCORD?.trim() ?? null;

        if (discordTag === null) {
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, "The Minecraft account has not been linked to any Discord account on Hypixel.", false);

            return Util.reply(message, "**This Minecraft Account has not Linked a Discord Account.\n\n**" +
                `The Minecraft account (${player.displayname}) you entered was found, but has not been linked to any ` +
                `Discord account on Hypixel. To link your account, follow the following steps:\n\n${VERIFY_STEPS}\n\n` +
            "If you see a message like, \"The URL isn't valid!\" in chat, make sure you typed your Discord username" +
                ` and tag (\`${Util.userTag(message.author)}\`) correctly. If the message persists, you likely have` +
                ` a special character in your username. Instead of your Discord tag, type \`${message.author.id
                    .slice(-6)}#${message.author.discriminator}\` in chat when prompted and re-run the command.`);
        }

        if (discordTag !== Util.userTag(message.author) &&
            discordTag !== `${message.author.id.slice(-6)}#${message.author.discriminator}`) {
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, `The Discord tag linked on Hypixel (\`${discordTag}\`) does not match the member's Discord ` +
                "tag.", false);

            return Util.reply(message, "**The Discord Tag on Hypixel Does Not Match With Your Current Tag.**\n\n" +
            `The Discord tag (\`${discordTag}\`) on does not match with your current Discord tag (\`${Util
                .userTag(message.author)}\`) or short ID (\`${message.author.id.slice(-6)}#${message.author
                .discriminator}\`) on __Hypixel__. Run \`${message.prefix}help ${this.name}\` for steps on how to ` +
                "update your tag.");
        }

        if (!player.achievements?.bedwars_level) {
            await this.logVerify(message, {
                uuid: player.uuid,
                username: player.displayname
            }, "The Minecraft account has never played a game of BedWars.");

            return Util.reply(message, "**Your Minecraft Account Has Never Played a Game of BedWars**\n\n" +
            "In order to fetch your game stats, it's required you play at least **1** game of BedWars. Play a game" +
                " then run this command again.");
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