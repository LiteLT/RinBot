"use strict";

const { Util, Command, Endpoints, CommandError } = require("../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "(hex|rgb|hsl|cmyk) (color)",
            description: "Get color info.",
            fullDescription: "By default, this command will check all supported color formats and guess which one " +
            "matches. You are not required to add the subcommand before it (e.g., `colorinfo #FFFFFF`).",
            cooldown: 5,
            requiredArgs: 1,
            aliases: ["color", "ci"],
            flags: [{
                name: "noembed",
                description: "Sends the info in plain text rather than embed. This is automatically selected if I do " +
                "not have permission to `Embed Links`."
            }]
        });

        this.hexRegex = /^#?((?:[a-f0-9]{3}){1,2})$/i;
    }

    async run(message, args) {
        let colorRegex = [
            {
                name: "hex",
                regex: this.hexRegex
            },
            {
                name: "rgb",
                regex: /^(?:rgb)\( *(\d{1,3}) *, *(\d{1,3}) *, *(\d{1,3}) *\)$/i
            },
            {
                name: "hsl",
                regex: /^(?:hsl)\( *(\d{1,3}) *, *(\d{1,3}%?) *, *(\d{1,3}%?) *\)$/i
            },
            {
                name: "cmyk",
                regex: /^(?:cmyk)\( *(\d{1,3}%?) *, *(\d{1,3}%?) *, *(\d{1,3}%?) *, *(\d{1,3}%?) *\)$/i
            }
        ];

        let colorInput = args.join(" ");
        let color = colorRegex.find((color) => color.regex.test(colorInput));

        if (color) {
            switch (color.name) {
                case "hex": {
                    color.urlColor = colorInput.replace("#", "");
                    break;
                }

                case "rgb": {
                    let colorCodes = colorInput.match(color.regex).slice(1);
                    colorCodes.forEach((color, index) => {
                        let colorNum = parseInt(color, 10);

                        if (colorNum > 255) {
                            colorCodes[index] = "255";
                        } else if (colorNum < 0) {
                            colorCodes[index] = "0";
                        }
                    });

                    color.urlColor = `rgb(${colorCodes.join(",")})`;
                    break;
                }

                case "hsl": {
                    let colorCodes = colorInput.match(color.regex).slice(1);
                    colorCodes.forEach((color, index) => {
                        let colorNum = parseInt(color.replace("%", ""), 10);
                        
                        if (index === 0) {
                            if (colorNum > 360) {
                                colorCodes[index] = "360";
                            } else if (colorNum < 0) {
                                colorCodes[index] = "0";
                            }
                        } else {
                            if (colorNum > 100) {
                                colorCodes[index] = "100%";
                            } else if (colorNum < 0) {
                                colorCodes[index] = "0%";
                            }
                            
                            if (!colorCodes[index].endsWith("%")) {
                                colorCodes[index] = `${colorNum}%`;
                            }
                        }
                    });

                    color.urlColor = `hsl(${colorCodes.join(",")})`;
                    break;
                }

                case "cmyk": {
                    let colorCodes = colorInput.match(color.regex).slice(1);
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

                    color.urlColor = `cmyk(${colorCodes.join(",")})`;
                    break;
                }
            }

            return this._request(color.name, color.urlColor).then((colorData) => this.result(message, colorData));
        }

        return CommandError.ERR_INVALID_ARG_TYPE(message, colorInput, "hex, RGB, HLS or CMYK color");
    }

    result(message, color) {
        let flags = Util.messageFlags(message, this.client);
        let sendType = this.sendType(message, flags);
        let description = [
            `Hex: **${color.hex.value}**`,
            `RGB: (**${[color.rgb.r, color.rgb.g, color.rgb.b].join(", ")}**)`,
            `CMYK: (**${[
                `${color.cmyk.c || 0}%`,
                `${color.cmyk.m || 0}%`,
                `${color.cmyk.y || 0}%`,
                `${color.cmyk.k || 0}%`
            ].join(", ")}**)`,
            `XYZ: (**${[color.XYZ.X, color.XYZ.Y, color.XYZ.Z].join(", ")}**)`,
            [
                `HSL: (**${[color.hsl.h, `${color.hsl.s}%`, `${color.hsl.l}%`].join(", ")}**)`,
                `HSV: (**${[color.hsv.h, `${color.hsv.s}%`, `${color.hsv.v}%`].join(", ")}**)`
            ].join(" | ")
        ].join("\n");

        if (sendType === "embed") {
            let embedColor = Util.base10(color.hex.clean);

            if (embedColor === 0xFFFFFF) { // Discord likes to render full white as full black.
                embedColor = 0xFFFFFE;
            }

            return message.channel.createMessage({
                embed: {
                    description,
                    color: embedColor,
                    title: color.name.value,
                    thumbnail: {
                        url: Endpoints.DUMMY_IMAGE_IMAGE(color.hex.clean, encodeURIComponent(color.name.value))
                    }
                }
            });
        } else if (sendType === "plain") {
            let content = `__**${color.name.value}**__\n${description}`;

            return message.channel.createMessage(content);
        }
    }

    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel.permissionsOf(this.client.user.id)
            .has("embedLinks"))) {
            return "embed";
        }
        
        return "plain";
    }

    _request(type, urlColor) {
        return fetch(Endpoints.THE_COLOR_API_ID(type, urlColor)).then(this.checkStatus);
    }
};