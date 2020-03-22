const BaseCommand = require('../utils/baseCommand.js');
const moment = require('moment');
require('moment-precise-range-plugin'); // for precide difference time calcucaltion

class Gfind extends BaseCommand {
  constructor(prefix) {
    super('find', `find`, 'Shows all the Giveaway in a guild', {
      prefix: prefix,
      args: false,
    });
    this.allias = ['gfind']
    this.usage += `\nAlias: ${ this.allias.join(',') }`
  }


  Chunk(arr, len) {
    let chunks = [],
      i = 0,
      n = arr.length;

    while (i < n) {
      chunks.push(arr.slice(i, (i += len)));
    }

    return chunks;
  }


  async run( client,message,args ) {

    let Giveaways = require( '../utils/databases/giveaway.json' )
    let fields = []; // We will push giveaway objects in here if valid

    for ( let GiveawayID in Giveaways ){
      let obj = Giveaways[ GiveawayID ]
      obj['messageID'] = GiveawayID
      if ( message.guild.channels.cache.has(obj.channelID) ) fields.push( obj )
    }

    if (fields.length == 0) return message.channel.send( 'Hey they\'re no active giveaways going on right now in this guild.' )

    let tChunks = this.Chunk(fields, 2);
    let embeds = [],tEmbed;


    // Start to use nested arrays to iterate through the 2D chunck array we created
    for (let outer of tChunks) {
      // Start to init the embed we gonna use
      tEmbed = this.RichEmbed().setTitle(`${message.guild.name}, Giveaways`);

      tEmbed.setDescription('Shows all the current active giveaways in this guild');
      tEmbed.setColor('#7FB3D5');
      // Setup the rest of the embed here
      for (let inner of outer) {
        let timeLeft = moment( Date.now() ).preciseDiff( inner.deadline )
        tEmbed.addField(
          `https://discordapp.com/channels/${message.guild.id}/${inner.channelID}/${inner.channelID}/${inner.messageID}`,
          `\`\`\`\n` +
            `🏷️ Title: ${inner.title}\n` +
            `⏰ Time Remaining: ${timeLeft}\n` +
            `🏆 Number of Winners: ${inner.winnerAmount}\n` +
            `\`\`\``
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

module.exports = Gfind
