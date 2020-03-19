const BaseCommand = require('../utils/baseCommand.js');

class Gpost extends BaseCommand {
  constructor(prefix) {
    super('post', 'post [time] [winners] [title] (-c argument) (-h argument)', 'Posts a giveaway', {
      prefix: prefix
    });
  }

  // If anything goes wrong or just the user needs some basic knowledge this function will be run
  usageEmbed(error = '') {
    const data = [
      'time: A unit of time for when the giveaway will end in the format of days:hours:minutes:seconds',
      'winners: The number of winners the giveaway will randomly pick',
      'title: Ideally what you\'re going to be giving away',
      'additional arguments: -h {text/mention} & -c {channelID/mention}'
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
        `${this.prefix}post 120 -h BonerKun 2 Hen*ai-MineSweeper\n${this.prefix}post 1:30:0 20 Minecraft account\n${this.prefix}post 5:0 5 Sani Soul -c 684767524671584326\n${this.prefix}post 2:15:43 1 Yofou diginity -c 684767524671586305 -h Geotim`
      )
      .setTimestamp();

    return embed;
  }

  // the main method of the command
  async run(client, message, args){

    if (this.checkGiveawayPerms(message)) return message.channel.send( `<@${message.author.id}> Sorry but you dont have the required role or permissions to run this command` );

    // First thing we need to do is grab and filter any optional arguments passed into the command. I.E -channel or -host
    let host;
    if ( args.includes('-h') || args.includes('-host') ){

      // find the index of the host argument
      let index;
      if (args.includes('-h')) index = args.indexOf('-h')
      if (args.includes('-host')) index = args.indexOf('-host')


      // makes sure atleast there is an argument next to the optional arg
      if (index >= args.length - 1) return message.channel.send( this.usageEmbed( 'No argument passed into -h' ) )

      // grab and validate it
      host = args[index + 1]
      if ( !isNaN( Number( host ) ) ) {
        let tag = message.channel.members.get( host )
        if (!tag) return message.channel.send( this.usageEmbed('Cant find the user by id') )
        host = tag.user.tag
      }

      // then remove it from main args array
      args = args.filter(arg => {
          if (arg != args[index] && arg != args[index + 1]) return arg
        }
      )


    } else {
      host = message.author.tag
    }

    let channel;
    if ( args.includes('-c') || args.includes('-channel') ){

      // find the index of the channel argument
      let index;
      if (args.includes('-c')) index = args.indexOf('-c')
      if (args.includes('-channel')) index = args.indexOf('-channel')

      // makes sure atleast there is an argument next to the optional arg
      if (index >= args.length - 1) return message.channel.send( this.usageEmbed( 'No argument passed into -c' ) )

      // grab and validate it
      channel = args[index + 1]
      if ( !isNaN( Number( channel ) ) ) {
        channel = message.guild.channels.cache.get(channel)
        if (!channel) return message.channel.send( this.usageEmbed('Cant find the channel by id') )
      } else {
        channel = message.guild.channels.cache.get(channel.replace(/\D/g,''))
        if (!channel) return message.channel.send( this.usageEmbed('Cant find the channel by id') )
      }

      // check if they have permission to use this channel
      if ( !channel.permissionsFor(message.member).has('MANAGE_SERVER') ) return message.channel.send( this.usageEmbed( 'Sorry but you don\'t have permission to post a giveaway in that channel' ) )

      // remove the optional argument out of the main args array
      args = args.filter(arg => {
          if (arg != args[index] && arg != args[index + 1]) return arg
        }
      )


    } else {
      channel = message.channel
    }

    // destructure the arguments out of the main array
    let [ time,winners,...description ] = args
    description = description.join( ' ' ); // makes description just a string

    // some basic validation to make sure they exist or is atleast usable
    if ( !time ) return message.channel.send( this.usageEmbed('Time argument wasn\'t passed in') )
    if (!winners) return message.channel.send( this.usageEmbed('Winner argument wasn\'t passed in') )
    if (description.length == 0) return message.channel.send( this.usageEmbed('Title argument wasnt passed in') )
    if (description.length >= 256) return message.channel.send( this.usageEmbed('Can\'t make the title larger than 256 characters') )

    // if time argument isnt a straight up number passed in try to convert it into one
    if ( isNaN( Number( time ) ) ) {
      // checks if
      if (!time.includes(':')) return message.channel.send( this.usageEmbed('Invalid time format') )
      time = time.split(':')
      if (time.length > 4) return message.channel.send( this.usageEmbed('Too many numbers passed in') )

      let milli = 0

      for (var i = 0; i < time.length; i++) {
        let item = Number(time[(time.length - 1) - i])
        if (isNaN(item)) return message.channel.send( this.usageEmbed( `${item} is not a number`) )

        if (i == 3) {milli += item * 24 * (1000 * Math.pow(60,i - 1))}
        else {milli += item * (1000 * Math.pow(60,i))}
      }

      time = milli

    } else {
      time = Number( time ) * 1000
    }

    // set a range of 0 - 2 months for the time
    if (time <= 0) return message.channel.send( this.usageEmbed( 'Time argument cant be 0 or smaller' ) )
    if (time >= 5184000000) return message.channel.send( this.usageEmbed( 'What is even the point cunt...' ).setImage( 'https://i.imgur.com/DWrI2JY.gif' ) )

    // set a range of 0 - what ever number you can think of
    if ( isNaN( Number( winners ) ) ) return message.channel.send( this.usageEmbed(`${winners} is not a number`) )
    winners = Number( winners )
    if ( winners <= 0 ) return message.channel.send( this.usageEmbed('Winner argument cant be 0 or smaller') )

    // structure the giveaway object
    const giveawayObj = {
      host : host,
      deadline: Date.now() + time,
      title : description,
      winnerAmount : winners,
      channelID : channel.id
    }

    // send that baby out to the world :)
    channel.send( client.giveawayEmbed( giveawayObj ) ).then(message => {
      message.react( '🎉' )
      let giveawayDB = require( '../utils/databases/giveaway.json' )
      giveawayDB[message.id] = giveawayObj
      this.saveJsonFile('./utils/databases/giveaway.json',JSON.stringify( giveawayDB,null,4 ))
    })

  }
}


module.exports = Gpost
