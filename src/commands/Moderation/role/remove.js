"use strict";

const { Util, Subcommand, CommandError } = require("../../../index.js");

module.exports = class extends Subcommand {
    constructor(...args) {
        super(...args, {
            usage: "<member> <...role>",
            description: "Removes a role to a member.",
            fullDescription: "Each role must be separated with a comma. If the member doesn't have the role, it will " +
            "be ignored. If the member doesn't have any of the roles list, the command will fail.",
            requiredArgs: 2
        });
    }

    /**
     *
     * @param message
     * @param memberArg
     * @param roleArgs
     * @returns {Promise<Message>}
     */
    async run(message, [memberArg, ...roleArgs]) {
        let target = this.command.findMember(message, [memberArg], { strict: true });

        if (!target) {
            return CommandError.ERR_NOT_FOUND(message, "member", memberArg);
        }

        let [roles, notFoundRoles] = Util.arrayPartition(roleArgs.join(" ").split(/, */).map((arg) => {
            return this.command.findRole(message, [arg], { strict: true }) || arg;
        }), (role) => typeof role !== "string");

        if (roles.length) {
            let clientMember = await Util.guildMe(this.client, message.channel.guild);
            let roleList = {
                allowed: [],
                disallowed: {
                    managed: [],
                    everyone: [],
                    doesNotHave: [],
                    hierarchyMember: [],
                    hierarchyClientMember: []
                }
            };

            for (const role of roles) {
                if (role.managed) {
                    roleList.disallowed.managed.push(role);
                } else if (role.id === message.guildID) {
                    roleList.disallowed.everyone.push(role);
                } else if (!target.roles.includes(role.id)) {
                    roleList.disallowed.doesNotHave.push(role);
                } else if (Util.memberHighestRole(message.member)?.position <= role.position) {
                    roleList.disallowed.hierarchyMember.push(role);
                } else if (Util.memberHighestRole(clientMember)?.position <= role.position) {
                    roleList.disallowed.hierarchyClientMember.push(role);
                } else {
                    roleList.allowed.push(role);
                }
            }

            let types = {
                managed: "Managed by an integration.",
                everyone: "Default everyone role.",
                doesNotHave: "Target member does not have the role.",
                hierarchyMember: "Role is higher than or equal to your current highest role.",
                hierarchyClientMember: "Role is higher than or equal to the bot's highest role."
            };

            if (roleList.allowed.length) {
                await target.edit({
                    roles: target.roles.filter((roleID) => roleList.allowed.every((role) => role.id !== roleID))
                });

                let hasDisallowedRoles = !!Object.values(roleList.disallowed).flat().length;
                let content = `Removes roles from **${Util.userTag(target)}**. ${hasDisallowedRoles
                    ? "Some roles failed to be added."
                    : ""}\n\`\`\`diff\n` + [
                        `+ Removed\n${roleList.allowed.map((role) => role.name).join(", ")}`,
                        Object.keys(roleList.disallowed)
                            .filter((type) => roleList.disallowed[type].length)
                            .map((type) => `- ${types[type]}\n${roleList.disallowed[type].map((role) => role.name)
                                .join(", ")}`)
                ].flat().join("\n\n") + "```";

                return message.channel.createMessage(content);
            }

            return this.command.onRolesNotFound(message, roleList.disallowed, types);
        }

        return CommandError.ERR_NOT_FOUND(message, "roles", notFoundRoles.join("\", \""));
    }
};