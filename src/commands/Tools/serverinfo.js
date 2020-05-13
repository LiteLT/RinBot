"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");
const { Invite: ErisInvite } = require("eris");
const ms = require("ms");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "[server|inviteURL]",
            description: "Displays information on the current guild/server.",
            fullDescription: "The `server` argument can only be used by bot staff/admins. You " +
            "can pass an invite link (the entire URL) to get minor details on a guild.",
            cooldown: 5,
            guildOnly: true,
            aliases: ["guildinfo", "server", "guild", "si", "gi"],
            flags: [
                {
                    name: "noembed",
                    description: "Displays the guild info in plain text instead of an embed. " +
                    "This is automatically selected when I lack permission to `Embed Links`."
                },
                {
                    name: "icon",
                    description: "Sends the server's icon URL instead of server info."
                }
            ]
        });
    }

    async run(message, args) {
        let guild = args.length && Constants.BOT_STAFF.includes(message.author.id)
            ? this.client.guilds.get(args[0])
            : message.channel.guild;

        if (guild) {
            if (guild.unavailable) {
                return message.channel.createMessage(`${Constants.CustomEmojis
                    .OUTAGE} This server is currently unavailable, try again later.`);
            }

            return this.result(message, guild);
        }

        let inviteRegex = /^(?:https:\/\/)?discord(?:app\.com\/invite|\.gg)\/(\w+)$/i;
        let invite = inviteRegex.test(args[0])
            ? await this.client.getInvite(args[0].match(inviteRegex)[1], true).catch((err) => err)
            : null;

        if (invite) {
            if (invite instanceof Error && invite.code === 10006) {
                return CommandError.ERR_NOT_FOUND(message, "invite", args[0]);
            }

            return this.result(message, invite);
        }

        return CommandError.ERR_NOT_FOUND(message, "guild", args[0]);
    }

    result(message, guild) {
        const flags = Util.messageFlags(message, this.client);
        let { ENABLED: onEmoji, DISABLED: offEmoji } = Constants.CustomEmojis;
        let sendType = this.sendType(message, flags, guild instanceof ErisInvite);
        let bulletChar = "»";

        if (sendType === "embed" || sendType === "plain") {
            let guildOwner = guild.members.get(guild.ownerID) || null;
            let verificationLevel = null;
            let contentFilter = null;
            let boostsPerTier = [2, 15, 30, 30];
            let regions = {
                brazil: `${Constants.Emojis.FLAG_BRAZIL} Brazil`,
                europe: `${Constants.Emojis.FLAG_EUROPE} Europe`,
                hongkong: `${Constants.Emojis.FLAG_HONGKONG} Hong Kong`,
                india: `${Constants.Emojis.FLAG_INDIA} India`,
                japan: `${Constants.Emojis.FLAG_JAPAN} Japan`,
                russia: `${Constants.Emojis.FLAG_RUSSIA} Russia`,
                singapore: `${Constants.Emojis.FLAG_SINGAPORE} Singapore`,
                southafrica: `${Constants.Emojis.FLAG_SOUTH_AFRICA} South Africa`,
                sydney: `${Constants.Emojis.FLAG_SYNDEY} Syndey (Australia)`,
                "us-central": `${Constants.Emojis.FLAG_UNITED_STATES} US Central`,
                "us-east": `${Constants.Emojis.FLAG_UNITED_STATES} US East`,
                "us-south": `${Constants.Emojis.FLAG_UNITED_STATES} US South`,
                "us-west": `${Constants.Emojis.FLAG_UNITED_STATES} US West`,

                // Regions that don't appear on the regions tab.
                amsterdam: `${Constants.Emojis.FLAG_NETHERLANDS} Amsterdam (Netherlands)`,
                dubai: `${Constants.Emojis.FLAG_UNITED_ARAB_EMIRATES} Dubai (United Arab Emirates)`,
                "eu-west": `${Constants.Emojis.FLAG_EUROPE} Western Europe`,
                "eu-central": `${Constants.Emojis.FLAG_EUROPE} Central Europe`,
                frankfurt: `${Constants.Emojis.FLAG_GERMANY} Frankfurt (Germany)`,
                london: `${Constants.Emojis.FLAG_ENGLAND} London (England)`,
                "south-korea": `${Constants.Emojis.FLAG_SOUTH_KOREA} South Korea`
            };

            // eslint-disable-next-line default-case
            switch (guild.explicitContentFilter) {
                case 0: {
                    contentFilter = `${offEmoji} Content Filter.`;
                    break;
                }

                case 1: {
                    contentFilter = `${onEmoji} Content Filter - Members Without Roles.`;
                    break;
                }

                case 2: {
                    contentFilter = `${onEmoji} Content Filter - Everyone.`;
                    break;
                }
            }

            // eslint-disable-next-line default-case
            switch (guild.verificationLevel) {
                case 0: {
                    verificationLevel = `${offEmoji} Verification Level.`;
                    break;
                }

                case 1: {
                    verificationLevel = `${onEmoji} Verification Level - Verified Email (Low).`;
                    break;
                }

                case 2: {
                    verificationLevel = `${onEmoji} Verification Level - Registered for 5+ ` +
                    "Minutes (Medium).";
                    break;
                }

                case 3: {
                    verificationLevel = `${onEmoji} Verification Level - Member for 10+ Minutes ` +
                    "(High).";
                    break;
                }

                case 4: {
                    verificationLevel = `${onEmoji} Verification Level - Verified Phone (Very ` +
                    "High).";
                    break;
                }
            }

            if (sendType === "embed") {
                return message.channel.createMessage({
                    embed: {
                        title: guild.name,
                        url: guild.vanityURL,
                        description: guild.description,
                        timestamp: new Date(guild.createdAt),
                        color: Util.base10(Constants.Colors.DEFAULT),
                        thumbnail: { url: guild.iconURL },
                        footer: { text: `Server ID: ${guild.id} | Created` },
                        fields: [
                            {
                                name: "Owner",
                                value: guildOwner ? Util.userTag(guildOwner) : "N/A",
                                inline: true
                            },
                            {
                                name: "Member Count",
                                value: `**${Util.commaify(guild.memberCount)}** (${[
                                    `Humans: **${Util.commaify(guild.members
                                        .filter((member) => !member.bot).length)}**`,
                                    `Bots: **${Util.commaify(guild.members
                                        .filter((member) => member.bot).length)}**`
                                ].join(" | ")})`,
                                inline: true
                            },
                            {
                                name: "Region",
                                value: regions[guild.region] || "???",
                                inline: true
                            },
                            guild.roles.size && message.guildID === guild.id ? {
                                name: "Roles",
                                value: (() => { // Not being lazy and using `<Array>.filter`
                                    let roleMentions = guild.roles.map((role) => role)
                                        .sort((a, b) => b.position - a.position)
                                        .map((role) => role.mention);

                                    roleMentions.pop(); // @everyone role

                                    return Util.arrayJoinLimit(roleMentions, " ", 1024);
                                })()
                            } : null,
                            {
                                name: "Attributes",
                                value: [
                                    `${guild.mfaLevel === 1 ? onEmoji : offEmoji} 2FA Moderation.`,
                                    contentFilter,
                                    verificationLevel,
                                    "", // End of switches
                                    `Emojis: ${guild.emojis.length
                                        ? `**${guild.emojis.length}** (${[
                                            `Normal: **${guild.emojis
                                                .filter((emoji) => !emoji.animated).length}**`,
                                            `Animated: **${guild.emojis
                                                .filter((emoji) => emoji.animated).length}**`
                                        ].join(" | ")})`
                                        : "None"}`,
                                    guild.premiumSubscriptionCount > 0
                                        ? `Boost Tier: **${guild.premiumTier}**/3 [**${guild
                                            .premiumSubscriptionCount}**/${boostsPerTier[guild
                                            .premiumTier]}]`
                                        : null,
                                    guild.features.length
                                        ? `Features: \`${guild.features
                                            .map((feature) => Util.toTitleCase(feature
                                                .replace(/_/g, " ")))
                                            .join("`, `")}\``
                                        : null,
                                    guild.afkChannelID && message.guildID === guild.id
                                        ? `AFK Channel: **<#${guild.afkChannelID}>** (${ms(guild
                                            .afkTimeout * 1000, { long: true })})`
                                        : null
                                ].filter((prop) => prop !== null).join("\n")
                            }
                        ].filter((field) => field !== null)
                    }
                });
            }

            let content = `__**${guild.name}**__\n${guild.description
                ? guild.description + "\n\n"
                : ""}` + [
                `Owner: **${guildOwner ? Util.userTag(guildOwner) : "N/A"}**`,
                `Region: **${regions[guild.region] || "???"}**`,
                `Member Count: **${Util.commaify(guild.memberCount)}** (${[
                    `Humans: **${Util.commaify(guild.members
                        .filter((member) => !member.bot).length)}**`,
                    `Bots: **${Util.commaify(guild.members
                        .filter((member) => member.bot).length)}**`
                ].join(" | ")})`,
                `Emojis: ${guild.emojis.length
                    ? `**${guild.emojis.length}** (${[
                        `Normal: **${guild.emojis
                            .filter((emoji) => !emoji.animated).length}**`,
                        `Animated: **${guild.emojis
                            .filter((emoji) => emoji.animated).length}**`
                    ].join(" | ")})`
                    : "**None**"}`,
                guild.premiumSubscriptionCount > 0
                    ? `Boost Tier: **${guild.premiumTier}**/3 [**${guild
                        .premiumSubscriptionCount}**/${boostsPerTier[guild
                        .premiumTier]}]`
                    : null,
                guild.features.length
                    ? `Features: \`${guild.features
                        .map((feature) => Util.toTitleCase(feature
                            .replace(/_/g, " ")))
                        .join("`, `")}\``
                    : null,
                guild.afkChannelID && message.guildID === guild.id
                    ? `AFK Channel: **<#${guild.afkChannelID}>** (${ms(guild
                        .afkTimeout * 1000, { long: true })})`
                    : null,
                `Server ID: \`${guild.id}\``
            ].filter((prop) => prop !== null).map((str) => `${bulletChar} ${str}`)
                .join("\n") + "\n\n" + [
                `${guild.mfaLevel === 1 ? onEmoji : offEmoji} 2FA Moderation.`,
                contentFilter,
                verificationLevel
            ].join("\n");

            return message.channel.createMessage(content);
        } else if (sendType === "invite-embed" || sendType === "invite-plain") {
            let { guild: inviteGuild, memberCount, presenceCount } = guild;

            if (sendType === "invite-embed") {
                return message.channel.createMessage({
                    embed: {
                        title: inviteGuild.name,
                        color: Util.base10(Constants.Colors.DEFAULT),
                        footer: { text: `Server ID: ${inviteGuild.id}` },
                        thumbnail: {
                            url: inviteGuild.icon
                                ? this.cdnDiscordURL("icons", inviteGuild.id, inviteGuild.icon)
                                : null
                        },
                        fields: [
                            presenceCount !== null ? {
                                name: "Online",
                                value: `**${Util.commaify(presenceCount)}** members.`,
                                inline: true
                            } : null,
                            memberCount !== null ? {
                                name: "Member Count",
                                value: `**${Util.commaify(memberCount)}** members.`,
                                inline: true
                            } : null
                        ].filter((field) => field !== null)
                    }
                });
            }

            let content = `__**${inviteGuild.name}**__\n` + [
                `Online: **${Util.commaify(presenceCount)}** members.`,
                `Member Count: **${Util.commaify(memberCount)}** members.`,
                `Server ID: \`${inviteGuild.id}\``
            ].map((str) => `${bulletChar} ${str}`).join("\n");

            return message.channel.createMessage(content);
        } else if (sendType === "icon") {
            let iconURL = guild instanceof ErisInvite
                ? this.cdnDiscordURL("icons", guild.guild.id, guild.guild.icon)
                : guild.iconURL;

            return message.channel.createMessage(`Icon URL: ${iconURL}`);
        }
    }

    sendType(message, flags, isInvite) {
        if (flags.icon || flags.iconurl) {
            return "icon";
        }

        if (isInvite) {
            if (!flags.noembed && message.channel.permissionsOf(this.client.user.id)
                .has("embedLinks")) {
                return "invite-embed";
            }

            return "invite-plain";
        }

        if (!flags.noembed && message.channel.permissionsOf(this.client.user.id)
            .has("embedLinks")) {
            return "embed";
        }


        return "plain";
    }

    cdnDiscordURL(endpoint, guildID, hash) {
        return `https://cdn.discordapp.com/${endpoint}/${guildID}/${hash}.${hash
            .startsWith("a_") ? "gif" : "png"}?size=2048`;
    }
};