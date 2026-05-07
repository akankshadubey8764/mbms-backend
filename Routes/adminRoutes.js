const adminController = require('../Controllers/adminController');
const S = require('fluent-json-schema');

const emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';

async function adminRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.authenticate);

    // Helper for admin-only routes
    const adminOnly = [fastify.authorize(['admin'])];
    // Helper for shared routes
    const adminManager = [fastify.authorize(['admin', 'mess_manager'])];

    // 6. Dashboard Statistics
    fastify.route({
        method: 'GET',
        url: '/stats',
        preHandler: adminOnly,
        handler: adminController.getDashboardStats
    });

    // 7. List students awaiting approval
    fastify.route({
        method: 'GET',
        url: '/pending-approvals',
        preHandler: adminOnly,
        handler: adminController.getPendingApprovals
    });

    // 8. Approve a student registration
    fastify.route({
        method: 'POST',
        url: '/requests/:id/approve',
        preHandler: adminOnly,
        schema: {
            params: S.object().prop('id', S.string().required())
        },
        handler: adminController.approveStudent
    });

    // 8. Reject a student request
    fastify.route({
        method: 'DELETE',
        url: '/requests/:id/reject',
        preHandler: adminOnly,
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
        preHandler: adminOnly,
        handler: adminController.getApprovedStudents
    });

    // 10. Manually add a student
    fastify.route({
        method: 'POST',
        url: '/add-students',
        preHandler: adminOnly,
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
        preHandler: adminOnly,
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
        preHandler: adminOnly,
        schema: {
            tags: ['Admin'],
            description: 'Get all student mess bills',
            security: [{ bearerAuth: [] }]
        },
        handler: adminController.getAllMessBills
    });

    // 15a. Fetch mess bills status for all students (Calendar view)
    fastify.route({
        method: 'GET',
        url: '/mess-bills/status-list',
        preHandler: adminOnly,
        handler: adminController.getStudentsMessStatus
    });

    // 15b. Bulk Upload Mess Bills
    fastify.route({
        method: 'POST',
        url: '/mess-bills/bulk-upload',
        preHandler: adminOnly,
        handler: adminController.bulkUploadMessBills
    });

    // 15c. Check Bulk Upload Window
    fastify.route({
        method: 'GET',
        url: '/mess-bills/upload-window',
        preHandler: adminOnly,
        handler: adminController.checkBulkUploadWindow
    });

    // 16. Checks if bills already exist
    fastify.route({
        method: 'GET',
        url: '/mess-bills/exists',
        preHandler: adminOnly,
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
        preHandler: adminOnly,
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
        preHandler: adminOnly,
        schema: {
            body: S.object()
                .prop('studentId', S.string().required())
                .prop('month', S.number().required())
                .prop('year', S.number().required())
                .prop('verified', S.boolean().required())
        },
        handler: adminController.verifyPayment
    });

    // 25. Fetches current stock status (Shared with Mess Manager)
    fastify.route({
        method: 'GET',
        url: '/stock',
        preHandler: adminManager,
        handler: adminController.getCurrentStock
    });

    // 28. Fetches all student queries
    fastify.route({
        method: 'GET',
        url: '/queries',
        preHandler: adminOnly,
        handler: adminController.getAllQueries
    });

    // 29. Mark query as resolved
    fastify.route({
        method: 'PUT',
        url: '/queries/:id/resolve',
        preHandler: adminOnly,
        schema: {
            params: S.object().prop('id', S.string().required())
        },
        handler: adminController.resolveQuery
    });

    // 29. Locks a billing month
    fastify.route({
        method: 'POST',
        url: '/billing-cycle/close',
        preHandler: adminOnly,
        schema: {
            body: S.object()
                .prop('month', S.number().required())
                .prop('year', S.number().required())
        },
        handler: adminController.closeBillingCycle
    });

    // Reset Student Password (Admin only)
    fastify.route({
        method: 'POST',
        url: '/students/:id/reset-password',
        preHandler: adminOnly,
        schema: {
            params: S.object().prop('id', S.string().required()),
            body: S.object()
                .prop('newPassword', S.string().minLength(6).required())
        },
        handler: adminController.resetStudentPassword
    });
}

module.exports = adminRoutes;
