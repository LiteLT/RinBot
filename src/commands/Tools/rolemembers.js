"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<...role>",
            description: "Displays all members in one or more roles.",
            fullDescription: "Due to the way the bot saves guild members, the collection of members will only " +
                "resemble online guild members on very large servers. To view all guild members in a role, check the " +
                "built-in server tab and filter by role (`Server Settings` -> `Members` -> `Display Role: <Role>`).\n" +

                "\nTo search for members within multiple roles at the same time, each role must be separated with a" +
                " comma.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["rms"],
            clientPermissions: ["embedLinks"]
        });
    }

    async run(message, args) {
        let [roles, notFoundRoles] = Util.arrayPartition(args.join(" ").split(/, */).map((arg) => {
            return this.findRole(message, [arg], { strict: true }) || arg;
        }), (role) => typeof role !== "string");

        if (notFoundRoles.length) {
            return CommandError.ERR_NOT_FOUND(message, "roles", notFoundRoles.join("\", \""));
        }

        if (roles.some((role) => role.id === message.guildID)) {
            return message.channel.createMessage("You cannot view all the members in the `everyone` role with this " +
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
        let title = `Role Members — `;
        let total = `Total: **${members.length}**`;

        return message.channel.createMessage({
            embed: {
                color: roles.length === 1 ? roles[0].color : Util.base10(Constants.Colors.DEFAULT),
                title: title + Util.arrayJoinLimit(roles.map((role) => role.name), ", ", Constants.Discord
                    .MAX_EMBED_TITLE_LENGTH - title.length),
                description: `${total}\n\n${Util.arrayJoinLimit(members.map((member) => member
                    .mention), " | ", Constants.Discord.MAX_EMBED_DESCRIPTION_LENGTH - total.length - 2)}`
            }
        });
    }
};