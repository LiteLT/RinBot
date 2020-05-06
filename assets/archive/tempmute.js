"use strict";

const { Util, Command, Constants, CommandError } = require("../../src/index.js");
const ms = require("ms");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<member> <time> [reason]",
            description: "Temporarily mutes a member.",
            fullDescription: "The tempmute command revokes a member's permission to speak and " +
            "add reactions in text and voice channels. The difference between this and the " +
            "`mute` command is the mute command will permanently mute a member. Attempting to " +
            "add a duration with the `mute` command will emit a warning for confirmation.\n\n" +

            "In order to mute the member, a Muted role must exist. If no role exists, one will " +
            "automatically be created. A member can be muted from a range of **10 seconds** to " +
            "**1 year**. In order to mute someone for a specific range in time (e.g. 5 hours and " +
            "30 minutes), the time must be combined into the single time argument. For example, " +
            "muting someone for 5 hours and 30 seconds can be written as `5h30m`.\n\n",
            requiredArgs: 2,
            enabled: false,
            guildOnly: true,
            aliases: ["tm", "tmute"],
            clientPermissions: ["manageRoles"],
            flags: [
                {
                    name: "silent",
                    description: "Logs the mute without DMing the member of their punishment."
                },
                {
                    name: "showmod",
                    description: "DMs the member with the staff/moderator shown in the message."
                }
            ]
        });
    }
    
    async run(message, [memberArg, timeArg, ...reasonArgs]) {
        let member = this.findMember(message, [memberArg], { strict: true });
        let time = (timeArg.match(/\d+[a-zA-Z]+/g) || [])
            .reduce((prev, time) => prev + ms(time), 0);
        let reason = reasonArgs.join(" ");

        let settings = (await this.client.db.table("guilds").get(message.channel.guild.id)
            .pluck("moderation").run(this.client.dbConnection)).moderation;
        let status = await this.check(message, member, memberArg, time, timeArg, reason, settings);

        if (status === true) {
            let muteRole = settings.muteRole && message.channel.guild.roles.get(settings.muteRole);

            if (!muteRole) {
                const MAX_GUILD_ROLES_SIZE = 250;

                if (message.channel.guild.roles.size >= MAX_GUILD_ROLES_SIZE) {
                    return message.channel.createMessage("The mute role has not been set and I " +
                    "am not able to create one. This is due to the guild hitting the maximum " +
                    "role count of 250.\n\nTo resolve this issue, make room for at least **1** " +
                    "new role so I can create one, or use the `settings` command to set a role " +
                    "instead.");
                }

                await message.channel.createMessage(`${Constants.Emojis
                    .WARNING} Mute role does not exist, attempting to create one...`);

                muteRole = await message.channel.guild.createRole({
                    name: "Muted",
                    permissions: 0,
                    color: Util.base10(Constants.Colors.GRAY)
                });

                await this.client.db.table("guilds").get(message.channel.guild.id)
                    .update({ moderation: { muteRole: muteRole.id } })
                    .run(this.client.dbConnection);

                for (const [, channel] of message.channel.guild.channels) {
                    if (channel.permissionsOf(this.client.user.id).has("manageChannels")) {
                        // 2099264 -> Send Messages, Add Reactions and Speak.
                        await channel.editPermission(muteRole.id, 0, 2099264, "role");
                    }
                }
            }

            let punishment = (await this.client.db.table("modlogs").insert({
                guildID: message.channel.guild.id,
                type: "tempmute",
                duration: time,
                reason: reason === "" ? null : reason,
                deleted: false,
                timestamp: new Date(),
                caseNumber: this.client.db.table("modlogs")
                    .filter(this.client.db.row("guildID").eq(message.channel.guild.id))
                    .count().add(1),
                user: {
                    id: member.id,
                    username: member.username,
                    discriminator: member.discriminator
                },
                moderator: {
                    id: message.author.id,
                    username: message.author.username,
                    discriminator: message.author.discriminator
                }
            }).run(this.client.dbConnection, { returnChanges: true })).changes[0].new_val;

            await member.addRole(muteRole.id, `Muted by ${Util.userTag(message.author)}`);

            let logsChannel = settings.modlogs.channelID &&
            message.channel.guild.channels.get(settings.modlogs.channelID);

            if (logsChannel && logsChannel.permissionsOf(this.client.user.id).has("sendMessages")) {
                try {
                    if (settings.modlogs.type === "embed" &&
                        logsChannel.permissionsOf(this.client.user.id).has("embedLinks")) {
                        await logsChannel.createMessage({
                            embed: {
                                timestamp: new Date(),
                                title: `Tempmute | Case #${punishment.caseNumber}`,
                                color: Util.base10(Constants.Colors.MODLOGS_MUTE),
                                fields: [
                                    {
                                        name: "User",
                                        value: `${Util.userTag(member)} (${member.mention})`,
                                        inline: true
                                    },
                                    {
                                        name: "Moderator",
                                        value: `${Util.userTag(message.author)} (${message.author
                                            .mention})`,
                                        inline: true
                                    },
                                    {
                                        name: "Duration",
                                        value: ms(time, { long: true }),
                                        inline: true
                                    },
                                    {
                                        name: "Reason",
                                        value: reason || `None (Moderator: Do \`${Constants
                                            .PRIMARY_PREFIX}reason ${punishment
                                            .caseNumber} <reason>\`).`
                                    }
                                ]
                            }
                        });
                    } else if (settings.modlogs.type === "text") {
                        await logsChannel.createMessage(`${Constants.Emojis
                            .ZIPPER_MOUTH} **${Util.userTag(member)}** (${member.user
                            .id}) was temporarily muted by **${Util.userTag(message
                            .author)}** (${message.author.id}) for **${ms(time, {
                            long: true
                        })}**${reason ? `with the following reason:\n>>> ${reason}` : "."}`);
                    } else {
                        this.client.logger.warn(`[Command - ${this.category}/${this
                            .name}]: Unknown modlogs type "${settings.modlogs.type}".`);

                        throw new Error(`Unknown modlogs type "${settings.modlogs.type}".`);
                    }
                } catch (ex) {
                    await message.channel.createMessage(`${Constants.CustomEmojis
                        .WARNING} Could not log to the punishment logs channel: \`${ex.message}\``);
                }
            } else if (settings.modlogs.channelID || logsChannel) {
                await message.channel.createMessage(`${Constants.Emojis
                    .WARNING} Could not find the modlogs channel.`);
            }

            const flags = Util.messageFlags(message, this.client);

            if (settings.dmMember && !flags.silent) {
                await member.user.getDMChannel().then((dm) => {
                    let content = `${Constants.Emojis.ZIPPER_MOUTH} You have been muted in ` +
                    `**${message.channel.guild.name}** for **${ms(time, { long: true })}**` +
                    (flags.showmod ? ` by **${Util.userTag(message.author)}**${reason}` : "") +
                    (reason !== "" ? ` with the following reason:\n>>> ${reason}` : "");

                    return dm.createMessage(content);
                }).catch(() => message.channel.createMessage(`${Constants.Emojis
                    .WARNING} Could not message **${Util.userTag(member)}**.`));
            }

            return message.channel.createMessage(`${Constants.Emojis.PAPER_PENCIL} **${Util
                .userTag(member)}** has been warned.`);
        } else if (typeof status === "string") {
            return message.channel.createMessage(status);
        } else if (status === null) {
            return;
        }
    }

    /**
     * @typedef {import("eris").Message} Message
     * @typedef {import("eris").Member} Member
     */
    /**
     * Checks if the arguments and settings are all good before proceeding any further.
     * @param {Message} message The message instance.
     * @param {Member} member The member to mute.
     * @param {String} memberArg The original member string used in finding the member to punish.
     * @param {Number} time The time in milliseconds to mute the member for.
     * @param {String} timeArg The original time string used in converting the string to a number.
     * @param {String} reason The mute reason.
     * @param {Object} settings The guild settings.
     * @returns {null|String|Boolean} `null` when the check fails but should silently reject,
     * a string when the check fails and the string should be sent back to the user,
     * or true - when the check passes.
     */
    async check(message, member, memberArg, time, timeArg, reason, settings) {
        const MAX_REASON_LENGTH = 800;
        const MIN_MUTE_LENGTH = 10000;

        if (!member) {
            CommandError.ERR_NOT_FOUND(message, "guild member", memberArg);

            return null;
        }

        if (reason.length > MAX_REASON_LENGTH) {
            return `Invalid Usage: Mute reason is too long. [${reason
                .length}/${MAX_REASON_LENGTH}]`;
        }

        if (time) {
            if (time < 0) {
                return `Invalid Usage: Mute duration must be a positive number.`;
            }

            if (time < MIN_MUTE_LENGTH) { // 5 seconds.
                return `Invalid Usage: Mute duration must be ${MIN_MUTE_LENGTH / 1000} seconds ` +
                "or longer.";
            } else if (time > 31557600000) { // 1 year.
                return "Invalid Usage: Mute duration cannot be over a year in length.";
            }

            if (settings.maxMuteLength !== null && time > settings.maxMuteLength) {
                if (settings.lengthConflict === "warn") {
                    let notice = `${Constants.Emojis.STOPWATCH} The mute duration supplied ` +
                    `exceeds the duration allowed (**${ms(settings.maxMuteLength, {
                        long: true
                    })}**). Would you like to process?\nThis will timeout in 30 seconds. [Y/N]`;
                    let msg = await Util.messagePrompt(message, message.channel, this
                        .client, notice, 30000, ["y", "yes", "n", "no", "stop"]).catch(() => null);

                    if (msg === null) {
                        return null;
                    }

                    if (["n", "no", "stop"].includes(msg.content.toLowerCase())) {
                        return "Aborted.";
                    }
                }
            }
        } else {
            return `Invalid Usage: Time "${timeArg}" is not valid. Examples of correct usage:\n` + [
                "`30s` - 30 seconds.",
                "`5h` - 5 hours.",
                "`3d` - 3 days.",
                "`1w` - 1 week.",
                "`30d` - 30 days (1 month).",
                "`3h20s` - 3 hours and 20 seconds."
            ].map((str) => `- ${str}`).join("\n");
        }

        if (settings.modRoles.length) {
            let authorIsMod = ["manageGuild", "administrator"]
                .some((perm) => message.member.permission.has(perm));

            for (const roleID of settings.modRoles) {
                if (member.roles.includes(roleID)) {
                    return `Invalid Usage: **${Util.userTag(member)}** is a moderator.`;
                }

                if (!authorIsMod && message.member.roles.includes(roleID)) {
                    authorIsMod = true;
                }
            }

            if (!authorIsMod) {
                return "Invalid Usage: You must be a moderator to run this command.";
            }
        }

        if (settings.muteRole) {
            let muteRole = message.channel.guild.roles.get(settings.muteRole);

            if (muteRole) {
                let guildMe = await Util.guildMe(this.client, message.channel.guild);
                let botHighestRole = Util.memberHighestRole(guildMe);

                if (botHighestRole.position <= muteRole.position) {
                    return "Invalid Usage: I do not have permission to manage the server " +
                    "mute role. Please check the role hierarchy to make sure my highest role " +
                    `is higher than the **${muteRole.name}** role.`;
                }
            }
        }

        return true;
    }
};