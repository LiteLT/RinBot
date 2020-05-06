module.exports = {
    prefix: {
        summary: "Modify the guild prefix(es).",
        description: "The `prefix` setting allows you to configure the guild prefix through adding, removing, " +
        "clearing or reseting the guild prefixes.",
        maximumAmount: 10,
        length: {
            min: 0,
            max: 20 // 20 ccharacters to allow mentions
        }
    },
    modrole: {
        summary: "Set the moderator role for mod-only commands.",
        description: "Moderators gain access to the `tempmute` command.",
        maximumAmount: 10 // Why on earth would you need more than 10 moderator roles.
    }
};