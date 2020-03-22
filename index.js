const Bot = require('./bot.js');
const fs = require('fs');

const client = new Bot('>');

client.buildCommands([['commands', './commands/']]);

client.buildDBs({ config: './utils/databases/config.json' });

client.setInterval( () => {
  let giveawayDB = require( './utils/databases/giveaway.json' );

  for (msgID in giveawayDB) {
    const giveawayObj = giveawayDB[msgID];

    channel = client.channels.cache.get(giveawayObj.channelID)
    channel.messages
    .fetch(msgID)
    .then(message => {

      if (Date.now() > giveawayObj.deadline) {
        const orignalEmbed = message.embeds[0]
        const msgUrl = message.url
        let users = message.reactions.cache.get('🎉').users
        .fetch()
        .then( (users) => {
          const embed = client.finishEmbed( users,orignalEmbed )
          message.edit( embed )
          delete giveawayDB[ message.id ]
          fs.writeFile('./utils/databases/giveaway.json', JSON.stringify( giveawayDB, null, 4 ) , 'utf8', function(err) {
            if (err) {
              console.log('An error occured while writing JSON Object to file.');
              return console.log(err);
            }
          });

          message.channel.send( embed.description + `\n${msgUrl}` )
        } )
      } else {
        message.edit( client.giveawayEmbed(giveawayObj) )
      }
    })
  }
}, 10000 )

client.login(client.config.get('token'));
