"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    constructor(...args) {
        super(...args, { once: true });
    }
  
    async run(err, origin) {
        let type = origin === "uncaughtException" ? "Exception" : "Promise Rejection";
      
        this.client.logger.error(`Uncaught ${type}:`, err);
        this.client.gracefulExit(1);
    }
};