"use strict";

const { Subcommand, CommandError } = require("../../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<term>",
            description: "Search for a term.",
            requiredArgs: 1
        });
    }
  
    async run(message, args) {
        let terms = (await this._request(args.join(" "))).list;

        if (terms.length) {
            return this.client.commands.get("urbandictionary").result(message, terms);
        }

        return CommandError.ERR_NOT_FOUND(message, "term", args.join(" "));
    }

    _request(term) {
        return fetch("https://api.urbandictionary.com/v0/define?" +
        `term=${encodeURIComponent(term)}`).then(this.checkStatus);
    }
};