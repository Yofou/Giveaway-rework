const BaseCommand = require('../utils/baseCommand.js');
const DB = require('../databases/db.js');

class Gend extends BaseCommand {
  constructor () {
    super('end', 'end [messageID]', 'Ends/Reroll a giveaway ahead of time');
    this.allias = ['roll', 'groll', 'gend', 'gcancel', 'cancel'];
    this.usage += `\nAlias: ${this.allias.join(',')}`;
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
        `${prefix}end 684767524671586305 \n${prefix}roll 684767524671584326\n${prefix}end 693871103478595704 -c 638096970996776977 \n${prefix}roll -c 638096970996776977 693871103478595704`
      )
      .setTimestamp();

    return embed;
  }

  async run (client, message, args) {
    if (this.checkGiveawayPerms(message)) return message.channel.send(`<@${message.author.id}> Sorry but you dont have the required role or permissions to run this command`);

    let channel = this.channelValidation(message, args);
    if (channel.error) return message.channel.send(this.usageEmbed(client.prefix(message), channel.error));
    args = channel.args;
    channel = channel.channel;

    // First thing we need to do is grab and filter any optional arguments passed into the command. I.E -channel or -host
    let verifcationLink = 'https://github.com/Yofou/Giveaway-rework';
    const lowerArgs = args.map(arg => arg.toLowerCase());

    if (lowerArgs.includes('-o') || lowerArgs.includes('-old')) {
      verifcationLink = 'https://www.VerifedGiveaway.com/';
      args = args.filter(arg => !(arg.toLowerCase() == '-o' || arg.toLowerCase() == '-old'));
    }

    const [messageID] = args;
    if (isNaN(Number(messageID))) return message.channel.send(this.usageEmbed(client.prefix(message), 'Invalid message id (Not a number)'));

    const msgChannel = message;

    channel.messages
      .fetch(messageID)
      .then(message => {
        const originalEmbed = message.embeds[0];
        const msgUrl = message.url;
        if (!originalEmbed) return msgChannel.channel.send(this.usageEmbed(client.prefix(message), 'Not an embed message'));
        if (originalEmbed.url != verifcationLink) return msgChannel.channel.send(this.usageEmbed(client.prefix(message), `Invalid giveaway embed\n\nIf this happens to be an old giveaway (you can check by clicking the title and if it redirects you to \`https://www.VerifedGiveaway.com/\`) then add a **-o or -old** at the end of this command to be able to end/roll old giveaways.\nExample is ${client.prefix(message)}end 714211179987337337 -o`));

        message.reactions.cache.get('🎉').users
          .fetch()
          .then( async (users) => {
            const embed = client.finishEmbed(users, originalEmbed);
            message.edit(embed);
            message.unpin().catch(err => console.error(err));
            msgChannel.react('👌');

            const giveaway = await DB.sequelize.models.giveaway.findByPk( message.id )
            if (giveaway) await giveaway.destroy()

            message.channel.send(`Prize: **${embed.title}**\n${embed.description}\n${msgUrl}`);
          })
          .catch(e => message.channel.send(this.usageEmbed(client.prefix(message), 'Uh oh unexpected error please contact Yofou#0420')));
      })
      .catch(e => {
        message.channel.send(this.usageEmbed(client.prefix(message), 'Can\'t find the a message in this channel by that id'));
      });
  }
}

module.exports = Gend;
