"use strict";

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * @typedef {import("../Client.js")} Client
 * @typedef {import("events").EventEmitter} EventEmitter
 */
/**
 * Represents an event.
 * @property {Client} client The client instance.
 * @property {EventEmitter} emitter The event emitter.
 * @property {Boolean} once Whether the event will be emitted only once.
 * @property {Boolean} enabled Whether the event listener is enabled or not.
 * @property {String} eventName the name of the event, the same as the file name.
 */
class EventListener {
    /**
     * Initialize the event emitter.
     * @param {Client} client The client instance.
     * @param {EventEmitter} emitter The event emitter.
     * @param {String} fileName The name of the file with its extension.
     * @param {Object} [options] Optional options to configure the event listener.
     * @param {Boolean} [options.once=false] Whether to emit the event once before removing.
     * @param {Boolean} [options.enabled=true] Whether the event is enabled or disabled.
     */
    constructor(client, emitter, fileName, options = {}) {
        this.client = client;
        this.emitter = emitter;
      
        this.once = options.once || false;
        this.enabled = has(options, "enabled") ? options.enabled : true;
        this.eventName = fileName.replace(".js", "");
    }
  
    /**
     * Run the event listener.
     * @returns {any} The value returned from the event execution.
     */
    async run() {
        this.client.logger.warn(`Event ${this.listenerName} has no run method.`);
    }
}

module.exports = EventListener;