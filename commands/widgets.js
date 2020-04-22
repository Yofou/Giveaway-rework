const BaseCommand = require('../utils/baseCommand.js');

class Widgets extends BaseCommand {
  constructor(prefix) {
    super('widget', 'widget', 'creates custom messages with widgets', {
      prefix: prefix
    })
    this.allias = ['widgets']
    this.caseSensitiveArgs = true;
  }

  usageEmbed(error = '') {
    const data = [
      'roleCount: @RoleMention/<RoleID>/RoleName Also add a space to make it count more than 1 role',
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
        `${this.prefix}widget {roleCount: @Member 685107365342609418 Admin } / 500\n${this.prefix}widget -c {channelID/mention/name} {roleCount: @Member 685107365342609418 Admin } / 500`
      )
      .setTimestamp();

    return embed;
  }

  roleMentionResolver(cache,mention){
    if (!mention) return;

    if (mention.startsWith('<@&') && mention.endsWith('>') ) {
      mention = mention.slice(3, -1);

      if (mention.startsWith('!')) {
        mention = mention.slice(1);
      }
    }

    return cache.find(
      role => role.name == mention || role.id == mention
    );
  }

  async run(client, message, args){

    if (!message.member.hasPermission( 'ADMINISTRATOR' )) return message.channel.send( `Sorry <@${message.author.id}> but you don't have permission to execute this command, I know smh...` )

    let channel = this.channelValidation(message,args)
    if (channel.error) return message.channel.send( this.usageEmbed( channel.error ) );
    args = channel.args
    channel = channel.channel

    let tagFunctions = {
      roleCount : (val) => {
        let role;
        let counter = 0
        val = val[0].split( ' ' )

        for (let rawRoles of val){
          role = this.roleMentionResolver( message.guild.roles.cache, rawRoles )
          if (role) counter += role.members.size
        }

        return counter
      }
    }

    const embed = this.RichEmbed()
      .setColor('#7FB3D5')
      .setDescription(`${channel.toString()}\n${client.toWidget( args.join( ' ' ),tagFunctions )}`)

    channel.send( embed )
      .then( msg => {
        message.delete()

        let widget = require( '../utils/databases/widget.json' )

        widget[ msg.id ] = {
          channelID : channel.id,
          guildID: message.guild.id,
          rawArgs : args.join(' ')
        }

        this.saveJsonFile( './utils/databases/widget.json', JSON.stringify( widget,null,4 ) )
      })

  }

}


module.exports = Widgets