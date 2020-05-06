const Bot = require('./bot.js');
const fs = require('fs');
const glob = require('glob');
const { parse } = require('path');

if (!fs.existsSync(`${__dirname}/config.json`)){
  fs.writeFile(`./config.json`, JSON.stringify( { token: "place your bot token here", OWNER : "place the bot owner discord id here", defaultPrefix: "place your desired prefix here" }, null, 4 ) , 'utf8', function(err) {
    if (err) {
      console.log('An error occurred while writing JSON Object to file.');
      return console.log(err);
    }
    console.log( `${__dirname}/config.json has been generated.` )
  });
  return console.log( `Made ${__dirname}/databases\nplease fill out config.json created in the root folder` )
}


const client = new Bot();

client.buildDBs({ config: './config.json' });

client.on('ready', () => {
  client.buildCommands([['commands', './commands/']]);

  if (!fs.existsSync(`${__dirname}/databases`)) fs.mkdirSync(`${__dirname}/databases`);
  glob( `${__dirname}/databases/*.json`, (err,files) => {
    files = files.map( file => parse( file ).name );
    const dbs = ['giveaway','ignore','roles','widget','prefix'];

    dbs.forEach( item => {
      if ( !files.includes( item ) ) {
        fs.writeFile(`./databases/${item}.json`, JSON.stringify( {}, null, 4 ) , 'utf8', function(err) {
          if (err) {
            console.log('An error occurred while writing JSON Object to file.');
            return console.log(err);
          }
          console.log( `${__dirname}/databases/${item}.json has been generated.` )
        });
      }
    });

    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(`for ${client.prefix()}help`, { type: 'WATCHING' })
      .catch(err => console.error(err));
  } )
});

client.setInterval( () => {
  let giveawayDB = require( './databases/giveaway.json' );

  for (let msgID in giveawayDB) {
    const giveawayObj = giveawayDB[msgID];

    let channel = client.channels.cache.get(giveawayObj.channelID);
    channel.messages
    .fetch(msgID)
    .then(message => {

      if (Date.now() > giveawayObj.deadline) {
        const originalEmbed = message.embeds[0];
        const msgUrl = message.url;
        let users = message.reactions.cache.get('🎉').users
        .fetch()
        .then( (users) => {
          const embed = client.finishEmbed( users,originalEmbed );
          message.edit( embed )
            .catch(err => console.error(err));
          delete giveawayDB[ message.id ];
          fs.writeFile('./databases/giveaway.json', JSON.stringify( giveawayDB, null, 4 ) , 'utf8', function(err) {
            if (err) {
              console.log('An error occurred while writing JSON Object to file.');
              return console.log(err);
            }
          });

          message.channel.send( embed.description + `\n${msgUrl}` )
            .catch(err => console.error(err));
        } )
      } else {
        message.edit( client.giveawayEmbed(giveawayObj) )
          .catch(err => console.error(err));
      }
    })
  }
}, 10000 );

client.setInterval( () => {

  let widgets = require( './databases/widget.json' );

  for ( let messageID in widgets) {

    let widget = widgets[messageID];

    let guild = client.guilds.cache.get( widget.guildID );
    if (!guild) {delete widgets[messageID];continue}
    let channel = guild.channels.cache.get( widget.channelID );
    if (!channel) {delete widgets[messageID];continue}
    channel.messages
      .fetch(messageID)
        .then(message => {

          let tagFunctions = {
            roleCount : (val) => {
              let role;
              let counter = 0;
              val = val[0].split( ' ' );

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
          };

          let embed = message.embeds[0];
          embed.description = `${channel.toString()}\n${client.toWidget( widget.rawArgs,tagFunctions )}`;

          message.edit( embed )
            .catch(err => console.error(err))
        })
        .catch( err => {
          if (err.code == 10008) delete widgets[messageID]
        } )
  }

  fs.writeFile('./databases/widget.json', JSON.stringify( widgets, null, 4 ) , 'utf8', function(err) {
    if (err) {
      console.log('An error occurred while writing JSON Object to file.');
      return console.log(err);
    }
  });

}, 10000 );

client.login(client.config.get('token'))
  .catch(err => console.error(err));
