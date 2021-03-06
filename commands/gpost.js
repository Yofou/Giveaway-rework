const BaseCommand = require('../utils/baseCommand.js');
const isImageUrl = require('is-image-url');
const DB = require('../databases/db.js')

class Gpost extends BaseCommand {
  constructor () {
    super('post', 'post [time] [winners] [title] (-c argument) (-h argument) (-img url)', 'Posts a giveaway');

    this.caseSensitiveArgs = true;
  }

  // If anything goes wrong or just the user needs some basic knowledge this function will be run
  usageEmbed (prefix, error = '') {
    const data = [
      'time: A unit of time for when the giveaway will end in the format of days:hours:minutes:seconds',
      'winners: The number of winners the giveaway will randomly pick',
      'title: Ideally what you\'re going to be giving away',
      'additional arguments: -h {text/mention}, -c {channelID/mention/name},\n-img {valid url: that ends with a file extenstion}'
    ];
    const embed = this.RichEmbed().setColor('#7FB3D5');

    if (error) {
      embed.addField('An error has occurred!', error);
    }

    embed
      .addField('Usage', `${prefix}${this.usage}`)
      .addField('Parameters Help', data.join('\n\n'))
      .addField(
        'Examples',
        `${prefix}post 120 -h BonerKun 2 Hen*ai-MineSweeper\n${prefix}post 1:30:0 20 Minecraft account\n${prefix}post 5:0 5 Sani Soul -c 684767524671584326\n${prefix}post 2:15:43 1 Yofou dignity -c 684767524671586305 -h Geotim`
      )
      .setTimestamp();

    return embed;
  }

  // the main method of the command
  async run (client, message, args) {
    if (await this.checkGiveawayPerms(message)) return message.channel.send(`<@${message.author.id}> Sorry but you dont have the required role or permissions to run this command`);

    let prefix = await client.prefix(message)

    // First thing we need to do is grab and filter any optional arguments passed into the command. I.E -channel or -host
    let host = `<@${message.author.id}>`;
    let lowerArgs = args.map(arg => arg.toLowerCase());
    if (lowerArgs.includes('-h') || lowerArgs.includes('-host')) {
      // find the index of the host argument
      let index;
      if (lowerArgs.includes('-h')) index = lowerArgs.indexOf('-h');
      if (lowerArgs.includes('-host')) index = lowerArgs.indexOf('-host');

      // makes sure at least there is an argument next to the optional arg
      if (index >= args.length - 1) return message.channel.send(this.usageEmbed(prefix, 'No argument passed into -h'));

      // grab and validate it
      host = args[index + 1];
      if (isNaN(Number(host))) {
        const tag = message.channel.members.find(member => member.displayName.toLowerCase() == host.toLowerCase());
        if (tag) host = `<@${tag.user.id}>`;
      } else {
        const tag = message.channel.members.get(host);
        if (!tag) return message.channel.send(this.usageEmbed(prefix, `Sorry but I can\'t the userID by ${host} in this channel`));
        host = `<@${tag.user.id}>`;
      }

      // then remove it from main args array
      args = args.filter(arg => {
        if (arg != args[index] && arg != args[index + 1]) return arg;
      }
      );
    }

    let image = null;
    lowerArgs = args.map(arg => arg.toLowerCase());
    if (lowerArgs.includes('-img') || lowerArgs.includes('-image')) {
      // find the index of the host argument
      let index;
      if (lowerArgs.includes('-img')) index = lowerArgs.indexOf('-img');
      if (lowerArgs.includes('-image')) index = lowerArgs.indexOf('-image');

      // makes sure at least there is an argument next to the optional arg
      if (index >= args.length - 1) return message.channel.send(this.usageEmbed(prefix, 'No argument passed into -img or -image'));

      image = args[index + 1];
      if (isImageUrl(image) == false) return message.channel.send(this.usageEmbed(prefix, 'Url either doesn\'t exist or doesn\'t return a image for me to use\nPlease make sure the url ends with a image file extenstion on the end'));

      // then remove it from main args array
      args = args.filter(arg => {
        if (arg != args[index] && arg != args[index + 1]) return arg;
      });
    }

    let channel = await this.channelValidation(message, args);
    if (channel.error) return message.channel.send(this.usageEmbed(prefix, channel.error));
    args = channel.args;
    channel = channel.channel;

    // destructure the arguments out of the main array
    let [time, winners, ...description] = args;
    description = description.join(' '); // makes description just a string

    // some basic validation to make sure they exist or is at least usable
    if (!time) return message.channel.send(this.usageEmbed(prefix, 'Time argument wasn\'t passed in'));
    if (!winners) return message.channel.send(this.usageEmbed(prefix, 'Winner argument wasn\'t passed in'));
    if (description.length == 0) return message.channel.send(this.usageEmbed(prefix, 'Title argument wasn\'t passed in'));
    if (description.length >= 256) return message.channel.send(this.usageEmbed(prefix, 'Can\'t make the title larger than 256 characters'));

    // if time argument isn't a straight up number passed in try to convert it into one
    if (isNaN(Number(time))) {
      // checks if
      if (!time.includes(':')) return message.channel.send(this.usageEmbed(prefix, 'Invalid time format'));
      time = time.split(':');
      if (time.length > 4) return message.channel.send(this.usageEmbed(prefix, 'Too many numbers passed in'));

      let milli = 0;

      for (let i = 0; i < time.length; i++) {
        const item = Number(time[(time.length - 1) - i]);
        if (isNaN(item)) return message.channel.send(this.usageEmbed(prefix, `${item} is not a number`));

        if (i == 3) { milli += item * 24 * (1000 * Math.pow(60, i - 1)); } else { milli += item * (1000 * Math.pow(60, i)); }
      }

      time = milli;
    } else {
      time = Number(time) * 1000;
    }

    // set a range of 0 - 2 months for the time
    if (time <= 0) return message.channel.send(this.usageEmbed(prefix, 'Time argument can\'t be 0 or smaller'));
    if (time >= 5184000000) return message.channel.send(this.usageEmbed(prefix, 'What is even the point cunt...').setImage('https://i.imgur.com/DWrI2JY.gif'));

    // set a range of 0 - what ever number you can think of
    if (isNaN(Number(winners))) return message.channel.send(this.usageEmbed(prefix, `${winners} is not a number`));
    winners = Number(winners);
    if (winners <= 0) return message.channel.send(this.usageEmbed(prefix, 'Winner argument can\'t be 0 or smaller'));
    if (winners > message.guild.memberCount) return message.channel.send(this.usageEmbed(prefix, 'Winner argument can\'t be more than the guilds member count'));

    // structure the giveaway object
    const giveawayObj = {
      host: host,
      deadline: Date.now() + time,
      title: description,
      winnerAmount: winners,
      channelID: channel.id,
      image: image
    };

    // send that baby out to the world :)
    channel.send(client.giveawayEmbed(giveawayObj))
      .then( async (giveawayMsg) => {
        giveawayMsg.react('🎉').catch(err => console.error(err)); ;
        giveawayMsg.pin().catch(err => console.error(err));
        message.react('🥳').catch(err => console.error(err)); ;
        await DB.sequelize.models.giveaway.create({
          id: giveawayMsg.id,
          ...giveawayObj
        })
      })
      .catch(err => {
        message.react('❌')
          .then(() => message.reply('Something has went terribly wrong please contact Yofou#0420.'))
          .catch(err => console.error(err));

        console.error(err);
      });
  }
}

module.exports = Gpost;
