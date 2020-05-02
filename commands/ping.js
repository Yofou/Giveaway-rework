const BaseCommand = require('../utils/baseCommand.js');

class Ping extends BaseCommand {
  constructor () {
    super('ping', 'ping', 'Shows the bot is online', {
      args: false
    });
  }

  async run (client, message, args) {
    message.channel.send('Pong!')
      .catch(err => console.error(err));
  }
}

module.exports = Ping;
