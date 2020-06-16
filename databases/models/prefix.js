

module.exports = (db) => {

  db.sequelize.define('prefix',{
    id: {
      type: db.DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    prefix: {
      type: db.DataTypes.STRING,
      allowNull: false
    }
  })

};
