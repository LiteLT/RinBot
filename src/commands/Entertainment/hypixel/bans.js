"use strict";

const { Util, Constants, Endpoints, Subcommand, CommandError } = require("../../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, { description: "Displays statistics on watchdog and staff bans." });
    }
  
    async run(message) {
        let banData = await this._request().catch((err) => err);

        if (banData instanceof Error) {
            return CommandError.ERR_API_ERROR(message, "Slothpixel API");
        }

        return this.result(message, banData.watchdog, banData.staff);
    }

    result(message, watchdogBans, staffBans) {
        let flags = Util.messageFlags(message, this.client);
        let sendType = this.sendType(message, flags);

        if (sendType === "embed") {
            return message.channel.createMessage({
                embed: {
                    title: "Hypixel Bans",
                    timestamp: new Date(),
                    url: Endpoints.PLANCKE_WATCHDOG,
                    color: Util.base10(Constants.Colors.HYPIXEL),
                    description: `Total: **${Util.commaify(watchdogBans.total + staffBans
                        .total)}**`,
                    fields: [
                        {
                            name: "Watchdog",
                            value: [
                                `Daily: **${Util.commaify(watchdogBans.daily)}**`,
                                `Total: **${Util.commaify(watchdogBans.total)}**`
                            ].join("\n"),
                            inline: true
                        },
                        {
                            name: "Staff",
                            value: [
                                `Daily: **${Util.commaify(staffBans.daily)}**`,
                                `Total: **${Util.commaify(staffBans.total)}**`
                            ].join("\n"),
                            inline: true
                        }
                    ]
                }
            });
        } else if (sendType === "plain") {
            let content = "?";

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

    _request() {
        return fetch(Endpoints.SLOTHPIXEL_BANS).then(this.checkStatus);
    }
};