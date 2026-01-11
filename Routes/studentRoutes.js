const studentController = require('../Controllers/studentController');
const S = require('fluent-json-schema');

async function studentRoutes(fastify, options) {
    // Public registration
    fastify.route({
        method: 'POST',
        url: '/register',
        schema: {
            body: S.object()
                .prop('email', S.string().format(S.FORMAT.EMAIL).required())
                .prop('password', S.string().minLength(6).required())
                .prop('firstname', S.string().required())
                .prop('lastname', S.string().required())
                .prop('regnumber', S.string().required())
                .prop('department', S.string().required())
                .prop('year', S.string().required())
                .prop('roomno', S.number().required())
                .prop('block', S.string().required())
        },
        async handler(request, reply) {
            return studentController.register(request, reply);
        }
    });

    // Protected routes: Profile Management
    fastify.route({
        method: 'GET',
        url: '/profile',
        preHandler: [fastify.authenticate],
        async handler(request, reply) {
            return studentController.getMyProfile(request, reply);
        }
    });

    fastify.route({
        method: 'PUT',
        url: '/profile',
        preHandler: [fastify.authenticate],
        schema: {
            body: S.object()
                .prop('firstname', S.string())
                .prop('lastname', S.string())
                .prop('department', S.string())
                .prop('year', S.string())
        },
        async handler(request, reply) {
            return studentController.updateMyProfile(request, reply);
        }
    });

    // Admin/Warden only routes
    fastify.route({
        method: 'GET',
        url: '/requests',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'warden1', 'warden2'])],
        async handler(request, reply) {
            return studentController.getRequests(request, reply);
        }
    });

    fastify.route({
        method: 'PATCH',
        url: '/approve/:id',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'warden1', 'warden2'])],
        schema: {
            params: S.object().prop('id', S.string().required())
        },
        async handler(request, reply) {
            return studentController.approve(request, reply);
        }
    });

    fastify.route({
        method: 'GET',
        url: '/',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'warden1', 'warden2'])],
        async handler(request, reply) {
            return studentController.getAll(request, reply);
        }
    });
}

module.exports = studentRoutes;

