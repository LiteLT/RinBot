"use strict";

const { Util, Command, Constants } = require("../../index.js");
const { inspect } = require("util");
// noinspection JSUnusedLocalSymbols
const fetch = require("node-fetch"); // eslint-disable-line no-unused-vars

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<code>",
            description: "Evaluates arbitrary JavaScript.",
            requiredArgs: 1,
            protected: true,
            validatePermissions: (message) => Constants.BOT_DEVELOPERS.includes(message.author.id),
            flags: [
                {
                    name: "depth",
                    value: "number",
                    description: "Sets the depth limit for the value returned from the eval expression."
                },
                {
                    name: "async",
                    description: "Wraps the expression in an async function. This allows for the use of the `await` " +
                    "keyword. As a downside, you must use the `return` keyword to retrieve the result."
                },
                {
                    name: "silent",
                    description: "Makes the bot not send a message after evaluation, regardless of if an exception " +
                    "was thrown."
                },
                {
                    name: "showhidden",
                    description: "Exposes hidden properties within the returned object."
                }
            ]
        });
    }

    async run(message, args) {
        let input = args.join(" ").replace(/^`{3}\w+\n|`{3}$/g, "");
        let flags = Util.messageFlags(message, this.client);

        if (flags.async) {
            input = `(async () => { ${input} })()`;
        }

        try {
            let result = await eval(input); // eslint-disable-line no-eval

            if (!flags.silent) {
                if (typeof result !== "string") {
                    result = inspect(result, {
                        maxArrayLength: 50,
                        depth: ~~flags.depth,
                        showHidden: !!flags.showHidden
                    });
                }

                result = result.replace(new RegExp(Constants.DISCORD_TOKEN, "g"), "--- Deducted ---");

                // It returns the content faster if you suppress it.
                // noinspection ES6MissingAwait
                message.addReaction(Constants.Emojis.BLUE_CHECK);

                return await message.channel.createMessage(`\`\`\`js\n${result}\`\`\``);
            }
        } catch (ex) {
            if (!flags.silent) {
                return message.channel.createMessage(`\`\`\`js\n${ex}\`\`\``).catch(() => {});
            }
        }
    }
};