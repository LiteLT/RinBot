"use strict";

const { Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<command>",
            description: "Reload a command.",
            fullDescription: "This is useful when both a command and category share the same name.",
            requiredArgs: 1,
            enabled: true
        });
    }

    async run(message, [argCommand, argSubcommand]) {
        let commandName = argCommand.toLowerCase();
        let subcommandName = argSubcommand && argSubcommand.toLowerCase();

        let command = this.client.commands.get(this.client.aliases.get(commandName) || commandName);

        if (command) {
            if (argSubcommand) {
                let subcommand = command.subcommands.get(subcommandName);

                if (subcommand) {
                    return this.command._reloadSubcommand(message, command, subcommand);
                }

                return CommandError.ERR_NOT_FOUND(message, `subcommand of command \`${command
                    .name}\``, argSubcommand);
            }

            return this.command._reloadCommand(message, command);
        }

        return CommandError.ERR_NOT_FOUND(message, "command", argCommand);
    }
};