"use strict";

const {
    Util,
    Constants,
    Endpoints,
    Subcommand,
    CommandError,
    ReactionCollector
} = require("../../../index.js");
const fetch = require("node-fetch");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<...search>",
            description: "Search for a character.",
            requiredArgs: 1
        });
    }
  
    async run(message, args) {
        const flags = Util.messageFlags(message, this.client);
        let query = `
        query CharacterData($search: String!, $perPage: Int!, $plain: Boolean!) {
            Page(perPage: $perPage) {
                characters(search: $search) {
                    siteUrl
                    favourites
                    description(asHtml: false)
                    image @skip(if: $plain) { large }
                    name { full native alternative }
                    media @skip(if: $plain) {
                        edges {
                            voiceActors { siteUrl name { full native } }
                            node { type siteUrl title { english romaji native } }
                        }
                    }
                }
            }
        }`;

        let sendType = this.sendType(message, flags);
        let variables = {
            search: args.join(" "),
            perPage: flags.all ? 10 : 1,
            plain: sendType === "plain"
        };

        let characterData = (await this._request(query, variables)).data.Page.characters;
        let character = null;

        if (characterData.length) {
            if (flags.all) {
                character = await this.prompt(message, flags, characterData, variables.search);
            } else {
                [character] = characterData;
            }
        } else {
            return CommandError.ERR_NOT_FOUND(message, "character", args.join(" "));
        }

        if (character) {
            character.siteUrl += `/${character.name.full.replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}`;

            if (!message.channel.nsfw && !variables.plain) {
                character.media.edges = character.media.edges
                    .filter(({ node: media }) => !media.isAdult);
            }

            return this.result(message, flags, character, sendType);
        }
    }

    async result(message, flags, character, sendType) {
        if (this.sendType(message, flags) !== sendType) {
            return; // Noop.
        }

        let embedTemplate = {
            url: character.siteUrl,
            title: character.name.alternative.join(", "),
            color: Util.base10(Constants.Colors.ANILIST),
            thumbnail: sendType === "embed"
                ? { url: character.image.large }
                : null,
            author: { url: character.siteUrl, name: this.personName(character.name) }
        };
        let msg = null;

        if (sendType === "embed") {
            msg = await message.channel.createMessage({
                embed: {
                    ...embedTemplate,
                    description: character.description && Util.stringLimit(this
                        .parseALMarkdown(character.description, {
                            linebreak: "toHTML",
                            spoilers: "snip"
                        }), Constants.Discord.MAX_EMBED_DESCRIPTION_LENGTH),
                    fields: character.favourites ? [{
                        name: "Attributes",
                        value: `Favorites: **${Util.commaify(character.favourites)}**`
                    }] : null
                }
            });
        } else if (sendType === "plain") {
            let header = `__**${embedTemplate.author.name}**__ (<${embedTemplate.author.url}>)\n`;
            let description = character.description && this.parseALMarkdown(character.description, {
                linebreak: "toHTML",
                spoilers: "snip"
            }) + "\n";
            let footer = `\nFavorites: **${Util.commaify(character.favourites)}**`;
            let content = header + Util.stringLimit(description || "", Constants.Discord
                .MAX_MESSAGE_LENGTH - header.length - footer.length) + footer;

            return message.channel.createMessage(content);
        }

        if (Util.hasChannelPermission(msg.channel, this.client.user, "addReactions")) {
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

            let bulletChar = "»";
            let emdash = "—";
            let pageNumber = 1;
            let isAwaitingResponse = false;
            let pageLayouts = [
                {
                    ...msg.embeds[0],
                    author: { name: `${embedTemplate.author.name} > Overview` }
                },
                character.media.edges.length ? {
                    ...embedTemplate,
                    author: { name: `${embedTemplate.author.name} > Overview` },
                    fields: Util.arrayUnique(character.media.edges.map((edge) => edge.node.type))
                        .map((type) => ({
                            name: Util.toTitleCase(type),
                            value: Util.arrayJoinLimit(character.media.edges
                                .filter((edge) => edge.node.type === type)
                                .map(({ node: media, voiceActors: [staff] }) => {
                                    return `${bulletChar} [${this.mediaTitle(media.title)}](${media
                                        .siteUrl})${staff
                                        ? ` ${emdash} [${this.personName(staff.name)}](${staff
                                            .siteUrl})`
                                        : ""}`;
                                }), "\n", Constants.Discord.MAX_EMBED_FIELD_VALUE_LENGTH)
                        }))
                } : null
            ].filter((field) => field !== null);

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
                        if (pageNumber === pageLayouts.length) {
                            return;
                        }
                      
                        pageNumber += 1;
                        break;
                    }
                    
                    case Constants.Emojis.TRACK_NEXT: {
                        if (pageNumber === pageLayouts.length) {
                            return;
                        }

                        pageNumber = pageLayouts.length;
                        break;
                    }
                    
                    case Constants.Emojis.STOP_BUTTON: {
                        return collector.stop("stop");
                    }

                    case Constants.Emojis.ONE_TWO_THREE_FOUR: {
                        isAwaitingResponse = true;
                        let text = `What page would you like to jump to (1 - ${pageLayouts
                            .length})?`;
                        let response = await Util.messagePrompt(message, msg.channel, this
                            .client, text, 30000, [...Array(pageLayouts.length + 1).keys()]
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

                let page = pageLayouts[pageNumber - 1];
                page.footer = { text: `Page ${pageNumber}/${pageLayouts.length}` };

                return msg.edit({ embed: page });
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

    async prompt(message, flags, characters, search) {
        let sendType = this.sendType(message, flags);
        let emdash = "—";
        let prefix = `Search Results ${emdash} `;
        let content = sendType === "embed"
            ? {
                embed: {
                    color: Util.base10(Constants.Colors.ANILIST),
                    title: prefix + `"${search.substring(0, Constants.Discord
                        .MAX_EMBED_TITLE_LENGTH - prefix.length - 2)}"`,
                    description: characters.map((char, index) => {
                        return `**${index + 1}.** [${this.personName(char.name)
                            .replace(/\[|\]/g, (str) => `\\${str}`)}](${char.siteUrl})`;
                    }).join("\n"),
                    footer: {
                        text: `Select a number between 1 and ${characters.length}.`
                    }
                }
            }
            : `__**${prefix}"${search.substring(0, Constants.Discord.MAX_EMBED_TITLE - prefix
                .length - 2)}"**__\n` + characters.map((char, index) => {
                return `**${index + 1}.** ${this.personName(char.name)} (<${char.siteUrl}>)`;
            }).join("\n") + `\n\nSelect a number between 1 and ${characters.length}.`;

        let msg = await Util.messagePrompt(message, message.channel, this
            .client, content, 30000, [...Array(characters.length + 1).keys()].slice(1))
            .catch(() => null);

        if (msg === null) {
            return null;
        }

        return characters[parseInt(msg.content, 10) - 1];
    }

    mediaTitle(title) {
        return title.english || title.romaji || title.native || "?";
    }

    personName(name) {
        let cleanName = "";

        if (name.full) {
            cleanName = name.full.trim();
        }

        if (name.native) {
            if (cleanName) {
                cleanName += ` (${name.native.trim()})`;
            } else {
                cleanName = name.native.trim();
            }
        }

        return cleanName || "?";
    }
    
    sendType(message, flags) {
        if (!flags.noembed && (!message.channel.guild || message.channel
            .permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }
        
        
        return "plain";
    }

    _request(query, variables) {
        return fetch(Endpoints.ANILIST_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({ query, variables })
        }).then(this.checkStatus);
    }
};