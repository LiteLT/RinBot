"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    /**
     * Runs the event listener.
     * @param {Error|*} _err The error.
     * @param {Promise<*>} promise The rejected promise.
     */
    async run(_err, promise) {
        this.client.logger.error(`Unhandled Rejection:`, promise);
    }
};