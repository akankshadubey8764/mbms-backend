const authController = require('../Controllers/authController');
const S = require('fluent-json-schema');

async function authRoutes(fastify, options) {
    // Login / Signin Route
    fastify.route({
        method: 'POST',
        url: '/login',
        schema: {
            body: S.object()
                .prop('email', S.string().format(S.FORMAT.EMAIL).required())
                .prop('password', S.string().minLength(6).required())
                .prop('from', S.string().required()) // 'web' or 'mobile'
        },
        async handler(request, reply) {
            return authController.login(request, reply);
        }
    });

    // Registration Route
    fastify.route({
        method: 'POST',
        url: '/register',
        schema: {
            body: S.object()
                .prop('email', S.string().format(S.FORMAT.EMAIL).required())
                .prop('password', S.string()
                    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
                    .minLength(8)
                    .required()
                )
                .prop('username', S.string().required()) // Maps to userId 
                .prop('firstname', S.string().required())
                .prop('lastname', S.string().required())
                .prop('regnumber', S.string().required())
                .prop('department', S.string().required())
                .prop('year', S.string().required())
                .prop('roomno', S.number().required())
                .prop('block', S.string().required())
                .prop('phnnum', S.string().required())
                .prop('photo', S.string()) // URL/Link is optional
                .prop('role', S.string().enum(['admin', 'warden1', 'warden2', 'student']).default('student'))
        },
        async handler(request, reply) {
            return authController.register(request, reply);
        }
    });

    // Protected Route: Get Profile
    fastify.route({
        method: 'GET',
        url: '/me',
        preHandler: [fastify.authenticate],
        async handler(request, reply) {
            return authController.me(request, reply);
        }
    });
}

module.exports = authRoutes;

