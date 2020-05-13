"use strict";

const Util = require("../utils/Util.js");
const EventEmitter = require("events");
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * @typedef {import("../Rin.js")} Client
 * @typedef {import("eris").Message} Message
 * @typedef {{ id?: String, name: String }} emoji
 * @typedef {"ADD" | "REMOVE" | "REMOVEALL"} reactionType
 */
/**
 * @typedef {Object} EmojiData
 * @property {?String} id The ID of the emoji.
 * @property {String} name The name of the emoji.
 */
/**
 * @typedef {Object} CollectedEmojiData
 * @property {Eris.Message} message The message the reaction was added to.
 * @property {EmojiData} emoji The emoji.
 * @property {Eris.User.id} userID The ID of the user who added the reaction.
 * @property {reactionType} type The type of reaction.
 */
/**
 * Represents a collector for reactions.
 */
class ReactionCollector extends EventEmitter {
    /**
     * @param {Client} client The client instance.
     * @param {Function} filter The filter to run on each reaction.
     * @param {Object} options The options for the collector.
     * @param {Number} [options.time=Infinity] How long to keep the filter running for
     * in milliseconds.
     * @param {Array<reactionType>} [options.allowedTypes] The type of reactions
     * to allow.
     * @param {String} [options.messageID] The message to run the reaction collector on.
     * @param {Number} [options.maxMatches] The maximum amount of reactions passing the filter.
     * @param {Boolean} [options.restartTimerOnCollection=false] Whether to restart the timer once a
     * reaction passes the filter or not.
     */
    constructor(client, filter, options) {
        super();

        /**
         * The client instance.
         * @type {Client}
         */
        this.client = client;

        /**
         * The filter to run on each message.
         * @type {Function}
         */
        this.filter = filter;

        /**
         * Whether or not the collection has ended.
         * @type {Boolean}
         */
        this.ended = false;

        /**
         * An array of collected messages.
         * @type {Array<CollectedEmojiData>}
         */
        this.collected = [];

        /**
         * The options for the collector.
         * @typedef {Object} CollectorOptionsData
         * @property {Number} [time=Infinity] How long to run the collector for.
         * @property {Array<reactionType>} [allowedTypes=["ADD", "REMOVE", "REMOVEALL"]] The type
         * of reactions to listen for.
         * @property {String} [messageID=null] The message to limit the collection to.
         * @property {Number} [maxMatches=Infinity] How many items the collector is allowed to hold.
         * @property {Boolean} [restartTimerOnCollection=false] Whether or not to restart the timer when a new item
         * is added to the collection.
         */

        /**
         * An object representing the options for the collection.
         * @type {CollectorOptionsData}
         */
        this.options = Object.assign({
            time: Infinity,
            allowedTypes: ["ADD", "REMOVE", "REMOVEALL"],
            messageID: null,
            maxMatches: Infinity,
            restartTimerOnCollection: false
        }, options);

        /**
         * The timer for when the collector hits its time limit.
         * @type {?NodeJS.Timeout}
         * @private
         */
        this._timeout = options.time ? setTimeout(() => this.stop("time"), options.time) : null;

        this.client.reactionMonitors.add(this);
    }

    /**
     * Checks if the reaction passes the filter.
     * @param {Eris.Message} message The message instance.
     * @param {EmojiData} emoji The emoji object.
     * @param {Eris.User.id} userID The ID of the user who added the reaction.
     * @param {reactionType} type The reaction type.
     * @returns {Boolean} Whether or not the reaction passed the filter.
     * An event is fired when a reaction passes or fails the filter.
     */
    check(message, emoji, userID, type) {
        const failed = (...args) => this.emit("failed", ...args);
        const passed = (message, emoji, userID, type) => {
            this.emit("passed", message, emoji, userID, type);
            this.emit(`reaction${Util.toTitleCase(type)}`, message, emoji, userID);
        };

        if (!has(message, "content")) { // Message has become uncached.
            failed(message, emoji, userID, type);
            this.stop("cache");

            return false;
        }

        if (this.options.messageID && this.options.messageID !== message.id) {
            failed(message, emoji, userID, type);

            return false;
        }

        if (this.filter(message, emoji, userID, type)) {
            this.collected.push({ message, emoji, userID, type });
            passed(message, emoji, userID, type);

            if (this.collected.length >= this.options.maxMatches) {
                this.stop("maxMatches");
            }

            if (this.options.restartTimerOnCollection) {
                this._timeout = this.options.time
                    ? setTimeout(() => this.stop("time"), this.options.time)
                    : null;
            }

            return true;
        }

        failed(message, emoji, userID, type);

        return false;
    }

    /**
     * Stops the reaction collector.
     * @param {String} reason The reason.
     * @returns {Boolean} Whether or not the reaction collector was stopped by this method call. `false` when the
     * reaction collector already ended.
     */
    stop(reason = "") {
        if (this.ended) {
            return false;
        }

        if (this._timeout) {
            global.clearTimeout(this._timeout);
        }

        this.ended = true;

        this.client.reactionMonitors.delete(this);
        this.emit("end", this.collected, reason);

        return true;
    }
}

module.exports = ReactionCollector;