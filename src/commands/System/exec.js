"use strict";

const { Command, Constants } = require("../../index.js");
const { exec: childExec } = require("child_process");
const exec = require("util").promisify(childExec);

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            usage: "[command]",
            description: "Executes a command within the shell.",
            fullDescription: "The shell command spawns a shell then executes a command within " +
            "that shell. It's very important to be cautious when running commands as you hold " +
            "the power to kill the process if used maliciously.",
            protected: true,
            requiredArgs: 1,
            validatePermissions: (message) => Constants.BOT_DEVELOPERS.includes(message.author.id)
        });
    }
  
    async run(message, args) {
        if (args.join(" ").includes("rm -rf /")) {
            return message.channel.createMessage("Go away.");
        }
      
        exec(args.join(" "), { shell: "/bin/zsh", timeout: 60000 }).then(({ stdout, stderr }) => {
            const makeCodeblocks = (code) => `\`\`\`sh\n${code}\`\`\``;
            let output = [];
          
          
            if (stdout) {
                output.push(`**Standard Output**\n${makeCodeblocks(stdout)}`);
            }
          
            if (stderr) {
                output.push(`**Standard Error**\n${makeCodeblocks(stderr)}`);
            }
          
            return message.channel.createMessage(output.join("\n").substring(0, 2000));
        }).catch((err) => {
            return message.channel.createMessage(`\`\`\`js\n${err.message}\`\`\``);
        });
    }
};