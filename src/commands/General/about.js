"use strict";

const { version, repository: { url: repositoryURL } } = require("../../../package.json");
const { Util, Command, Constants } = require("../../index.js");
const Eris = require("eris");
const lessons = new Set();

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            description: "Get info about me.",
            fullDescription: `Want to learn how to use the bot in style? Take the interactive lesson (\`${Constants
                .PRIMARY_PREFIX}about --learn\`)!`,
            cooldown: 15,
            aliases: ["aboutme", "botinfo"],
            validatePermissions: (message) => lessons.has(message.author.id)
                ? "You're currently in Interactive Lesson mode. You must cancel (type \"cancel\") or complete the " +
                "lesson before using the `about` command."
                : true,
            flags: [
                {
                    name: "noembed",
                    description: "Sends the about information in plain text instead of an embed. This is " +
                        "automatically selected if I do not have permission to `Embed Links`."
                },
                {
                    name: "learn",
                    description: "Activates the interactive lesson stage."
                }
            ]
        });
    }

    async run(message) {
        let flags = Util.messageFlags(message, this.client);

        if (flags.learn) {
            return this.learn(message, flags.noembed);
        }

        let sendType = this.sendType(message, flags.noembed);
        let botOwner = await this.client.getRESTUser(Constants.BOT_OWNER);
        let description = `${this.client.user.username} is a private assistant meant to aid you in your Discord ` +
            "experience. My name and origins are unknown, but purpose has been defined to make cruel tasks easy. If " +
            `you seek my assistance in a server of yours, contact my owner, **${Util.userTag(botOwner)}**.`;
        let stats = [
            `${Constants.Emojis.BOOK} Library: **Eris v${Eris.VERSION}**`,
            `${Constants.Emojis.COMPUTER} Servers: **${Util.commaify(this.client.guilds.size)}**`,
            `${Constants.Emojis.WOMAN_TIPPING_HAND} Users: **${Util.commaify(this.client.guilds
                .reduce((prev, guild) => prev + guild.memberCount, 0))}**`
        ];

        if (sendType === "embed") {
            let inviteURL = `https://discord.com/oauth2/authorize/?client_id=${this.client.user
                .id}&permissions=379968&scope=bot`;

            return message.channel.createMessage({
                embed: {
                    description: `${description}\n\n**${[
                        `[Add ${this.client.user.username} (Private)](${inviteURL})`,
                        `[GitHub Repository](${repositoryURL})`
                    ].join(" | ")}**`,
                    color: Util.base10(Constants.Colors.DEFAULT),
                    author: {
                        icon_url: this.client.user.avatarURL,
                        name: `${this.client.user.username} Bot v${version}`
                    },
                    fields: [{ name: "Stats", value: stats.join("\n") }]
                }
            });
        } else if (sendType === "plain") {
            let content = `**${this.client.user.username} Bot v${version}**\n${description}\n\n**Stats**\n` +
                stats.join("\n");

            return message.channel.createMessage(content);
        }
    }

    learn(message) {
        let lessons = [
            {
                message: `You're about to take the interactive lesson on how to use **${this.client.user
                        .username}**. The lesson should take about 5-10 minutes to complete. If you feel like ` +
                    "changing the lesson up a bit, here are some built-in features for this.\n\n" + [
                        "Type `stop` to stop the interactive lesson (you cannot \"pause\" it).",
                        "Type `skip` to skip to the next lesson.",
                        "Type `back` to go back a lesson."
                    ].map((str) => `» ${str}`).join("\n") + "\n\n" +
                    "If you're inactive for 5+ minutes, the interactive lesson will end. Type `start` to start the " +
                    "lesson. Type `stop` to close it.",
                answers: ["start"]
            },
            {
                message: "The help command is the tree of knowledge for every category and command. It's your best " +
                    "friend.\n\nMission: Check all the commands within the `Tools` category. Remember, to search a " +
                    `category, type \`${message.prefix}help <category>\``,
                answers: [`${message.prefix}help tools`.toLowerCase()]
            },
            {
                message: "Good job! Now, try getting help on one of the commands within that category.\n\nMission: " +
                    `Use the \`help\` command to get info on the \`userinfo\` command. Usage: \`${message
                        .prefix}help \`<command>\`.`,
                answers: [`${message.prefix}help userinfo`.toLowerCase()]
            },
            {
                message: `Run the \`userinfo\` command (\`${message.prefix}userinfo\`).`,
                answers: [`${message.prefix}userinfo`.toLowerCase()]
            },
            {
                message: "Now, try using the command with a **flag**! Flags act as additional input to change the " +
                    "outcome of the command. For example, most utility commands come with a `--noembed` flag to send " +
                    "the message as plain text instead of an embed. Flags must start with `--` and be 2+ letters " +
                    "long. Flags are not included in the content of your message.\n\nMission: Use the `userinfo` " +
                    "command with the `noembed` flag by appending `--flagname` to the end of your message.",
                answers: [`${message.prefix}userinfo --noembed`.toLowerCase()]
            },
            {
                message: "- - -\nThe `userinfo` command can do more than show information on yourself. Try using the " +
                    `command with the first argument being the following user ID: \`${Constants
                        .BOT_ID}\`.\n\nHint: \`userinfo ${Constants.BOT_ID}\``,
                answers: [`${message.prefix}userinfo ${Constants.BOT_ID}`.toLowerCase()]
            },
            {
                message: "Excellent work! You're near the finish line! Many commands come with aliases to make " +
                    "executing the command easier than typing the whole name. For example, the `userinfo` command " +
                    "has an alias of `ui`. If you replaced the command name for its alias, it would still work.\n\n" +
                    "Mission: Use the alias `si` to execute the `serverinfo` command. If you're in a DM channel, " +
                    "don't worry if it doesn't show the guild info. It's supposed to do that.",
                answers: [`${message.prefix}si`.toLowerCase()]
            },
            {
                message: "Congratulations on completing the interactive lesson on using me! Hope you learned " +
                    "something useful. :)\n\nType `exit` to exit the interactive lesson.",
                answers: ["exit"]
            }
        ];

        const runLesson = async (index) => {
            let lesson = lessons[index];
            let msg = null;
            let canSend = () => !message.channel.guild || message.channel.permissionsOf(this.client.user.id)
                .has("sendMessages");


            if (canSend()) {
                msg = await Util.messagePrompt(message, message
                    .channel, this.client, `Stage #**${index + 1}**: ${lesson
                    .message}`, 300000, [...lesson.answers, "stop", "skip", "back"]);
            } else {
                if (canSend()) {
                    await message.channel.createMessage("The interactive lesson has timed out due to inactivity.");
                }

                return;
            }

            if (canSend()) {
                switch (msg.content.toLowerCase()) {
                    case "stop": {
                        await message.channel.createMessage("Stopped.");

                        return;
                    }

                    case "skip": {
                        if (index + 1 === lessons.length) {
                            return message.channel.createMessage("There are no more lessons. Ending session...");
                        }

                        return runLesson(index + 1);
                    }

                    case "back": {
                        if (index === 0) {
                            return message.channel.createMessage("This is the first lesson. To run the lesson, run " +
                                "the command again.");
                        }

                        return runLesson(index - 1);
                    }

                    default: {
                        if (index + 1 === lessons.length) {
                            return message.channel.createMessage("Exiting...");
                        }

                        await Util.sleep(500);

                        return runLesson(index + 1);
                    }
                }
            }
        };

        runLesson(0);
    }

    sendType(message, noembed) {
        if (!noembed && (!message.channel.guild ||
            message.channel.permissionsOf(this.client.user.id).has("embedLinks"))) {
            return "embed";
        }

        return "plain";
    }
};