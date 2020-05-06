"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    run(shardID) {
        this.client.logger.info(`Shard #${shardID} | Resumed.`);
    }
};