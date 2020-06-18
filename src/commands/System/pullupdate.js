"use strict";

const { Command, Constants } = require("../../index.js");
const { exec: execCommand } = require("child_process");
const { promisify } = require("util");
const exec = promisify(execCommand);

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            description: "Downloads the latest version of the bot.",
            protected: true,
            validatePermissions: (message) => Constants.BOT_DEVELOPERS.includes(message.author.id)
        });
    }

    /**
     * Runs the command.
     *
     * @param {Eris.Message} message The message the command was called on.
     * @param {Array<String>} args Arguments passed to the command.
     */
    async run(message, args) {
        await message.channel.createMessage("Updating...");

        try {
            await exec("git pull --no-commit origin master && pm2 restart rin");
            await this.client.gracefulExit(0); // Just to be safe.
        } catch (ex) {
            return message.channel.createMessage(`Failed to download update: ${ex.stack || ex}`);
        }
    }
};