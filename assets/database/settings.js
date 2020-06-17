module.exports = {
    prefix: {
        summary: "Modify the guild prefix(es).",
        description: "The `prefix` setting allows you to configure the guild prefix through adding, removing, " +
        "clearing or resetting the guild prefixes.",
        maximumAmount: 10,
        length: {
            min: 0,
            max: 20 // 20 characters to allow mentions
        }
    },
    modrole: {
        summary: "Set the moderator role for mod-only commands.",
        description: "Moderators gain access to the `tempmute` command.",
        maximumAmount: 10 // Why on earth would you need more than 10 moderator roles.
    },
    logging: {
        summary: "Configure the channels for the bot to log messages to.",
        description: `The most common logging options can be seen below.\n${[
            {
                name: "modlogs",
                value: "Set the modlogs channel."
            }
        ].map((opt) => `**${opt.name}** — ${opt.value}`).join("\n")}`
    }
};