"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    async run(err, id) {
        err.shardID = id;
        this.client.logger.error(err);
    }
};