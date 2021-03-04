"use strict";

const { Util, Command, Constants, Endpoints, CommandError } = require("../../index.js");
const fetch = require("node-fetch");
const { Member } = require("eris");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<member|user>",
            description: "Un-verifies a user.",
            fullDescription: "To use this command, you must be a staff member on the **Hypixel BedWars** server.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["bwunverify"],
            clientPermissions: ["manageRoles", "manageNicknames"],
            validatePermissions: (msg) => {
                if (msg.guildID === Constants.GUILD_HYPIXEL_BEDWARS) {
                    return msg.member.roles.includes(this.category.roles.discordStaff);
                }

                return this.category.onUsageInWrongGuild();
            },
            flags: [{
                name: "reset",
                description: "Resets the user's state by removing their roles, removing their nickname, and putting" +
                    " them back in the verification channel."
            }]
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
                target = await this.client.getRESTUser(args[0]).catch((err) => err);
            }

            if (!target || target instanceof Error) {
                return CommandError.ERR_NOT_FOUND(message, "guild member", args.join(" "));
            }
        }

        let existingEntry = await this.client.db.get("SELECT minecraftUUID FROM bw_verified WHERE guildID = ? " +
            "AND userID = ?", [message.guildID, target.id]);

        if (!existingEntry) {
            await this.logUpdate(message, target, {}, "This user is not verified.");

            return Util.reply(message, `**${Util.userTag(target)}** is not verified.`);
        }

        await this.client.db.run("DELETE FROM bw_verified WHERE guildID = ? AND userID = ?", [
            message.guildID,
            target.id
        ]);

        if (Util.messageFlags(message, this.client).reset && target instanceof Member) {
            await target.edit({
                nick: "",
                reason: "Member un-verified.",
                roles: [this.category.roles.needUsernames]
            });
        }

        let username = await this._fetchMcUsername(existingEntry.minecraftUUID);
        this.logUpdate(message, target, { username, uuid: existingEntry.minecraftUUID });

        return message.channel.createMessage(`${Constants.Emojis.BLUE_CHECK} **${Util.userTag(target)}** (${target
            .id}) has been unverified.`).then((msg) => Util.deleteMessage(msg, { time: 3000 }));
    }

    /**
     * Logs when a staff member tries to un-verify a user.
     *
     * @param {Eris.Message} message The message to reference.
     * @param {Eris.User} target The target user.
     * @param {{ username: ?string, uuid: string }} player The player's basic data.
     * @param {?string} reason The reason to be displayed in the embed.
     */
    logUpdate(message, target, player, reason) {
        let channel = message.channel.guild.channels.get(this.category.channels.verificationLogs);
        let sendType = this.sendType(message);

        if (channel) {
            if (sendType === "embed") {
                return channel.createMessage({
                    embed: {
                        timestamp: new Date(),
                        title: reason ? "Un-verification Failed" : "Member Unverified",
                        color: Util.base10(Constants.Colors[reason ? "YELLOW" : "GREEN"]),
                        description: reason || "The target member was successfully unverified.",
                        fields: [
                            {
                                name: "Member",
                                value: `${Util.userTag(target)} (${target.mention})`,
                                inline: true
                            },
                            {
                                name: "Moderator",
                                value: `${Util.userTag(message.author)} (${message.author.mention})`,
                                inline: true
                            },
                            {
                                name: "Minecraft Account",
                                value: player.uuid && player.username
                                    ? `[${player.username}](${Endpoints.PLANCKE_PLAYER(player.uuid)})`
                                    : `??? (input: \`${player.username || "?"}\`)`,
                                inline: true
                            }
                        ]
                    }
                });
            } else if (sendType === "plain") {
                let content;

                if (reason) {
                    content = `${Constants.Emojis.X_EMOJI} **${Util.userTag(message.author)}** (${message.author
                        .id}) tried to un-verify **${Util.userTag(target)}** (${target
                        .id}), but failed for the following reason: ${reason}`;
                } else {
                    content = `${Constants.Emojis.OUTPUT_TRAY} **${Util.userTag(message.author)}** (${message.author
                        .id}) successfully un-verified **${Util.userTag(target)}** (${target.id})`;
                }

                content += `\n- Minecraft account: ${player.uuid && player.username
                    ? `**${player.username}** (<${Endpoints.PLANCKE_PLAYER(player.uuid)}>)`
                    : `? (\`${player.username || "?"}\`)`}`;

                return channel.createMessage(content);
            }

            return false;
        }

        throw new Error("Verification logs channel not found");
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