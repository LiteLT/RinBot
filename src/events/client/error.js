"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    /**
     * Runs the event listener.
     * @param {Error} err The error.
     * @param {Number} shardID The ID of the shard the event was emitted on.
     */
    async run(err, shardID) {
        this.client.logger.error(`[Shard ${shardID ? `#${shardID}` : "?"}]`, err);
    }
};