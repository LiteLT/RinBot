<img align="right" width="140" height="140" src="https://cdn.discordapp.com/avatars/663069544193064980/10173a8d51581f291b3b9f4ca29166cc.png?size=1024">

## Rin
A private Discord bot.

[Invite Rin (Private)](https://discord.com/oauth2/authorize/?client_id=663069544193064980&permissions=379968&scope=bot) | [Support Server]()
- - -
Rin is a Discord bot for servers that need more features most bots don't have, or implement well. Rin is a small solution to a growing issue for groups/servers: dedicated support.
- - -
## Frequently Asked Questions
- `[p]` symbolizes the bot prefix. The default prefixes are `r.` and `Rin#1497`. This is simply a place holder. It does not correspond with `[]` or `<>` arguments.
- `[label]` means an argument is optional. Even if the argument is invalid, the command should still work.
- `<label>` means an argument is required.
- `(label)` means an argument is semi-required. Not passing anything to the argument is allowed, but if you pass an argument that's invalid, the command will fail.

**How do I invite Rin?**

You cannot invite Rin. If you'd like to have Rin on your server, please contact me on Discord (Discord info below).

**Why is Rin private?**

Rin's features are based around the guilds she is in. Some commands would or would not work as expected in other servers. I also don't feel like maintaining another public bot at the time. If you'd like to see one of my public bots (old but still around), check out [Riko](https://top.gg/bot/553771373944635402).

If you really want to have Rin in your server, you can always try self-hosting the bot. It's not user-friendly and has little documentation at the moment, so I advise you avoid doing so.

**How can I use Rin?**

If Rin is in your server, send `[p]help` in a channel she can speak in for documentation.

**Why is Rin not working?**

There can be many reasons a bot could not be responding. Some of the more common reasons are listed below.
- **Rin does not have permission to `Send Messages`.** Rin checks for most commands if it has permission to `Embed Links`, so you should not have to worry about permission issues. To test if Rin can send messages, try mentioning her. Make sure she can view the channel as well.
- **The prefix does not exist.** Make sure the prefix is correct. Rin's default prefixes are `r.` and `@Rin#1497`. You can customize your prefixes with the `prefix` command, but mentioning the bot should always work.
- **The command does not exist.** Make sure the command you're using also exists. You can check if a command exists by sending `[p]help <command>` in chat. In rare occasionals (not visible), you'll run into disabled commands. These commands cannot be used by anyone except the bot owner.
- **Rin is not in your server, or she is offline.** Make sure the bot is, in fact, in your server. If she's offline, please contact me directly.
- **Different issue?** Send me a message on Discord!

**Can I contribute?**

You can contribute by suggesting new features/improvements relating to commands or the source code in the support server.

**How can I self-host Rin?**

Although user-friendly support is not a thing, it's possible to self-host the bot yourself. You'll need the knowledge of JavaScript/Node.js to run it yourself.

Keep in mind that I will not help you during the process. Any issues you run into will be your burden.

1. Install Node.js.
    - To check if Node.js is already installed, open your terminal and run `node -v`.
        - If it says `vx.x.x` (x should be a number), node is installed.
        - If the first number is `14` or higher, you're good to go. If it's not, you'll need to download the latest version of Node.js
        - If you get an error (such as the command not being found), you'll need to install Node.js
    - To download, visit the [official site](https://nodejs.org/en/) and make sure to download version `14` or higher.
2. Clone the repository.
3. Run `npm install` in the directory where the bot project is. If you receive any errors during installation, I won't be any assistance to you.
4. Create a new application on the [Discord Developer Portal](https://discord.com/developers/applications).
    - Click, "New Application" and give your application a name.
    - Copy the "Client ID", then navigate to `src/utils/Constants.js` and replace `BOT_ID` with your bot's ID.
    - Look at the side bar and press, "Bot" and build a bot. The name you gave your application will be the bot's name, but it can be changed.
    - Press, "Copy" on the token. Create a `.env` file and type `DISCORD_TOKEN=YOUR_TOKEN_HERE`, with `YOUR_TOKEN_HERE`, obviously being your bot token. There should be no spaces in between.
        - Your bot token should **always** be private. Keep in mind that the client secret and bot token are **not** the same.
        - You'll notice some options at the bottom. I recommend you have the following settings:
            - `Public Bot` - Off. This is not a requirement, but I take pride in the work I put into the bot. Please don't copy or claim to have made it yourself, or at least give credit. :)
            - `Requires OAuth2 Code Grant` - Off.
            - `Presence Intent` - On.
            - `Server Members Intent` - On.
    - Look at the side bar and press, "OAuth2". Scroll down to Scopes and press, "Bot". Scroll down some more and press, "Administrator". Finally, look up for the generated URL and invite your bot to your server.
5. **Optional.** If you want support for the `hypixel` command, you'll need to generate an API key by joining the server and running the `/api` command to get your API key. Go to your `.env` file (or create one in the base directory) and type `HYPIXEL_API_KEY=YOUR_API_KEY`, with `YOUR_API_KEY` obviously being the API key Hypixel generated. Make sure there's a line break between `DISCORD_TOKEN` and `HYPIXEL_API_KEY`.
6. Navigate to `src/util/Constants.js` and update the following properties:
    - `PRIMARY_PREFIX` - The default and primary prefix. Make sure your prefix does not contain a space.
    - `BOT_OWNER` - Your Discord user ID.
    - `BOT_PREFIXES` - An array of prefixes. Same rule applies to the primary prefix.
    - `BOT_STAFF` - An array of user IDs for any users who may be bot staff members. Grants access to commands like `leaveguild`.
    - `BOT_DEVELOPERS` - An array of user IDs for any users who may be bot developers. Grants access to commands like `eval`.
    - `BOT_SUPPORT_SERVER_INVITE` - The link to your support server.
    - `REPORT_EXCEPTION_CHANNEL_ID` - The channel where your bot will output any errors/exceptions thrown in the command. If Rin does throw an exception, it's unlikely I will help you resolve them.
    - `CustomEmojis` - An object of custom emojis. As there are so many emojis and you can't visually see them all, I can't help you retrieve all the images for each emoji. Use your discretion to figure out what each emoji would look like, or join the support server to get a basic grasp of what some may look like.
7. Access the database file (`database.db`) and run the following SQL statements.

<details>
  <summary>#7 - SQL Statements</summary>

  ```sql
CREATE TABLE prefixes (
    prefixes TEXT,
    guildID TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(prefixes, guildID)
)
  ```
  
  ```sql
CREATE TABLE modroles (
    roles TEXT,
    guildID TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(roles, guildID)
)
  ```
  
  ```sql
CREATE TABLE punishments (
    guildID TEXT,
    caseID INTEGER,
    deleted INTEGER,

    type TEXT NOT NULL,
    reason TEXT,
    duration INTEGER,

    userID TEXT NOT NULL,
    userName TEXT NOT NULL,
    userDiscriminator TEXT NOT NULL,

    moderatorID TEXT NOT NULL,
    moderatorName TEXT NOT NULL,
    moderatorDiscriminator TEXT NOT NULL,

    createdTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    editedTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (guildID, caseID)
)
  ```

  ```sql
CREATE TABLE guildOptions (
    guildID TEXT NOT NULL PRIMARY KEY,

    modlogs TEXT
)
  ```
</details>

8. Run the bot: `npm run start`! 🎉

## Reference
- Developer(s): `Kinolite#0001 (345539839393005579)`
- Library: [Eris v0.12.0](https://www.npmjs.com/package/eris)
- Last Update: May 6th, 2020.