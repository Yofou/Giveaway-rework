const BaseCommand = require('../utils/baseCommand.js');

class Gcreate extends BaseCommand {
  constructor(prefix) {
    super('create', 'create', `An interactive setup alternative of ${prefix}post`, {
      args: false,
      prefix: prefix
    })
    this.allias = ['gcreate'];
    this.usage += `\nAlias: ${ this.allias.join(',') }`;

  }

  askQuestions(message,questions,answers,index = 0,retry = 1){
    if (index == questions.length) return message.client.commands.find(cmd => cmd.name == 'post').run(message.client,message,answers)

    message.channel.send(questions[index][0]).then(() => {

      message.channel.awaitMessages(responce => responce.author.id == message.author.id, { max: 1, time: 30000, errors: ['time'] })
    		.then(collected => {
          let answer = collected.first().content
          if (answer.toLowerCase() == 'cancel') return collected.first().react( '👌' )
          if ( questions[index][1]( answer ) ) {

            if ( index == 4 ) {
              answers.push('-c')
              if( answer.toLowerCase() == 'here' ) answer = message.channel.id
            }
            if ( index == 3 ) {
              answers.push('-h')
              if( answer.toLowerCase() == 'me' ) answer = message.author.id
            }
            answers.push( answer );
            this.askQuestions(message,questions,answers,index + 1)
          } else if (retry == 3){
            message.channel.send( 'Too many attempts' )
          } else {
            this.askQuestions(message,questions,answers,index,retry + 1)
          }
    		})
    		.catch(collected => {
          console.log(collected)
          message.channel.send( 'you took to long to respond :(' )
    		});

    });
  }

  async run(client, message, args){
    this.askQuestions(message,[
      ['Alright lets get started (type **cancel** at any time to abort the giveaway),\nHow long is this giveaway going to last for? `in the format of **days:hours:minutes:seconds**`',(answer) => {
        let time = Number( answer )
        if ( isNaN( time ) ) {
          if (!answer.includes(':')) {message.channel.send( `**${answer}** is an invalid time format, try again` );return false}
          answer = answer.split(':')
          if (answer.length > 4) {message.channel.send( `too many time arguments passed in, try again` );return false}

          let milli = 0

          for (var i = 0; i < answer.length; i++) {
            let item = Number(answer[(answer.length - 1) - i])
            if (isNaN(item)) {message.channel.send( `**${item}** is not a number, try again` );return false}

            if (i == 3) {milli += item * 24 * (1000 * Math.pow(60,i - 1))}
            else {milli += item * (1000 * Math.pow(60,i))}
          }

          time = milli
        }

        if ( time <= 0 ) {message.channel.send('Giveaway duration cant be 0 or smaller, try again');return false}
        if (time >= 5184000000) {message.channel.send('Giveaway duration cant be larger than 2 months sorry, try again');;return false}

        return true
      }],
      ['Sweet, how many winners?',(answer) => {
        answer = Number(answer)
        if ( isNaN(answer) ) {message.channel.send( `**${answer}** is not a number, try again` );return false}
        if ( answer < 1) {message.channel.send( `**${answer}** is too small you fool, try again` );return false}
        return true
      }],
      ['What about the title?',(answer) => {
        let val = answer.length < 256
        if (!val) message.channel.send( 'Title needs to be 256 characters or less, try again' )
        return val
      }],
      ['Oh! before I forget who is hosting the giveaway? **(type `me` if you want to set yourself as the host)**', (answer) => {
        if ( answer.toLowerCase() == 'me') return true

        if ( !isNaN( Number( answer ) ) ) {
          let tag = message.channel.members.get( answer )
          if (!tag) {message.channel.send( `Cant find the channel by the id of **${answer}**, try again` );return false}
        }

        return true
      }],
      ['and... the channel? **(type `here` if you want the giveaway to be posted in this channel)**',(answer) => {
        if (answer.toLowerCase() == 'here') return true

        let channel;
        if ( isNaN( Number( answer ) ) ) {
          channel = message.guild.channels.cache.get(answer.replace(/\D/g,''))
          if (!channel) {message.channel.send( `Cant find the channel by the mention of **${answer}**, try again` );return false}
        } else {
          channel = message.guild.channels.cache.get(answer)
          if (!channel) {message.channel.send( `Cant find the channel by the id of **${answer}**, try again` );return false}
        }

        // check if they have permission to use this channel
        if ( !channel.permissionsFor(message.member).has('MANAGE_SERVER') ) {message.channel.send( `Sorry but you dont have the correct permission to send to this channel, pick another` );return false}

        return true

      }]
    ],[])
  }

}


module.exports = Gcreate
