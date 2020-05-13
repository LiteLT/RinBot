"use strict";

const { Util, Command } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "<embed>",
            description: "Creates and sends a custom embed.",
            fullDescription: "To send your own custom embed, you'll need to use an online Discord embed generator " +
            "and paste the contents as the command arguments. What you'll be pasting is what you find at the bottom " +
            "of the left column of the page here: <https://bit.ly/3d2KihF>. Everything in `{...}` is what's required.",
            requiredArgs: 1,
            aliases: ["makeembed", "sendembed"],
            memberPermissions: ["embedLinks"],
            clientPermissions: ["embedLinks"]
        });
    }

    async run(message, args) {
        let embedStructure = null;

        try {
            embedStructure = JSON.parse(args.join(" "));
        } catch (ex) {
            if (ex.name === "SyntaxError") {
                return message.channel.createMessage("Invalid JSON. Check the embed builder website for help. If " +
                "you're using flags, don't pass any arguments except for flags.");
            }

            throw ex;
        }

        if (!embedStructure?.embeds?.length) { // NOTE: Use ?. once done with this command.
            return message.channel.createMessage("Could not create an embed. Are you sure you're using a valid " +
            "JSON embed builder?");
        }

        [embedStructure] = embedStructure.embeds;

        try {
            await message.channel.createMessage({ embed: embedStructure });
        } catch (ex) {
            if (ex.message === "No content, file, or embed") {
                return message.channel.createMessage("Could not create an embed. Are you sure you're using a " +
                "valid JSON embed builder?");
            } else if (ex.code === 50035) {
                let invalidFields = ex.message.replace(/^Invalid Form Body\n/, "").split("\n")
                    .map((str) => `- ${str.slice(8).split(": ")
                        .map((fieldError, index) => index === 0
                            ? `**${fieldError.split(".")
                                .map((str) => Util.toTitleCase(str.replace("_", " ")).replace("Url", "URL"))
                                .join(" ")}**`
                            : fieldError).join(": ")}`)
                    .join("\n");

                message.channel.createMessage(`Invalid embed structure:\n${invalidFields}`).catch(() => {});
            }
        }
    }
};