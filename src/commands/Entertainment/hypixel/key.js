"use strict";

const { Util, Constants, Endpoints, Subcommand, CommandError } = require("../../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            description: "Displays statistics on the current Hypixel API keys.",
            fullDescription: "This subcommand acts more as a debug command. The keys refer to " +
            "the API keys the bot uses."
        });
    }
  
    async run(message) {
        let keyData = await this._request(Constants.HYPIXEL_API_KEY, null).catch((err) => err);

        if (keyData instanceof Error) { // Usually 500s
            return CommandError.ERR_API_ERROR(message, "Hypixel API");
        }

        if (keyData.success === false) {
            return Util.reply(message, "something went wrong. Try again later?");
        }

        keyData = keyData.record;

        // Now, it's time to get the owner.
        let keyOwner = await this._request(null, keyData.ownerUuid, "PLAYER").catch((err) => err);

        if (keyOwner instanceof fetch.FetchError) { // Could not parse the page to JSON.
            keyOwner = null;
        } else {
            keyOwner = keyOwner.pop().name;
        }

        return this.result(message, keyData, keyOwner);
    }

    
    result(message, record, owner) {
        let flags = Util.messageFlags(message, this.client);
        let sendType = this.sendType(message, flags);
        
        if (sendType === "embed") {
            return message.channel.createMessage({
                embed: {
                    timestamp: new Date(),
                    title: "API Key Stats",
                    color: Util.base10(Constants.Colors.HYPIXEL),
                    fields: [
                        owner ? {
                            name: "Owner",
                            value: `[${owner}](${Endpoints.PLANCKE_PLAYER(record.ownerUuid)})`,
                            inline: true
                        } : null,
                        {
                            name: "Total Queries",
                            value: Util.commaify(record.totalQueries),
                            inline: true
                        }
                    ].filter((field) => field !== null)
                }
            });
        } else if (sendType === "plain") {
            let bulletChar = "»";
            let content = `**API Key Stats**\n` + [
                owner ? `Owner: **${owner}**` : null,
                `Total Queries: **${Util.commaify(record.totalQueries)}**`
            ].filter((field) => field !== null).map((str) => `${bulletChar} ${str}`).join("\n");
            
            return message.channel.createMessage(content);
        }
    }
    
    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel
            .permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }
        
        
        return "plain";
    }

    _request(key, uuid, type = "KEY") {
        if (type === "KEY") {
            return fetch(Endpoints.HYPIXEL_API_KEY(key)).then(this.checkStatus);
        } else if (type === "PLAYER") {
            return fetch(Endpoints.MINECRAFT_UUID_NAMEHISTORY(uuid)).then(this.checkStatus);
        }
    }
};