const cron = require('node-cron');
const { Query } = require('../mbmsModels/MessOps');
const Student = require('../mbmsModels/Student');

// 1. Overdue Query Auto-Escalation (Daily at midnight)
cron.schedule('0 0 * * *', async () => {
    console.log('Running Overdue Query Auto-Escalation job...');
    try {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const result = await Query.updateMany(
            { 
                status: 'Open', 
                createdAt: { $lt: fortyEightHoursAgo } 
            },
            { status: 'Overdue' }
        );
        console.log(`Updated ${result.modifiedCount} queries to Overdue status.`);
    } catch (err) {
        console.error('Error in Overdue Query job:', err);
    }
});

// 2. Stale Registration Cleanup (Weekly on Sunday at 1 AM)
cron.schedule('0 1 * * 0', async () => {
    console.log('Running Stale Registration Cleanup job...');
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await Student.updateMany(
            { 
                status: 'PENDING', 
                createdAt: { $lt: thirtyDaysAgo } 
            },
            { 
                status: 'REJECTED', 
                is_rejected: true, 
                is_Approved: false 
            }
        );
        console.log(`Auto-rejected ${result.modifiedCount} stale registration requests.`);
    } catch (err) {
        console.error('Error in Stale Registration job:', err);
    }
});

console.log('Cron jobs initialized.');
