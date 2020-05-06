"use strict";

const Util = require("../utils/Util.js");
const EventEmitter = require("events");
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * @typedef {import("../Client.js")} Client
 * @typedef {import("eris").Message} Message
 * @typedef {{ id?: String, name: String }} emoji
 * @typedef {"ADD" | "REMOVE" | "REMOVEALL"} reactionType
 */
/**
 * Represents a reaction collector for awaiting reactions.
 * @property {Client} client The client instance.
 * @property {Function} filter The filter to run on each reaction.
 * @property {{
        messageID?: String, 
        time?: Number,
        maxMatches?: Number,
        restartTimerOnCollection?: Boolean,
        allowedTypes?: Array<reactionType>
    }} options The options.
 * @property {Boolean} ended Whether or not the collector has ended or not.
 * @property {{
        message: Message,
        emoji: emoji,
        userID: String,
        type: reactionType
    }} collected The data collected from the reaction collector.
 */
class ReactionCollector extends EventEmitter {
    /**
     * Initializes the reaction collector.
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
        
        this.client = client;
        this.filter = filter;
        this.ended = false;
        this.collected = [];
        this.options = Object.assign({
            time: Infinity,
            allowedTypes: ["ADD", "REMOVE", "REMOVEALL"],
            messageID: null,
            maxMatches: Infinity,
            restartTimerOnCollection: false
        }, options);

        this._timeout = options.time ? setTimeout(() => this.stop("time"), options.time) : null;

        this.client.reactionMonitors.add(this);
    }

    /**
     * Checks if the reaction passes the filter.
     * @param {Message} message The message instance.
     * @param {{ id?: String, name: String }} emoji The emoji object.
     * @param {String} userID The ID of the user who added the reaction.
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
     * @returns {Boolean} Whether or not the reaction collector was stopped by this method call.
     * `False` when the reaction collector already ended.
     */
    stop(reason = "") {
        if (this.ended) {
            return false;
        }

        if (this._timeout) {
            clearTimeout(this._timeout);
        }

        this.ended = true;

        this.client.reactionMonitors.delete(this);
        this.emit("end", this.collected, reason);

        return true;
    }
}

module.exports = ReactionCollector;