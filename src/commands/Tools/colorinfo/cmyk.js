"use strict";

const { Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<cmyk(cyan, magenta, yellow, key (black))>",
            description: "Displays color info from the CMYK color model.",
            requiredArgs: 1
        });
    }
  
    async run(message, args) {
        let command = this.client.commands.get("colorinfo");
        let colorInput = args.join(" ");
        let color = colorInput
            .match(/^(?:cmyk)?\(? *(\d{1,3}%?) *, *(\d{1,3}%?) *, *(\d{1,3}%?) *, *(\d{1,3}%?) *\)?$/i);

        if (color) {
            let colorCodes = color.slice(1);
            colorCodes.forEach((color, index) => {
                let colorNum = parseInt(color, 10);

                if (colorNum > 100) {
                    colorCodes[index] = "100%";
                } else if (colorNum < 0) {
                    colorCodes[index] = "0%";
                }

                if (!colorCodes[index].endsWith("%")) {
                    colorCodes[index] = `${colorNum}%`;
                }
            });

            let urlColor = `cmyk(${colorCodes.join(",")})`;

            return command._request(this.name, urlColor).then((colorData) => command.result(message, colorData));
        }

        return CommandError.ERR_INVALID_ARG_TYPE(message, colorInput, "CMYK color");
    }
};