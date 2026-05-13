const Student = require('../mbmsModels/Student');
const Notification = require('../mbmsModels/Notification');
const { Query } = require('../mbmsModels/MessOps');

class AutomationController {
    // Logic for Monthly Billing
    async triggerMonthlyBilling(request, reply) {
        console.log('Manual Trigger: Monthly Mess Bill Calculation...');
        try {
            const today = new Date();
            // Default to previous month if no params provided
            const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const month = prevMonthDate.getMonth() + 1;
            const year = prevMonthDate.getFullYear();
            const dailyRate = 300; 

            const students = await Student.find({ status: 'APPROVED' });
            let generatedCount = 0;
            
            for (const student of students) {
                const daysInMonth = new Date(year, month, 0).getDate();
                const daysPresent = daysInMonth; 
                
                let amount = daysPresent * dailyRate;

                const existingBillIdx = student.messBills.findIndex(b => b.month === month && b.year === year);
                if (existingBillIdx === -1) {
                    student.messBills.push({
                        month,
                        year,
                        daysPresent,
                        daysAbsent: 0,
                        amountIssued: amount,
                        paymentStatus: 'UNPAID'
                    });
                    await student.save();

                    const monthName = prevMonthDate.toLocaleString('en', { month: 'long' });
                    await Notification.create({
                        student: student._id,
                        message: `Automated: Your mess bill for ${monthName} ${year} has been generated.`,
                        type: 'BILL_PUBLISHED'
                    });
                    generatedCount++;
                }
            }
            
            return reply.send({ 
                success: true, 
                message: `Generated bills for ${generatedCount} students for ${month}/${year}.`,
                totalStudentsScanned: students.length
            });
        } catch (err) {
            console.error('Error in Manual Billing:', err);
            return reply.status(500).send({ error: err.message });
        }
    }

    // Logic for Overdue Escalation
    async triggerOverdueEscalation(request, reply) {
        try {
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            const result = await Query.updateMany(
                { status: 'Open', createdAt: { $lt: fortyEightHoursAgo } },
                { status: 'Overdue' }
            );
            return reply.send({ success: true, updatedCount: result.modifiedCount });
        } catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    }

    // Logic for Stale Registration Cleanup
    async triggerStaleCleanup(request, reply) {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const result = await Student.updateMany(
                { status: 'PENDING', createdAt: { $lt: thirtyDaysAgo } },
                { status: 'REJECTED', is_rejected: true, is_Approved: false }
            );
            return reply.send({ success: true, updatedCount: result.modifiedCount });
        } catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    }
}

module.exports = new AutomationController();
