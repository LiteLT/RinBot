"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");
const { Member } = require("eris");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<user>",
            description: "Un-verifies a member.",
            fullDescription: "To use this command, you must be a staff member in the **Forum Wonderland** server." +
                " This command will remove the `Member` role and any forum/Hypixel player roles from the user.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["fwunverify"],
            clientPermissions: ["manageRoles"],
            validatePermissions: (msg) => {
                if (msg.guildID === Constants.GUILD_FORUM_WONDERLAND) {
                    return msg.member.roles.includes(this.category.roles.serverStaff);
                }

                return this.category.onUsageInWrongGuild();
            },
            flags: [{
                name: "all",
                description: "Removes all the member's roles instead of just the `Member` role."
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
                target = this.client.getRESTUser(args[0]).catch((err) => err);
            }

            if (!target || target instanceof Error) {
                return CommandError.ERR_NOT_FOUND(message, "guild member", args.join(" "));
            }
        }

        let result = await this.client.db.run("DELETE FROM fw_verified WHERE guildID = ? AND userID = ?", [
            Constants.GUILD_FORUM_WONDERLAND,
            target.id
        ]);

        if (result.changes > 0) {
            if (target instanceof Member) {
                if (Util.messageFlags(message, this.client).all) {
                    await target.edit({ roles: [] });
                } else {
                    let roles = [...target.roles];
                    let indexOfMember = roles.indexOf(this.category.roles.member);

                    if (indexOfMember !== -1) {
                        roles.splice(indexOfMember, 1);
                        await target.edit({ roles });
                    }
                }
            }

            return message.channel.createMessage(`${Constants.CustomEmojis
                .CHECKMARK} Successfully un-verified **${Util.userTag(target)}**.`);
        } else {
            return Util.reply(message, `**${Util.userTag(target)}** is not verified.`);
        }
    }

};