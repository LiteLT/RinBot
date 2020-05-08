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
                date: "May 2th, 2020",
                value: [
                    "Created the `changelog` command.",
                    "Created the `emoji` command.",
                    "Created the `create` subcommand of `emoji`.",
                    "Created the `delete` subcommand of `emoji`.",
                    "Created the `info` subcommand of `emoji`.",
                    "Created the `rename` subcommand of `emoji`."
                ].map((str) => `- ${str}`).join("\n")
            },
            {
                date: "May 4th, 2020",
                value: [
                    "Created the `modrole` command.",
                    "Created the `add` subcommand of `modrole`.",
                    "Created the `view` subcommand of `modrole`."
                ].map((str) => `- ${str}`).join("\n")
            },
            {
                date: "May 5th, 2020",
                value: [
                    "Created the `remove` subcommand of `modrole`.",
                    "Created the `clear` subcommand of `modrole`."
                ].map((str) => `- ${str}`).join("\n")
            },
            {
                date: "May 7th, 2020",
                value: [
                    "Removes the `Kitsu` command and its subcommands.",
                    "Created public GitHub repository (<https://github.com/Kinolite/RinBot>)."
                ].map((str) => `- ${str}`).join("\n")
            },
            {
                date: "May 8th, 2020",
                value: [
                    "Added category descriptions in the help manual (`help <category>`)."
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