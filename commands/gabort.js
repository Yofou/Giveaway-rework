const BaseCommand = require('../utils/baseCommand.js');

class Gabort extends BaseCommand {
  constructor(prefix) {
    super('abort', `abort [messageID]`, 'Aborts a giveaway so no winner will be picked', {
      prefix: prefix
    });
  }

  usageEmbed(error = '') {
    const data = [
      'messageID: the message id of the giveaway embed',
      'additional arguments: -c {channelID/mention/name}'
    ];
    const embed = this.RichEmbed().setColor('#7FB3D5');

    if (error) {
      embed.addField('An error has occurred!', error);
    }

    embed
      .addField('Usage', this.usage)
      .addField('Parameters Help', data.join('\n'))
      .addField(
        'Examples',
        `${this.prefix}abort 684767524671586305\n${this.prefix}abort 693871103478595704 -c 638096970996776977 \n${this.prefix}abort -c 638096970996776977 693871103478595704`
      )
      .setTimestamp();

    return embed;
  }

  async run(client, message, args){

    if (this.checkGiveawayPerms(message)) return message.channel.send( `<@${message.author.id}> Sorry but you dont have the required role or permissions to run this command` );

    let channel;
    if ( args.includes('-c') || args.includes('-channel') ){

      let index;
      if (args.includes('-c')) index = args.indexOf('-c')
      if (args.includes('-channel')) index = args.indexOf('-channel')

      if (index >= args.length - 1) return message.channel.send( this.usageEmbed( 'No argument passed into -c' ) )

      channel = args[index + 1]

      if ( !isNaN( Number( channel ) ) ) {
        channel = this.getChannelFromMention( message.guild.channels.cache,channel )
        if (!channel) return message.channel.send( this.usageEmbed('Cant find the channel by name/mention') )
      } else {
        channel = this.getChannelFromMention( message.guild.channels.cache,channel )
        if (!channel) return message.channel.send( this.usageEmbed('Cant find the channel by id') )
      }

      if ( !channel.permissionsFor(message.member).has('VIEW_CHANNEL') ) return message.channel.send( this.usageEmbed( 'Sorry but you don\'t have permission to view that channel' ) )

      args = args.filter(arg => {
          if (arg != args[index] && arg != args[index + 1]) return arg
        }
      )


    } else {
      channel = message.channel
    }

    let [messageID] = args
    if ( isNaN( Number( messageID ) ) ) return message.channel.send( this.usageEmbed( 'Invalid message id (Not a number)' ) )
    let giveawayDB = require( '../utils/databases/giveaway.json' )

    const msgChannel = message

    channel.messages
    .fetch(messageID)
    .then(message => {
        const orignalEmbed = message.embeds[0]

        const embed = this.RichEmbed()
          .setTitle( orignalEmbed.title )
          .setColor('#ff726f')
          .setDescription(`**Sorry but this giveaway has been cancelled**`)
          .setFooter(orignalEmbed.footer.text)

        message.edit(embed);
        message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        delete giveawayDB[messageID]
        this.saveJsonFile( './utils/databases/giveaway.json',JSON.stringify( giveawayDB,null,4 ) )
        msgChannel.channel.send(`😢 Giveaway Aborted 😢`)
    })
    .catch( e => {
      console.log(e)
      message.channel.send( this.usageEmbed( 'Cant find the a message in this channel by that id' ) )
    } )
  }
}


module.exports = Gabort
