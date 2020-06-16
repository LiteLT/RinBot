const { CommandCategory } = require("../index.js");

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
                role: "428317393236787200"
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
            }
        };

        /**
         * The other ranks on Hypixel supported.
         * @type {Object<String, Eris.Role.id>}
         */
        this.roles = {
            rankGiver: "430513835401543690",
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
         * @type {Object<String, Eris.Channel.id>}
         */
        this.channels = {
            verification: "422259585798242314",
            verificationLogs: "672475663994716178",
            changelogs: "425958447041740800"
        };
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
            case 0: {
                return this.ranks.stone.star;
            }

            case 1: {
                return this.ranks.iron.star;
            }

            case 2: {
                return this.ranks.gold.star;
            }

            case 3: {
                return this.ranks.diamond.star;
            }

            case 4: {
                return this.ranks.emerald.star;
            }

            case 5: {
                return this.ranks.sapphire.star;
            }

            case 6: {
                return this.ranks.ruby.star;
            }

            case 7: {
                return this.ranks.crystal.star;
            }

            case 8: {
                return this.ranks.opal.star;
            }

            case 9: {
                return this.ranks.amethyst.star;
            }

            default: {
                if (Math.floor(level / 100) >= 10) {
                    return this.ranks.rainbow.star;
                }
            }
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
            case 0: {
                return role(this.ranks.stone.role);
            }

            case 1: {
                return role(this.ranks.iron.role);
            }

            case 2: {
                return role(this.ranks.gold.role);
            }

            case 3: {
                return role(this.ranks.diamond.role);
            }

            case 4: {
                return role(this.ranks.emerald.role);
            }

            case 5: {
                return role(this.ranks.sapphire.role);
            }

            case 6: {
                return role(this.ranks.ruby.role);
            }

            case 7: {
                return role(this.ranks.crystal.role);
            }

            case 8: {
                return role(this.ranks.opal.role);
            }

            case 9: {
                return role(this.ranks.amethyst.role);
            }

            default: {
                if (Math.floor(level / 100) >= 10) {
                    return role(this.ranks.rainbow.role);
                }
            }
        }
    }
};