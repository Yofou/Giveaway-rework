
module.exports = (db) => {

  db.sequelize.define('widget',{
    id: {
      type: db.DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    channelID: {
      type: db.DataTypes.STRING,
      allowNull: false
    },
    guildID: {
      type: db.DataTypes.STRING,
      allowNull: false
    },
    rawArgs: {
      type: db.DataTypes.STRING(2048),
      allowNull: false
    }
  },{
    createdAt: false,
    updatedAt: false
  })

};
