const Command = require('../utils/baseCommand.js');

class Help extends Command {
  constructor(prefix) {
    super('help', 'help', 'List all commands and their information', {
      args: false,
      prefix: prefix
    });
  }

  async run(client, message, args) {
    const helpEmbed = this.RichEmbed().setColor('#7FB3D5');
    let data;

    // Other Commands w/o Args
    data = [];
    client.commands
      .forEach(cmd => {
        if (!cmd.category) {
          if (!cmd.secret)
            data.push(`**${this.prefix}${cmd.name}** - ${cmd.description}`);
        }
      });
    helpEmbed.addField('General', data.join('\n'));

    // Notes
    data = [];
    data.push('_:bulb: Using a command w/o parameters gets extended help_');
    data.push('[parameter] - Mandatory parameter');
    data.push('(parameter) - Optional paramater');
    helpEmbed.addField('Syntax', data.join('\n'));

    // Additional
    helpEmbed
      .setTimestamp()
      .setFooter(
        `Help | Issues: Contact Yofou#0420`,
        client.user.avatarURL
      );

    message.channel.send(helpEmbed)

  }
}

module.exports = Help;
