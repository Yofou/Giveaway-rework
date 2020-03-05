const BaseCommand = require('../utils/baseCommand.js');

class Grole extends BaseCommand {
  constructor(prefix) {
    super('role', `role [roleID/roleMention]`, 'Toggle on/off roles to overide permission to do giveaway commands', {
      prefix: prefix
    });
    this.allias = [
      'roles',
      'grole',
      'groles'
    ]
    this.usage += `\nAlias: ${ this.allias.join(',') }`
  }

  async usageEmbed(error = '',guild){
    const data = [
      'role(ID/Mention): a role that you want to have permission to use the giveaway commands'
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
        `${this.prefix}roles 672970287200993325 \n${this.prefix}roles @RoleName`
      )
      .setTimestamp();

    if (!guild) return embed

    const rolesDB = await this.getSafeRoleDB( guild ).then( rolesDB => rolesDB )

      if (rolesDB){
        let responce = [];
        for (let roleID of rolesDB[guild.id]){
          responce.push( `<@&${roleID}>` )
        }

        if (responce.length > 0) embed.addField('Giveaway Roles',responce.join(','))
      }


    return embed
  }

  getIDFromMention(mention) {
  	if (!mention) return;

  	if (mention.startsWith('<@') && mention.endsWith('>')) {
  		mention = mention.slice(2, -1);

  		if (mention.startsWith('!') || mention.startsWith('&')) {
  			mention = mention.slice(1);
  		}
  	}

    return mention
  }

  async run(client, message, args){

    if (!message.member.hasPermission('MANAGE_SERVER')) return message.channel.send( 'Sorry but you dont have the permissions to do this command :(' )

    let [roleArg] = args
    const roleID = this.getIDFromMention( roleArg )

    message.guild.roles
    .fetch(roleID)
    .then( async (role) => {

      if (!role) return message.channel.send( await this.usageEmbed(`Sorry cant find the role of ${roleArg}`) )
      let rolesDB = require( '../utils/databases/roles.json' )

      if (!rolesDB[message.guild.id]) rolesDB[message.guild.id] = []

      let responce;
      if (rolesDB[message.guild.id].includes( roleID )){
        rolesDB[message.guild.id] = rolesDB[message.guild.id].filter( id => id != roleID )
        responce = `Removed <@&${role.id}> from the roster`
      } else {
        rolesDB[message.guild.id].push( roleID )
        responce = `Added <@&${role.id}> from the roster`
      }

      if (rolesDB[message.guild.id].length == 0) delete rolesDB[message.guild.id]

      message.channel.send( responce )
      this.saveJsonFile( './utils/databases/roles.json', JSON.stringify( rolesDB ) )

    })
    .catch(async (e) => message.channel.send( await this.usageEmbed( 'Uh oh unexpected error please contact Yofou#0420' ) ));

  }

}


module.exports = Grole
