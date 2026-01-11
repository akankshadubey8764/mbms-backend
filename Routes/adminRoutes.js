const adminController = require('../Controllers/adminController');
const S = require('fluent-json-schema');

const emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';

async function adminRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.authenticate);
    fastify.addHook('preHandler', fastify.authorize(['admin']));

    // 6. List students awaiting approval
    fastify.route({
        method: 'GET',
        url: '/pending-approvals',
        handler: adminController.getPendingApprovals
    });

    // 7. Approve a student registration
    fastify.route({
        method: 'POST',
        url: '/requests/:id/approve',
        schema: {
            params: S.object().prop('id', S.string().required())
        },
        handler: adminController.approveStudent
    });

    // 8. Reject a student request
    fastify.route({
        method: 'DELETE',
        url: '/requests/:id/reject',
        schema: {
            params: S.object().prop('id', S.string().required()),
            body: S.object().prop('reason', S.string().required())
        },
        handler: adminController.rejectStudent
    });

    // 9. Fetch all approved students
    fastify.route({
        method: 'GET',
        url: '/approved-students',
        handler: adminController.getApprovedStudents
    });

    // 10. Manually add a student
    fastify.route({
        method: 'POST',
        url: '/add-students',
        schema: {
            body: S.object()
                .prop('email', S.string().pattern(emailRegex).required())
                .prop('password', S.string().required())
                .prop('firstname', S.string().required())
                .prop('lastname', S.string().required())
                .prop('regnumber', S.string().required())
                .prop('department', S.string().required())
                .prop('year', S.string().required())
                .prop('roomno', S.number().required())
                .prop('block', S.string().required())
                .prop('phnnum', S.string().required())
        },
        handler: adminController.addStudentManually
    });

    // 14. Generate monthly mess bills
    fastify.route({
        method: 'POST',
        url: '/mess-bills/calculate',
        schema: {
            body: S.object()
                .prop('month', S.number().required())
                .prop('year', S.number().required())
                .prop('dailyRate', S.number().required())
                .prop('attendance', S.array().items(
                    S.object()
                        .prop('studentId', S.string().required())
                        .prop('daysPresent', S.number().required())
                        .prop('daysAbsent', S.number().required())
                ).required())
        },
        handler: adminController.calculateMessBills
    });

    // 15. Fetch mess bills for all students
    fastify.route({
        method: 'GET',
        url: '/mess-bills',
        schema: {
            tags: ['Admin'], // This groups it under 'Admin' in Swagger
            description: 'Get all student mess bills',
            security: [{ bearerAuth: [] }] // This enables the padlock and sends the token
        },
        handler: adminController.getAllMessBills
    });

    // 16. Checks if bills already exist
    fastify.route({
        method: 'GET',
        url: '/mess-bills/exists',
        schema: {
            query: S.object()
                .prop('month', S.number().required())
                .prop('year', S.number().required())
        },
        handler: adminController.checkBillsExist
    });

    // 17. Updates bill payment status
    fastify.route({
        method: 'PATCH',
        url: '/mess-bills/status',
        schema: {
            body: S.object()
                .prop('studentId', S.string().required())
                .prop('month', S.number().required())
                .prop('year', S.number().required())
                .prop('status', S.string().enum(['PAID', 'PARTIAL', 'UNPAID']).required())
        },
        handler: adminController.updateBillStatus
    });

    // 21. Verifies uploaded receipt
    fastify.route({
        method: 'PATCH',
        url: '/mess-bills/verify-payment',
        schema: {
            body: S.object()
                .prop('studentId', S.string().required())
                .prop('month', S.number().required())
                .prop('year', S.number().required())
                .prop('verified', S.boolean().required())
        },
        handler: adminController.verifyPayment
    });

    // 25. Fetches current stock status
    fastify.route({
        method: 'GET',
        url: '/stock',
        handler: adminController.getCurrentStock
    });

    // 28. Fetches all student queries
    fastify.route({
        method: 'GET',
        url: '/queries',
        handler: adminController.getAllQueries
    });

    // 29. Locks a billing month
    fastify.route({
        method: 'POST',
        url: '/billing-cycle/close',
        schema: {
            body: S.object()
                .prop('month', S.number().required())
                .prop('year', S.number().required())
        },
        handler: adminController.closeBillingCycle
    });
}

module.exports = adminRoutes;
