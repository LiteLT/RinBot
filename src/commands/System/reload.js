"use strict";

const { Util, Command, Constants, CommandError } = require("../../index.js");
const { promises: fs } = require("fs");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<command|category|all>",
            description: "Reload a command, category or everything.",
            fullDescription: "You can pass an asterisk (`*`) as an alias for \"all\".",
            requiredArgs: 1,
            protected: true,
            validatePermissions: (message) => Constants.BOT_DEVELOPERS.includes(message.author.id)
        });
    }

    /**
     * Runs the command.
     * @param {Eris.Message} message The message the command was called on.
     * @param {Array<String>} args Arguments passed to the command.
     */
    async run(message, args) {
        let search = args[0].toLowerCase();

        if (search === "all" || search === "*") {
            return this._reloadAll(message);
        }

        let command = this.client.commands.get(this.client.aliases.get(search) || search);
        let subcommand = args[1]?.toLowerCase();

        if (command) {
            if (subcommand) {
                let subcmd = command.subcommands.get(subcommand);

                if (subcmd) {
                    return this._reloadSubcommand(message, command, subcmd);
                }

                return CommandError.ERR_NOT_FOUND(message, `subcommand of command \`${command.name}\``, subcommand);
            }

            return this._reloadCommand(message, command);
        }

        let category = Util.arrayUnique(this.client.commands.map((command) => command.category.name))
            .find((category) => category === Util.toTitleCase(args.join(" ")));

        if (category) {
            return this._reloadCategory(message, category);
        }

        return CommandError.ERR_NOT_FOUND(message, "command or category", args.join(" "));
    }

    _reloadAll(message) {
        let failed = [];

        for (const [, command] of this.client.commands) {
            try {
                delete require.cache[require.resolve(`../${command.category.name}/${command.name}.js`)];
            } catch {
                failed.push(command.name);
            }
        }

        this.client.commands.clear();
        this.client.aliases.clear();
        this.client.globalRatelimit.clear();

        this.client.init(["events", "connect"]).then(() => {
            return message.channel.createMessage(`${Constants.CustomEmojis
                .CHECKMARK} Reloaded all commands.${failed.length
                ? `\n\nFailed commands: \`${failed.join("`, `")}\``
                : ""}`);
        });
    }

    async _reloadCategory(message, categoryName) {
        let commands = [...this.client.commands.filter((command) => command.category.name === categoryName).values()];
        let category = commands[0].category;

        for (const command of commands) {
            delete require.cache[require.resolve(`../${category.name}/${command.name}.js`)];
            this.client.commands.delete(command.name);

            for (const alias of command.aliases) {
                this.client.aliases.delete(alias);
            }
        }

        const commandFiles = await fs.readdir(`src/commands/${categoryName}/`);

        for (const commandFile of commandFiles) {
            let command = new (require(`../${categoryName}/${commandFile}`))(this.client, commandFile, category);

            this.client.commands.set(command.name, command);

            for (const alias_1 of command.aliases) {
                this.client.aliases.set(alias_1, command.name);
            }
        }

        return message.channel.createMessage(`${Constants.CustomEmojis
            .CHECKMARK} Reloaded category \`${categoryName}\`.`);
    }

    async _reloadCommand(message, command) {
        let hasSubcommands = command.subcommands.size;

        delete require.cache[require.resolve(`../${command.category.name}/${command.name}.js`)];
        this.client.commands.delete(command.name);

        for (const alias of command.aliases) {
            this.client.aliases.delete(alias);
        }

        for (const [subcommand] of command.subcommands) {
            let pathway = `../${command.category.name}/${command.name}/${subcommand}.js`;

            delete require.cache[require.resolve(pathway)];
        }

        command.subcommands.clear();
        command = new (require(`../${command.category.name}/${command
            .name}.js`))(this.client, `${command.name}.js`, command.category);

        this.client.commands.set(command.name, command);

        for (const alias of command.aliases) {
            this.client.aliases.set(alias, command.name);
        }

        if (hasSubcommands > 0) {
            let subcommands = await fs.readdir(`src/commands/${command.category.name}/${command.name}/`);

            for (const subcommandFile of subcommands) {
                let subcommand = new (require(`../${command.category.name}/${command
                    .name}/${subcommandFile}`))(this.client, command, subcommandFile);

                command.subcommands.set(subcommand.name, subcommand);
            }
        }

        return message.channel.createMessage(`${Constants.CustomEmojis
            .CHECKMARK} Reloaded command \`${command.name}\`.`);
    }

    _reloadSubcommand(message, command, subcommand) {
        let pathway = `../${command.category.name}/${command.name}/${subcommand.name}.js`;

        delete require.cache[require.resolve(pathway)];
        command.subcommands.delete(subcommand.name);

        subcommand = new (require(pathway))(this.client, command, `${subcommand.name}.js`);
        command.subcommands.set(subcommand.name, subcommand);

        return message.channel.createMessage(`${Constants.CustomEmojis
            .CHECKMARK} Reloaded subcommand \`${subcommand.name}\`.`);
    }
};