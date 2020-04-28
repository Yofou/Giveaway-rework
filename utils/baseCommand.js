const { MessageEmbed, TextChannel, version } = require('discord.js');
const fs = require('fs');
const Pages = require('./pagers.js');

const defaultOptions = {
  args: true,
  secret: false,
  category: false,
  subTree: null,
  prefix: ''
};

class Command {
  constructor (name, usage, description, customOptions) {
    // Merge options (custom will override default if given)
    const options = { ...defaultOptions, ...customOptions };
    this.name = name;
    this.usage = `${options.prefix}${usage}`;
    this.description = description;
    this.args = options.args;
    this.secret = options.secret;
    this.category = options.category;
    this.subTree = options.subTree;
    this.prefix = options.prefix;
    this.version = version;
    this.allias = [];

    if (!this.category && this.subTree != null) {
      console.log(
        `Warning Non-Category Command (${this.name}) has set a subTree`
      );
    } else if (this.category && this.subTree == null) {
      this.subTree = this.name;
    }
  }

  run (client, message, args) {
    const subCommand = args[0];
    args = args.slice(1, args.length);
    const commandFound = client[this.subTree].find(
      cmd => cmd.name === subCommand && !cmd.secret
    );
    if (!commandFound) return message.channel.send(this.usageEmbed());
    if (commandFound.args && args.length == 0) { return message.channel.send(commandFound.usageEmbed()); }
    commandFound.run(client, message, args);
  }

  RichEmbed () {
    return new MessageEmbed();
  }

  channelValidation (message, args) {
    const responseObj = {
      args: args,
      channel: message.channel,
      error: false
    };

    if (args.includes('-c') || args.includes('-channel')) {
      let index;
      let channel;
      if (args.includes('-c')) index = args.indexOf('-c');
      if (args.includes('-channel')) index = args.indexOf('-channel');

      if (index >= args.length - 1) { responseObj.error = 'No argument passed into -c'; return responseObj; }

      const channelInput = args[index + 1];

      if (isNaN(Number(channelInput))) {
        channel = this.getChannelFromMention(message.guild.channels.cache, channelInput);
        if (!channel) { responseObj.error = `Sorry But I can\'t find any channel via name/mention called ${channelInput}`; return responseObj; }
      } else {
        channel = this.getChannelFromMention(message.guild.channels.cache, channelInput);
        if (!channel) { responseObj.error = `Sorry But I can\'t find any channel via ID by ${channelInput}`; return responseObj; }
      }

      const ignored = require('../utils/databases/ignore.json');
      if (ignored.channels) {
        if (ignored.channels.includes(channel.id)) {
          responseObj.error = 'Sorry but I can\'t post Giveaways in that channel (Channel is restricted by admins)'; return responseObj;
        }
      } else if (!channel.permissionsFor(message.member).has(['VIEW_CHANNEL'])) {
        responseObj.error = 'Sorry but you don\'t have permission to view that channel'; return responseObj;
      }
      args = args.filter(arg => {
        if (arg != args[index] && arg != args[index + 1]) return arg;
      }
      );

      responseObj.channel = channel;
      responseObj.args = args;
    }

    return responseObj;
  }

  menu (
    channel = new TextChannel(),
    uid,
    pages = [],
    time = 120000,
    reactions = { first: '⏪', back: '◀', next: '▶', last: '⏩', stop: '⏹' },
    pageFooter = false
  ) {
    return new Pages(channel, uid, pages, time, reactions, pageFooter);
  }

  getChannelFromMention (cache, mention) {
    if (!mention) return;

    if (mention.startsWith('<#') && mention.endsWith('>')) {
      mention = mention.slice(2, -1);

      if (mention.startsWith('!')) {
        mention = mention.slice(1);
      }
    }

    return cache.find(
      channel => channel.name == mention || channel.id == mention
    );
  }

  checkGiveawayPerms (message) {
    let userpass = false;
    // check if the user has permission or an override role to use this command
    const rolesDB = require('./databases/roles.json');
    if (rolesDB[message.guild.id]) {
      for (const roleID of rolesDB[message.guild.id]) {
        if (message.member.roles.cache.has(roleID)) userpass = true; break;
      }
    }

    return (!message.member.hasPermission('MANAGE_GUILD') && !userpass);
  }

  async getSafeRoleDB (guild) {
    const rolesDB = require('./databases/roles.json');
    const filter = [];

    if (!rolesDB[guild.id]) return false;

    return await guild.roles
      .fetch()
      .then((roles) => {
        for (const roleID of rolesDB[guild.id]) {
          if (!roles.cache.has(roleID)) filter.push(roleID);
        }

        rolesDB[guild.id] = rolesDB[guild.id].filter(role => !filter.includes(role));

        if (rolesDB[guild.id].length == 0) delete rolesDB[guild.id];

        this.saveJsonFile('./utils/databases/roles.json', JSON.stringify(rolesDB, null, 4));

        return rolesDB;
      });
  }

  saveJsonFile (filePath, jsonObj) {
    fs.writeFile(filePath, jsonObj, 'utf8', function (err) {
      if (err) {
        console.log('An error occurred while writing JSON Object to file.');
        return console.log(err);
      }
    });
  }

  usageEmbed () {
    let embed;
    if (this.category) {
      // Get all commands in sub command
      const data = [];

      client[this.subTree].tap(cmd => {
        data.push(
          `**${this.prefix}${this.name} ${cmd.usage}** - ${cmd.description}`
        );
      });

      embed = this.RichEmbed()
        .setColor('#7FB3D5')
        .addField(this.description, `**${this.usage}**`)
        .addField('Parameters Help', data.join('\n\n'))
        .setTimestamp()
        .setFooter(`${this.name.toUpperCase()} Help`);
    } else {
      embed = this.RichEmbed()
        .setColor('#7FB3D5')
        .addField('Usage: ', this.usage)
        .addField('Description: ', this.description)
        .setTimestamp();
    }

    return embed;
  }
}

module.exports = Command;
