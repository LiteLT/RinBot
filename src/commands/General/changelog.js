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
        // Note: only 5 results!!!
        let history = [
            {
                date: "May 7th, 2020",
                value: [
                    "Removed the `Kitsu` command and its subcommands.",
                    "Created a public GitHub repository (<https://github.com/Kinolite/RinBot>)."
                ].map((str) => `- ${str}`).join("\n")
            },
            {
                date: "May 8th, 2020",
                value: [
                    "Added category descriptions in the help manual (`help <category>`)."
                ].map((str) => `- ${str}`).join("\n")
            },
            {
                date: "May 11th, 2020",
                value: [
                    "Fixed an issue with the `Hypixel Guild` subcommand where guild members would not be fetched, " +
                    "causing an error (credit: `HoggyTheWizard#8015`)."
                ].map((str) => `- ${str}`).join("\n")
            },
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
                    "Created the `bw-verify` command."
                ].map((str) => `- ${str}`).join("\n")
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