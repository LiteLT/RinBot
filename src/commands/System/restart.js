"use strict";

const { Util, Command, Constants } = require("../../index.js");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            description: "Restarts the bot.",
            protected: true,
            validatePermissions: (message) => Constants.BOT_DEVELOPERS.includes(message.author.id),
            flags: [{
                name: "force",
                description: "Forcibly closes the client, skipping graceful closing of " +
                "background tasks (database, web server, etc)."
            }]
        });
    }
  
    async run(message) {
        let flags = Util.messageFlags(message, this.client);
      
        if (flags.force) {
            await message.channel.createMessage("Forcibly closing...").catch(() => {});
          
            return process.exit(0);
        }
      
        await message.channel.createMessage("Restarting...").catch(() => {});
      
        return this.client.gracefulExit(0);
    }
};