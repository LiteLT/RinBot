"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    async run() {
        this.client.logger.warn("Disconnected!");
    }
};