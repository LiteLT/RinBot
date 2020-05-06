"use strict";

const { promises: fs } = require("fs");
const { Client } = require("eris");
const Collection = require("./structures/Collection.js");
// const Schedule = require("./structures/Schedule.js");
const Logger = require("./structures/Logger.js");

/**
 * @typedef {Rin} Client
 * @typedef {import("./structures/MessageCollector.js")} MessageCollector
 * @typedef {import("./structures/ReactionCollector.js")} ReactionCollector
 */
/**
 * Represents an extended class of the Client class from Eris.
 * @property {Logger} logger The logger instance for sending output to the console.
 * @property {Set} globalRatelimit The global ratelimit on the bot to prevent users from spamming.
 * @property {Collection} commands The command collection with the name being the key, and the command instance being
 * the value.
 * @property {Collection} aliases The alias collection with the name being the key, and the command being the value.
 * @property {Collection<String, Array<String>>} guildPrefixes A list of guild prefixes with the guild ID being the key,
 * and an array of strings being the value. The array can be blank if the guild holds no prefixes.
 * @property {Set<MessageCollector>} messageMonitors All the messages being monitored.
 * @property {Set<ReactionCollector>} reactionMonitors All the reactions being monitored.
 */
class Rin extends Client {
    /**
     * Initializes the client.
     * @param {String} token The Discord token.
     * @param {Object} erisOptions The Eris options for the client.
     */
    constructor(token, erisOptions) {
        super(token, erisOptions);
        
        this.logger = new Logger();
        this.globalRatelimit = new Set();
        this.commands = new Collection();
        this.aliases = new Collection();
        this.guildSettings = new Collection();
        this.messageMonitors = new Set();
        this.reactionMonitors = new Set();
    }
  
    /**
     * Loads all commands in the `src/commands` directory, including its aliases and subcommands.
     * @returns {this} The client instance.
     */
    async loadCommands() {
        let categories = await fs.readdir("src/commands/");
      
        for (const category of categories) {
            let commands = (await fs.readdir(`src/commands/${category}/`)).sort((a, b) => b.endsWith(".js") ? 1 : -1);
          
            for (const commandFile of commands) {
                if (commandFile.endsWith(".js")) {
                    let command = new (require(`./commands/${category}/${commandFile}`))(this, commandFile, category);
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
                      
                        command.subcommands.set(subcommand.name, subcommand);
                    }
                }
            }
        }
      
        return this;
    }
  
    /**
     * Loads all events in the `src/events/` directory.
     * @returns {this} The client instance.
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
     * @returns {this} The client instance.
     */
    async init(disabled = []) {
        if (!disabled.includes("commands")) {
            this.loadCommands();
        }
      
        if (!disabled.includes("events")) {
            this.loadEvents();
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