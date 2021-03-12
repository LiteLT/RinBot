const { Util, Constants, CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Hypixel BedWars category is a collection of commands that can only be used in the **Hypixel" +
            " BedWars** server.");

        /**
         * The BedWars ranks and stars.
         * @type {Object<String, { star: String, role: Eris.Role.id }>}
         */
        this.ranks = {
            stone: {
                star: "⭐",
                role: "396837260378505216"
            },
            iron: {
                star: "🌟",
                role: "396837540612800544"
            },
            gold: {
                star: "✨",
                role: "396837663660834827"
            },
            diamond: {
                star: "💫",
                role: "396837745097441280"
            },
            emerald: {
                star: "☄",
                role: "406150428947120159"
            },
            sapphire: {
                star: "✩",
                role: "428317168728276992"
            },
            ruby: {
                star: "✵",
                role: "428317393236787200"
            },
            crystal: {
                star: "✫",
                role: "439863000988647425"
            },
            opal: {
                star: "✰",
                role: "452908345133629440"
            },
            amethyst: {
                star: "✯",
                role: "467524155349139456"
            },
            rainbow: {
                star: "🌈",
                role: "479478482171068420"
            },
            ironPrime: {
                star: "✪",
                role: "763977262601076756"
            },
            goldPrime: {
                star: "✪",
                role: "763977448768536606"
            },
            diamondPrime: {
                star: "✪",
                role: "763977567035195462"
            },
            emeraldPrime: {
                star: "✪",
                role: "763977687903109160"
            },
            sapphirePrime: {
                star: "✪",
                role: "763978311733870602"
            },
            rubyPrime: {
                star: "✪",
                role: "763978476348637195"
            },
            crystalPrime: {
                star: "✪",
                role: "763978613082554389"
            },
            opalPrime: {
                star: "✪",
                role: "763978744334909440"
            },
            amethystPrime: {
                star: "✪",
                role: "763979533212188703"
            },
            mirror: {
                star: "✬",
                role: "763979582994513940"
            },
            light: {
                star: "✬",
                role: "802232852401487912"
            },
            dawn: {
                star: "✬",
                role: "802233176306352159"
            },
            dusk: {
                star: "✬",
                role: "802233180584149058"
            },
            air: {
                star: "✬",
                role: "802233186586198086"
            },
            wind: {
                star: "✬",
                role: "802233192148107395"
            },
            nebula: {
                star: "✬",
                role: "802233234384486440"
            },
            thunder: {
                star: "✬",
                role: "802233547469226015"
            },
            earth: {
                star: "✬",
                role: "802236219764506695"
            },
            water: {
                star: "✬",
                role: "802236232876687391"
            },
            fire: {
                star: "✬",
                role: "802236235388026913"
            },
            
        };

        /**
         * The other ranks on Hypixel supported.
         * @type {Object<String, Eris.Role.id>}
         */
        this.roles = {
            discordStaff: "724465434358841384",
            hypixelStaff: "416614910299209738",
            helper: "423306413050298368",
            moderator: "423307060457897985",
            admin: "423307128091181059",
            buildTeam: "430090491447476244",
            youtuber: "430157044041908234",
            needUsernames: "480448464220585984",
            needUsername: "470511160412733441"
        };

        /**
         * The channel IDs.
         * @type {Object}
         */
        this.channels = {
            verification: "422259585798242314",
            verificationLogs: "672475663994716178",
            changelogs: "425958447041740800"
        };

        // There are a number of methods designed poorly in this class, but I have no intention of improving Rin in the
        // future.
    }

    /**
     * Called when a command in the category is used in the wrong server.
     * @returns {String} The message.
     */
    onUsageInWrongGuild() {
        return "You must be in the **Hypixel BedWars** server to run this command.";
    }

    /**
     * Gets the BedWars star for the player.
     * @param {Number} level The level of the user.
     * @returns {String} An emoji representing their rank/class.
     */
    getPlayerStar(level) {
        switch (Math.floor(level / 100)) {
            case 0: return this.ranks.stone.star;
            case 1: return this.ranks.iron.star;
            case 2: return this.ranks.gold.star;
            case 3: return this.ranks.diamond.star;
            case 4: return this.ranks.emerald.star;
            case 5: return this.ranks.sapphire.star;
            case 6: return this.ranks.ruby.star;
            case 7: return this.ranks.crystal.star;
            case 8: return this.ranks.opal.star;
            case 9: return this.ranks.amethyst.star;
            case 10: return this.ranks.rainbow.star;
            case 11: return this.ranks.ironPrime.star;
            case 12: return this.ranks.goldPrime.star;
            case 13: return this.ranks.diamondPrime.star;
            case 14: return this.ranks.emeraldPrime.star;
            case 15: return this.ranks.sapphirePrime.star;
            case 16: return this.ranks.rubyPrime.star;
            case 17: return this.ranks.crystalPrime.star;
            case 18: return this.ranks.opalPrime.star;
            case 19: return this.ranks.amethystPrime.star;
            case 20: return this.ranks.mirror.star;
            case 21: return this.ranks.light.star;
            case 22: return this.ranks.dawn.star;
            case 23: return this.ranks.dusk.star;
            case 24: return this.ranks.air.star;
            case 25: return this.ranks.wind.star;
            case 26: return this.ranks.nebula.star;
            case 27: return this.ranks.thunder.star;
            case 28: return this.ranks.earth.star;
            case 29: return this.ranks.water.star;
            case 30: return this.ranks.fire.star;
            default: return this.ranks.fire.star;
        }
    }

    /**
     * Gets the player's BedWars rank role for the server.
     * @param {Eris.Message} message The message to reference.
     * @param {Number} level The level of the user.
     * @returns {Eris.Role} A role representing their rank/class.
     */
    getPlayerRole(message, level) {
        const role = (roleID) => message.channel.guild.roles.get(roleID) ?? null;

        switch (Math.floor(level / 100)) {
            case 0: return role(this.ranks.stone.role);
            case 1: return role(this.ranks.iron.role);
            case 2: return role(this.ranks.gold.role);
            case 3: return role(this.ranks.diamond.role);
            case 4: return role(this.ranks.emerald.role);
            case 5: return role(this.ranks.sapphire.role);
            case 6: return role(this.ranks.ruby.role);
            case 7: return role(this.ranks.crystal.role);
            case 8: return role(this.ranks.opal.role);
            case 9: return role(this.ranks.amethyst.role);
            case 10: return role(this.ranks.rainbow.role);
            case 11: return role(this.ranks.ironPrime.role);
            case 12: return role(this.ranks.goldPrime.role);
            case 13: return role(this.ranks.diamondPrime.role);
            case 14: return role(this.ranks.emeraldPrime.role);
            case 15: return role(this.ranks.sapphirePrime.role);
            case 16: return role(this.ranks.rubyPrime.role);
            case 17: return role(this.ranks.crystalPrime.role);
            case 18: return role(this.ranks.opalPrime.role);
            case 19: return role(this.ranks.amethystPrime.role);
            case 20: return role(this.ranks.mirror.role);
            case 21: return role(this.ranks.light.role);
            case 22: return role(this.ranks.dawn.role);
            case 23: return role(this.ranks.dusk.role);
            case 24: return role(this.ranks.air.role);
            case 25: return role(this.ranks.wind.role);
            case 26: return role(this.ranks.nebula.role);
            case 27: return role(this.ranks.thunder.role);
            case 28: return role(this.ranks.earth.role);
            case 29: return role(this.ranks.water.role);
            case 30: return role(this.ranks.fire.role);
            default: return role(this.ranks.fire.role);
        }
    }

    /**
     * Purge messages in the verification channel.
     *
     * @param {Eris.Message} message The message to reference.
     * @param {Eris.Member} member The target member.
     * @return {Promise<Number>} The amount of messages that were purged.
     */
    async purgeMessages(message, member) {
        let deleted = [];

        if (message.channel.id !== this.channels.verification) {
            return false;
        }

        let deleteCount = await message.channel.purge(100, (msg) => {
            if (!msg.pinned && (msg.author?.id === member.id ||
                msg.mentions.some((user) => user.id === member.id))) {
                deleted.push(msg);

                return true;
            }

            return false;
        });

        let channel = message.channel.guild.channels.get(this.channels.changelogs);

        if (channel) {
            deleted = deleted.map((msg) => `__${msg.author ? Util.userTag(msg.author) : "???"}__: ${msg
                .content || "???"}`);

            let msgBuilder = "";
            let count = 0;

            for (const log of deleted) {
                if (msgBuilder.length + log.length > Constants.Discord.MAX_EMBED_DESCRIPTION_LENGTH) {
                    await channel.createMessage({
                        embed: {
                            title: "Bulk Delete",
                            timestamp: new Date(),
                            description: msgBuilder,
                            color: Util.base10(Constants.Colors.ORANGE),
                            fields: [{
                                name: "Metadata",
                                value: [
                                    `**Deleted**: **${count}**`,
                                    `**Channel**: ${message.channel.name} (${message.channel.mention})`
                                ].join("\n")
                            }]
                        }
                    });

                    msgBuilder = "";
                    count = 0;
                } else {
                    msgBuilder += `${log}\n`;
                    ++count;
                }
            }

            if (msgBuilder.length) {
                await channel.createMessage({
                    embed: {
                        title: "Bulk Delete",
                        timestamp: new Date(),
                        description: msgBuilder,
                        color: Util.base10(Constants.Colors.ORANGE),
                        fields: [{
                            name: "Metadata",
                            value: [
                                `**Deleted**: **${count}**`,
                                `**Channel**: ${message.channel.name} (${message.channel.mention})`
                            ].join("\n")
                        }]
                    }
                });
            }
        }

        return deleteCount;
    }
};