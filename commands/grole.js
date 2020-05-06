const BaseCommand = require('../utils/baseCommand.js');

class Grole extends BaseCommand {
  constructor () {
    super('role', 'role [role ID/role mention/role name]', 'Toggle on/off roles to override permission to do giveaway commands');
    this.allias = [
      'roles',
      'grole',
      'groles'
    ];
    this.usage += `\nAlias: ${this.allias.join(',')}`;
  }

  async usageEmbed (prefix,error = '', guild) {
    const data = [
      'role (ID/Mention/Name): a role that you want to have permission to use the giveaway commands'
    ];
    const embed = this.RichEmbed().setColor('#7FB3D5');

    if (error) {
      embed.addField('An error has occurred!', error);
    }

    embed
      .addField('Usage', `${prefix}${this.usage}`)
      .addField('Parameters Help', data.join('\n\n'))
      .addField(
        'Examples',
        `${prefix}roles 672970287200993325 \n${prefix}roles @RoleName\n${prefix}roles RoleName`
      )
      .setTimestamp();

    if (!guild) return embed;

    const rolesDB = await this.getSafeRoleDB(guild).then(rolesDB => rolesDB);

    if (rolesDB) {
      const response = [];
      for (const roleID of rolesDB[guild.id]) {
        response.push(`<@&${roleID}>`);
      }

      if (response.length > 0) embed.addField('Giveaway Roles', response.join(','));
    }

    return embed;
  }

  getIDFromMention (mention) {
  	if (!mention) return;

  	if (mention.startsWith('<@') && mention.endsWith('>')) {
  		mention = mention.slice(2, -1);

  		if (mention.startsWith('!') || mention.startsWith('&')) {
  			mention = mention.slice(1);
  		}
  	}

    return mention;
  }

  async run (client, message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('Sorry but you dont have the permissions to do this command :(');

    const [roleArg] = args;
    const roleID = this.getIDFromMention(roleArg);

    message.guild.roles
      .fetch()
      .then(async (roles) => {
        roles = roles.cache;
        let role;

        if (roles.get(roleID)) {
          role = roles.get(roleID);
        } else if (roles.find(role => role.name == roleID)) {
          role = roles.find(role => role.name == roleID);
        } else {
          return message.channel.send(await this.usageEmbed(client.prefix(message),`Sorry can\'t find the role of ${roleArg}`));
        }

        const rolesDB = require('../databases/roles.json');

        if (!rolesDB[message.guild.id]) rolesDB[message.guild.id] = [];

        let response;
        if (rolesDB[message.guild.id].includes(role.id)) {
          rolesDB[message.guild.id] = rolesDB[message.guild.id].filter(id => id != role.id);
          response = `Removed <@&${role.id}> from the roster`;
        } else {
          rolesDB[message.guild.id].push(role.id);
          response = `Added <@&${role.id}> from the roster`;
        }

        if (rolesDB[message.guild.id].length == 0) delete rolesDB[message.guild.id];

        message.channel.send(response)
          .catch(err => console.error(err));
        this.saveJsonFile('./databases/roles.json', JSON.stringify(rolesDB, null, 4));
      })
      .catch(async (e) => {
        console.log(e);
        return message.channel.send(await this.usageEmbed(client.prefix(message),'Uh oh unexpected error please contact Yofou#0420'));
      });
  }
}

module.exports = Grole;
