const BaseCommand = require('../utils/baseCommand.js')

class Ping extends BaseCommand {
  constructor (prefix) {
    super('ping', 'ping', 'Shows the bot is online', {
      args: false,
      prefix: prefix
    })
  }

  async run (client, message, args) {
    message.channel.send('Pong!')
  }
}

module.exports = Ping
