"use strict";

const { Subcommand, CommandError } = require("../../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, { description: "Get a bunch of random terms and definitions." });
    }
  
    async run(message) {
        let terms = (await this._request()).list;

        if (terms.length) {
            return this.client.commands.get("urbandictionary").result(message, terms);
        }

        return CommandError.ERR_NOT_FOUND(message, "Could not find any definitions.");
    }

    _request() {
        return fetch("https://api.urbandictionary.com/v0/random").then(this.checkStatus);
    }
};