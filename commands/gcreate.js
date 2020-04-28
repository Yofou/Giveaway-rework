const BaseCommand = require('../utils/baseCommand.js');

class Gcreate extends BaseCommand {
  constructor (prefix) {
    super('create', 'create', `An interactive setup alternative of ${prefix}post`, {
      args: false,
      prefix: prefix
    });
    this.allias = ['gcreate'];
    this.usage += `\nAlias: ${this.allias.join(',')}`;
  }

  // This is a recursive method that will repeat this cycle until all the questions have been answered correctly.
  // ask question --> listen for answer --> validate answer --> save answer in an array
  askQuestions (message, questions, answers, index = 0, retry = 1) {
    // If all questions have been answer stop the recursive loop and start processing all the answers into >post command
    if (index == questions.length) {
      message.channel.send('🎉 Giveaway Created 🎉');
      return message.client.commands.find(cmd => cmd.name == 'post').run(message.client, message, answers);
    }

    // Send question
    message.channel.send(questions[index][0]).then(() => {
      // Listen for a answer
      message.channel.awaitMessages(response => response.author.id == message.author.id, { max: 1, time: 120000, errors: ['time'] })
    		.then(collected => {
          let answer = collected.first().content;
          if (answer.toLowerCase() == 'cancel') return collected.first().react('👌');
          if (questions[index][1](answer)) {
            // Some prefix so the >post know where talking about the channel selection or who hosting the giveaway
            if (index == 4) {
              answers.push('-c');
              if (answer.toLowerCase() == 'here') answer = message.channel.id;
            }
            if (index == 3) {
              answers.push('-h');
              if (answer.toLowerCase() == 'me') answer = message.author.id;
            }

            // Add the answer the data structure
            answers.push(answer);
            this.askQuestions(message, questions, answers, index + 1);
          } else if (retry == 3) {
            // If to many tries give up listening
            message.channel.send('Too many attempts');
          } else {
            // if answer failed the validation phase then add one to the retry counter
            this.askQuestions(message, questions, answers, index, retry + 1);
          }
    		})
    		.catch(collected => {
          console.log(collected);
          message.channel.send('you took to long to respond :(');
    		});
    });
  }

  // This just runs the recursive method called askQuestions
  async run (client, message, args) {
    if (this.checkGiveawayPerms(message)) return message.channel.send(`<@${message.author.id}> Sorry but you dont have the required role or permissions to run this command`);

    // There a lot going on here i wont add a comment through everything but ill give the basic structure of the actual parameters
    // message = the discord.js message class builder
    // questions = [
    //                [{question : string},{answer validation : arrow-function}],
    //                ...
    //             ]
    // answers = []; this is just a chosen data structure for me to put the answers into
    // index = {number : int}; default is 0
    // retry = {number : int}; default is 0 and recommended to keep it that way

    this.askQuestions(message, [
      ['Alright lets get started (type **cancel** at any time to abort the giveaway),\nHow long is this giveaway going to last for? **`in the format of days:hours:minutes:seconds`**', (answer) => {
        let time = Number(answer);
        if (isNaN(time)) {
          if (!answer.includes(':')) { message.channel.send(`**${answer}** is an invalid time format, try again`); return false; }
          answer = answer.split(':');
          if (answer.length > 4) { message.channel.send('too many time arguments passed in, try again'); return false; }

          let milli = 0;

          for (let i = 0; i < answer.length; i++) {
            const item = Number(answer[(answer.length - 1) - i]);
            if (isNaN(item)) { message.channel.send(`**${item}** is not a number, try again`); return false; }

            if (i == 3) { milli += item * 24 * (1000 * Math.pow(60, i - 1)); } else { milli += item * (1000 * Math.pow(60, i)); }
          }

          time = milli;
        }

        if (time <= 0) { message.channel.send('Giveaway duration can\'t be 0 or smaller, try again'); return false; }
        if (time >= 5184000000) { message.channel.send('Giveaway duration can\'t be larger than 2 months sorry, try again'); return false; }

        return true;
      }],
      ['Sweet, how many winners?', (answer) => {
        answer = Number(answer);
        if (isNaN(answer)) { message.channel.send(`**${answer}** is not a number, try again`); return false; }
        if (answer < 1) { message.channel.send(`**${answer}** is too small you fool, try again`); return false; }
        if (answer > message.guild.memberCount) { message.channel.send('Winner argument can\'t be more than the guilds member count, try again'); return false; }
        return true;
      }],
      ['What about the title?', (answer) => {
        const val = answer.length < 256;
        if (!val) message.channel.send('Title needs to be 256 characters or less, try again');
        return val;
      }],
      ['Oh! before I forget who is hosting the giveaway? **(type `me` if you want to set yourself as the host)**', (answer) => {
        if (answer.toLowerCase() == 'me') return true;

        if (!isNaN(Number(answer))) {
          const tag = message.channel.members.get(answer);
          if (!tag) { message.channel.send(`Can\'t find the channel by the id of **${answer}**, try again`); return false; }
        }

        return true;
      }],
      ['and... the channel? **(type `here` if you want the giveaway to be posted in this channel)**', (answer) => {
        if (answer.toLowerCase() == 'here') answer = message.channel.id;

        const channel = this.channelValidation(message, ['-c', answer]);
        if (channel.error) { message.channel.send(channel.error); return false; }

        return true;
      }]
    ], []);
  }
}

module.exports = Gcreate;
