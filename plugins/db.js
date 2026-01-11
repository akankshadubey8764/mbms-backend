const fp = require('fastify-plugin');
const mongoose = require('mongoose');

async function dbConnector(fastify, options) {
  try {
    // Connect to MongoDB using the URI from your .env file
    const db = await mongoose.connect(process.env.MONGODB_URI);
    
    fastify.log.info('MongoDB Connected Successfully');

    // Decorate fastify instance with mongoose to use it globally
    fastify.decorate('mongoose', db);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

module.exports = fp(dbConnector);