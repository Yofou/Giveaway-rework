const BaseCommand = require('../utils/baseCommand.js');
const fs = require('fs');
const DB = require('../databases/db.js')

class Gignore extends BaseCommand {
  constructor () {
    super(
      'ignore',
      'ignore [channel_(id/mention/name) | all | clear | list]',
      'Allows the bot to ignore a channel\n*(run again to remove channel from list)*',
      {
        args: true
      }
    );
  }

  usageEmbed (prefix, error = '') {
    const data = [];
    data.push('**channel_id:** 18 digits (turn on developer mode to see them)');
    data.push('**channel_mention:** example - #general');
    data.push('**channel_name:** example - general');
    data.push('**all:** ignore all channels, except current one');
    data.push('**clear:** clear ignore list');
    data.push('**list:** show current ignore list');

    const embed = this.RichEmbed().setColor('#7FB3D5');

    if (error) {
      embed.addField('An error has occurred!', error);
    }

    embed
      .addField('Usage', `${prefix}${this.usage}`)
      .addField('Options', data.join('\n'))
      .setTimestamp();

    return embed;
  }

  async run (client, message, args) {
    // some perm checking
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return message.reply(
        this.usageEmbed(await client.prefix(message), 'Sorry but you don\'t have the **ADMINISTRATOR** permission!')
      );
    }

    let channelID = args[0];

    switch (channelID) {
      case 'all':
        {
          // grab all text channels, except current one
          let channels = message.guild.channels.cache.filter(
            channel =>
              channel.id != message.channel.id && channel.type == 'text'
          );

          // create mentionable channels for user response
          let mentions = channels
            .filter(channel => channel.viewable)
            .map(channel => `<#${channel.id}>`)
            .join(', ');

          // if not all channels are viewable add in some extra details
          if (!channels.every(channel => channel.viewable)) { mentions += ' and all private channels'; }

          const channelDB = await DB.sequelize.models.channel.findAll({
            where: {
              guildID: message.guild.id
            }
          })

          const allChannelDbIds = channelDB.map( channel => channel.channelID )

          channels = channels
            .map(channel => channel.id)
            .filter( channel => !allChannelDbIds.includes( channel ) );

          channels.forEach( async (channel) => {
            await DB.sequelize.models.channel.create({
              channelID: channel,
              guildID: message.guild.id
            })
          });


          message.channel.send(`Will now restrict from posting giveaways in ${mentions} (except for this channel)`)
            .catch(err => console.error(err));
        }
        break;
      case 'clear':
        {

          try {

            await DB.sequelize.models.channel.destroy({
              where: {
                guildID: message.guild.id
              }
            })

            message.channel.send('all channels can be used for giveaways!')
            .catch(err => console.error(err));
          } catch (e) {
            message.channel.send('Uh oh something went wrong, please contact Yofou#0420')
            console.log(e);
          }

        }
        break;
      case 'list':
        {
          const channelsIgnored = await DB.sequelize.models.channel.findAll({
            where: {
              guildID: message.guild.id
            }
          })

          if (channelsIgnored.length == 0) {
            return message.channel.send('Not ignoring any channel');
          }

          let mentions = channelsIgnored
            .map(channel => `<#${channel.channelID}>`)
            .join(', ');

          // if not all channels are viewable add in some extra details
          if (
            !message.guild.channels.cache
              .filter(channel => channelsIgnored.map( entitiy => entitiy.channelID ).includes(channel.id))
              .every(channel => channel.viewable)
          ) { mentions += ' and all private channels'; }

          message.channel.send(`Restricted channels: ${mentions}`)
            .catch(err => console.error(err));
        }
        break;
      default:
        {
          // // Data validation
          // if (channelID.length != 18)
          //   return message.channel.send(this.usageEmbed('Invalid channel ID - should be 18 digits'));

          const channel = this.getChannelFromMention(
            message.guild.channels.cache,
            channelID
          );
          if (!channel) {
            return message.channel.send(
              this.usageEmbed(await client.prefix(message), `Can't find the channel by \`${channelID}\``)
            );
          }
          channelID = channel.id;

          const ignoredChannel = await DB.sequelize.models.channel.findOne({
            where: {
              channelID: channelID
            }
          })
          // remove or add to list
          if (ignoredChannel) {
            ignoredChannel.destroy()
            message.channel.send(`Removed <#${channelID}> from giveaway restrictions!`)
              .catch(err => console.error(err));
          } else {
            await DB.sequelize.models.channel.create({
              channelID: channelID,
              guildID: message.guild.id
            }).catch(err => console.error(err));

            message.channel.send(`Will now restrict from posting giveaways in <#${channelID}>`)
              .catch(err => console.error(err));
          }
        }
        break;
    }
  }
}

module.exports = Gignore;
