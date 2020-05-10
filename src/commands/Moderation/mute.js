"use strict";

const { Command } = require("../../index.js");
const ms = require("ms");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<member> [duration] [reason]",
            description: "Mutes a member.",
            fullDescription: "You can mute a member for a specified amount of time. The bot checks on a 1-minute " +
            "interval for expired punishments, so it may take a few extra seconds to unmute if you're casually " +
            "waiting. Your duration must be in abbreviated form. You can combine abbreviations to make a specific " +
            "rather than doing it by digits (e.g., combining hours and minutes).\n\n" +
            "Abbreviation symbols:\n" + [
                "`m` - Minute.",
                "`h` - Hour.",
                "`d` - Day.",
                "`w` - Week.",
                "`y` - Year."
            ].map((str) => `- ${str}`).join("\n") + "\n\n" +
            "Examples on setting the duration:\n" + [
                "`1h` - Mute for one hour.",
                "`5h` - Mute for five hours.",
                "`4d` - Mute for four days.",
                "`30m` - Mute for 30 minutes.",
                "`1w` - Mute for one week.",
                "`1h30m` - Mute for one hour and 30 minutes.",
                "`30d` - Mute for 30 days (one month). This is equivilent to `4w2d`."
            ].map((str) => `- ${str}`).join("\n"),
            requiredArgs: 1,
            guildOnly: true,
            aliases: ["m", "tempmute", "tm"],
            clientPermissions: ["manageRoles"],
            validatePermissions: (message) => this.client.guildSettings.get(message.guildID).moderation.roles
                .some((roleID) => message.member.roles.includes(roleID)),
            flags: [
                {
                    name: "silent",
                    value: "yes/no",
                    description: "Whether or not to message the member about their punishment. This flag overrides " +
                    "the default setting for your server."
                },
                {
                    name: "showmod",
                    value: "yes/no",
                    description: "Whether or not to show the moderator when notifying the member about their " +
                    "punishment. This flag overrides the default setting for your server. This flag is redundent if " +
                    "the `--silent` flag is enabled."
                }
            ]
        });
    }

    async run(message, [memberArg, durationArg, ...reasonArgs]) {
        let member = this.findMember(message, [memberArg], { strict: true });
        let duration = (durationArg.match(/\d+[a-zA-Z]+/g) || []).reduce((prev, time) => prev + ms(time), 0);
        let reason = reasonArgs.join(" ");
        let result = this.check(message, member, memberArg, duration, durationArg, reason);
    }

    async notify() {

    }

    async logPunishment() {

    }

    async check() {

    }
};