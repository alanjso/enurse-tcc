const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const logSchema = mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  user: {
    type: String,
  },
  url: {
    type: String
  },
  method: {
    type: String
  }
});

const log = mongoose.model('log', logSchema);

module.exports = log;

