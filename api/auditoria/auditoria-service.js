const Log = require('./auditoria-model');

module.exports = {
  add: async (data) => {
    await Log.create(data);
  }
}