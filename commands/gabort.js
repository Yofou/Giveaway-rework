const BaseCommand = require('../utils/baseCommand.js');
const DB = require('../databases/db.js')

class Gabort extends BaseCommand {
  constructor () {
    super('abort', 'abort [messageID]', 'Aborts a giveaway so no winner will be picked');
  }

  usageEmbed (prefix, error = '') {
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
        `${prefix}abort 684767524671586305\n${prefix}abort 693871103478595704 -c 638096970996776977 \n${prefix}abort -c 638096970996776977 693871103478595704`
      )
      .setTimestamp();

    return embed;
  }

  async run (client, message, args) {
    if (await this.checkGiveawayPerms(message)) return message.channel.send(`<@${message.author.id}> Sorry but you dont have the required role or permissions to run this command`);

    let channel = await this.channelValidation(message, args);
    if (channel.error) return message.channel.send(this.usageEmbed(await client.prefix(message), channel.error));
    args = channel.args;
    channel = channel.channel;

    const [messageID] = args;
    if (isNaN(Number(messageID))) return message.channel.send(this.usageEmbed(await client.prefix(message), 'Invalid message id (Not a number)'));

    const msgChannel = message;

    channel.messages
      .fetch(messageID)
      .then( async (message) => {
        const originalEmbed = message.embeds[0];

        const embed = this.RichEmbed()
          .setTitle(originalEmbed.title)
          .setColor('#ff726f')
          .setDescription('**Sorry but this giveaway has been cancelled**')
          .setFooter(originalEmbed.footer.text);

        message.edit(embed);
        message.unpin().catch(err => console.error(err));
        message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        const giveaway = await DB.sequelize.models.giveaway.findByPk( message.id )
        if (giveaway) {
          await giveaway.destroy()
          msgChannel.channel.send('😢 Giveaway Aborted 😢');
        }
      })
      .catch( async (e) => {
        message.channel.send(this.usageEmbed(await client.prefix(message), 'Can\'t find the a message in this channel by that id'));
      });
  }
}

module.exports = Gabort;
