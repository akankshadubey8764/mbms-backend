const automationController = require('../Controllers/automationController');

module.exports = function (fastify, options, done) {
    // These should ideally be protected by an Admin API Key or JWT
    fastify.post('/trigger-billing', automationController.triggerMonthlyBilling);
    fastify.post('/trigger-overdue', automationController.triggerOverdueEscalation);
    fastify.post('/trigger-stale-cleanup', automationController.triggerStaleCleanup);
    done();
};
