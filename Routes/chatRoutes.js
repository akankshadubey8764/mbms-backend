const chatController = require('../Controllers/chatController');

async function chatRoutes(fastify, options) {
    fastify.post('/', chatController.handleChat);
}

module.exports = chatRoutes;
