"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    run(message, emoji, userID) {
        if (this.client.reactionMonitors.size) {
            for (const collector of this.client.reactionMonitors) {
                if (collector.options.allowedTypes.includes("ADD")) {
                    collector.check(message, emoji, userID, "ADD");
                }
            }
        }
    }
};