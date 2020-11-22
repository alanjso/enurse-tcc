const Sequelize = require('sequelize');

// Option 1: Passing parameters separately
const sequelize = new Sequelize('flex_crm', 'flex_crm', 'desenvolvimento', {
  host: 'localhost',
  dialect: 'postgres'
});

module.exports = sequelize;