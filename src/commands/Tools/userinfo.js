"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");
const { User: ErisUser } = require("eris");
const dateformat = require("dateformat");
const ms = require("ms");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "[member|user]",
            description: "Displays information on a user/member.",
            fullDescription: "A user is any Discord user. A member is any user in a server. " +
            "In order to get info on a user, supply their user ID as the first argument. " +
            "Passing no arguments or using the command in DMs will show information on yourself.",
            aliases: ["user", "ui"],
            flags: [{
                name: "noembed",
                description: "Sends the user information as plain text instead of an embed. This " +
                "is automatically selected if I lack permission to `Embed Links`."
            }]
        });
    }

    async run(message, args) {
        let memberOrUser = args.length && message.channel.guild
            ? this.findMember(message, args)
            : message.member || message.author;

        if (!message.channel.guild && args.length || !memberOrUser) {
            if (Util.isSnowflake(args[0])) {
                memberOrUser = this.client.users.get(args[0]);

                if (!memberOrUser) {
                    try {
                        memberOrUser = await this.client.getRESTUser(args[0]);
                    } catch (ex) {
                        if (ex.code === 10013) {
                            return CommandError.ERR_INVALID_ARG_TYPE(message, args[0], "user ID");
                        }

                        return this.handleException(message, ex);
                    }
                }
            }
        }

        if (!memberOrUser) {
            return CommandError.ERR_NOT_FOUND(message, "guild member or user", args.join(" "));
        }

        return this.result(message, memberOrUser);
    }

    result(message, target) {
        const flags = Util.messageFlags(message, this.client);
        let { ENABLED: onEmoji, DISABLED: offEmoji } = Constants.CustomEmojis;
        let sendType = this.sendType(message, flags, target instanceof ErisUser);
        let bulletChar = "»";
        
        if (sendType === "member-embed" || sendType === "member-plain") {
            let status = Util.toTitleCase(target.status.replace("dnd", "do not disturb"));
            let customStatus = target.activities.find((activity) => activity.type === 4);
            let activityStatus = target.activities
                .find((activity) => [0, 1, 2, 3].includes(activity.type));
            let activityStatusType = null;

            if (activityStatus) {
                // eslint-disable-next-line default-case
                switch (activityStatus.type) {
                    case 0: {
                        activityStatusType = "Playing";
                        break;
                    }

                    case 1: {
                        activityStatusType = "Streaming";
                        break;
                    }

                    case 2: {
                        activityStatusType = "Listening To";
                        break;
                    }

                    case 3: {
                        activityStatusType = "Watching";
                        break;
                    }
                }
            }

            if (sendType === "member-embed") {
                let keyPerms = [
                    "administrator",
                    "banMembers",
                    "kickMembers",
                    "manageChannels",
                    "manageEmojis",
                    "manageGuild",
                    "manageMessages",
                    "manageNicknames",
                    "manageRoles",
                    "manageWebhooks",
                    "mentionEveryone",
                    "viewGuildAnalytics",
                    "voiceDeafenMembers",
                    "voiceMoveMembers",
                    "voiceMuteMembers"
                ];

                let permissions = this.sanitizePermissions(Object.keys(target.permission.json)
                    .filter((perm) => target.permission.json[perm] && keyPerms.includes(perm)));

                return message.channel.createMessage({
                    embed: {
                        timestamp: new Date(target.createdAt),
                        color: target.roles.length
                            ? target.roles
                                .map((roleID) => message.channel.guild.roles.get(roleID))
                                .sort((a, b) => b.color ? b.position - a.position : -1)[0].color ||
                            Util.base10(Constants.Colors.DEFAULT)
                            : Util.base10(Constants.Colors.DEFAULT),
                        description: [
                            target.mention,
                            message.channel.guild.members.get(message.channel.guild
                                .ownerID).id === target.id
                                ? Constants.CustomEmojis.GUILD_OWNER
                                : null,
                            target.premiumSince ? Constants.CustomEmojis.BOOST : null,
                            target.bot ? Constants.CustomEmojis.BOT : null,
                            target.user.system ? Constants.CustomEmojis.SYSTEM : null,
                            Constants.BOT_STAFF.includes(target.user.id)
                                ? Constants.CustomEmojis.STAFF
                                : null,
                            target.clientStatus && target.clientStatus
                                .mobile === "online"
                                ? Constants.Emojis.PHONE
                                : null
                        ].filter((prop) => prop !== null).join(" "),
                        thumbnail: { url: target.avatarURL },
                        footer: { text: `User ID: ${target.id} | Account Created` },
                        author: {
                            name: Util.userTag(target),
                            icon_url: target.avatarURL
                        },
                        fields: [
                            target.nick ? {
                                name: "Nickname",
                                value: target.nick,
                                inline: true
                            } : null,
                            {
                                name: "Joined On",
                                value: dateformat(target.joinedAt, "mmmm dS, yyyy"),
                                inline: true
                            },
                            {
                                name: "Status",
                                value: `${Constants.CustomEmojis[status.toUpperCase()
                                    .replace(/ /g, "_")]} ${status} ${target.voiceState.sessionID
                                    ? `(**${message.channel.guild.channels.get(target.voiceState.channelID).mention}**)`
                                    : ""}`,
                                inline: true
                            },
                            target.activities.length ? {
                                name: "Activity",
                                value: [
                                    customStatus
                                        ? `${onEmoji} Custom Status: **${customStatus.state}**`
                                        : `${offEmoji} Custom Status`,
                                    
                                    activityStatus
                                        ? `${onEmoji} ${activityStatusType}: **${activityStatus.type === 2
                                            ? `${activityStatus.state || "?"} — ${activityStatus.details || "?"}`
                                            : activityStatus.name}** (${activityStatus.assets.large_text})`
                                        : `${offEmoji} Activity Status`
                                    // activityStatus
                                    //     ? `${onEmoji} ${activityStatusType}: **${activityStatus.type === 2
                                    //         ? activityStatus.details
                                    //         : `${activityStatus.state || "?"} — ${activityStatus
                                    //             .name || "?"}`}** (${ms(Date.now() - activityStatus
                                    //         .created_at, { long: true })})`
                                    //     : `${offEmoji} Activity Status`
                                ].join("\n")
                            } : null,
                            target.roles.length ? {
                                name: "Roles",
                                value: Util.arrayJoinLimit(target.roles
                                    .map((roleID) => message.channel.guild.roles.get(roleID))
                                    .sort((a, b) => b.position - a.position)
                                    .map((role) => role.mention), " ", 1024)
                            } : null,
                            permissions.length ? {
                                name: "Primary Permissions",
                                value: permissions.join(", ")
                            } : null
                        ].filter((field) => field !== null)
                    }
                });
            }

            let content = `**${Util.userTag(target)}** ` + [
                message.channel.guild.members.get(message.channel.guild
                    .ownerID).id === target.id
                    ? Constants.CustomEmojis.GUILD_OWNER
                    : null,
                target.premiumSince ? Constants.CustomEmojis.BOOST : null,
                target.bot ? Constants.CustomEmojis.BOT : null,
                Constants.BOT_STAFF.includes(target.user.id)
                    ? Constants.CustomEmojis.STAFF
                    : null,
                target.clientStatus && target.clientStatus
                    .mobile === "online"
                    ? Constants.Emojis.PHONE
                    : null
            ].filter((prop) => prop !== null).join(" ") + "\n" + [
                target.nick ? `Nickname: ${target.nick}` : null,
                `Status: ${Constants.CustomEmojis[status.toUpperCase()
                    .replace(/ /g, "_")]} ${status} ${target.voiceState.sessionID
                    ? `(**${message.channel.guild.channels.get(target.voiceState
                        .channelID).mention}**)`
                    : ""}`,
                `Joined At: **${dateformat(target.joinedAt, "mmmm dS, yyyy")}**`,
                `Account Registered: **${dateformat(target.createdAt, "mmmm dS, yyyy")}**`,
                `User ID: \`${target.id}\``
            ].filter((prop) => prop !== null).map((str) => `${bulletChar} ${str}`)
                .join("\n") + "\n\n" + [
                target.activities.length ? [
                    customStatus
                        ? `${onEmoji} Custom Status: **${customStatus
                            .state}**`
                        : `${offEmoji} Custom Status`,
                    
                    activityStatus
                        ? `${onEmoji} ${activityStatusType}: **${activityStatus
                            .name}** (${ms(Date.now() - activityStatus
                            .created_at, { long: true })})`
                        : `${offEmoji} Activity Status`
                ].join("\n") : null
            ].filter((prop) => prop !== null).join("\n");

            return message.channel.createMessage(content);
        } else if (sendType === "user-embed" || sendType === "user-plain") {
            if (sendType === "user-embed") {
                return message.channel.createMessage({
                    embed: {
                        timestamp: new Date(target.createdAt),
                        color: Util.base10(Constants.Colors.DEFAULT),
                        description: [
                            target.mention,
                            target.bot ? Constants.CustomEmojis.BOT : null,
                            target.system ? Constants.CustomEmojis.SYSTEM : null
                        ].filter((prop) => prop !== null).join(" "),
                        thumbnail: { url: target.avatarURL },
                        footer: { text: `User ID: ${target.id} | Account Created` },
                        author: {
                            name: Util.userTag(target),
                            icon_url: target.avatarURL
                        }
                    }
                });
            }

            let content = `**${Util.userTag(target)}** ` + [
                target.bot ? Constants.CustomEmojis.BOT : null,
                target.system ? Constants.CustomEmojis.SYSTEM : null
            ].filter((prop) => prop !== null).join(" ") + "\n" + [
                `User ID: \`${target.id}\``,
                `Account Registered: **${dateformat(target.createdAt, "mmmm dS, yyyy")}**`
            ].map((str) => `${bulletChar} ${str}`).join("\n");

            return message.channel.createMessage(content);
        }
    }

    sendType(message, flags, isUser) {
        if (isUser) {
            if (!flags.noembed && (!message.channel.guild || message.channel
                .permissionsOf(this.client.user.id).has("embedLinks"))) {
                return "user-embed";
            }

            return "user-plain";
        }

        if (!flags.noembed && (!message.channel.guild || message.channel
            .permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "member-embed";
        }


        return "member-plain";
    }
};