const BaseCommand = require('../utils/baseCommand.js');

class SetPrefix extends BaseCommand {
  constructor () {
    super('setprefix', 'setPrefix [someSymbol]', 'Will set the bots prefix for this server only');
    this.allias = ['prefix']
  }

  async run (client, message, args) {

    let prefixs = require( '../databases/prefix.json' )
    const requestedPrefix = args[0]

    if (requestedPrefix == '>' && prefixs[message.guild.id]){
      delete prefixs[message.guild.id]
      message.channel.send( `Prefix has been set too the default \`>\`` )
    } else {
      if (prefixs[message.guild.id] == requestedPrefix || (!prefixs[message.guild.id] && requestedPrefix == '>') ) return message.channel.send( `Please only set **different** prefixs` )

      message.channel.send( `Prefix has been set too \`${requestedPrefix}\`` )
      prefixs[message.guild.id] = requestedPrefix
    }

    this.saveJsonFile( './databases/prefix.json', JSON.stringify( prefixs,null,4 ) )

  }
}

module.exports = SetPrefix;
