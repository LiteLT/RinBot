"use strict";

const { Util, Command, Constants, ReactionCollector } = require("../../index.js");
const dateformat = require("dateformat");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "[term|random] (term)",
            description: "Search the Urban Dictionary.",
            requiredArgs: 1,
            aliases: ["urban", "ud"],
            flags: [{
                name: "noembed",
                description: "Sends the term info as plain text instead of an embed. This is " +
                "automatically selected if I do not have permission to `Embed Links`."
            }]
        });
    }

    async run(message, args) {
        return this.subcommands.get("term").run(message, args);
    }

    async result(message, definitions) {
        const baseURL = "https://www.urbandictionary.com/define.php?term=";
        let flags = Util.messageFlags(message, this.client);
        let sendType = this.sendType(message, flags);
        let msg = null;

        const output = (term, sendType, pageNumber) => {
            let ratio = term.thumbs_up / term.thumbs_down;
            const urbanDefinition = (def) => def.replace(/\[([^\]]+)\]/g, (_, word) => {
                return sendType === "embed"
                    ? `[${word}](${baseURL + encodeURIComponent(word)})`
                    : word;
            });

            if (sendType === "embed") {
                return {
                    embed: {
                        title: term.word,
                        url: term.permalink,
                        timestamp: new Date(term.written_on),
                        color: Util.base10(Constants.Colors.ORANGE),
                        description: urbanDefinition(term.definition).substring(0, Constants.Discord
                            .MAX_EMBED_DESCRIPTION_LENGTH),
                        footer: {
                            text: [
                                pageNumber ? `Page ${pageNumber}/${definitions.length}` : null,
                                `Votes: ${term.thumbs_up}/${term.thumbs_down} (${ratio === Infinity
                                    ? "∞"
                                    : ratio.toFixed(2)})`,
                                `Submitted by ${term.author}`
                            ].filter((value) => value !== null).join(" | ")
                        },
                        fields: term.example ? [{
                            name: "Example",
                            value: Util.stringLimit(urbanDefinition(term.example), Constants.Discord
                                .MAX_EMBED_FIELD_VALUE_LENGTH)
                        }] : []
                    }
                };
            } else if (sendType === "plain") {
                return (`**${term.word}**\n${urbanDefinition(term.definition)}\n\n` + (term.example
                    ? `**Example**\n${urbanDefinition(term.example)}\n\n`
                    : "") + [
                    pageNumber ? `Page: **${pageNumber}**/**${definitions.length}**` : null,
                    `Votes: **${term.thumbs_up}**/**${term.thumbs_down}** (**${ratio === Infinity
                        ? "∞"
                        : ratio.toFixed(2)}**)`,
                    `Submitted By: \`${term.author}\``,
                    `Submission Date: **${dateformat(term.written_on, "mmmm dS, yyyy")}**`
                ].filter((str) => str !== null).map((str) => `» ${str}`).join("\n"))
                    .substring(0, 2000);
            }
        };

        msg = await message.channel.createMessage(output(definitions[0], sendType));

        if (definitions.length > 1 &&
            Util.hasChannelPermission(msg.channel, this.client.user, "addReactions")) {
            let emojis = [
                Constants.Emojis.TRACK_PREVIOUS,
                Constants.Emojis.ARROW_BACKWARDS,
                Constants.Emojis.ARROW_FORWARD,
                Constants.Emojis.TRACK_NEXT,
                Constants.Emojis.STOP_BUTTON,
                Constants.Emojis.ONE_TWO_THREE_FOUR
            ];

            try {
                for (const emoji of emojis) {
                    await Util.sleep(1000);
                    await msg.addReaction(emoji);
                }
            } catch (ex) {
                if (ex.code === 10008 || ex.code === 30010 ||
                    ex.code === 50013 || ex.code === 90001) {
                    if (Util.hasChannelPermission(msg.channel, this.client
                        .user, "manageMessages")) {
                        msg.removeReactions().catch(() => {});
                    }
                  
                    return;
                }
            }

            let pageNumber = 1;
            let isAwaitingResponse = false;
            let collector = new ReactionCollector(this.client, (_msg, emoji, userID) => {
                return userID === message.author.id && emojis.includes(emoji.name);
            }, {
                time: 300000,
                messageID: msg.id,
                allowedTypes: ["ADD"],
                restartTimerOnCollection: true
            });

            collector.on("reactionAdd", async (msg, emoji, userID) => {
                if (message.channel.guild &&
                    message.channel.permissionsOf(this.client.user.id).has("manageMessages")) {
                    msg.removeReaction(emoji.name, userID);
                }

                if (isAwaitingResponse) {
                    return;
                }

                switch (emoji.name) {
                    case Constants.Emojis.TRACK_PREVIOUS: {
                        if (pageNumber === 1) {
                            return;
                        }
                      
                        pageNumber = 1;
                        break;
                    }
                    
                    case Constants.Emojis.ARROW_BACKWARDS: {
                        if (pageNumber === 1) {
                            return;
                        }
                        
                        pageNumber -= 1;
                        break;
                    }
                    
                    case Constants.Emojis.ARROW_FORWARD: {
                        if (pageNumber === definitions.length) {
                            return;
                        }
                      
                        pageNumber += 1;
                        break;
                    }
                    
                    case Constants.Emojis.TRACK_NEXT: {
                        if (pageNumber === definitions.length) {
                            return;
                        }

                        pageNumber = definitions.length;
                        break;
                    }
                    
                    case Constants.Emojis.STOP_BUTTON: {
                        return collector.stop("stop");
                    }

                    case Constants.Emojis.ONE_TWO_THREE_FOUR: {
                        isAwaitingResponse = true;
                        let text = `What page would you like to jump to (1 - ${definitions
                            .length})?`;
                        let response = await Util.messagePrompt(message, msg.channel, this
                            .client, text, 30000, [...Array(definitions.length + 1).keys()]
                            .slice(1)).catch(() => null);

                        isAwaitingResponse = false;

                        if (response === null) {
                            return;
                        }

                        let newPage = parseInt(response.content, 10);

                        if (pageNumber === newPage) {
                            return;
                        }

                        pageNumber = newPage;
                        break;
                    }
                    
                    default: {
                        return;
                    }
                }

                return msg.edit(output(definitions[pageNumber - 1], this
                    .sendType(message, flags), pageNumber));
            });

            collector.once("end", async (_collected, reason) => {
                if (reason === "cache") {
                    try {
                        msg = await msg.channel.getMessage(msg.id);
                    } catch {
                        return;
                    }
                }

                msg.removeReactions().catch(() => {});
            });
        }
    }

    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel
            .permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }


        return "plain";
    }
};