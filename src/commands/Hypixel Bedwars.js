const { Util, Constants, CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
	constructor(name) {
		super(name, "The Hypixel BedWars category is a collection of commands that can only be used in the **Hypixel" + " BedWars** server.");

		/**
		 * The BedWars ranks and stars.
		 * @type {Object<String, { star: String, role: Eris.Role.id }>}
		 */
		this.ranks = {
			stone: {
				star: "⭐",
				role: "396837260378505216",
			},
			iron: {
				star: "🌟",
				role: "396837540612800544",
			},
			gold: {
				star: "✨",
				role: "396837663660834827",
			},
			diamond: {
				star: "💫",
				role: "396837745097441280",
			},
			emerald: {
				star: "☄",
				role: "406150428947120159",
			},
			sapphire: {
				star: "✩",
				role: "428317168728276992",
			},
			ruby: {
				star: "✵",
				role: "428317393236787200",
			},
			crystal: {
				star: "✫",
				role: "439863000988647425",
			},
			opal: {
				star: "✰",
				role: "452908345133629440",
			},
			amethyst: {
				star: "✯",
				role: "467524155349139456",
			},
			rainbow: {
				star: "🌈",
				role: "479478482171068420",
			},
			iron_prime: {
				star: "🌈",
				role: "763977262601076756",
			},
			gold_prime: {
				star: "🌈",
				role: "763977448768536606",
			},
			diamond_prime: {
				star: "🌈",
				role: "763977567035195462",
			},
			emerald_prime: {
				star: "🌈",
				role: "763977687903109160",
			},
			sapphire_prime: {
				star: "🌈",
				role: "763978311733870602",
			},
			ruby_prime: {
				star: "🌈",
				role: "763978476348637195",
			},
			crystal_prime: {
				star: "🌈",
				role: "763978613082554389",
			},
			opal_prime: {
				star: "🌈",
				role: "763978744334909440",
			},
			amethyst_prime: {
				star: "🌈",
				role: "763979533212188703",
			},
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
			needUsername: "470511160412733441",
		};

		/**
		 * The channel IDs.
		 * @type {Object}
		 */
		this.channels = {
			verification: "422259585798242314",
			verificationLogs: "672475663994716178",
			changelogs: "425958447041740800",
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

			case 10: {
				return this.ranks.rainbow.star;
			}

			case 11: {
				return this.ranks.iron_prime.star;
			}

			case 12: {
				return this.ranks.gold_prime.star;
			}

			case 13: {
				return this.ranks.diamond_prime.star;
			}

			case 14: {
				return this.ranks.emerald_prime.star;
			}

			case 15: {
				return this.ranks.sapphire_prime.star;
			}

			case 16: {
				return this.ranks.ruby_prime.star;
			}

			case 17: {
				return this.ranks.crystal_prime.star;
			}

			case 18: {
				return this.ranks.opal_prime.star;
			}

			default: {
				if (Math.floor(level / 100) >= 19) {
					return this.ranks.amethyst_prime.star;
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
				return this.ranks.stone.role;
			}

			case 1: {
				return this.ranks.iron.role;
			}

			case 2: {
				return this.ranks.gold.role;
			}

			case 3: {
				return this.ranks.diamond.role;
			}

			case 4: {
				return this.ranks.emerald.role;
			}

			case 5: {
				return this.ranks.sapphire.role;
			}

			case 6: {
				return this.ranks.ruby.role;
			}

			case 7: {
				return this.ranks.crystal.role;
			}

			case 8: {
				return this.ranks.opal.role;
			}

			case 9: {
				return this.ranks.amethyst.role;
			}

			case 10: {
				return this.ranks.rainbow.role;
			}

			case 11: {
				return this.ranks.iron_prime.role;
			}

			case 12: {
				return this.ranks.gold_prime.role;
			}

			case 13: {
				return this.ranks.diamond_prime.role;
			}

			case 14: {
				return this.ranks.emerald_prime.role;
			}

			case 15: {
				return this.ranks.sapphire_prime.role;
			}

			case 16: {
				return this.ranks.ruby_prime.role;
			}

			case 17: {
				return this.ranks.crystal_prime.role;
			}

			case 18: {
				return this.ranks.opal_prime.role;
			}

			default: {
				if (Math.floor(level / 100) >= 19) {
					return this.ranks.amethyst_prime.role;
				}
			}
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
			if (!msg.pinned && (msg.author?.id === member.id || msg.mentions.some((user) => user.id === member.id))) {
				deleted.push(msg);

				return true;
			}

			return false;
		});

		let channel = message.channel.guild.channels.get(this.channels.changelogs);

		if (channel) {
			deleted = deleted.map((msg) => `__${msg.author ? Util.userTag(msg.author) : "???"}__: ${msg.content || "???"}`);

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
							fields: [
								{
									name: "Metadata",
									value: [`**Deleted**: **${count}**`, `**Channel**: ${message.channel.name} (${message.channel.mention})`].join("\n"),
								},
							],
						},
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
						fields: [
							{
								name: "Metadata",
								value: [`**Deleted**: **${count}**`, `**Channel**: ${message.channel.name} (${message.channel.mention})`].join("\n"),
							},
						],
					},
				});
			}
		}

		return deleteCount;
	}
};
