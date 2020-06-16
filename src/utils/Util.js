"use strict";

const MessageCollector = require("../structures/MessageCollector.js");
const Constants = require("./Constants.js");
const sleep = (ms) => new Promise((res) => setTimeout(res, ms, ms));

/**
 * @typedef {import("../Rin.js")} Client
 * @typedef {import("../structures/Command.js")} Command
 */
/**
 * Represents the Utility static class for performing common functions.
 */
class Util {
    /**
     * Checks if the text is a Twitter snowflake.
     * @param {String} text The text to check.
     * @returns {Boolean} Whether or not it's a snowflake or not.
     */
    static isSnowflake(text) {
        return /^\d+$/.test(text);
    }

    /**
     * Checks if the bot can manage the target member.
     * @param {Eris.Member} member The member to check.
     * @param {Client} client The bot.
     * @return {Promise<Boolean>} Whether or not the member is manageable by the client member.
     */
    static async isManageable(member, client) {
        let clientMember = await this.guildMe(client, member.guild);

        if (member.id === member.guild.ownerID ||
            member.id === clientMember.id ||
            clientMember.id === member.guild.ownerID) {
            return false;
        }

        if (clientMember.roles.length) {
            if (member.roles.length) {
                return Util.memberHighestRole(clientMember).position >= Util.memberHighestRole(member).position;
            }
        } else if (member.roles.length) {
            return false;
        }

        return true;
    }

    /**
     * Adds commas to a number.
     * @param {Number} num The number.
     * @returns {String} The number with commas added where they're needed.
     */
    static commaify(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Pause/halt progression for a number of time.
     * @param {Number} ms The time to wait in milliseconds.
     * @returns {Promise<Number>} The duration specified to wait.
     */
    static sleep(ms) {
        return sleep(ms);
    }

    /**
     * Get the tag of a user.
     * @param {User|Member} user The Discord user instance. Passing a guild member instance works too, but it's not
     * ideal.
     * @returns {String} The formatted Discord user tag.
     */
    static userTag(user) {
        return `${user.username}#${user.discriminator}`;
    }

    /**
     * Get the highest role from a member.
     * @param {Eris.Member} member The member to get the role for.
     * @returns {Eris.Role} The role.
     */
    static memberHighestRole(member) {
        return member.roles
            .map((roleID) => member.guild.roles.get(roleID))
            .sort((a, b) => b.position - a.position)[0];
    }

    /**
     * Parses a custom emoji's markdown form to an object.
     * @param {String} emojiText The emoji's markdown text.
     * @returns {?{ id: String, name: String, animated: Boolean }} The name and ID of the custom emoji.
     */
    static parseCustomEmoji(emojiText) {
        let regex = emojiText.match(/<(a)?:(\w{2,32}):(\d{17,19})>/);

        if (regex) {
            return {
                id: regex[3],
                name: regex[2],
                animated: !!regex[1]
            };
        }

        return null;
    }

    /**
     * Checks if the member has permission to do something in a channel.
     * @param {TextChannel} channel The text channel.
     * @param {Member | User} member The guild member or user.
     * @param {String} perm The Eris permission.
     * @returns {Boolean} Whether or not the member has permission in a text channel.
     */
    static hasChannelPermission(channel, member, perm) {
        return !channel.guild || channel.permissionsOf(member.id).has(perm);
    }

    /**
     * Converts a hex to a base10 integer.
     * @param {String} hex The hex to convert.
     * @returns {Number} The base10 integer.
     */
    static base10(hex) {
        return parseInt(hex.replace("#", ""), 16);
    }

    /**
     * Makes every starting letter of a word capital in a string.
     * @param {String} str The string to convert to title case.
     * @returns {String} The title case string (e.g. "the end" -> "The End").
     */
    static toTitleCase(str) {
        return str.toLowerCase().split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase())
            .join(" ");
    }

    /**
     * Limit the size of a string by adding ... at the end if exceeded.
     * @param {String} str The string to limit.
     * @param {Number} limit The maximum string length.
     * @returns {String} The new string, with its length limited. If the length was not over the limit, the appended
     * dots will not be there.
     */
    static stringLimit(str, limit) {
        return str.length > limit ? str.substring(0, limit - 3) + "..." : str;
    }

    /**
     * Filters out an array by returning two arrays that pass and fail the condition function.
     * @param {Array<any>} arr The array to use.
     * @param {Function} fn The function to run on each element in the array. The function receives the item, index and
     * value of `this`.
     * @param {any} thisArg The `this` value to use in the function.
     * @returns {Array<Array<*>>} The result of the function. The first array contains the values
     * returning a truthfully value, while the 2nd contain the ones failing to pass.
     */
    static arrayPartition(arr, fn, thisArg = null) {
        fn = thisArg === null ? fn : fn.bind(thisArg);
        let passed = [];
        let failed = [];
        let index = 0;

        for (const item of arr) {
            if (fn(item, index, arr)) {
                passed.push(item);
            } else {
                failed.push(item);
            }
        }

        return [passed, failed];
    }

    /**
     * Filters out repeating entries in an array.
     * @param {Array<any>} arr The array to filter.
     * @returns {Array<any>} The new array, with all the repeating items removed. Items with different instances
     * (e.g. objects) will fail to be removed if they're not the exact same instance.
     */
    static arrayUnique(arr) {
        let list = [];

        for (const item of arr) {
            if (!list.includes(item)) {
                list.push(item);
            }
        }

        return list;
    }

    /**
     * Joins an array of strings leaving out elements exceeding the character limit.
     * @param {Array<String>} arr The array to join.
     * @param {String} delimiter The `<Array>.join()` string to place in between items when joining.
     * @param {Number} strMax The maximum length of the join character count.
     * @returns The joined array.
     */
    static arrayJoinLimit(arr, delimiter, strMax) {
        let res = [];
        let length = 0;

        for (const item of arr) {
            if (length + delimiter.length + item.length > strMax) {
                break;
            } else {
                res.push(item);
                length += item.length + delimiter.length;
            }
        }

        return res.join(delimiter);
    }

    /**
     * Get the prefix used in the sent message. If the message is sent in a guild, it will attempt to find set prefixes
     * in the guild. This may pose a problem when checking old messages.
     * @param {Message} message The message instance.
     * @param {Client} bot The client instance.
     * @returns {String} The prefix, or null (if no prefix was found).
     */
    static messagePrefix(message, bot) {
        let prefix = null;
        let guildPrefixes = bot.guildSettings.get(message.guildID)?.prefixes || null;

        if (guildPrefixes !== null) {
            if (guildPrefixes?.length) {
                prefix = guildPrefixes.find((pre) => message.content.toLowerCase().startsWith(pre));
            }
        } else {
            prefix = Constants.BOT_PREFIXES.find((pre) => message.content.toLowerCase().startsWith(pre));
        }

        return prefix && message.content.substring(prefix.length).charAt(0) !== " " ? prefix : null;
    }

    /**
     * Get the arguments passed in the sent message.
     * @param {Message} message The sent message.
     * @param {Client} bot The client instance.
     * @returns {Array<String>} An array of strings for each argument, or null (if no prefix could be found from
     * `Util.messagePrefix`).
     */
    static messageArgs(message, bot) {
        let prefix = message.prefix || Util.messagePrefix(message, bot);

        if (prefix) {
            return message.content.substring(prefix.length).trim().split(/ +(?:--[\w=]+)*/g).slice(1)
                .filter((arg) => arg);
        }

        return null;
    }

    /**
     * Get any flags passed in a message, regardless of if a command was ran or not. Flags can be passed in a syntax
     * like `--flagName`. The name must be at least 2 characters long. Optionally, the flag can have a value by
     * appending =myValue to the end of the flag name (e.g. `--flagName=hi`). Flags do not support values containing
     * spaces nor quote support.
     * @param {Message} message The sent message.
     * @param {Client} bot The client instance.
     * @returns {Object} The flags passed in the message.
     */
    static messageFlags(message, bot) {
        let flags = message.content.split(/ +/g)
            .filter((str) => str.startsWith("--") && str.slice(2).length >= 2)
            .map((str) => str.slice(2));

        if ((message.prefix || Util.messagePrefix(message, bot)) === "--") {
            flags = flags.slice(1);
        }

        let flagObj = {};

        for (const flag of flags) {
            let [key, value] = flag.split("=");

            flagObj[key] = value || key;
        }

        return flagObj;
    }

    /**
     * Get the command called for the sent message. This is unreliable if the user updates/edits their message.
     * @param {Eris.Message} message The sent message.
     * @param {Client} bot The client instance.
     * @returns {?Command} The command called in the message, or null.
     */
    static messageCommand(message, bot) {
        let prefix = message.prefix || Util.messagePrefix(message, bot);

        if (prefix) {
            let label = message.content.substring(prefix.length).trim().split(/ +(?:--[\w=]+)*/g)[0].toLowerCase();

            return bot.commands.get(bot.aliases.get(label) || label) || null;
        }

        return null;
    }

    /**
     * Prompts the user for a response.
     * @param {Message} message The message instance.
     * @param {TextChannel} channel The channel to send the message in.
     * @param {Client} client The client instance.
     * @param {String} text The message to send to the user initially. This can also be an embed.
     * @param {Number} time The maximum duration to run the prompt for in milliseconds.
     * @param {Array<String>} responses An array of strings to limit responses from the user to.
     * @returns {Promise<Message>} The received message.
     */
    static async messagePrompt(message, channel, client, text, time, responses) {
        if (responses) {
            responses = responses.map((res) => ("" + res).toLowerCase()); // Confirm it's a string.
        }

        let sent = await message.channel.createMessage(text);
        let collector = new MessageCollector(client, (msg) => {
            if (msg.author.id === message.author.id) {
                if (responses) {
                    return responses.includes(msg.content.toLowerCase());
                }

                return true;
            }
        }, { time, maxMatches: 1, channelID: channel.id });

        return new Promise((resolve, reject) => {
            collector.on("collect", (msg) => {
                sent.delete().catch(() => {});

                return resolve(msg);
            });

            collector.on("end", (collected) => {
                if (collected.length === 0) {
                    return reject(new Error("No messages received."));
                }
            });
        });
    }

    /**
     * Wait to delete a message.
     * @param {Message} msg The message to delete.
     * @param {Object} [options] The options to use when deleting messages.
     * @param {Number} [options.time] The time to wait before deleting the message. This uses the `Util.sleep(ms)`
     * method.
     * @param {String} [options.reason] The reason to use in audit logs.
     * @returns {Message|TypeError} The deleted message, or a TypeError (if an invalid time in milliseconds was
     * supplied).
     */
    static async deleteMessage(msg, options = { time: 0, reason: "" }) {
        if (typeof options.time === "number") {
            await sleep(options.time);

            return msg.delete(options.reason);
        }

        throw new TypeError(`Invalid time: ${options.time}`);
    }

    /**
     * Get the client member in the guild. If the member cannot be found in the cache, a raw request will be sent to
     * fetch the member.
     * @param {Client} bot The client instance.
     * @param {Guild} guild The guild to search.
     * @returns {Promise<Eris.Member>} The guild client member.
     */
    static guildMe(bot, guild) {
        let me = guild.members.get(bot.user.id);

        if (me) {
            return Promise.resolve(me);
        }

        return guild.getRESTMember(bot.user.id);
    }

    /**
     * Reply to a message with a mention prefixing it.
     * @param {Message} message The message to reply to.
     * @param {String} content The content to send with the message. Embeds are not supported.
     * @param {{ file: Buffer, name: String }} [file] The file contents to send a long with it.
     * @returns {Message|Promise<Error>} The created message, or an error (if it failed to send the message).
     */
    static reply(message, content, file) {
        return message.channel.createMessage(`${message.author.mention}, ${content}`, file);
    }
}

module.exports = Util;