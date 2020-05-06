"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    async run(warning, shardID) {
        this.client.logger.warn(`Shard #${shardID}: ${warning}`);
    }
};