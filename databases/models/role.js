
module.exports = (db) => {
  db.sequelize.define('role', {
    guildID: {
      type: db.DataTypes.STRING,
      allowNull: false
    },
    roleID: {
      type: db.DataTypes.STRING,
      allowNull: false
    }
  },{
    createdAt: false,
    updatedAt: false
  })
};
