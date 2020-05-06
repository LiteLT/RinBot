"use strict";

const { Util, Constants, EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    constructor(...args) {
        super(...args, { once: true });
    }
  
    async run() {
        let botTag = Util.userTag(this.client.user);
        let guildCount = this.client.guilds.size;
        let userCount = this.client.guilds.reduce((prev, guild) => prev + guild.memberCount, 0);
      
        this.client.logger.log(`Authenticated as ${botTag} (${this.client.user
            .id}) | Serving ${guildCount} guilds and ${userCount} users.`);

        this.client.editStatus("online", {
            type: 2,
            name: `${Constants.PRIMARY_PREFIX}help `
        });
    }
};