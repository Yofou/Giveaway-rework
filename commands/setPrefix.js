const BaseCommand = require('../utils/baseCommand.js');

class SetPrefix extends BaseCommand {
  constructor () {
    super('setprefix', 'setPrefix [someSymbol]', 'Will set the bots prefix for this server only');
    this.allias = ['prefix']
    this.caseSensitiveArgs = true;
  }

  async run (client, message, args) {
    if (!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('Sorry but you dont have the permissions to do this command :(');
    let prefixes = require( '../databases/prefix.json' )
    const requestedPrefix = args[0]

    if (requestedPrefix == client.config.get('defaultPrefix') && prefixes[message.guild.id]){
      delete prefixes[message.guild.id]
      message.channel.send( `Prefix has been set to the default \`${client.config.get('defaultPrefix')}\`` )
    } else {
      if (prefixes[message.guild.id] == requestedPrefix || (!prefixes[message.guild.id] && requestedPrefix == client.config.get('defaultPrefix')) ) return message.channel.send( `Please only set **different** prefixes` )

      message.channel.send( `Prefix has been set to \`${requestedPrefix}\`` )
      prefixes[message.guild.id] = requestedPrefix
    }

    this.saveJsonFile( './databases/prefix.json', JSON.stringify( prefixes,null,4 ) )

  }
}

module.exports = SetPrefix;
