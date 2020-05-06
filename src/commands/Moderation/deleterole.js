"use strict";

const { Util, Command, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<name>",
            description: "Deletes a guild role.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["delrole", "remrole"],
            memberPermissions: ["manageRoles"],
            clientPermissions: ["manageRoles"]
        });
    }

    async run(message, args) {
        let role = Util.isSnowflake(args[0]) ? message.channel.guild.roles.get(args[0]) : null;

        if (!role) {
            role = message.channel.guild.roles.map((role) => role).sort((a, b) => {
                let bName = b.name.toLowerCase();
                let aName = a.name.toLowerCase();

                if (bName < aName) {
                    return 1;
                } else if (bName > aName) {
                    return -1;
                }

                return 0;
            }).find((role) => {
                let roleName = role.name.toLowerCase();
                let input = args.join(" ").toLowerCase();

                return roleName === input || roleName.includes(input);
            });
        }

        if (role) {
            if (role.managed) {
                return message.channel.createMessage(`The **${role.name}** role is managed by an integration. ` +
                "Managed roles cannot be deleted.");
            }

            if (Util.memberHighestRole(message.member)?.position <= role.position) {
                return message.channel.createMessage(`The **${role.name}** role must be higher than your highest ` +
                "role in order for you to delete it.");
            } else if (Util.memberHighestRole(await Util.guildMe(this.client, message.channel.guild))?.position <= role
                .position) {
                return message.channel.createMessage(`The **${role.name}** role must be lower than my highest role ` +
                "in order for me to delete it.");
            } else if (role.id === message.guildID) {
                return message.channel.createMessage("You cannot delete the \`everyone\` role.");
            }

            await role.delete();

            return message.channel.createMessage(`The **${role.name}** role has been deleted.`);
        }

        return CommandError.ERR_NOT_FOUND(message, "role", args.join(" "));
        // let role = Util.isSnowflake(args[0])
        //     ? message.channel.guild.roles.get(args[0])
        //     : message.channel.guild.roles.map((role) => role).sort((a, b) => {
        //         let bName = b.name.toLowerCase();
        //         let aName = a.name.toLowerCase();

        //         if (bName < aName) {
        //             return 1;
        //         } else if (bName > aName) {
        //             return -1;
        //         }

        //         return 0;
        //     }).find((role) => role);
    }
};