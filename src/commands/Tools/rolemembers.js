"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<...role>",
            description: "Displays all members in one or more roles.",
            fullDescription: "Due to the way the bot saves guild members, the collection of members will only " +
            "resemble online guild members on very large servers. To view all guild members in a role, check the " +
            "built-in server tab and filter by role (`Server Settings` -> `Members` -> `Display Role: <Role>`).\n\n" +

            "To search for members within multiple roles at the same time, each role must be separated with a " +
            "comma (`, `).",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["rms"],
            flags: [{
                name: "noembed",
                description: "Sends the message in plain text instead of an embed. This is automatically selected if " +
                "I do not have permission to `Embed Links`. **Note**: The bot will refuse to mention any members or " +
                "roles by disabling mentions. The mentions will remain clickable, but **will not** send out any push " +
                "notifications/pings."
            }]
        });
    }

    async run(message, args) {
        let rolesArray = message.channel.guild.roles.map((role) => role).sort((a, b) => {
            let bName = b.name.toLowerCase();
            let aName = a.name.toLowerCase();

            if (bName < aName) {
                return 1;
            } else if (bName > aName) {
                return -1;
            }

            return 0;
        });
        let [roles, notFoundRoles] = Util.arrayPartition(args.join(" ").split(/, */).map((arg) => {
            if (Util.isSnowflake(arg)) {
                let maybeRole = message.channel.guild.roles.get(arg);

                if (maybeRole) {
                    return maybeRole;
                }
            }

            arg = arg.toLowerCase();

            return rolesArray.find((role) => {
                let roleName = role.name.toLowerCase();

                return roleName === arg || roleName.includes(arg);
            }) || arg;
        }), (roleOrID) => typeof roleOrID !== "string");

        if (notFoundRoles.length) {
            return CommandError.ERR_NOT_FOUND(message, "roles", notFoundRoles.join("\", \""));
        }

        if (roles.length === 1 && roles[0].id === message.guildID) {
            return message.channel.createMessage("You cannot view all the members of the `everyone` role with this " +
            "command.");
        }

        let members = message.channel.guild.members
            .filter((member) => roles.every((role) => member.roles.includes(role.id)));

        if (!members.length) {
            return CommandError.ERR_COLLECTION_EMPTY(message, "members", "guild members");
        }

        return this.result(message, roles, members);
    }

    result(message, roles, members) {
        let flags = Util.messageFlags(message, this.client);
        let sendType = this.sendType(message, flags);
        let title = `Role Members — `;
        let total = `Total: **${members.length}**`;

        if (sendType === "embed") {
            return message.channel.createMessage({
                embed: {
                    color: roles.length === 1 ? roles[0].color : Util.base10(Constants.Colors.DEFAULT),
                    title: title + Util.arrayJoinLimit(roles.map((role) => role.name), ", ", Constants.Discord
                        .MAX_EMBED_TITLE_LENGTH - title.length),
                    description: `${total}\n\n${Util.arrayJoinLimit(members.map((member) => member
                        .mention), " | ", Constants.Discord.MAX_EMBED_DESCRIPTION_LENGTH - total.length - 2)}`
                }
            });
        } else if (sendType === "plain") {
            title = `**${title}${Util.arrayJoinLimit(roles.map((role) => role.name), ", ", 500 - title.length)}**`;
            let description = `${total}\n\n${Util.arrayJoinLimit(members.map((member) => member
                .mention), " | ", Constants.Discord.MAX_MESSAGE_LENGTH - title.length - total.length - 3)}`;
            let content = title + "\n" + description;

            return message.channel.createMessage({
                content,
                allowedMentions: { roles: false, users: false, everyone: false }
            });
        }
    }

    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel.permissionsOf(this.client.user.id)
            .has("embedLinks"))) {
            return "embed";
        }
        
        return "plain";
    }
};