"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");
const dateformat = require("dateformat");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<role>",
            description: "Displays information on a role.",
            fullDescription: "In order to retrieve the list of members in a role, you must use " +
            "the `rolemembers` command.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["ri"],
            flags: [{
                name: "noembed",
                description: "Sends the role info as plain text instead of an embed. This is " +
                "automatically selected if I do not have permission to `Embed Links`."
            }]
        });
    }

    async run(message, args) {
        let search = args.join(" ").toLowerCase();
        let role = /^\d+$/.test(args[0])
            ? message.channel.guild.roles.get(args[0])
            : message.channel.guild.roles
                .map((role) => role)
                .sort((a, b) => {
                    let aName = a.name.toLowerCase();
                    let bName = b.name.toLowerCase();

                    if (bName < aName) {
                        return 1;
                    } else if (bName > aName) {
                        return -1;
                    }

                    return 0;
                }).find((role) => role.name.toLowerCase() === search || role.name.toLowerCase().includes(search));

        if (role) {
            return this.result(message, role);
        }

        return CommandError.ERR_NOT_FOUND(message, "role", search);
    }

    result(message, role) {
        const flags = Util.messageFlags(message, this.client);
        let { ENABLED: onEmoji, DISABLED: offEmoji } = Constants.CustomEmojis;
        let sendType = this.sendType(message, flags);
        let roleMemberCount = role.id === role.guild.id
            ? role.guild.members.size
            : role.guild.members.filter((member) => member.roles.includes(role.id)).length;
        let hexColor = role.color.toString(16).toUpperCase();
        let bulletChar = "»";

        if (hexColor === "0") { // hexToRGB breaks if it's not a 6-digit number.
            hexColor = "000000";
        } else if (hexColor.length !== 3 || hexColor.length !== 6) {
            hexColor = hexColor.padStart(6, "0");
        }

        if (sendType === "embed") {
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

            let permissions = this.sanitizePermissions(Object.keys(role.permissions.json)
                .filter((perm) => role.permissions.json[perm] && keyPerms.includes(perm)));

            return message.channel.createMessage({
                embed: {
                    title: role.name,
                    color: role.color,
                    timestamp: new Date(role.createdAt),
                    description: [
                        role.mention,
                        `Position: **${role.guild.roles.size - role.position}**/**${role.guild.roles
                            .size}**`,
                        `Members: **${roleMemberCount}**/**${role.guild.members.size}** ${role.guild
                            .large ? `(may be inaccurate)` : ""}`,
                        `Hex: **#${hexColor}** | RGB: (**${this.hexToRGB(hexColor)}**)`,
                        "",
                        `${role.managed ? onEmoji : offEmoji} Managed.`,
                        `${role.mentionable ? onEmoji : offEmoji} Mentionable.`,
                        `${role.hoist ? onEmoji : offEmoji} Hoisted (displayed separate from ` +
                        `sidebar).`
                    ].join("\n"),
                    footer: {
                        text: `Role ID: ${role.id} | Created`
                    },
                    fields: [
                        permissions.length ? {
                            name: "Primary Permissions",
                            value: permissions.join(", ")
                        } : null
                    ].filter((field) => field !== null)
                }
            });
        } else if (sendType === "plain") {
            let content = `**${role.name}**\n` + [
                `Position: **${role.guild.roles.size - role.position}**/**${role.guild.roles
                    .size}**`,
                `Members: **${roleMemberCount}**/**${role.guild.members.size}** ${role.guild
                    .large ? `(may be inaccurate)` : ""}`,
                `Hex: **#${hexColor}** | RGB: (**${this.hexToRGB(hexColor)}**)`,
                `Creation Date: **${dateformat(role.createdAt, "mmmm dS, yyyy")}**`,
                `Role ID: \`${role.id}\``
            ].map((str) => `${bulletChar} ${str}`).join("\n") + "\n\n" + [
                `${role.managed ? onEmoji : offEmoji} Managed.`,
                `${role.mentionable ? onEmoji : offEmoji} Mentionable.`,
                `${role.hoist ? onEmoji : offEmoji} Hoisted (displayed separate from ` +
                `sidebar).`
            ].join("\n");

            return message.channel.createMessage(content);
        }
    }

    sendType(message, flags) {
        if (!flags.noembed &&
            message.channel.permissionsOf(this.client.user.id).has("embedLinks")) {
            return "embed";
        }


        return "plain";
    }

    hexToRGB(hex) {
        let shorthandRegex = /^([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (txt, rr, gg, bb) => rr + rr + gg + gg + bb + bb);

        let result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ].join(", ");
    }
};