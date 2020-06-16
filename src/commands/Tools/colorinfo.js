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

    /**
     * Runs the command.
     * @param {Eris.Message} message The message the command was called on.
     * @param {Array<String>} args Arguments passed to the command.
     */
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

        return CommandError.ERR_INVALID_ARG_TYPE(message, colorInput, "hex, RGB, HSLr or CMYK color");
    }

    /**
     * Sends the result of the command back to the user.
     * @param {Eris.Message} message The message the command was called on.
     * @param {Object} color The color data.
     * @return {Promise<Eris.Message>} The newly created message sent to the user.
     */
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

    /**
     * Checks the type of message the bot should send to the channel.
     * @param {Eris.Message} message The message to reference.
     * @param {Object<String, String>} flags An object of flags passed as semi-arguments.
     * @return {"embed" | "plain"} A string telling the type of message to send.
     */
    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel.permissionsOf(this.client.user.id)
            .has("embedLinks"))) {
            return "embed";
        }

        return "plain";
    }

    /**
     * Converts a normal array of color codes to their proper color.
     * @param {"hsl" | "cmyk"} type The type of color code.
     * @param {Array<String>} codes The color codes.
     * @return {Array<String>} The new array.
     */
    transformColorCodes(type, codes) {
        return codes.map((color, index) => {
            let colorNum = parseInt(color, 10);

            if (type === "hsl") {
                if (colorNum <= 0) {
                    return "0%";
                } else if (index === 0) {
                    if (colorNum >= 360) {
                        return "360";
                    }

                    return color;
                }
            } else if (type === "cmyk") {
                if (colorNum > 100) {
                    return "100%";
                } else if (colorNum < 0) {
                    return "0%";
                }
            }

            if (!color.endsWith("%")) {
                return `${colorNum}%`;
            }

            return color;
        });
    }

    /**
     * Sends a request to the color API.
     * @param {"hex" | "rgb" | "hsl" | "cmyk"} type The type of color it is.
     * @param {String} urlColor The color for the
     * @return {Promise<Object>} The color data.
     * @private
     */
    _request(type, urlColor) {
        return fetch(Endpoints.THE_COLOR_API_ID(type, urlColor)).then(this.checkStatus);
    }
};