"use strict";

const EventEmitter = require("events");

/**
 * @typedef {import("../Client.js")} Client
 * @typedef {import("eris").Message} Message
 */
/**
 * Represents a message collector.
 * @property {Client} client The client instance.
 * @property {Function} filter The filter to run on each message.
 * @property {Boolean} ended Whether the message collector has ended or not.
 * @property {Array<Message>} collected An array of messages passing the filter.
 * @property {{
        channelID?: String,
        time?: Number,
        maxMatches?: Number,
        restartTimerOnCollection?: Boolean
    }} options The options.
 
 */
class MessageCollector extends EventEmitter {
    /**
     * Initializes the message collector.
     * @param {Client} client The client instance.
     * @param {Function} filter The function to run on each message.
     * @param {Object} options The options for the collector.
     * @param {String} [options.channelID] The channel to restrict the message collector to.
     * @param {Number} [options.time=Infinity] The maximum time for the collectot to run in ms.
     * @param {Number} [options.maxMatches=Infinity] The maximum amount of messages to collect.
     * @param {Boolean} [options.restartTimerOnCollection=false] Whether to restart the timer upon
     * a message being collected or not.
     */
    constructor(client, filter, options) {
        super();

        this.client = client;
        this.filter = filter;
        this.ended = false;
        this.collected = [];
        this.options = Object.assign({
            channelID: null,
            time: Infinity,
            maxMatches: Infinity,
            restartTimerOnCollection: false
        }, options);

        this._timeout = options.time ? setTimeout(() => this.stop("time"), options.time) : null;

        this.client.messageMonitors.add(this);
    }

    /**
     * 
     * @param {Message} message The message instance.
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

        this.client.messageMonitors.delete(this);
        this.emit("end", this.collected, reason);

        return true;
    }
}

module.exports = MessageCollector;