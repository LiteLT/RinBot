"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    /**
     * Runs the event listener.
     * @param {Number} shardID The ID of the shard the event was emitted on.
     */
    run(shardID) {
        this.client.logger.info(`[Shard ${shardID ? `#${shardID}` : "?"}] Shard Resumed.`);
    }
};