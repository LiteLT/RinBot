"use strict";

const { Util, Command, Constants, CommandError } = require("../../src/index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<member> [reason]",
            description: "Warns a member.",
            requiredArgs: 1,
            enabled: false,
            guildOnly: true,
            aliases: ["strike", "w"],
            flags: [
                {
                    name: "silent",
                    description: "Logs the warning without DMing the member of their punishment."
                },
                {
                    name: "showmod",
                    description: "DMs the member with the staff/moderator shown in the message."
                }
            ]
        });
    }

    async run(message, [memberArg, ...reasonArgs]) {
        let member = this.findMember(message, [memberArg], { strict: true });
        let reason = reasonArgs.join(" ");

        let settings = (await this.client.db.table("guilds").get(message.channel.guild.id)
            .pluck({ moderation: ["modRoles", "dmMember", "modlogs"] })
            .run(this.client.dbConnection)).moderation;
        let status = this.check(message, member, memberArg, reason, settings);

        if (status === true) {
            let punishment = (await this.client.db.table("modlogs").insert({
                guildID: message.channel.guild.id,
                reason: reason === "" ? null : reason,
                type: "warn",
                duration: null,
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

            let logsChannel = settings.modlogs.channelID &&
            message.channel.guild.channels.get(settings.modlogs.channelID);

            if (logsChannel && logsChannel.permissionsOf(this.client.user.id).has("sendMessages")) {
                try {
                    if (settings.modlogs.type === "embed" &&
                        logsChannel.permissionsOf(this.client.user.id).has("embedLinks")) {
                        await logsChannel.createMessage({
                            embed: {
                                timestamp: new Date(),
                                title: `Warn | Case #${punishment.caseNumber}`,
                                color: Util.base10(Constants.Colors.MODLOGS_WARN),
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
                            .PAPER_PENCIL} **${Util.userTag(member)}** (${member.user
                            .id}) was warned by **${Util.userTag(message.author)}** (${message
                            .author.id}) with the following reason:\n>>> ${reason}`);
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
                    return dm.createMessage(`${Constants.Emojis.WARNING} You have received a ` +
                    `warning in **${message.channel.guild.name}**${flags.showmod ? ` from **${Util
                        .userTag(message.author)}**` : ""}${reason
                        ? ` for the following reason:\n>>> ${reason}`
                        : "."}`);
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
     * Check the arguments/permission before executing the real `warn` command.
     * @param {Message} message The message instance.
     * @param {Member} member The member to warn.
     * @param {String} memberArg The original message string for finding the member to warn.
     * @param {String} reason The reason to warn the member for.
     * @param {Object} settings Guild settings.
     * @returns {null|String|Boolean} `null` when the check fails but should silently reject,
     * a string when the check fails and the string should be sent back to the user,
     * or true - when the check passes.
     */
    check(message, member, memberArg, reason, settings) {
        let MAX_REASON_LENGTH = 800;

        if (!member) {
            CommandError.ERR_NOT_FOUND(message, "guild member", memberArg);

            return null;
        }

        if (reason.length > MAX_REASON_LENGTH) {
            return `Invalid Usage: Warn reason is too long. [${reason
                .length}/${MAX_REASON_LENGTH}]`;
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

        return true;
    }
};