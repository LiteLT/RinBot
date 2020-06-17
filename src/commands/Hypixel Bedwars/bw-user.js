"use strict";

const { Util, Command, Constants, Endpoints, CommandError } = require("../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<user>",
            description: "Looks up what MC account a user is linked to.",
            fullDescription: "To use this command, you must be a staff member on the **Hypixel BedWars** server.",
            cooldown: 5,
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["bwuser"],
            validatePermissions: (message) => message.guildID === Constants.GUILD_HYPIXEL_BEDWARS ||
                this.category.onUsageInWrongGuild()
        });
    }

    /**
     * Runs the command.
     *
     * @param {Eris.Message} message The message the command was called on.
     * @param {Array<String>} args Arguments passed to the command.
     */
    async run(message, args) {
        let user = this.findMember(message, args)?.user;

        if (!user) {
            if (Util.isSnowflake(args[0])) {
                user = await this.client.getRESTUser(args[0]).catch((err) => err);
            }

            if (!user || user instanceof Error) {
                return CommandError.ERR_NOT_FOUND(message, "guild member", args.join(" "));
            }
        }

        let mcData = await this.client.db.get("SELECT minecraftUUID FROM bw_verified WHERE guildID = ? AND userID =" +
            " ?", [message.guildID, user.id]);

        if (mcData) {
            let username = await this._fetchMcUsername(mcData.minecraftUUID);

            return message.channel.createMessage(`**${Util.userTag(user)}** is linked to the account **` +
                `${username}** (<${Endpoints.PLANCKE_PLAYER(mcData.minecraftUUID)}>).`);
        }

        return Util.reply(message, `**${Util.userTag(user)}** is not verified.`);
    }

    /**
     * Fetches a player's most recent username by UUID.
     *
     * @param {string} uuid The Minecraft account UUID.
     * @return {Promise<string>} The Minecraft username.
     * @private
     */
    _fetchMcUsername(uuid) {
        return fetch(Endpoints.MINECRAFT_UUID_NAMEHISTORY(uuid))
            .then(this.checkStatus)
            .then((usernames) => usernames.pop().name);
    }
};