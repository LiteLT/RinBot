"use strict";

const { Subcommand } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "",
            description: "",
            fullDescription: "",
            requiredArgs: 0,
            enabled: true
        });
    }
  
    async run(message, args) {
        
    }
};