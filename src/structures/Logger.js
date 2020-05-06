"use strict";

const dateformat = require("dateformat");
const { inspect } = require("util");
const chalk = require("chalk");

/**
 * Represents the utility class for logging input to the console.
 */
class Logger {
    /**
     * Initialize the logger.
     * @param {Number} time The timestamp in milliseconds.
     */
    constructor(time) {
        this.timestamp = time;
    }
  
    /**
     * Get the formatted time.
     * @returns {String} The formatted time to use as a prefix.
     */
    get time() {
        return `[${dateformat(this.timestamp || Date.now(), "mediumTime")}]`;
    }
  
    /**
     * Log something to the standard output.
     * @param {...any} args Arguments to pass.
     * @returns {void} Nothing.
     */
    log(...args) {
        console.log(`${this.time} ${this.constructor.clean(args)}`);
    }
  
    /**
     * Log something to the standard output. Similar to `<Logger>.log`, but logs it in cyan.
     * @param {...any} args Arguments to pass.
     * @returns {void} Nothing.
     */
    info(...args) {
        console.info(chalk.cyan(`${this.time} ${this.constructor.clean(args)}`));
    }
  
    /**
     * Log something to the standard output. Similar to `<Logger>.log`, but logs it in green.
     * @param {...any} args Arguments to pass.
     * @returns {void} Nothing.
     */
    debug(...args) {
        console.debug(chalk.green(`${this.time} ${this.constructor.clean(args)}`));
    }
  
    /**
     * Logs something to the standard error. This is similiar to `<Logger>.error`,
     * but it's in yellow and has a [WARN] prefix before it.
     * @param {...any} args Arguments to pass.
     * @returns {void} Nothing.
     */
    warn(...args) {
        console.warn(chalk.yellow(`${this.time} ${chalk.underline("[WARN]")} ${this
            .constructor.clean(args)}`));
    }
  
    /**
     * Logs something to the standard error.
     * @param {...any} args Arguments to pass.
     * @returns {void} Nothing.
     */
    error(...args) {
        console.error(chalk.redBright(`${this.time} ${chalk.underline("ERR!")} ${this
            .constructor.clean(args)}`));
    }
  
    /**
     * Sanitize input for the console.
     * @static
     * @param {Array<any>} args Arguments to pass.
     * @returns {String} A joined string of arguments.
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