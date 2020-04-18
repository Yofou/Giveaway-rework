const { Client, Collection, Constants, MessageEmbed } = require('discord.js');
const fs = require('fs');
const moment = require('moment');
require('moment-precise-range-plugin'); // for precide difference time calcucaltion

apiDefault = {
  apiRequestMethod: 'sequential',
  shardId: 1,
  shardCount: 1,
  messageCacheMaxSize: 100,
  messageCacheLifetime: 300,
  messageSweepInterval: 30,
  fetchAllMembers: false,
  disableMentions: 'everyone',
  sync: false,
  restWsBridgeTimeout: 5000,
  restTimeOffset: 500,
  retryLimit: Number.POSITIVE_INFINITY,
  disabledEvents: [
    'TYPING_START',
    'PRESENCE_UPDATE',
    'WEBHOOKS_UPDATE',
    'VOICE_STATE_UPDATE',
    'USER_NOTE_UPDATE',
    'CHANNEL_PINS_UPDATE',
    'RELATIONSHIP_ADD',
    'RELATIONSHIP_REMOVE',
    'GUILD_BAN_ADD',
    'GUILD_BAN_REMOVE',
    'USER_SETTINGS_UPDATE'
  ],
  ws: { large_threshold: 250 },
  http: {
    version: 7,
    api: 'https://discordapp.com/api',
    cdn: 'https://cdn.discordapp.com',
    invite: 'https://discord.gg'
  }
};

class Bot extends Client {
  constructor(prefix, customOptions) {
    // Merge options (custom will override default if given)
    const options = { ...apiDefault, ...customOptions };
    super(options);
    this.prefix = prefix;
    this.Constants = Constants;

    this.on('ready', () => {
      console.log(`Logged in as ${this.user.tag}!`);
      this.user.setActivity(`for ${this.prefix}help`, { type: 'WATCHING' });
    });
  }

  buildCollection() {
    return new Collection();
  }

  setupCommand(dir) {
    let collectionName;
    if (typeof dir == 'object') {
      collectionName = dir[0];
      dir = dir[1];
    } else {
      collectionName = dir.split('/')[2];
    }
    this[collectionName] = new Collection();
    fs.readdir(dir, (err, files) => {
      if (err) return console.error(err);
      files.forEach(file => {
        if (!file.endsWith('.js')) return;
        const props = require(`${dir}${file}`);
        const commandName = file.split('.')[0];
        this[collectionName].set(commandName, new props(this.prefix));
      });
    });
  }

  setupDB(collection, jsonDir) {
    let json = require(jsonDir);
    for (const i of Object.keys(json)) {
      collection.set(i, json[i]);
    }
  }

  buildCommands(dirs) {
    dirs.forEach(dir => {
      this.setupCommand(dir);
    });

    this.on('message', this.listenForCommands);
  }

  buildDBs(dbCollection) {
    Object.entries(dbCollection).forEach(([collectionName, dbDir]) => {
      this[collectionName] = new Collection();
      this.setupDB(this[collectionName], dbDir);
    });
  }

  giveawayEmbed(Obj){

    let timeLeft = moment( Date.now() ).preciseDiff( Obj.deadline )
    const embed = new MessageEmbed()
      .setTitle( Obj.title )
      .setColor('#7FB3D5')
      .setURL('https://www.VerifedGiveaway.com/')
      .setDescription(`React with 🎉 to enter!\nTime remaining: **${ timeLeft }**\nHosted by: ${ Obj.host }`)
      .setFooter(`${ Obj.winnerAmount } Winners | Ends at • ${ moment(Obj.deadline).format("dddd, MMMM Do YYYY") }`)


    return embed
  }

  finishEmbed(users,orignalEmbed,func){

    // from https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
    function shuffle(a) {
      var j, x, i;
      for (i = a.length - 1; i > 0; i--) {
          j = Math.floor(Math.random() * (i + 1));
          x = a[i];
          a[i] = a[j];
          a[j] = x;
      }
      return a;
    }

    users = users
      .filter( user => {
        // filter out the bot from the list
        if (!user.bot) return user
      } )
      .map(user => `<@${user.id}>`) // then remap the collection to only the things we need

    users = shuffle( users ) // shuffle the array
    const winnerAmount = Number( orignalEmbed.footer.text.split(' ')[0] )
    users = users.splice( 0,winnerAmount )

    let winnerAnouncment = ''

    if (users.length == 0){
      winnerAnouncment = 'Nobody Won'
    } else if (users.length > 1) {
      winnerAnouncment = 'Winners: '
    } else {
      winnerAnouncment = 'Winner: '
    }

    winnerAnouncment += users.join( ' ' )

    const parsedDesc =  orignalEmbed.description.split('\n')

    const embed = new MessageEmbed()
      .setTitle( orignalEmbed.title )
      .setColor('#7FB3D5')
      .setURL('https://www.VerifedGiveaway.com/')
      .setDescription(`${winnerAnouncment}\n${parsedDesc[ parsedDesc.length - 1 ]}`)
      .setFooter(orignalEmbed.footer.text)

    return embed
  }

  toWidget(string, funcObj) {
    let string2 = string;
    let brackets = { '{': [], '}': [] };
    for (let bracket in brackets) {
      for (let charIndex in string) {
        if (string[charIndex] == bracket) brackets[bracket].push(charIndex);
      }
    }

    if (brackets['{'].length != brackets['}'].length)
      return 'Parsing Error: not closing brackets properly';

    for (let i = 0; i < brackets['{'].length; i++) {
      let start = parseInt(brackets['{'][i]) + 1;
      let end = parseInt(brackets['}'][i]);
      let innerBrackets = string.substring(start, end);

      if (!innerBrackets.includes(':')) {
        if (
          innerBrackets in funcObj &&
          typeof funcObj[innerBrackets] != 'function'
        )
          string2 = string2.replace(
            `{${innerBrackets}}`,
            funcObj[innerBrackets]
          );
      } else {
        let [funcName, args] = innerBrackets.split(':');

        if (args.split('|').includes(''))
          return `Parse Error: too many '|' in ${innerBrackets}`;
        args = args.split('|');

        if (!(funcName in funcObj))
          return `Function Error: Invalid function name ${funcName} in ${innerBrackets}`;

        let funcValue = funcObj[funcName](args);
        if (funcValue == undefined)
          return `Function Error: ${funcName} has no return value`;

        string2 = string2.replace(`{${innerBrackets}}`, funcValue);
      }
    }

    return string2;
  }

  async listenForCommands(message) {
    // Ignore dms
    if (typeof message.channel == 'DMChannel') return;

    // Ignore Bots
    if (message.author.bot) return;

    // Ignores message if bot cannot send messages
    if (!message.guild) return;

    // This here is kind of temporary fix for the below, unless this itself fixes the issue fine, which it might
    if (!message.member) return;

    // Before this would sometimes error out as a cannot find guild of null, meaning message.member is null
    if (!message.member.guild.me.hasPermission('SEND_MESSAGES')) return;
    if (!message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES'))
      return;

    if (message.content.startsWith(`<@!${message.member.guild.me.id}>`))
      return message.channel.send(`Use \`${this.prefix}help\` to get started!`);

    if (message.content[0] != this.prefix) return;

    // Standard argument and command definitions
    const content = message.content.slice(this.prefix.length).trim();

    const rawArgs = content.split(/ +/g);

    const args = content.toLowerCase().split(/ +/g);

    const cmdName = args.shift();

    const command = this.commands.find(cmd => cmd.name == cmdName || cmd.allias.includes( cmdName ));

    if (!command) return;

    // Ignores Secret Commands if Not Owner
    if (command.secret && message.author.id != this.config.get('OWNER')) return;

    if (command.args && !args.length) {
      if (command.usage) {
        message.channel.send(await command.usageEmbed('',message.guild));
      }
      return;
    }

    try {
      if (command.caseSensitiveArgs) {
        rawArgs.shift();
        return command
          .run(this, message, rawArgs)
          .catch(err => console.log(err));
      } else {
        command.run(this, message, args).catch(err => console.log(err));
      }
    } catch (err) {
      console.log(err);
    }
  }
}


module.exports = Bot;
