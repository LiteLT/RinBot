"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    run(message) {
        if (this.client.reactionMonitors.size) {
            for (const collector of this.client.reactionMonitors) {
                if (collector.options.allowedTypes.includes("REMOVEALL")) {
                    collector.check(message, null, null, "REMOVEALL");
                }
            }
        }
    }
};