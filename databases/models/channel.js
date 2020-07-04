
module.exports = (db) => {

  db.sequelize.define('channel', {
    channelID: {
      type: db.DataTypes.STRING,
      allowNull: false
    },
    guildID: {
      type: db.DataTypes.STRING,
      allowNull: false
    }
  },{
    createdAt: false,
    updatedAt: false
  })

};
