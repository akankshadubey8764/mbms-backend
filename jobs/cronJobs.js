const cron = require('node-cron');
const automationController = require('../Controllers/automationController');

// 1. Overdue Query Auto-Escalation (Daily at midnight)
cron.schedule('0 0 * * *', async () => {
    await automationController.triggerOverdueEscalation({ body: {} }, { send: (data) => console.log('Cron Job (Overdue):', data) });
});

// 2. Stale Registration Cleanup (Weekly on Sunday at 1 AM)
cron.schedule('0 1 * * 0', async () => {
    await automationController.triggerStaleCleanup({ body: {} }, { send: (data) => console.log('Cron Job (Stale Cleanup):', data) });
});

// 3. Monthly Mess Bill Calculation (1st of every month at 2 AM)
cron.schedule('0 2 1 * *', async () => {
    await automationController.triggerMonthlyBilling({ body: {} }, { send: (data) => console.log('Cron Job (Billing):', data), status: () => ({ send: console.log }) });
});

console.log('Cron jobs initialized.');
