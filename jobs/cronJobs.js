const cron = require('node-cron');
const Student = require('../mbmsModels/Student');
const Notification = require('../mbmsModels/Notification');
const { Query } = require('../mbmsModels/MessOps');

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

// 3. Monthly Mess Bill Calculation (1st of every month at 2 AM)
cron.schedule('0 2 1 * *', async () => {
    console.log('Running Monthly Mess Bill Calculation job...');
    try {
        const today = new Date();
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const month = prevMonthDate.getMonth() + 1;
        const year = prevMonthDate.getFullYear();
        const dailyRate = 300; // Standard rate

        const students = await Student.find({ status: 'APPROVED' });
        
        for (const student of students) {
            // Default logic: Assume full attendance for the month (e.g. 30 days)
            // In a real scenario, you'd fetch this from an Attendance model
            const daysInMonth = new Date(year, month, 0).getDate();
            const daysPresent = daysInMonth; 
            const daysAbsent = 0;
            
            let amount = daysPresent * dailyRate;

            const existingBillIdx = student.messBills.findIndex(b => b.month === month && b.year === year);
            if (existingBillIdx === -1) {
                student.messBills.push({
                    month,
                    year,
                    daysPresent,
                    daysAbsent,
                    amountIssued: amount,
                    paymentStatus: 'UNPAID'
                });
                await student.save();

                // Notify student
                const monthName = prevMonthDate.toLocaleString('en', { month: 'long' });
                await Notification.create({
                    student: student._id,
                    message: `Automated: Your mess bill for ${monthName} ${year} has been generated.`,
                    type: 'BILL_PUBLISHED'
                });
            }
        }
        console.log(`Successfully generated bills for ${students.length} students for ${month}/${year}.`);
    } catch (err) {
        console.error('Error in Monthly Bill Calculation job:', err);
    }
});

console.log('Cron jobs initialized.');
