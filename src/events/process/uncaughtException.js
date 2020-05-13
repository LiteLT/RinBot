"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    constructor(...args) {
        super(...args, { once: true });
    }

    /**
     * Runs the event listener.
     * @param {Error} err The error.
     * @param {"uncaughtException" | "unhandledRejection"} origin Where the error originated.
     */
    async run(err, origin) {
        let type = origin === "uncaughtException" ? "Exception" : "Promise Rejection";

        this.client.logger.error(`Uncaught ${type}:`, err);
        await this.client.gracefulExit(1);
    }
};