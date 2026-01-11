require('dotenv').config();
const fastify = require('fastify')({ logger: { transport: { target: 'pino-pretty' } } });
const mongoose = require('mongoose');

// Register Plugins
fastify.register(require('@fastify/cors'), { origin: '*' });
fastify.register(require('./plugins/db'));
fastify.register(require('./plugins/auth'));

// Register Routes
fastify.register(require('./Routes/authRoutes'), { prefix: '/api/auth' });
fastify.register(require('./Routes/studentRoutes'), { prefix: '/api/students' });
fastify.register(require('./Routes/inventoryRoutes'), { prefix: '/api/inventory' });
fastify.register(require('./Routes/messOpsRoutes'), { prefix: '/api/mess-ops' });

// Basic Health Check Route
fastify.get('/health', async (request, reply) => {
  return {
    status: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  };
});

// Start the Server
const start = async () => {
  try {
    const port = process.env.PORT || 5000;
    await fastify.listen({ port: port, host: '0.0.0.0' });
    console.log(`🚀 MBMS Backend ready at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();