"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    /**
     * Runs the event listener.
     * @param {Eris.Message} [message] The message the reaction was removed from.
     * @param {Object} emoji The emoji that was removed.
     * @param {String} [emoji.id=null] The ID of the emoji (`null` for non-custom emojis).
     * @param {String} emoji.name The name of the emoji (the unicode for non-custom emojis).
     * @param {Eris.User.id} userID The ID of the user who removed the reaction.
     */
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