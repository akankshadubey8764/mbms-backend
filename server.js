require('dotenv').config();
const fastify = require('fastify')({ logger: { transport: { target: 'pino-pretty' } } });
const mongoose = require('mongoose');

// Register Plugins
fastify.register(require('@fastify/cors'), { origin: '*' });
fastify.register(require('./plugins/db'));
fastify.register(require('./plugins/auth'));

// --- SWAGGER INTEGRATION START ---

// 1. Register Swagger Generator
fastify.register(require('@fastify/swagger'), {
  openapi: {
    info: {
      title: 'MBMS API Documentation',
      description: 'Hostel Mess Management System Backend',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
});

// 2. Register Swagger UI
fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs', // Access this at http://localhost:5000/docs
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  },
  exposeRoute: true
});

// --- SWAGGER INTEGRATION END ---

// Register Routes
fastify.register(require('./Routes/index'));

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
    console.log(`📝 Documentation available at http://localhost:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();