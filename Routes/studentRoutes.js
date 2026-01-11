const studentController = require('../Controllers/studentController');
const S = require('fluent-json-schema');

const emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';

async function studentRoutes(fastify, options) {
    // 5. Registration API
    fastify.route({
        method: 'POST',
        url: '/register',
        schema: {
            body: S.object()
                .prop('email', S.string().pattern(emailRegex).required())
                .prop('password', S.string().minLength(6).required())
                .prop('username', S.string().required())
                .prop('firstname', S.string().required())
                .prop('lastname', S.string().required())
                .prop('regnumber', S.string().required())
                .prop('department', S.string().required())
                .prop('year', S.string().required())
                .prop('roomno', S.number().required())
                .prop('block', S.string().required())
                .prop('phnnum', S.string().required())
                .prop('role', S.string().default('student'))
                .prop('photo', S.string())
        },
        handler: studentController.register
    });

    // 11. View User Profile API
    fastify.route({
        method: 'GET',
        url: '/profile',
        preHandler: [fastify.authenticate],
        handler: studentController.getMyProfile
    });

    // 18. View Personal Mess Bill API (Most recent)
    fastify.route({
        method: 'GET',
        url: '/mess-bills',
        // 1. ADD THIS SCHEMA BLOCK
        schema: {
            tags: ['Student'],
            description: 'Get the latest mess bill for the logged-in student',
            // This line tells Swagger to show the lock icon and Authorization input
            security: [{ bearerAuth: [] }] 
        },
        // 2. KEEP YOUR EXISTING AUTH LOGIC
        preHandler: [fastify.authenticate, fastify.authorize(['student'])],
        handler: studentController.getLatestMessBill
    });

    // 19. View Mess Bill History API
    fastify.route({
        method: 'GET',
        url: '/mess-bills/history',
        preHandler: [fastify.authenticate, fastify.authorize(['student'])],
        handler: studentController.getMessBillHistory
    });

    // 20. Upload Payment Receipt API
    fastify.route({
        method: 'POST',
        url: '/bills/upload-proof',
        preHandler: [fastify.authenticate, fastify.authorize(['student'])],
        handler: studentController.uploadPaymentProof
    });
}

module.exports = studentRoutes;


