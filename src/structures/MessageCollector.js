"use strict";

const EventEmitter = require("events");

/**
 * @typedef {import("../Rin.js")} Client
 */
/**
 * Represents a collector for watching new messages.
 * @extends {EventEmitter}
 */
class MessageCollector extends EventEmitter {
    /**
     * @param {Client} client The client instance.
     * @param {Function} filter The function to run on each message.
     * @param {Object} options The options for the collector.
     * @param {String} [options.channelID] The channel to restrict the message collector to.
     * @param {Number} [options.time=Infinity] The maximum time for the collector to run in ms.
     * @param {Number} [options.maxMatches=Infinity] The maximum amount of messages to collect.
     * @param {Boolean} [options.restartTimerOnCollection=false] Whether to restart the timer upon
     * a message being collected or not.
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
         * @type {Array<Eris.Message>}
         */
        this.collected = [];

        /**
         * The options for the collector.
         * @typedef {Object} CollectorOptionsData
         * @property {String} [channelID=null] The channel to limit the collection to.
         * @property {Number} [time=Infinity] How long to run the collector for.
         * @property {Number} [maxMatches=Infinity] How many items the collector is allowed to hold.
         * @property {Boolean} [restartTimerOnCollection=false] Whether or not to restart the timer when a new item
         * is added to the collection.
         */

        /**
         * An object representing the options for the collection.
         * @type {CollectorOptionsData}
         */
        this.options = Object.assign({
            channelID: null,
            time: Infinity,
            maxMatches: Infinity,
            restartTimerOnCollection: false
        }, options);

        /**
         * The timer for when the collector hits its time limit.
         * @type {?NodeJS.Timeout}
         * @private
         */
        this._timeout = options.time ? setTimeout(() => this.stop("time"), options.time) : null;

        this.client.messageMonitors.add(this);
    }

    /**
     * Runs the filter on a new message and emits events.
     * @param {Eris.Message} message The message instance.
     * @returns {Boolean} Whether or not the message passes the filter or not.
     */
    check(message) {
        const failed = (msg) => this.emit("failed", msg);
        const passed = (msg) => this.emit("collect", msg);

        if (this.options.channelID && this.options.channelID !== message.channel.id) {
            failed(message);

            return false;
        }

        if (this.filter(message)) {
            this.collected.push(message);
            passed(message);

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

        failed(message);

        return false;
    }

    /**
     * Stops the message collector.
     * @param {String} [reason=""] The reason.
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

        this.client.messageMonitors.delete(this);
        this.emit("end", this.collected, reason);

        return true;
    }
}

module.exports = MessageCollector;