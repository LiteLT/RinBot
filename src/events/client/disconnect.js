"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    /**
     * Runs the event listener.
     */
    async run() {
        this.client.logger.warn("Disconnected!");
    }
};