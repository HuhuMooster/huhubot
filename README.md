# huhubot

A simple discord bot that provides several useful features for path of exile players. Boilerplate for this bot was taken from `https://github.com/An-Idiots-Guide/guidebot-class.git`.

Some of the included features are:

- looking up item stats and price
- finding all characters from an account
- finding an account name given a character name
- daily labyrinth layout
- daily labyrinth ladder
- past and current league overview
- personal labyrinth trial tracking

## Requirements

- [NodeJS](https://nodejs.org)
- The node-gyp build tools. This is a pre-requisite for Enmap, but also for a **lot** of other modules. See [The Enmap Guide](https://enmap.evie.codes/install#pre-requisites) for details and requirements for your OS. Just follow what's in the tabbed block only, then come back here!

You also need your bot's token. This is obtained by creating an application in
the Developer section of discordapp.com. Check the https://docs.discordbotstudio.org/setting-up-dbs/finding-your-bot-token
for more info.

## Starting the bot

To start the bot, in the command prompt, run the following command:
`node index.js`

## Inviting to a guild

To add the bot to your guild, you have to get an oauth link for it.

You can use this site to help you generate a full OAuth Link, which includes a calculator for the permissions:
[https://finitereality.github.io/permissions-calculator/?v=0](https://finitereality.github.io/permissions-calculator/?v=0)
