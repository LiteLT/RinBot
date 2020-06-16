"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<user>",
            description: "Unlinks a user's Minecraft from their Discord account.",
            fullDescription: "To use this command, you must be a staff member on the **Hypixel BedWars** server.",
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["bwunlink"],
            clientPermissions: ["manageRoles", "manageNicknames"],
            validatePermissions: (message) => {
                if (message.guildID === Constants.GUILD_HYPIXEL_BEDWARS) {
                    return message.member.roles.includes(this.category.roles.rankGiver);
                }

                return this.category.onUsageInWrongGuild();
            }
        });
    }

    /**
     * Runs the command.
     * @param {Eris.Message} message The message the command was called on.
     * @param {Array<String>} args Arguments passed to the command.
     */
    async run(message, args) {
        let member = this.findMember(message, args, { strict: true });

        if (!member) {
            if (Util.isSnowflake(args[0])) {
                member = await this.client.getRESTUser(args[0]).catch((err) => err);
            }

            if (!member || member instanceof Error) {
                return CommandError.ERR_NOT_FOUND(message, "guild member", args.join(" "));
            }
        }

        let existingEntry = await this.client.db.get("SELECT COUNT(*)");
    }
};