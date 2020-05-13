"use strict";

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * @typedef {import("../Rin.js")} Client
 */
class EventListener {
    /**
     * @param {Client} client The client instance.
     * @param {EventEmitter} emitter The event emitter.
     * @param {String} fileName The name of the file with its extension.
     * @param {Object} [options] Optional options to configure the event listener.
     * @param {Boolean} [options.once=false] Whether to emit the event once before removing.
     * @param {Boolean} [options.enabled=true] Whether the event is enabled or disabled.
     */
    constructor(client, emitter, fileName, options = {}) {
        /**
         * The client instance.
         * @type {Client}
         */
        this.client = client;

        /**
         * The event emitter this class references.
         * @type {EventEmitter}
         */
        this.emitter = emitter;

        /**
         * Whether or not the event is emitted once.
         * @type {Boolean}
         */
        this.once = options.once || false;

        /**
         * Whether or not the event is enabled.
         * @type {Boolean}
         */
        this.enabled = has(options, "enabled") ? options.enabled : true;

        /**
         * The name of the event listener.
         * @type {String}
         */
        this.eventName = fileName.replace(".js", "");
    }

    /**
     * Run the event listener.
     * @returns {Promise<*>} The value returned from the event execution.
     */
    async run() {
        this.client.logger.warn(`Event ${this.eventName} has no run method.`);
    }
}

module.exports = EventListener;