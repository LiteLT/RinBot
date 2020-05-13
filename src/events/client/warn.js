"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    /**
     * Runs the event listener.
     * @param {String} warning The warning message.
     * @param {Number} shardID The ID of the shard the event was emitted on.
     */
    async run(warning, shardID) {
        this.client.logger.warn(`[Shard ${shardID ? `#${shardID}` : "?"}] ${warning}`);
    }
};