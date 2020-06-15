
module.exports = (db) => {
  db.sequelize.define('giveaway',{
    id: {
      type: db.DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    host: {
      type: db.DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: db.DataTypes.STRING,
      allowNull: false
    },
    deadline: {
      type: db.DataTypes.DATE,
      allowNull: false
    },
    winnerAmount: {
      type: db.DataTypes.INTEGER,
      allowNull: false
    },
    channelID: {
      type: db.DataTypes.STRING,
      allowNull: false
    },
    image: db.DataTypes.STRING
  }, {
    createdAt: false,
    updatedAt: false
  })
}
