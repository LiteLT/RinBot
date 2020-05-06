"use strict";

const { Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<rgb(red, green, blue)>",
            description: "Displays color info from the RGB color model.",
            requiredArgs: 1
        });
    }
  
    async run(message, args) {
        let command = this.client.commands.get("colorinfo");
        let colorInput = args.join(" ");
        let color = args.join(" ").match(/^(?:rgb)?\(? *(\d{1,3}) *, *(\d{1,3}) *, *(\d{1,3}) *\)?$/i);

        if (color) {
            let colorCodes = color.slice(1);
            colorCodes.forEach((color, index) => {
                let colorNum = parseInt(color, 10);

                if (colorNum > 255) {
                    colorCodes[index] = "255";
                } else if (colorNum < 0) {
                    colorCodes[index] = "0";
                }
            });
            let urlColor = `rgb(${colorCodes.join(",")})`;

            return command._request(this.name, urlColor).then((colorData) => command.result(message, colorData));
        }

        return CommandError.ERR_INVALID_ARG_TYPE(message, colorInput, "RGB color");
    }
};