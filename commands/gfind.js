const BaseCommand = require('../utils/baseCommand.js');
const moment = require('moment');
require('moment-precise-range-plugin'); // for precise difference time calculation
const DB = require('../databases/db.js')

class Gfind extends BaseCommand {
  constructor () {
    super('find', 'find', 'Shows all the Giveaway in a guild', {
      args: false
    });
    this.allias = ['gfind', 'glist', 'list'];
    this.usage += `\nAlias: ${this.allias.join(',')}`;
  }

  Chunk (arr, len) {
    const chunks = [];
    let i = 0;
    const n = arr.length;

    while (i < n) {
      chunks.push(arr.slice(i, (i += len)));
    }

    return chunks;
  }

  async run (client, message, args) {
    const allGiveaways = await DB.sequelize.models.giveaway.findAll()

    const fields = allGiveaways.filter( giveaway => message.guild.channels.cache.has(giveaway.channelID) )

    if (fields.length == 0) return message.channel.send('Hey they\'re no active giveaways going on right now in this guild.');

    const tChunks = this.Chunk(fields, 2);
    const embeds = []; let tEmbed;

    // Start to use nested arrays to iterate through the 2D chunk array we created
    for (const outer of tChunks) {
      // Start to init the embed we gonna use
      tEmbed = this.RichEmbed().setTitle(`${message.guild.name}, Giveaways`);

      tEmbed.setDescription('Shows all the current active giveaways in this guild');
      tEmbed.setColor('#7FB3D5');
      // Setup the rest of the embed here
      for (const inner of outer) {
        const timeLeft = moment(Date.now()).preciseDiff(inner.deadline);
        tEmbed.addField(
          `https://discordapp.com/channels/${message.guild.id}/${inner.channelID}/${inner.id}`,
          '```\n' +
            `🏷️ Title: ${inner.title}\n` +
            `⏰ Time Remaining: ${timeLeft}\n` +
            `🏆 Number of Winners: ${inner.winnerAmount}\n` +
            '```'
        );
      }
      // Adds to a 1D normal array of embeds for discord-paginationembed to iterate though
      embeds.push(tEmbed);
    }

    let reactions = {};
    this.menu(
      message,
      embeds,
      120000,
      (reactions = {
        first: '⏪',
        back: '◀',
        next: '▶',
        last: '⏩',
        stop: '⏹'
      }),
      true // override embed footers (with page number)
    );
  }
}

module.exports = Gfind;
