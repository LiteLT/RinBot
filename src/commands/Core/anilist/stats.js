"use strict";

const { Util, Constants, Endpoints, Subcommand } = require("../../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            description: "Displays AniList's site statistics.",
            fullDescription: "This subcommand does not support the `--all` flag."
        });
    }
  
    async run(message) {
        let query = `
        query SiteStats {
            SiteStatistics {
                anime { nodes { ...siteTrend } }
                manga { nodes { ...siteTrend } }
                characters { nodes { ...siteTrend } }
                staff { nodes { ...siteTrend } }
                studios { nodes { ...siteTrend } }
                reviews { nodes { ...siteTrend } }
                users { nodes { ...siteTrend } }
            }
        }
          
        fragment siteTrend on SiteTrend { date count change }`;
        let siteStatsData = await this._request(query);

        return this.result(message, siteStatsData.data.SiteStatistics);
    }

    result(message, siteStats) {
        let flags = Util.messageFlags(message, this.client);
        let sendType = this.sendType(message, flags);
        let emdash = "—";
        let bulletChar = "»";

        if (sendType === "embed") {
            return message.channel.createMessage({
                embed: {
                    url: Endpoints.ANILIST_SITE_STATS,
                    title: `AniList ${emdash} Site Stats`,
                    color: Util.base10(Constants.Colors.ANILIST),
                    description: "The statistics shown below is data over the course of **25** " +
                    "days.\n\n" + Object.keys(siteStats).map((statLabel) => {
                        let stats = siteStats[statLabel].nodes;
                        let change = stats.reduce((prev, stat) => prev + stat.change, 0);

                        if (change === 0) {
                            return null;
                        }

                        return `${bulletChar} ${Util.toTitleCase(statLabel)} ${emdash} ${Util
                            .commaify(stats[stats.length - 1].count)} (**${change >= 0
                            ? `+`
                            : "-"}${Util.commaify(change)}**)`;
                    }).filter((stat) => stat !== null).join("\n")
                }
            });
        } else if (sendType === "plain") {
            let content = `**AniList ${emdash} Site Stats**\n` +
            "The statistics shown below is data over the course of **25** days.\n\n" + Object
                .keys(siteStats).map((statLabel) => {
                    let stats = siteStats[statLabel].nodes;
                    let change = stats.reduce((prev, stat) => prev + stat.change, 0);

                    if (change === 0) {
                        return null;
                    }

                    return `${bulletChar} ${Util.toTitleCase(statLabel)} ${emdash} ${Util
                        .commaify(stats[stats.length - 1].count)} (**${change >= 0
                        ? `+`
                        : "-"}${Util.commaify(change)}**)`;
                }).filter((stat) => stat !== null).join("\n");

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

    _request(query) {
        return fetch(Endpoints.ANILIST_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({ query })
        }).then(this.checkStatus);
    }
};