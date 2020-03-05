const BaseCommand = require('../utils/baseCommand.js');

class Gend extends BaseCommand {
  constructor(prefix) {
    super('end', `end [messageID]`, 'Ends/Rerolls a giveaway ahead of time', {
      prefix: prefix
    });
    this.allias = ['roll','groll','gend']
    this.usage += `\nAlias: ${ this.allias.join(',') }`
  }

  usageEmbed(error = '') {
    const data = [
      'messageID: the message id of the giveaway embed'
    ];
    const embed = this.RichEmbed().setColor('#7FB3D5');

    if (error) {
      embed.addField('An error has occurred!', error);
    }

    embed
      .addField('Usage', this.usage)
      .addField('Parameters Help', data.join('\n\n'))
      .addField(
        'Examples',
        `${this.prefix}end 684767524671586305 \n${this.prefix}roll 684767524671584326`
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
        channel = message.guild.channels.cache.get(channel)
        if (!channel) return message.channel.send( this.usageEmbed('Cant find the channel by id') )
      } else {
        channel = message.guild.channels.cache.get(channel.replace(/\D/g,''))
        if (!channel) return message.channel.send( this.usageEmbed('Cant find the channel by id') )
      }

      if ( !channel.permissionsFor(message.member).has('MANAGE_MESSAGES') ) return message.channel.send( this.usageEmbed( 'Sorry but you don\'t have permission to post a giveaway in that channel' ) )

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
        const msgUrl = message.url
        if (!orignalEmbed) return message.channel.send( this.usageEmbed( 'Not an embed message' ) )
        if (orignalEmbed.url != 'https://www.VerifedGiveaway.com/') return message.channel.send( this.usageEmbed( 'Invalid giveaway embed' ) )

        message.reactions.cache.get('🎉').users
        .fetch()
        .then( (users) => {

          const embed = client.finishEmbed( users,orignalEmbed )
          message.edit( embed )
          msgChannel.react( '👌' )
          delete giveawayDB[ messageID ]
          this.saveJsonFile('./utils/databases/giveaway.json',JSON.stringify( giveawayDB ))

          message.channel.send( embed.description + `\n${msgUrl}` )

        } )
        .catch( e => message.channel.send( this.usageEmbed( 'Uh oh unexpected error please contact Yofou#0420' ) ))

    })
    .catch( e => {
      message.channel.send( this.usageEmbed( 'Uh oh unexpected error please contact Yofou#0420' ) )
      console.log( e );
    } )
  }
}


module.exports = Gend
