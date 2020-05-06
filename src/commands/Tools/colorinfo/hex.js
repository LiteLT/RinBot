"use strict";

const { Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<hex>",
            description: "Displays color info from a hex color code.",
            requiredArgs: 1
        });
    }
  
    async run(message, args) {
        let command = this.client.commands.get("colorinfo");
        let colorInput = args.join(" ");
        let color = colorInput.match(command.hexRegex);

        if (color) {
            let urlColor = colorInput.replace("#", "");

            return command._request(this.name, urlColor).then((colorData) => command.result(message, colorData));
        }

        return CommandError.ERR_INVALID_ARG_TYPE(message, colorInput, "HEX color");
    }
};