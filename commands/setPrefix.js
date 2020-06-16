const BaseCommand = require('../utils/baseCommand.js');
const DB = require('../databases/db.js')

class SetPrefix extends BaseCommand {
  constructor () {
    super('setprefix', 'setPrefix [someSymbol]', 'Will set the bots prefix for this server only');
    this.allias = ['prefix'];
    this.caseSensitiveArgs = true;
  }

  async run (client, message, args) {
    if (!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('Sorry but you dont have the permissions to do this command :(');
    const requestedPrefix = args[0];

    const guildPrefix = await DB.sequelize.models.prefix.findByPk( message.guild.id )

    if ( !guildPrefix ){
      if (requestedPrefix == client.config.get('defaultPrefix')) return message.channel.send('Please only set **different** prefixs')
      await DB.sequelize.models.prefix.create({
        id: message.guild.id,
        prefix: requestedPrefix
      })
    } else {

      if (guildPrefix.prefix == requestedPrefix) return message.channel.send('Please only set **different** prefixs')

      if (requestedPrefix == client.config.get('defaultPrefix')) {
        guildPrefix.destroy()
        return message.channel.send(`Prefix has been set too the default \`${requestedPrefix}\``)
      } else {
        guildPrefix.prefix = requestedPrefix
        await guildPrefix.save()
      }
    }

    message.channel.send(`Prefix has been set to \`${requestedPrefix}\``)

  }
}

module.exports = SetPrefix;
