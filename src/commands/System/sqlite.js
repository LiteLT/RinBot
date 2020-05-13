"use strict";

const { Util, Command, Constants } = require("../../index.js");
const { inspect } = require("util");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<sql>",
            description: "Runs SQL code.",
            fullDescription: "To use JavaScript, wrap your code around in `${}` to get the value from it.",
            requiredArgs: 1,
            protected: true,
            aliases: ["sql"],
            validatePermissions: (message) => Constants.BOT_DEVELOPERS.includes(message.author.id),
            flags: [
                {
                    name: "depth",
                    value: "number",
                    description: "Sets the depth limit for the object. As the limit increases, " +
                    "the result size becomes larger. Avoid specifying a limit if you know it'll " +
                    "exceed the 2000 character limit."
                }
            ]
        });
    }

    async run(message, args) {
        let flags = Util.messageFlags(message, this.client);
        let input = args.join(" ").replace(/^`{3}\w+\n|`{3}$/g, "").replace(/\${([^}]+)}/g, (_str, input) => {
            return eval(input); // eslint-disable-line no-eval
        });

        try {
            let result = await this.client.db.all(input);

            if (typeof result !== "string") {
                result = inspect(result, { maxArrayLength: 50, depth: parseInt(flags.depth || 1, 10) });
            }

            // noinspection ES6MissingAwait
            message.addReaction(Constants.Emojis.BLUE_CHECK);

            return message.channel.createMessage("```js\n" + result + "```");
        } catch (ex) {
            return message.channel.createMessage("```sql\n" + ex + "```");
        }
    }
};