const { Sequelize, DataTypes } = require('sequelize');
const glob = require('glob');
const { prettify } = require('sql-log-prettifier');
const sequelize = new Sequelize('sqlite:./giveaway.sqlite',{
  logging: (something) => console.log( prettify( something ) )
})

const DB = { sequelize, DataTypes }

glob("./databases/models/*.js", {}, function (er, files) {
  files.forEach((item, i) => {
    let method = require(item.replace('./databases','.'))
    method(DB)
  });

  DB.sequelize.sync()
})

module.exports = DB
