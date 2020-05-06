"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    async run(err, promise) { // eslint-disable-line handle-callback-err
        this.client.logger.error(`Unhandled Rejection:`, promise);
    }
};