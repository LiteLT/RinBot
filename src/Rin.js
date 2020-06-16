"use strict";

const { promises: fs } = require("fs");
const { Client } = require("eris");
const Collection = require("./structures/Collection.js");
const Logger = require("./structures/Logger.js");

/**
 * @typedef {import("sqlite").Database} Database
 * @typedef {import("./structures/Command.js")} Command
 * @typedef {import("./structures/MessageCollector.js")} MessageCollector
 * @typedef {import("./structures/ReactionCollector.js")} ReactionCollector
 */
/**
 * @typedef {Object} GuildSettingsData
 * @property {Array<String>} [prefixes] An array of prefixes. `null` if the guild has no configured prefixes.
 * @property {Object} categories The guild settings for guild categories.
 * @property {Array<Eris.CategoryChannel.id>} categories.disabled An array of disabled category channel IDS.
 * @property {Object} commands The guild settings for commands.
 * @property {Array<String>} commands.disabled An array of disabled commands by their name.
 * @property {Object} subcommands The guild settings for command subcommands.
 * @property {Array<String>} subcommands.disabled An array of disabled subcommands by the command name and
 * subcommand name (`command.subcommand`).
 * @property {Object} moderation Configuration for mod-only commands.
 * @property {Array<Eris.Role.id>} moderation.roles An array of mod roles mapped by their IDs.
 * @property {Eris.TextChannel.id} [moderation.channel] The channel to log moderator actions.
 */
/**
 * Represents an extended class of the Rin class from Eris.
 * @extends {Eris.Client}
 */
class Rin extends Client {
    /**
     * @param {String} token The Discord token.
     * @param {Object} erisOptions The Eris options for the client.
     */
    constructor(token, erisOptions) {
        super(token, erisOptions);

        /**
         * The logger to send messages to the console.
         * @type {Logger}
         */
        this.logger = new Logger();

        /**
         * The global rate limit list to prevent abuse across multiple commands.
         * @type {Set<String>}
         */
        this.globalRatelimit = new Set();

        /**
         * A collection of commands.
         * @type {Collection<String, Command>}
         */
        this.commands = new Collection();

        /**
         * A collection of aliases to point to a command.
         * @type {Collection<String, String>}
         */
        this.aliases = new Collection();

        /**
         * A collection of settings per guild.
         * @type {Collection<String, GuildSettingsData>}
         */
        this.guildSettings = new Collection();

        /**
         * A list of active monitors for messages.
         * @type {Set<MessageCollector>}
         */
        this.messageMonitors = new Set();

        /**
         * A list of active monitors for reactions.
         * @type {Set<ReactionCollector>}
         */
        this.reactionMonitors = new Set();

        /**
         * The database attached to the client. At the moment, it's an SQLite3 database.
         * @type {?Database}
         */
        this.db = null;
    }

    /**
     * Loads all commands in the `src/commands` directory, including its aliases and subcommands.
     * @returns {Promise<Rin>} The client instance for chaining.
     */
    async loadCommands() {
        let categories = (await fs.readdir("src/commands/")).sort((_a, b) => b.endsWith(".js") ? 1 : -1);
        let categoryList = {};

        for (const category of categories) {
            if (category.endsWith(".js")) {
                let name = category.replace(/\.js$/, "");
                categoryList[name] = new (require(`./commands/${category}`))(name);

                continue;
            }

            let categoryData = categoryList[category];
            let commands = (await fs.readdir(`src/commands/${category}/`)).sort((_a, b) => b.endsWith(".js") ? 1 : -1);

            for (const commandFile of commands) {
                if (commandFile.endsWith(".js")) {
                    let command = new (require(`./commands/${category}/` +
                    commandFile))(this, commandFile, categoryData);
                    this.commands.set(command.name, command);

                    for (const alias of command.aliases) {
                        this.aliases.set(alias, command.name);
                    }
                } else {
                    let subcommands = await fs.readdir(`src/commands/${category}/${commandFile}/`);

                    for (const subcommandFile of subcommands) {
                        let command = this.commands.get(commandFile.replace(".js", ""));
                        let subcommand = new (require(`./commands/${category}/${commandFile}/` +
                        subcommandFile))(this, command, subcommandFile);

                        // noinspection JSValidateTypes
                        command.subcommands.set(subcommand.name, subcommand);
                    }
                }
            }
        }

        return this;
    }

    /**
     * Loads all events in the `src/events/` directory.
     * @returns {Promise<Rin>} The client instance.
     */
    async loadEvents() {
        const events = { process, client: this };
        let categories = await fs.readdir("src/events/");

        for (const category of categories) {
            let eventFiles = await fs.readdir(`src/events/${category}`);

            for (const eventFile of eventFiles) {
                let eventEmitter = events[category];
                let event = new (require(`./events/${category}/${eventFile}`))(this, eventEmitter, eventFile);

                if (event.enabled) {
                    eventEmitter[event.once ? "once" : "on"](event.eventName, (...args) => event.run(...args));
                }
            }
        }

        return this;
    }

    /**
     * Initializes the client by loading its commands, events and connecting to Discord.
     * @param {Array<"commands" | "events" | "connect">} disabled An array of each module loadable to disable.
     * @returns {Promise<Rin>} The client instance.
     */
    async init(disabled = []) {
        if (!disabled.includes("commands")) {
            await this.loadCommands();
        }

        if (!disabled.includes("events")) {
            await this.loadEvents();
        }

        if (!disabled.includes("connect")) {
            await this.connect();
        }

        return this;
    }

    /**
     * Gracefully close the client, optionally closing the process.
     * @param {Number} [code=0] The optional code to use when closing the process. If no code is passed, the process
     * will exit.
     * @returns {Promise<void>} Undefined when the process is not closed, or nothing (as you can't use it once the
     * process has been closed).
     */
    async gracefulExit(code = 0) {
        this.commands.clear();
        this.aliases.clear();
        this.removeAllListeners();

        if (this.ready) {
            this.disconnect({ reconnect: false }); // Why does this not return a promise?
        }

        if (this.server) {
            await this.server.close().catch((err) => this.logger.error(err));
        }

        if (this.db) {
            await this.db.close().catch((err) => this.logger.error(err));
        }

        if (typeof code === "number") {
            return process.exit(code);
        }
    }
}

module.exports = Rin;