"use strict";

const ReactionCollector = require("../ReactionCollector.js");
const CommandError = require("../../utils/CommandError.js");
const Constants = require("../../utils/Constants.js");
const Collection = require("../Collection.js");
const Util = require("../../utils/Util.js");
const dateformat = require("dateformat");
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * @typedef {import("eris").Role} Role
 * @typedef {import("eris").Member} Member
 * @typedef {import("eris").Message} Message
 * @typedef {import("../../Client.js")} Client
 * @typedef {import("./Subcommand.js")} Subcommand
 */
/**
 * Represents a command.
 * @property {Client} client The client instance.
 * @property {String} name The name of the command.
 * @property {String} category The category the command is apart of.
 * @property {String} usage The syntax on how to use the command.
 * @property {String} description The command short description.
 * @property {String} fullDescription The full command description.
 * @property {Number} cooldown The number of seconds to wait before each call. A global ratelimit
 * of 1 second has been applied. 
 * @property {Number} requiredArgs The number of arguments required to pass in order to run
 * the command.
 * @property {Boolean} nsfw Whether the command is restricted to NSFW channels or not.
 * @property {Boolean} enabled Whether the command is enabled or not.
 * @property {Boolean} guildOnly Whether the command is restricted to guilds only or not.
 * @property {Boolean} protected Whether the command is protected from being disabled
 * through guild settings.
 * @property {Array<String>} aliases The aliases to refer the command to.
 * @property {Array<String>} memberPermissions A list of permissions the member is required to have.
 * @property {Array<String>} clientPermissions A list of permissions the client member is required
 * to have.
 * @property {Function} validatePermissions A function that must return true acting as a permission
 * wall. The function receives the message instance.
 * @property {Object} flags A list of flags available when running the command.
 */
class Command {
    /**
     * Initializes the command.
     * @param {Client} bot The client instance.
     * @param {String} fileName The name of the file to use as the command name.
     * @param {String} categoryName The name of the category/directory of the command.
     * @param {Object} options Optional options to pass for its settings.
     * @param {String} [options.usage=""] The usage/syntax on how to run the command.
     * @param {String} [options.description="No synopsis"] The short description of the command.
     * @param {String} [options.fullDescription=null] The full description describing the command
     * more in depth.
     * @param {Number} [options.cooldown=3] The ratelimit in seconds.
     * @param {Number} [options.requiredArgs=0] The number of arguments required to be passed before
     * running the command.
     * @param {Boolean} [options.nsfw=false] Whether the command can only be run in NSFW channels.
     * @param {boolean} [options.enabled=true] Whether the command is enabled or not.
     * @param {Boolean} [options.guildOnly=false] If the command can only be used
     * in guilds or not.
     * @param {Boolean} [options.protected=false] If the command is protected from being
     * disabled locally through settings.
     * @param {Array<String>} [options.aliases] A list of alternative names for the command.
     * @param {Array<String>} [options.memberPermissions] A list of permissions required for the
     * guild member to run the command.
     * @param {Array<String>} [options.clientPermissions] A list of permissions required for the
     * client user to execute the command.
     * @param {Function} [options.validatePermissions] A function to validate if the user
     * has permission to run the command. This gives the freedom of not being required to check in
     * the actual run method. The function receives the single message instance.
     * @param {Array<Object>} [options.flags] A list of available flags to use when running the
     * command.
     * @param {String} options.flags.name The name of the flag.
     * @param {String} [options.flags.value] The type of value for the flag.
     * @param {String} [options.synopsis] The description for the flag. It should be treated as a
     * full description, but making it short and understandable is good practice.
     */
    constructor(bot, fileName, categoryName, options) {
        this.client = bot;
      
        this.name = fileName.replace(".js", "");
        this.category = categoryName;
        this.usage = options.usage || "";
        this.description = options.description || "No synopsis.";
        this.fullDescription = options.fullDescription || null;
      
        this.cooldown = options.cooldown || 3;
        this.requiredArgs = options.requiredArgs || 0;
      
        this.nsfw = options.nsfw || false; // (false | undefined) -> false omegalul
        this.enabled = has(options, "enabled") ? options.enabled : true;
        this.guildOnly = options.guildOnly || false;
        this.protected = options.protected || false;
      
        this.aliases = options.aliases || [];
        this.memberPermissions = options.memberPermissions || [];
        this.clientPermissions = options.clientPermissions || [];
        this.validatePermissions = options.validatePermissions || (() => true);
      
        this.subcommands = new Collection();
        this.flags = options.flags ? options.flags.map((flag) => Object.assign({
            name: null,
            value: null,
            description: "No synopsis."
        }, flag)) : [];
      
        this.ratelimits = new Collection();
        this.ratelimitNoticed = new Set();
    }
  
    /**
     * Run the command.
     * @param {Message} [message] The sent message.
     * @param {Array<String>} [args=[]] Arguments passed in the message.
     * @returns {Promise<any>} Anything returned from the command.
     */
    async run() {
        this.client.logger.warn(`Command ${this.name} (${this.category}) has no run method.`);
    }
  
    /**
     * Check if the user can run the command.
     * @param {Message} message The message to reference.
     * @returns {Promise<Boolean|Error|null>} A boolean signaling the user can run the command,
     * or an error if they can't. The error has a `.friendly` property to tell if it was from
     * missing permissions. The error message is the recommended reason to supply to the user.
     * The method may also return `null` if it's supposed to be a silent rejection.
     */
    async validate(message) {
        const invalidate = (reason) => {
            let err = new Error(reason);
            err.friendly = true;
          
            throw err;
        };
      
        if (!this.enabled && !Constants.BOT_STAFF.includes(message.author.id)) {
            return null;
        }
      
        if (this.client.globalRatelimit.has(message.author.id)) {
            return null;
        }
      
        // Ratelimit checks.
        if (!Constants.BOT_STAFF.includes(message.author.id) &&
            !Constants.BOT_DEVELOPERS.includes(message.author.id)) {
            this.client.globalRatelimit.add(message.author.id);
            setTimeout(() => this.client.globalRatelimit.delete(message.author.id), 1000);
          
            let time = this.ratelimits.get(message.author.id);
          
            if (time) {
                if (!this.ratelimitNoticed.has(message.author.id)) {
                    this.ratelimitNoticed.add(message.author.id);
                    setTimeout(() => {
                        return this.ratelimitNoticed.delete(message.author.id);
                    }, this.cooldown * 1000);

                    return invalidate("You are being ratelimited. Try again in " +
                                      `**${((time - Date.now()) / 1000)
                                          .toFixed(1)}** seconds.`);
                }
            } else {
                this.ratelimits.set(message.author.id, Date.now() + this.cooldown * 1000);
                setTimeout(() => this.ratelimits.delete(message.author.id), this.cooldown * 1000);
            }
        }
      
        // Boolean checks.
        if (this.guildOnly && !message.channel.guild) {
            return invalidate(`${Constants.Emojis.LOCK} This command can only be run in a server.`);
        }
      
        if (this.nsfw && !message.channel.nsfw) {
            return invalidate(`${Constants.Emojis
                .UNDERAGE} This command can only be run in NSFW channels.`);
        }
      
      
        // Permission checks
        if (message.channel.guild) {
            let memberPermissions = this.sanitizePermissions(this.memberPermissions
                .filter((perm) => !message.member.permission.has(perm)));

            if (memberPermissions.length) {
                return invalidate("You do not have permission to run this command.\n\nMissing: " +
                                  `\`${memberPermissions.join("`, `")}\``);
            }
          
            let me = await Util.guildMe(this.client, message.channel.guild).catch(() => {});
            let botPermissions = this.sanitizePermissions(this.clientPermissions
                .filter((perm) => !me.permission.has(perm)));

            if (botPermissions.length) {
                return invalidate("I do not have permission to perform this action.\n\n" +
                `Missing Permissions: \`${botPermissions.join("`, `")}\``);
            }
        }
      
        let res = await this.validatePermissions(message);
      
        if (!res || typeof res === "string") {
            return invalidate(res || "You do not have permission to run this command.");
        }
      
        let args = Util.messageArgs(message, this.client);
      
        if (args.length < this.requiredArgs) {
            this.buildHelp(message, null);
          
            return null;
        }
      
        let subcommand = args[0] && this.subcommands.get(args[0].toLowerCase());
      
        if (subcommand) {
            if (subcommand.enabled) {
                if (args.length - 1 < subcommand.requiredArgs) {
                    this.buildHelp(message, subcommand);

                    return null;
                }
            } else {
                return null;
            }
        }
      
        return true;
    }

    /**
     * Builds the help manual and sends it to the user.
     * @param {Message} message The message to reference.
     * @param {Subcommand} [subcommand] The subcommand to build instead of the normal help manual.
     * @param {{ time: Number, embed: Boolean }} options The options to use when building the help manual.
     * @param {Number} [options.time=30000] How long to wait before deleting the message. If the time is set to `null`,
     * the message will not be deleted. Please note that if the bot is required to send a paginated response, this 
     * option has no effect in it.
     * @param {Boolean} [options.embed=true] Whether or not to send the message as a rich embed or plain text. This
     * option may be ignored when set to `true` if the bot lacks permission to `Embed Links`.
     * @returns {Promise<Message>} The newly created message.
     */
    async buildHelp(message, subcommand, options = { time: 30000, embed: true }) {
        let content = null;
        let sendType = options.embed && (!message.channel.guild ||
            message.channel.permissionsOf(this.client.user.id).has("embedLinks")) ? "embed" : "plain";
        let prefix = message.guildID ? message.prefix.match(/<@!?\d+>/)?.map((mention) => {
            let userID = mention.match(/<@!?(\d+)>/)[1];

            if (!message.guildID) {
                if (userID === this.client.user.id) {
                    return `@${Util.userTag(this.client.user)} `;
                }

                return mention + " ";
            }

            let member = message.channel.guild.members.get(userID);

            if (member) {
                return `@${Util.userTag(member)} `;
            }

            return mention + " ";
        }) || message.prefix : message.prefix;
        let title = `${prefix}${this.aliases.length
            ? `[${this.name}|${this.aliases.join("|")}]`
            : this.name}`;
        
        if (sendType === "embed") {
            if (subcommand) {
                content = {
                    embed: {
                        color: Util.base10(Constants.Colors.DEFAULT),
                        title: `${title} ${subcommand.name} ${subcommand.usage}`,
                        description: subcommand.fullDescription || subcommand.description || "No description.",
                        fields: []
                    }
                };
            } else {
                content = {
                    embed: {
                        title: `${title} ${this.usage}`,
                        color: Util.base10(Constants.Colors.DEFAULT),
                        description: this.fullDescription || this.description || "No description.",
                        fields: []
                    }
                };
                
                if (this.flags.length) {
                    content.embed.fields.push({
                        name: "Flags",
                        value: this.flags.map((flag) => {
                            return `${Constants.Emojis.WHITE_MEDIUM_SQUARE} \`--${flag.name}${flag.value
                                ? `=${flag.value}`
                                : ""}\` ${flag.description}`;
                        }).join("\n")
                    });
                }
                
                if (this.subcommands.size) {
                    content.embed.fields.push({
                        name: "Subcommands",
                        value: this.subcommands.map((subcommand) => {
                            return `**${message.prefix}${this.name} ${subcommand.name}** — ${subcommand.description}`;
                        }).join("\n")
                    });
                }
            }
        } else if (sendType === "plain") {
            if (subcommand) {
                content = `**${title} ${subcommand.name} ${subcommand.usage}**\n${subcommand.fullDescription ||
                subcommand.description || "No description."}`;
            } else {
                // NOTE: We're going to be doing some magic here because I like having a lot of flags.
                content = [
                    `**${title} ${this.usage}**`,
                    this.fullDescription || this.description || "No description.",
                    this.flags.length
                        ? `\n**Flags**\n${this.flags.map((flag) => {
                            return `${Constants.Emojis.WHITE_MEDIUM_SQUARE} \`--${flag.name}${flag.value
                                ? `=${flag.value}`
                                : ""}\` ${flag.description}`;
                        }).join("\n")}`
                        : null,
                    this.subcommands.size
                        ? `\n**Subcommands**\n${this.subcommands.map((subcommand) => {
                            return `**${message.prefix}${this.name} ${subcommand.name}** — ${subcommand.description}`;
                        }).join("\n")}`
                        : null
                ].filter((prop) => prop !== null);
            }
        }

        if (Array.isArray(content) &&
            content.reduce((prev, field) => prev + field.length, 0) > Constants.Discord.MAX_MESSAGE_LENGTH ||
            content.embed &&
            content.embed.fields.some((field) => field.value.length > Constants.Discord.MAX_EMBED_FIELD_VALUE_LENGTH)) {
            let pages = [
                {
                    embed: content.embed && {
                        embed: {
                            color: content.embed.color,
                            title: content.embed.title,
                            description: content.embed.description
                        }
                    },
                    plain: Array.isArray(content) && content.slice(0, 2).join("\n")
                },
                Array.isArray(content) && content[2].startsWith("\n**Flags**") ||
                content.embed && content.embed.fields.some((field) => field.name === "Flags") ? {
                        embed: content.embed && {
                            embed: {
                                color: content.embed.color,
                                title: `${content.embed.title} > Flags`,
                                description: content.embed.fields[0].value
                            }
                        },
                        plain: Array.isArray(content) && [content[0], content[2]].join("\n")
                    } : null,
                Array.isArray(content) && (content[3] || content[2]).startsWith("\n**Subcommands**") ||
                content.embed && content.embed.fields.some((field) => field.name === "Subcommands") ? {
                        embed: content.embed && {
                            embed: {
                                color: content.embed.color,
                                title: `${content.embed.title} > Subcommands`,
                                description: (content.embed.fields[1] || content.embed.fields[0]).value
                            }
                        },
                        plain: Array.isArray(content) && [content[0], content[3] || content[2]].join("\n")
                    } : null
            ].filter((prop) => prop !== null);

            let msg = await message.channel.createMessage(pages[0][sendType]);

            if (Util.hasChannelPermission(message.channel, this.client.user, "addReactions")) {
                let emojis = [
                    Constants.Emojis.TRACK_PREVIOUS,
                    Constants.Emojis.ARROW_BACKWARDS,
                    Constants.Emojis.ARROW_FORWARD,
                    Constants.Emojis.TRACK_NEXT,
                    Constants.Emojis.STOP_BUTTON
                ];
    
                try {
                    for (const emoji of emojis) {
                        await Util.sleep(1000);
                        await msg.addReaction(emoji);
                    }
                } catch (ex) {
                    if (ex.code === 10008 || ex.code === 30010 ||
                        ex.code === 50013 || ex.code === 90001) {
                        if (Util.hasChannelPermission(msg.channel, this.client
                            .user, "manageMessages")) {
                            msg.removeReactions().catch(() => {});
                        }
                      
                        return;
                    }
                }

                let pageNumber = 1;
                let collector = new ReactionCollector(this.client, (_msg, emoji, userID) => {
                    return userID === message.author.id && emojis.includes(emoji.name);
                }, {
                    time: 300000,
                    messageID: msg.id,
                    allowedTypes: ["ADD"],
                    restartTimerOnCollection: true
                });
    
                collector.on("reactionAdd", async (msg, emoji, userID) => {
                    if (message.channel.guild &&
                        message.channel.permissionsOf(this.client.user.id).has("manageMessages")) {
                        msg.removeReaction(emoji.name, userID);
                    }

                    switch (emoji.name) {
                        case Constants.Emojis.TRACK_PREVIOUS: {
                            if (pageNumber === 1) {
                                return;
                            }
                          
                            pageNumber = 1;
                            break;
                        }
                        
                        case Constants.Emojis.ARROW_BACKWARDS: {
                            if (pageNumber === 1) {
                                return;
                            }
                            
                            pageNumber -= 1;
                            break;
                        }
                        
                        case Constants.Emojis.ARROW_FORWARD: {
                            if (pageNumber === pages.length) {
                                return;
                            }
                          
                            pageNumber += 1;
                            break;
                        }
                        
                        case Constants.Emojis.TRACK_NEXT: {
                            if (pageNumber === pages.length) {
                                return;
                            }
    
                            pageNumber = pages.length;
                            break;
                        }
                        
                        case Constants.Emojis.STOP_BUTTON: {
                            return collector.stop("stop");
                        }
                    }

                    return msg.edit(pages[pageNumber - 1][sendType]);
                });
    
                collector.once("end", async (_collected, reason) => {
                    if (reason === "cache") {
                        try {
                            msg = await msg.channel.getMessage(msg.id);
                        } catch {
                            return;
                        }
                    }
    
                    msg.removeReactions().catch(() => {});
                });
            }
        } else {
            if (Array.isArray(content)) {
                content = content.join("\n");
            }

            let msg = await message.channel.createMessage(content);
    
            if (options.time) {
                Util.deleteMessage(msg, { time: options.time }).catch(() => {}); // No.
            }
        }
    }

    /**
     * Find a member in the guild.
     * @param {Message} message The message to reference when searching.
     * @param {Array<String>} args Arguments passed for searching separated by a space.
     * @param {Object} [options] Options to use when searching for a guild member.
     * @param {Boolean} [options.strict=false] Whether to enable strict mode, forcing the search to match the user's exact
     * name. This is reduntent in constant values, like the user's ID.
     * @returns {Member} The guild member, or null (if no guild member was found).
     */
    findMember(message, args, options = { strict: false }) {
        let members = message.channel.guild.members;
        let member = null;
      
        let [arg] = args;
            
        if (/^<@!?(\d+)>$/.test(arg)) {
            member = members.get(arg.match(/^<@!?(\d+)>$/)[1]);
        } else {
            member = members.get(arg);
        }
      
        if (member) {
            return member;
        }
      
        return members.map((member) => member).sort((a, b) => {
            if (b.username.toLowerCase() < a.username.toLowerCase()) {
                return 1;
            } else if (b.username.toLowerCase() > a.username.toLowerCase()) {
                return -1;
            }
          
            return 0;
        }).find((member) => {
            let search = args.join(" ").toLowerCase();
            
            if (options.strict) {
                return Util.userTag(member).toLowerCase() === search ||
                member.username.toLowerCase() === search;
            }
          
            return Util.userTag(member).toLowerCase() === search ||
            member.username.toLowerCase() === search ||
            member.username.toLowerCase().includes(search);
        }) || null;
    }

    /**
     * Find a role in a guild.
     * @param {Message} message The message to reference.
     * @param {Array<String>} args Arguments passed for searching.
     * @param {Object} [options] The options to use for searching.
     * @param {Boolean} [options.strict=false] Whether or not to skip checking for if a role name is close enough
     * to the search input.
     * @returns {Role} The role that was found, or `null` if no role was found.
     */
    findRole(message, args, options = { strict: false }) {
        let roleID = args[0].match(/^(?:(\d+)|<@&(\d+)>)$/);

        if (roleID) {
            let role = message.channel.guild.roles.get(roleID[2] || roleID[1]);

            if (role) {
                return role;
            }
        }

        return message.channel.guild.roles.map((role) => role).sort((a, b) => {
            let bName = b.name.toLowerCase();
            let aName = a.name.toLowerCase();

            if (bName < aName) {
                return 1;
            } else if (bName > aName) {
                return -1;
            }

            return 0;
        }).find((role) => {
            let roleName = role.name.toLowerCase();
            let search = args.join(" ").toLowerCase();

            return roleName === search || (options.strict ? null : roleName.includes(search));
        }) || null;
    }
  
    /**
     * Handle any exception thrown by the command. It'll likely be handled by sending a message to
     * the user telling what went wrong, or simply logging the error to the console/logging channel.
     * @param {Message} message The message to reference.
     * @param {Error} err The error instance.
     * @returns {any} Any value from the method.
     */
    handleException(message, err) {
        const report = async () => {
            await Util.reply(message, "something has gone terribly wrong. Try again later, or " +
            `join the support server if this message persists (<${Constants
                .BOT_SUPPORT_SERVER_INVITE}>).`)
                .catch(() => {});

            let channel = this.client.getChannel(Constants.REPORT_EXCEPTION_CHANNEL_ID) ||
            this.client.getChannel(Constants.BOT_OWNER);

            if (channel) {
                let [subcommandArg] = Util.messageArgs(message, this.client);
                let subcommand = subcommandArg && this.subcommands.get(subcommandArg.toLowerCase());
                    
                // If it fails to send for whatever reason, ignore and send to the console.
                try {
                    await channel.createMessage({
                        embed: {
                            title: err.toString().substring(0, 256),
                            description: `\`\`\`js\n${err.stack}\`\`\``.substring(0, 2048),
                            color: Util.base10(Constants.Colors.RED),
                            fields: [{
                                name: "Metadata",
                                value: [
                                    `**User**: ${Util.userTag(message.author)} (${message
                                        .author.id})`,
                                    `**Guild**: ${message.channel.guild
                                        ? `${message.channel.guild.name} (${message.channel
                                            .guild.id})`
                                        : `Direct Message (${message.channel.id})`}`,
                                    `**Command**: ${this.name} (\`src/commands/${this
                                        .category}/${this.name}.js\`)`,
                                    subcommand
                                        // eslint-disable-next-line max-len
                                        ? `**Subcommand**: ${subcommand.name} (\`src/commands/${this
                                            .category}/${this.name}/${subcommand.name}.js\`)`
                                        : null,
                                    `**Time**: ${dateformat(Date
                                        .now(), "mmmm d, yyyy @ h:MM:ss TT Z")}`
                                ].filter((value) => value !== null).join("\n")
                            }]
                        }
                    });

                    return;
                } catch (ex) {
                    this.client.logger.error("Error logging to channel:", ex);
                }
            }

            return this.client.logger.error(`Command Exception (${this.category}/${this
                .name}): ${err.stack}`);
        };

        if (err.code) {
            let code = err.code;

            // Unauthorized, forbidden.
            if (code === 401 || code === 403) {
                return message.channel.createMessage("I do not have permission to perform this " +
                `action (code: ${code}).`);
            } else if (code >= 500 && code < 600) {
                return message.channel.createMessage("There seems to be an issue with the API " +
                `(code: ${code}). Try again later or join the support server if this message ` +
                "consists.");
            }

            // Discord errors, hopefully.
            if (code > 10000) {
                if (code === 20001 || code === 20002) {
                    // Bots/only users can use this endpoint.
                    return report();
                } else if (code < 10016) {
                    // Unknown X
                    return CommandError.ERR_NOT_FOUND(message, err.message.replace("Unknown ", ""));
                } else if (code >= 30001 && code <= 30016 || code === 40007) {
                    // Maximum number of X reached (Y), the user is banned from the guild.
                    return message.channel.createMessage(err.message);
                } else if (code === 50001 || code === 50013) {
                    // Missing access, missing permissions
                    return message.channel.createMessage("I do not have permission to perform " +
                    "this action.");
                } else if (code === 50003) {
                    // Cannot execute action on DM.
                    return message.channel.createMessage(`${Constants.CustomEmojis
                        .LOCK} The \`${this.name}\` command can only be run in a server.`);
                } else if (code === 90001) {
                    // Reaction blocked, probably blocked the bot.
                    return;
                }
            }
        }

        return report();
    }
  
    /**
     * Check the status sent by an HTTP(s) request.
     * @param {Response} res The response sent back.
     * @param {String} [convert=json] The type of value to convert the response to. 
     * @param {Array<Number>} [statusCodes=[]] An array of valid status codes. The method checks if
     * the response was OK (code >= 200 && code <= 300), so there's no need to pass codes
     * in the 200 range.
     */
    checkStatus(res, convert = "json", statusCodes = []) {
        if (res.ok || statusCodes.includes(res.status)) {
            return res[convert]();
        }
      
        let err = new Error(`${res.status} ${res.statusText}`);
        err.code = res.status;
      
        throw err;
    }
  
    /**
     * Sanitize the permissions, returning the permissions one can use in a human readable form.
     * @param {Array<String>} perms An array of permissions something may have.
     * @returns {Array<String>} An array of human-readable permissions.
     */
    sanitizePermissions(perms) {
        let permissions = {
            createInstantInvite: "Create Instant Invites",
            kickMembers: "Kick Members",
            banMembers: "Ban Members",
            administrator: "Administrator",
            manageChannels: "Manage Channels",
            manageGuild: "Manage Guild",
            addReactions: "Add Reactions",
            viewAuditLogs: "View Audit Logs",
            voicePrioritySpeaker: "Priority Speaker",
            stream: "Stream",
            readMessages: "Read Messages",
            sendMessages: "Send Messages",
            sendTTSMessages: "Send TTS Messages",
            manageMessages: "Manage Messages",
            embedLinks: "Embed Links",
            attachFiles: "Attach Files",
            readMessageHistory: "Read Message History",
            mentionEveryone: "Mention Everyone",
            externalEmojis: "Use External Emojis",
            viewGuildAnalytics: "View Guild Analytics",
            voiceConnect: "Connect",
            voiceSpeak: "Speak",
            voiceMuteMembers: "Mute Members",
            voiceDeafenMembers: "Deafen Members",
            voiceMoveMembers: "Move Members",
            voiceUseVAD: "Use Voice Activation Detection",
            changeNickname: "Change Nickname",
            manageNicknames: "Manage Nicknames",
            manageRoles: "Manage Roles",
            manageWebhooks: "Manage Webhooks",
            manageEmojis: "Manage Emojis"
        };
      
        return perms.map((perm) => permissions[perm] || "???");
    }
}

module.exports = Command;