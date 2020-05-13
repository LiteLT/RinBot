"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<member> [reason]",
            description: "Warns a member.",
            requiredArgs: 1,
            enabled: false,
            guildOnly: true,
            aliases: ["w", "strike"],
            validatePermissions: (message) => {
                let roles = this.client.guildSettings.get(message.guildID).moderation.roles;

                if (roles.length) {
                    return roles.some((roleID) => message.member.roles.includes(roleID));
                }

                return "There seems to be no configured moderator role on this server. To create one, check the help" +
                    " manual for the `modrole` command.";
            },
            flags: [
                {
                    name: "silent",
                    value: "yes/no",
                    description: "Whether or not to message the member about their punishment. This flag overrides " +
                    "the default setting for your server."
                },
                {
                    name: "showmod",
                    value: "yes/no",
                    description: "Whether or not to show the moderator when notifying the member about their " +
                    "punishment. This flag overrides the default setting for your server. This flag is redundant if " +
                    "the `--silent` flag is enabled."
                }
            ]
        });
    }

    /**
     * Runs the command.
     * @param {Eris.Message} message The message the command was called on.
     * @param {String} memberArg The member being punished.
     * @param {Array<String>} [reasonArgs] The reason of the punishment.
     */
    async run(message, [memberArg, ...reasonArgs]) {
        let member = this.findMember(message, [memberArg], { strict: true });
        let reason = reasonArgs.join(" ");
        let settings = this.client.guildSettings.get(message.guildID);
        let result = this.check(message, member, memberArg, reason);

        if (typeof result === "string") {
            return message.channel.createMessage(result);
        } else if (result === false) {
            return;
        }

        let flags = Util.messageFlags(message, this.client);

        await this.logPunishment(message, member, reason, settings);

        if (!flags.silent) {
            let res = await this.notify(message, member, reason, !!flags.showmod);

            if (res === null) {
                await message.channel.createMessage(`${Constants.Emojis.WARNING} Could not DM the user.`);
            }
        }

        return message.channel.createMessage(`**${Util.userTag(member)}** has been warned.`);
    }

    /**
     * Notifies the punished user in DMs.
     * @param {Eris.Message} message The message to reference.
     * @param {Eris.Member} member The member who was punished.
     * @param {String} [reason] The reason of the punishment.
     * @param {Boolean} showMod Whether or not to show the moderator to the user.
     * @returns {Promise<Eris.Message>} The message sent to the user. The message will be `null` if it failed to DM.
     */
    async notify(message, member, reason, showMod) {
        try {
            let channel = await member.user.getDMChannel();

            return await channel.createMessage([
                `You have received a warning in **${message.channel.guild.name}**`,
                showMod ? `from **${Util.userTag(message.author)}**` : null,
                reason ? `for the following reason: ${reason}` : null
            ].filter((prop) => prop !== null).join(" "));
        } catch {
            return null;
        }
    }

    /**
     * Saves the punishment to the database and modlogs channel.
     * @param {Eris.Message} message The message to reference.
     * @param {Eris.Member} member The member who's being punished.
     * @param {String} reason The reason of the punishment.
     * @param {Object} settings The guild settings.
     * @returns {Promise<void>}
     */
    async logPunishment(message, member, reason, settings) {
        let fields = [
            "type",
            "caseID",
            "reason",
            "deleted",
            "guildID",
            "duration",
            "editedTimestamp",
            "createdTimestamp",
            "userID",
            "userName",
            "userDiscriminator",
            "moderatorID",
            "moderatorName",
            "moderatorDiscriminator"
        ];
        let caseID = ((await this.client.db.get("SELECT caseID FROM punishments WHERE guildID = ? ORDER BY " +
        "caseID DESC", [message.guildID])).caseID || 0) + 1;

        await this.client.db.run(`INSERT INTO punishments (${fields.join(", ")}) VALUES (${fields
            .map((field) => `$${field}`).join(", ")})`, {
            $type: "warn",
            $caseID: caseID,
            $reason: reason,
            $deleted: 0, // 0 => false, 1 => true
            $guildID: message.guildID,
            $duration: null,
            $editedTimestamp: null,
            $createdTimestamp: Date.now(),
            $userID: member.id,
            $userName: member.username,
            $userDiscriminator: member.discriminator,
            $moderatorID: message.member.id,
            $moderatorName: message.member.username,
            $moderatorDiscriminator: message.member.discriminator
        });

        let channel = message.channel.guild.channels.get(settings.moderation.channel);

        if (channel) {
            return channel.createMessage({
                embed: {
                    timestamp: new Date(),
                    title: `Warn | Case #${caseID}`,
                    color: Util.base10(Constants.Colors.MODLOGS_WARN),
                    fields: [
                        {
                            name: "User",
                            value: `${Util.userTag(member)} (${member.mention})`,
                            inline: true
                        },
                        {
                            name: "Moderator",
                            value: `${Util.userTag(message.member)} (${message.member.mention})`,
                            inline: true
                        },
                        {
                            name: "Reason",
                            value: reason || `??? (Moderator: Do \`${message.prefix}reason ${caseID} <reason>\`)`
                        }
                    ]
                }
            });
        }
    }

    /**
     * Evaluates the member and arguments before continuing.
     * @param {Eris.Message} message The message to reference.
     * @param {Eris.Member} [member] The member found from the argument.
     * @param {String} memberArg The arguments passed to find the member.
     * @param {String} reason The reason for the punishment.
     * @returns {String|Boolean} A string for when the check failed to be sent to the member. A boolean for silent
     * passing/rejection. `true` if the check was successful, and `false` if the check was unsuccessful.
     */
    check(message, member, memberArg, reason) {
        if (!member) {
            CommandError.ERR_NOT_FOUND(message, "guild member", memberArg);

            return false;
        }

        if (reason.length > Constants.MAX_PUNISHMENT_REASON_LENGTH) {
            CommandError.ERR_BAD_LENGTH(message, "reason", "long", reason.length, Constants
                .MAX_PUNISHMENT_REASON_LENGTH);

            return false;
        }

        return true;
    }
};