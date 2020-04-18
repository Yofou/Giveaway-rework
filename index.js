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

client.setInterval( () => {

  let widgets = require( './utils/databases/widget.json' )

  for ( messageID in widgets) {

    let widget = widgets[messageID]

    let guild = client.guilds.cache.get( widget.guildID )
    if (!guild) {delete widgets[messageID];continue}
    let channel = guild.channels.cache.get( widget.channelID )
    if (!channel) {delete widgets[messageID];continue}
    channel.messages
      .fetch(messageID)
        .then(message => {

          let tagFunctions = {
            roleCount : (val) => {
              let role;
              let counter = 0
              val = val[0].split( ' ' )

              for (let rawRoles of val){
                if (rawRoles.startsWith('<@&') && rawRoles.endsWith('>') ) {
                  rawRoles = rawRoles.slice(3, -1);

                  if (rawRoles.startsWith('!')) {
                    rawRoles = rawRoles.slice(1);
                  }
                }

                let role = guild.roles.cache.find( role => role.name == rawRoles || role.id == rawRoles );
                if (role) counter += role.members.size
              }

              return counter
            }
          }

          let embed = message.embeds[0]
          embed.description = `${channel.toString()}\n${client.toWidget( widget.rawArgs,tagFunctions )}`

          message.edit( embed )
        })
        .catch( err => {
          if (err.code == 10008) delete widgets[messageID]
        } )
  }

  fs.writeFile('./utils/databases/widget.json', JSON.stringify( widgets, null, 4 ) , 'utf8', function(err) {
    if (err) {
      console.log('An error occured while writing JSON Object to file.');
      return console.log(err);
    }
  });

}, 10000 )

client.login(client.config.get('token'));
