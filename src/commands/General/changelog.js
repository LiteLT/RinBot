"use strict";

const { Util, Command, Constants } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            description: "Displays the most recent updates with the bot.",
            cooldown: 5,
            flags: [{
                name: "noembed",
                description: "Sends the about information in plain text instead of an embed. This is automatically " +
                "selected if I do not have permission to `Embed Links`."
            }]
        });
    }

    async run(message) {
        // Only 5 results!!!
        let history = [
            {
                date: "May 12th, 2020",
                value: [
                    "Changed the `Activity` field in the `userinfo` command to display the activity details instead" +
                    " of the large text (minor).",

                    "Fixed an issue in the `userinfo` command where the command would throw an error on certain" +
                    " activities.",

                    "Fixed an issue in the `emoji/create` and `emoji/rename` subcommands where the subcommand would" +
                    " throw an error due to the name argument not being converted properly.",

                    "Fixed an issue in the `purge` command where it would always say no guild member was found," +
                    " regardless of if any input for the member was entered or not."
                ].map((str) => `- ${str}`).join("\n")
            },
            {
                date: "May 13th, 2020",
                value: [
                    "Created the `Hypixel BedWars` category.",
                    "Created the `bw-verify` command.",
                    "Fixed an issue in the `roleinfo` command where it would throw an error on hex codes that were" +
                    " not three or six digits long (`noneleft#5392`)."
                ].map((str) => `- ${str}`).join("\n")
            },
            {
                date: "May 14th, 2020",
                value: [
                    "Fixed an issue in the `prefix` command where it would throw an error on guilds that did not set" +
                    " up a custom prefix.",
                    "Fixed an issue in the `hypixel/player` subcommand where `Level` would appear as NaN (Not a" +
                    " Number) for players with no stats (such as a moderator in vanish).",
                    "Added missing properties to the `hypixel/player` `--noembed` flag to replicate parts of the" +
                    " embed version.",
                    "Fixed an issue in the `userinfo` command where it would throw an error if you tried to look up" +
                    " info on a member that was offline/not cached.",
                    "Fixed an issue in the `hypixel/player` subcommand where it would return `Not Found` on some" +
                    " social media pages."
                ].map((str) => `- ${str}`).join("\n")
            },
            {
                date: "June 16th, 2020",
                value: [
                    "Resumed work on Rin for emergency.",
                    "Created the `bwunverify` command.",
                    "Created the `bwforcify` command."
                ]
            },
            {
                date: "June 17th, 2020",
                value: [
                    "Created the `bwupdate` command.",
                    "Patched various bugs with Hypixel BedWars commands.",
                    "Began hosting the bot on a dedicated machine."
                ]
            }
        ];

        history.reverse();

        let flags = Util.messageFlags(message, this.client);
        let sendType = this.sendType(message, flags);

        if (sendType === "embed") {
            return message.channel.createMessage({
                embed: {
                    title: "Changelog",
                    color: Util.base10(Constants.Colors.DEFAULT),
                    fields: history.map((change) => ({
                        name: change.date,
                        value: change.value
                    }))
                }
            });
        } else if (sendType === "plain") {
            return message.channel.createMessage(history.map((change) => `**${change.date}**\n${change.value}`)
                .join("\n\n"));
        }
    }

    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild ||
            message.channel.permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }

        return "plain";
    }
};