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
                "`30d` - Mute for 30 days (one month). This is equivalent to `4w2d`."
            ].map((str) => `- ${str}`).join("\n"),
            requiredArgs: 1,
            enabled: false,
            guildOnly: true,
            aliases: ["m", "tempmute", "tm"],
            validatePermissions: (message) => {
                let roles = this.client.guildSettings.get(message.guildID).moderation.roles;

                if (roles.length) {
                    return roles.some((roleID) => message.member.roles.includes(roleID));
                }

                return "There seems to be no configured moderator role on this server. To create one, check the help" +
                    " manual for the `modrole` command.";
            },
            clientPermissions: ["manageRoles"],
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
                    "punishment. This flag overrides the default setting for your server. This flag is redundant if " +
                    "the `--silent` flag is enabled."
                }
            ]
        });
    }

    /**
     * Runs the command.
     * @param {Eris.Message} message The message the command was called on.
     * @param {String} memberArg The member who's being punished.
     * @param {String} [durationArg] The duration of the punishment.
     * @param {Array<String>} [reasonArgs=[]] The reason for the punishment.
     */
    async run(message, [memberArg, durationArg, ...reasonArgs]) {
        let member = this.findMember(message, [memberArg], { strict: true });
        let duration = (durationArg.match(/\d+[a-zA-Z]+/g) || []).reduce((prev, time) => prev + ms(time), 0);
        let reason = reasonArgs.join(" ");
        let result = this.check(message, member, memberArg, duration, durationArg, reason);

        // TODO
    }

    async notify() {
        // TODO
    }

    async logPunishment() {
        // TODO
    }

    async check() {
        // TODO
    }
};