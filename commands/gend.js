const BaseCommand = require('../utils/baseCommand.js');

class Gend extends BaseCommand {
  constructor () {
    super('end', 'end [messageID]', 'Ends/Reroll a giveaway ahead of time');
    this.allias = ['roll', 'groll', 'gend', 'gcancel', 'cancel'];
    this.usage += `\nAlias: ${this.allias.join(',')}`;
  }

  usageEmbed (prefix,error = '') {
    const data = [
      'messageID: the message id of the giveaway embed',
      'additional arguments: -c {channelID/mention/name}'
    ];
    const embed = this.RichEmbed().setColor('#7FB3D5');

    if (error) {
      embed.addField('An error has occurred!', error);
    }

    embed
      .addField('Usage', `${prefix}${this.usage}`)
      .addField('Parameters Help', data.join('\n'))
      .addField(
        'Examples',
        `${prefix}end 684767524671586305 \n${prefix}roll 684767524671584326\n${prefix}end 693871103478595704 -c 638096970996776977 \n${prefix}roll -c 638096970996776977 693871103478595704`
      )
      .setTimestamp();

    return embed;
  }

  async run (client, message, args) {
    if (this.checkGiveawayPerms(message)) return message.channel.send(`<@${message.author.id}> Sorry but you dont have the required role or permissions to run this command`);

    let channel = this.channelValidation(message, args);
    if (channel.error) return message.channel.send(this.usageEmbed(client.prefix(message),channel.error));
    args = channel.args;
    channel = channel.channel;

    const [messageID] = args;
    if (isNaN(Number(messageID))) return message.channel.send(this.usageEmbed(client.prefix(message),'Invalid message id (Not a number)'));
    const giveawayDB = require('../databases/giveaway.json');

    const msgChannel = message;

    channel.messages
      .fetch(messageID)
      .then(message => {
        const originalEmbed = message.embeds[0];
        const msgUrl = message.url;
        if (!originalEmbed) return msgChannel.channel.send(this.usageEmbed(client.prefix(message),'Not an embed message'));
        if (originalEmbed.url != 'https://www.VerifedGiveaway.com/') return msgChannel.channel.send(this.usageEmbed('Invalid giveaway embed'));

        message.reactions.cache.get('🎉').users
          .fetch()
          .then((users) => {
            const embed = client.finishEmbed(users, originalEmbed);
            message.edit(embed);
            msgChannel.react('👌');
            delete giveawayDB[messageID];
            this.saveJsonFile('./databases/giveaway.json', JSON.stringify(giveawayDB, null, 4));

            message.channel.send(`Prize: **${embed.title}**\n${embed.description}\n${msgUrl}`);
          })
          .catch(e => message.channel.send(this.usageEmbed(client.prefix(message),'Uh oh unexpected error please contact Yofou#0420')));
      })
      .catch(e => {
        message.channel.send(this.usageEmbed(client.prefix(message),'Can\'t find the a message in this channel by that id'));
      });
  }
}

module.exports = Gend;
