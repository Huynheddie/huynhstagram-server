const express = require('express');
require('express-async-errors');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./utils/config');
const postsRouter = require('./controllers/posts');
const middleware = require('./utils/middleware');
const logger = require('./utils/logger');

const app = express();

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error('Error connecting to MongoDB', err.message);
  });

app.use(cors());
app.use(express.json());
app.use(middleware.requestLogger);

app.use('/posts', postsRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;