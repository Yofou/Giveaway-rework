const Command = require('../utils/baseCommand.js');

class Help extends Command {
  constructor () {
    super('help', 'help', 'List all commands and their information', {
      args: false
    });
  }

  async run (client, message, args) {
    const helpEmbed = this.RichEmbed().setColor('#7FB3D5');
    let data;
    let prefix = await client.prefix(message)

    if (args.length > 0) {
      const command = client.commands.find(cmd => cmd.name == args[0] || cmd.allias.includes(args[0]));
      if (!command) return message.channel.send(`Sorry, I can't find the command called **${args[0]}**`);
      return message.channel.send(await command.usageEmbed(prefix))
        .catch(err => console.error(err));
    }

    // Other Commands w/o Args
    data = [];
    client.commands
      .forEach( async (cmd) => {
        if (!cmd.category) {
          if (!cmd.secret) { data.push(`**${prefix}${cmd.name}** - ${cmd.description}`); }
        }
      });
    helpEmbed.addField('General', data.join('\n'));

    // Notes
    data = [];
    data.push('_:bulb: Using a command w/o parameters gets extended help_');
    data.push('[parameter] - Mandatory parameter');
    data.push('(parameter) - Optional parameter');
    helpEmbed.addField('Syntax', data.join('\n'));

    // Additional
    helpEmbed
      .setTimestamp()
      .setFooter(
        'Help | Issues: Contact Yofou#0420',
        client.user.avatarURL
      );

    message.channel.send(helpEmbed)
      .catch(err => console.error(err));
  }
}

module.exports = Help;
