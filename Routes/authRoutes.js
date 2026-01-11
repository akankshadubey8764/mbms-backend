const authController = require('../Controllers/authController');
const S = require('fluent-json-schema');

const emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';

async function authRoutes(fastify, options) {
    // 1. Login API
    fastify.route({
        method: 'POST',
        url: '/login',
        schema: {
            body: S.object()
                .prop('email', S.string().pattern(emailRegex).required())
                .prop('password', S.string().required())
        },
        handler: authController.login
    });

    // 2. Logout API (Auth Required)
    fastify.route({
        method: 'POST',
        url: '/logout',
        preHandler: [fastify.authenticate],
        handler: authController.logout
    });

    // 3. Update Password API (Auth Required)
    fastify.route({
        method: 'POST',
        url: '/password',
        preHandler: [fastify.authenticate],
        schema: {
            body: S.object()
                .prop('currentPassword', S.string().required())
                .prop('newPassword', S.string().minLength(6).required())
        },
        handler: authController.updatePassword
    });

    // 4. Get Logged-in User Details API (Auth Required)
    fastify.route({
        method: 'GET',
        url: '/user_details',
        preHandler: [fastify.authenticate],
        handler: authController.user_details
    });
}

module.exports = authRoutes;


