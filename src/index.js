module.exports = {
    Client: require("./Client.js"),
    Util: require("./utils/Util.js"),
    Logger: require("./structures/Logger.js"),
    Constants: require("./utils/Constants.js"),
    Endpoints: require("./utils/Endpoints.js"),
    Schedule: require("./structures/Schedule.js"),
    CommandError: require("./utils/CommandError.js"),
    Collection: require("./structures/Collection.js"),
    KitsuMedia: require("./structures/KitsuMedia.js"),
    Command: require("./structures/Command/Command.js"),
    HypixelLeveling: require("./utils/HypixelLeveling.js"),
    EventListener: require("./structures/EventListener.js"),
    Subcommand: require("./structures/Command/Subcommand.js"),
    MessageCollector: require("./structures/MessageCollector.js"),
    ReactionCollector: require("./structures/ReactionCollector.js")
};