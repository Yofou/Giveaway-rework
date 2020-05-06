const BaseCommand = require('../utils/baseCommand.js');

class SetPrefix extends BaseCommand {
  constructor () {
    super('setprefix', 'setPrefix [someSymbol]', 'Will set the bots prefix for this server only');
    this.allias = ['prefix']
    this.caseSensitiveArgs = true;
  }

  async run (client, message, args) {
    if (!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('Sorry but you dont have the permissions to do this command :(');
    let prefixs = require( '../databases/prefix.json' )
    const requestedPrefix = args[0]

    if (requestedPrefix == client.config.get('defaultPrefix') && prefixs[message.guild.id]){
      delete prefixs[message.guild.id]
      message.channel.send( `Prefix has been set too the default \`${client.config.get('defaultPrefix')}\`` )
    } else {
      if (prefixs[message.guild.id] == requestedPrefix || (!prefixs[message.guild.id] && requestedPrefix == client.config.get('defaultPrefix')) ) return message.channel.send( `Please only set **different** prefixs` )

      message.channel.send( `Prefix has been set too \`${requestedPrefix}\`` )
      prefixs[message.guild.id] = requestedPrefix
    }

    this.saveJsonFile( './databases/prefix.json', JSON.stringify( prefixs,null,4 ) )

  }
}

module.exports = SetPrefix;
