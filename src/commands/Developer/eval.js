"use strict";

const { Util, Command, Constants } = require("../../index.js");
const { inspect } = require("util");
const fetch = require("node-fetch"); // eslint-disable-line no-unused-vars

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<code>",
            description: "Evaluates arbitrary JavaScript.",
            fullDescription: "The eval command evaluates code as-in, any error thrown from it " +
            "will be handled. If the output is too large, a file will be sent instead. If the " +
            "bot lacks permission to `Attach Files`, it will be sent to the console instead.",
            requiredArgs: 1,
            protected: true,
            validatePermissions: (message) => Constants.BOT_DEVELOPERS.includes(message.author.id),
            flags: [
                {
                    name: "depth",
                    value: "number",
                    description: "Sets the depth limit for the object. As the limit increases, " +
                    "the result size becomes larger. Avoid specifying a limit if you know it'll " +
                    "exceed the 2000 character limit."
                },
                {
                    name: "async",
                    description: "Wraps the expression in an async function. This allows for the " +
                    "use of the `await` keyword. As a downside, you must use the `return` " +
                    "keyword to display the result."
                },
                {
                    name: "silent",
                    description: "Makes the bot not send a message after evalaution, regardless " +
                    "of if an exception was thrown."
                },
                {
                    name: "showHidden",
                    description: "Displays hidden properties within the returned object."
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
              
                result = result.replace(new RegExp(Constants
                    .DISCORD_TOKEN, "g"), "--- Deducted ---");
                let wrap = `\`\`\`js\n${result}\`\`\``;
              
                message.addReaction(Constants.Emojis.BLUE_CHECK);
              
                return await message.channel.createMessage(wrap);
            }
        } catch (ex) {
            if (!flags.silent) {
                message.channel.createMessage("```js\n" + ex + "```").catch(() => {});
            }
        }
    }
};