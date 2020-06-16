const BaseCommand = require('../utils/baseCommand.js');
const DB = require('../databases/db.js')

class Widgets extends BaseCommand {
  constructor () {
    super('widget', 'widget', 'creates custom messages with widgets');
    this.allias = ['widgets'];
    this.caseSensitiveArgs = true;
  }

  usageEmbed (prefix, error = '') {
    const data = [
      'roleCount: @RoleMention/<RoleID>/RoleName Also add a space to make it count more than 1 role',
      'additional arguments: -c {channelID/mention/name}'
    ];
    const embed = this.RichEmbed().setColor('#7FB3D5');

    if (error) {
      embed.addField('An error has occurred!', error);
    }

    embed
      .addField('Usage', `${prefix}${this.usage}`)
      .addField('Parameters Help', data.join('\n'))
      .addField(
        'Examples',
        `${prefix}widget {roleCount: @Member 685107365342609418 Admin } / 500\n${prefix}widget -c {channelID/mention/name} {roleCount: @Member 685107365342609418 Admin } / 500`
      )
      .setTimestamp();

    return embed;
  }

  roleMentionResolver (cache, mention) {
    if (!mention) return;

    if (mention.startsWith('<@&') && mention.endsWith('>')) {
      mention = mention.slice(3, -1);

      if (mention.startsWith('!')) {
        mention = mention.slice(1);
      }
    }

    return cache.find(
      role => role.name == mention || role.id == mention
    );
  }

  async run (client, message, args) {
    if (!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send(`Sorry <@${message.author.id}> but you don't have permission to execute this command, I know smh...`);

    let channel = await this.channelValidation(message, args);
    if (channel.error) return message.channel.send(this.usageEmbed(await client.prefix(message), channel.error));
    args = channel.args;
    channel = channel.channel;

    const tagFunctions = {
      roleCount: (val) => {
        let role;
        let counter = 0;
        val = val[0].split(' ');

        for (const rawRoles of val) {
          role = this.roleMentionResolver(message.guild.roles.cache, rawRoles);
          if (role) counter += role.members.size;
        }

        return counter;
      }
    };

    const embed = this.RichEmbed()
      .setColor('#7FB3D5')
      .setDescription(`${channel.toString()}\n${client.toWidget(args.join(' '), tagFunctions)}`);

    channel.send(embed)
      .then( async (msg) => {
        message.delete();

        const widget = {
          id : msg.id,
          channelID: channel.id,
          guildID: message.guild.id,
          rawArgs: args.join(' ')
        };

        await DB.sequelize.models.widget.create(widget)
          .catch( e => console.log(e) );
      });
  }
}

module.exports = Widgets;
