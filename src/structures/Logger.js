"use strict";

const dateformat = require("dateformat");
const { inspect } = require("util");
const chalk = require("chalk");

/**
 * Represents the utility class for logging messages to the console.
 */
class Logger {
    /**
     * @param {Number} [time=null] The timestamp in milliseconds.
     */
    constructor(time = null) {
        this.timestamp = time;
    }

    /**
     * Get the formatted time.
     * @returns {String} The formatted time to use as a prefix.
     * @readonly
     */
    get time() {
        return `[${dateformat(this.timestamp || Date.now(), "mediumTime")}]`;
    }

    /**
     * Logs a message to `stdout`. The default color is used.
     * @param {...*} args Arguments to pass to `console.log`.
     * @returns {void}
     */
    log(...args) {
        console.log(`${this.time} ${this.constructor.clean(args)}`);
    }

    /**
     * Logs a message to `stdout`. The color is cyan.
     * @param {...*} args Arguments to pass to `console.info`.
     * @returns {void}
     */
    info(...args) {
        console.info(chalk.cyan(`${this.time} ${this.constructor.clean(args)}`));
    }

    /**
     * Logs a message to `stdout`. The color is green.
     * @param {...*} args Arguments to pass to `console.debug`.
     * @returns {void}
     */
    debug(...args) {
        console.debug(chalk.green(`${this.time} ${this.constructor.clean(args)}`));
    }

    /**
     * Logs a message to `stderr`. The color is yellow and prefixed with `[WARN]`.
     * @param {...*} args Arguments to pass to `console.warn`.
     * @returns {void}
     */
    warn(...args) {
        console.warn(chalk.yellow(`${this.time} ${chalk.underline("[WARN]")} ${this.constructor.clean(args)}`));
    }

    /**
     * Logs a message to `stderr`. The color is green and prefixed with `ERR!`
     * @param {...*} args Arguments to pass to `console.error`.
     * @returns {void}
     */
    error(...args) {
        console.error(chalk.redBright(`${this.time} ${chalk.underline("ERR!")} ${this
            .constructor.clean(args)}`));
    }

    /**
     * Sanitizes a message to log to the standard output/error.
     * @param {Array<*>} args The message to sanitize.
     * @returns {String} The message joined with a space.
     * @static
     */
    static clean(args) {
        return args.map((argument) => {
            if (argument instanceof Error) {
                return argument.stack;
            } else if (typeof argument !== "string") {
                return inspect(argument);
            }

            return argument;
        }).join(" ");
    }
}

module.exports = Logger;