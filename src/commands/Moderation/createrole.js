"use strict";

const { Util, Command, CommandError } = require("../../index.js");
const { Permission: ErisPermission } = require("eris");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<name> (color)",
            description: "Creates a guild role.",
            fullDescription: "This command will create a role with its properties set. The `color` argument requires " +
            "a hex code to work and must start with a hash tag (#).\n\n" +
            "By default, the role will have the permissions synced with the `everyone` role. If you'd like to create " +
            "a role with no permissions, use the `--perms=0` flag.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["crerole", "addrole"],
            memberPermissions: ["manageRoles"],
            clientPermissions: ["manageRoles"],
            flags: [
                {
                    name: "hoist",
                    description: "Whether to set the role as hoisted or not (displayed separate from the sidebar)."
                },
                {
                    name: "mentionable",
                    description: "Whether to set the role as mentionable by anyone or not. Anyone with the mention " +
                    "anyone permission can mention this role regardless of the option."
                },
                {
                    name: "perms",
                    value: "number",
                    description: "**Advanced**. The bit permissions the role has. Set the permission level to `0` to " +
                    "create a role with no permissions. Use a permission calculator to set the permissions you want: " +
                    "<https://finitereality.github.io/permissions-calculator>."
                }
            ]
        });
    }

    async run(message, args) {
        if (message.channel.guild.roles.size === 250) {
            return message.channel.createMessage("Invalid Usage: The guild has reached its maximum role capacity.");
        }

        let name = null;
        let color = null;

        if (args.length > 1 && args[args.length - 1].startsWith("#")) {
            color = Util.base10(args.pop());

            if (color === undefined) {
                return CommandError.ERR_INVALID_ARG_TYPE(message, "color", "hex code");
            } else if (color > 0xFFFFFF || color < 0) {
                return CommandError.ERR_INVALID_RANGE(message, "color", "hex code", "000000", "FFFFFF");
            }
        }

        name = args.join(" ");

        if (name.length > 100) {
            return CommandError.ERR_INVALID_RANGE(message, "name", "role name", 0, 100, "characters");
        }

        let flags = Util.messageFlags(message, this.client);
        let perms = flags.perms;

        if (perms) {
            perms = parseInt(perms, 10);

            if (perms || perms === 0) {
                let permission = new ErisPermission(perms);
                let missingPermissions = { bot: [], user: [] };
                let memberPerms = message.member.permission;
                let clientMemberPerms = (await Util.guildMe(this.client, message.channel.guild)).permission;

                for (const permLabel of Object.keys(permission.json)) {
                    if (!memberPerms.has(permLabel)) {
                        missingPermissions.user.push(permLabel);
                    } else if (!clientMemberPerms.has(permLabel)) {
                        missingPermissions.bot.push(permLabel);
                    }
                }

                if (missingPermissions.bot.length || missingPermissions.user.length) {
                    let content = [
                        missingPermissions.user.length
                            ? `You're missing the following permissions to add on to the role: \`${this
                                .sanitizePermissions(missingPermissions.user).join("`, `")}\``
                            : null,
                        missingPermissions.bot.length
                            ? `I'm missing the following permissions to add on to the role: \`${this
                                .sanitizePermissions(missingPermissions.bot).join("`, `")}\``
                            : null
                    ].filter((prop) => prop !== null).join("\n\n");

                    return message.channel.createMessage(content);
                }
            } else {
                return CommandError.ERR_INVALID_ARG_TYPE(message, "perms", "permissions integer");
            }
        }

        let role = await message.channel.guild.createRole({
            name,
            color,
            hoist: !!flags.hoist,
            mentionable: !!flags.mentionable,
            permissions: flags.perms ? parseInt(flags.perms, 10) : null
        }).catch((err) => err);

        if (role instanceof Error) {
            throw role;
        }

        return message.channel.createMessage(`The ${role.mention} role has been created.`);
    }
};