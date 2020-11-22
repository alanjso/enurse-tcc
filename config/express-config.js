const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const winston = require("winston");
const compression = require('compression');

const mongoose = require('./database-mongo-config')();

const authMiddleware = require("../api/middleware/auth-middleware");
const auditMiddleware = require('../api/middleware/audit-middleware');

const server = express();

server.use(cors());
server.use(express.json());

server.use('/uploads', express.static('uploads'));
//server.use(compression());
//server.use(morgan("dev"));

//middleware
//server.use(authMiddleware);
//server.use(auditMiddleware);

const logger = winston.createLogger({
  level: "verbose",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" })
  ]
});

require("./routes-config")(server);

module.exports = server;
