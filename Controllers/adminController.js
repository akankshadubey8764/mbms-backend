const studentService = require('../Services/studentService');
const authService = require('../Services/authService');
const groceryService = require('../Services/groceryService');
const queryService = require('../Services/queryService');
const bcrypt = require('bcryptjs');

class AdminController {
    async getPendingApprovals(request, reply) {
        try {
            const { skip = 0, limit = 10 } = request.query;
            const criteria = { status: 'PENDING' };
            const [data, total] = await Promise.all([
                studentService.get(criteria, {}, { skip: Number(skip), limit: Number(limit) }),
                studentService.count(criteria)
            ]);
            return reply.send({ data, total });
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async approveStudent(request, reply) {
        try {
            const { id } = request.params;
            const result = await studentService.updateOne(
                { _id: id },
                { status: 'APPROVED', is_Approved: true, is_rejected: false },
                { new: true }
            );
            if (!result) return reply.status(404).send({ message: 'Student not found' });
            return reply.send({ message: 'Student approved successfully', student: result });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async rejectStudent(request, reply) {
        try {
            const { id } = request.params;
            const { reason } = request.body; // reason could be saved if field exists
            const result = await studentService.updateOne(
                { _id: id },
                { status: 'REJECTED', is_Approved: false, is_rejected: true },
                { new: true }
            );
            if (!result) return reply.status(404).send({ message: 'Student not found' });
            return reply.send({ message: 'Student request rejected' });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getApprovedStudents(request, reply) {
        try {
            const { skip = 0, limit = 10, department, year } = request.query;
            const criteria = { status: 'APPROVED' };
            if (department) criteria.department = department;
            if (year) criteria.year = year;

            const [data, total] = await Promise.all([
                studentService.get(criteria, {}, { skip: Number(skip), limit: Number(limit) }),
                studentService.count(criteria)
            ]);
            return reply.send({ data, total });
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async addStudentManually(request, reply) {
        try {
            const { email, password, ...data } = request.body;

            // Create user
            const hashedPassword = await bcrypt.hash(password, 10);
            await authService.add({
                email,
                password: hashedPassword,
                username: data.regnumber || data.regNumber,
                role: 'student'
            });

            // Create student
            const student = await studentService.add({
                ...data,
                email,
                status: 'APPROVED',
                is_Approved: true
            });

            return reply.status(201).send({ message: 'Student added manually', student });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async calculateMessBills(request, reply) {
        try {
            const { month, year, dailyRate = 300, attendance } = request.body;
            const results = [];

            for (const record of attendance) {
                const { studentId, daysPresent, daysAbsent } = record;

                // Logic: 
                // for 1 day rs = 300
                // if absent days >= 7, only present days are charged
                // if absent days < 7, total days (present + absent) are charged
                let amount = 0;
                if (daysAbsent >= 7) {
                    amount = daysPresent * dailyRate;
                } else {
                    amount = (daysPresent + daysAbsent) * dailyRate;
                }

                const student = await studentService.getOne({ _id: studentId });
                if (student) {
                    const updatedBills = [...student.messBills];
                    const existingBillIdx = updatedBills.findIndex(b => b.month === month && b.year === year);

                    if (existingBillIdx !== -1) {
                        updatedBills[existingBillIdx].daysPresent = daysPresent;
                        updatedBills[existingBillIdx].daysAbsent = daysAbsent;
                        updatedBills[existingBillIdx].amountIssued = amount;
                    } else {
                        updatedBills.push({
                            month,
                            year,
                            daysPresent,
                            daysAbsent,
                            amountIssued: amount
                        });
                    }

                    await studentService.updateOne({ _id: studentId }, { messBills: updatedBills });
                    results.push({ studentId, amount });
                }
            }
            return reply.send({ message: 'Bills calculated successfully', results });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async bulkUploadMessBills(request, reply) {
        try {
            const { year, data } = request.body; // data is array of objects from CSV

            // Check timeframe: Enabled only on last day of month and first day of next month
            const today = new Date();
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const currentDay = today.getDate();

            const isLastDay = currentDay === lastDayOfMonth;
            const isFirstDay = currentDay === 1;

            if (!isLastDay && !isFirstDay) {
                return reply.status(403).send({ message: "Bulk upload is only available on the last day of the month and the first day of the next month." });
            }

            const monthMap = {
                'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
            };

            const currentMonth = today.getMonth() + 1;
            const results = [];

            for (const row of data) {
                const regNumber = row['Reg Number'];
                if (!regNumber) continue;

                const student = await studentService.getOne({ regNumber });
                if (!student) continue;

                const updatedBills = [...student.messBills];

                // Iterate through months provided in headers
                for (const [monthName, monthIndex] of Object.entries(monthMap)) {
                    // Ignore future months
                    if (year > today.getFullYear() || (year === today.getFullYear() && monthIndex > currentMonth)) {
                        continue;
                    }

                    const presentKey = `${monthName} Present`;
                    const absentKey = `${monthName} Absent`;

                    if (row[presentKey] !== undefined && row[absentKey] !== undefined) {
                        const daysPresent = Number(row[presentKey]);
                        const daysAbsent = Number(row[absentKey]);
                        const dailyRate = 300;

                        let amount = 0;
                        if (daysAbsent >= 7) {
                            amount = daysPresent * dailyRate;
                        } else {
                            amount = (daysPresent + daysAbsent) * dailyRate;
                        }

                        const existingBillIdx = updatedBills.findIndex(b => b.month === monthIndex && b.year === Number(year));
                        if (existingBillIdx !== -1) {
                            updatedBills[existingBillIdx].daysPresent = daysPresent;
                            updatedBills[existingBillIdx].daysAbsent = daysAbsent;
                            updatedBills[existingBillIdx].amountIssued = amount;
                            // Ensure it remains UNPAID on recalculation unless explicitly handled
                        } else {
                            updatedBills.push({
                                month: monthIndex,
                                year: Number(year),
                                daysPresent,
                                daysAbsent,
                                amountIssued: amount
                            });
                        }
                    }
                }

                await studentService.updateOne({ regNumber }, { messBills: updatedBills });
                results.push(regNumber);
            }

            return reply.send({ message: `Bulk upload processed for ${results.length} students.`, processedCount: results.length });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getStudentsMessStatus(request, reply) {
        try {
            const { year } = request.query;
            const searchYear = Number(year) || new Date().getFullYear();
            const students = await studentService.get({ status: 'APPROVED' });

            const data = students.map(s => {
                const billStatus = {};
                for (let m = 1; m <= 12; m++) {
                    const bill = (s.messBills || []).find(b => b.month === m && Number(b.year) === searchYear);
                    billStatus[m] = bill ? [{
                        status: bill.paymentStatus,
                        isVerified: bill.isVerified,
                        amountIssued: bill.amountIssued,
                        amountPaid: bill.amountPaid,
                        daysPresent: bill.daysPresent,
                        daysAbsent: bill.daysAbsent,
                        calculatedAt: bill.calculatedAt
                    }] : [];
                }

                return {
                    _id: s._id,
                    name: `${s.firstName || ''} ${s.lastName || ''}`,
                    dept: s.department,
                    year: s.year,
                    phone: s.phone,
                    regNumber: s.regNumber,
                    billStatus
                };
            });

            return reply.send(data);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async getAllMessBills(request, reply) {
        try {
            const { skip = 0, limit = 10 } = request.query;
            const criteria = { 'messBills.0': { $exists: true } };

            // For count, we need to know how many students have bills
            const [students, total] = await Promise.all([
                studentService.get(criteria, {}, { skip: Number(skip), limit: Number(limit) }),
                studentService.count(criteria)
            ]);

            const data = students.map(s => {
                const latestBill = s.messBills[s.messBills.length - 1];
                return {
                    _id: s._id,
                    studentName: `${s.firstName || ''} ${s.lastName || ''}`,
                    regNumber: s.regNumber,
                    amount: latestBill.amountIssued,
                    status: latestBill.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
                    email: s.email,
                    month: latestBill.month,
                    year: latestBill.year
                };
            });
            return reply.send({ data, total });
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async checkBillsExist(request, reply) {
        try {
            const { month, year } = request.query;
            const c = await studentService.count({
                'messBills': {
                    $elemMatch: { month: Number(month), year: Number(year) }
                }
            });
            return reply.send({ exists: c > 0 });
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async updateBillStatus(request, reply) {
        try {
            const { studentId, month, year, status } = request.body;
            const student = await studentService.getOne({ _id: studentId });
            if (!student) return reply.status(404).send({ message: 'Student not found' });

            const updatedBills = [...student.messBills];
            const billIdx = updatedBills.findIndex(b => b.month === Number(month) && b.year === Number(year));
            if (billIdx === -1) return reply.status(404).send({ message: 'Bill not found' });

            updatedBills[billIdx].paymentStatus = status;
            await studentService.updateOne({ _id: studentId }, { messBills: updatedBills });
            return reply.send({ message: 'Bill status updated', bill: updatedBills[billIdx] });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async verifyPayment(request, reply) {
        try {
            const { studentId, month, year, verified } = request.body;
            const student = await studentService.getOne({ _id: studentId });
            if (!student) return reply.status(404).send({ message: 'Student not found' });

            const updatedBills = [...student.messBills];
            const billIdx = updatedBills.findIndex(b => b.month === Number(month) && b.year === Number(year));
            if (billIdx === -1) return reply.status(404).send({ message: 'Bill not found' });

            updatedBills[billIdx].isVerified = verified;
            if (verified) updatedBills[billIdx].paymentStatus = 'PAID';

            await studentService.updateOne({ _id: studentId }, { messBills: updatedBills });
            return reply.send({ message: 'Payment verification updated', bill: updatedBills[billIdx] });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getCurrentStock(request, reply) {
        try {
            const { skip = 0, limit = 10 } = request.query;
            const [items, total] = await Promise.all([
                groceryService.get({}, {}, { skip: Number(skip), limit: Number(limit) }),
                groceryService.count({})
            ]);

            const data = items.map(item => ({
                _id: item._id,
                itemName: item.itemName,
                currentStock: item.stock?.remaining || 0,
                minimumStock: 20, // Default threshold
                unit: item.unit,
                category: 'Grocery',
                status: (item.stock?.remaining || 0) > 50 ? 'Good' : (item.stock?.remaining || 0) > 20 ? 'Low' : 'Critical'
            }));
            return reply.send({ data, total });
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async getAllQueries(request, reply) {
        try {
            const { skip = 0, limit = 100, startDate, endDate, status, queryArea } = request.query;

            const criteria = {};

            // 1. Default to last 3 months if no date range is provided
            if (startDate || endDate) {
                criteria.createdAt = {};
                if (startDate) criteria.createdAt.$gte = new Date(startDate);
                if (endDate) criteria.createdAt.$lte = new Date(endDate);
            } else {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                criteria.createdAt = { $gte: threeMonthsAgo };
            }

            // 2. Status filter (only apply if provided, otherwise show all)
            if (status && status !== 'All') {
                criteria.status = status;
            }

            // 3. Query Area filter (if provided)
            if (queryArea && queryArea !== 'All') {
                criteria.queryArea = queryArea;
            }

            const [queries, total] = await Promise.all([
                queryService.get(
                    criteria,
                    'queryArea queryText status createdAt updatedAt student',
                    { skip: Number(skip), limit: Number(limit), sort: { createdAt: -1 } },
                    {
                        path: 'student',
                        select: 'firstName lastName department year phone regNumber'
                    }
                ),
                queryService.count(criteria)
            ]);
            return reply.send({ data: queries, total });
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async resolveQuery(request, reply) {
        try {
            const { id } = request.params;
            const result = await queryService.updateOne({ _id: id }, { status: 'RESOLVED' });
            if (!result) return reply.status(404).send({ message: 'Query not found' });
            return reply.send({ message: 'Query marked as resolved' });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async closeBillingCycle(request, reply) {
        try {
            const { month, year } = request.body;
            return reply.send({ message: `Billing cycle for ${month}/${year} closed` });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async checkBulkUploadWindow(request, reply) {
        try {
            const today = new Date();
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const currentDay = today.getDate();

            const isLastDay = currentDay === lastDayOfMonth;
            const isFirstDay = currentDay === 1;

            return reply.send({
                allowed: isLastDay || isFirstDay,
                currentDay,
                lastDayOfMonth
            });
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }
    async getDashboardStats(request, reply) {
        try {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();

            const allStudents = await studentService.get({});
            const approvedStudents = allStudents.filter(s => s.status === 'APPROVED');
            const pendingStudents = allStudents.filter(s => s.status === 'PENDING');

            // 1. Calculate Unpaid Students for Current Month
            const unpaidStudentsCount = approvedStudents.filter(s => {
                const currentBill = (s.messBills || []).find(b => b.month === currentMonth && Number(b.year) === currentYear);
                return !currentBill || currentBill.paymentStatus !== 'PAID';
            }).length;

            // 2. Calculate Total Revenue (All time or current year)
            let totalRevenue = 0;
            approvedStudents.forEach(s => {
                (s.messBills || []).forEach(b => {
                    totalRevenue += (b.amountPaid || 0);
                });
            });

            // 3. Calculate Current Month's Inventory Expenditure (Revenue for vendors, cost for us)
            const allInventory = await groceryService.get({});
            let inventoryExpenditure = 0;
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            allInventory.forEach(item => {
                (item.purchaseHistory || []).forEach(purchase => {
                    const purchaseDate = new Date(purchase.date);
                    if (purchaseDate >= startOfMonth) {
                        inventoryExpenditure += (purchase.totalPrice || 0);
                    }
                });
            });

            return reply.send({
                totalStudents: approvedStudents.length,
                totalRevenue,
                unpaidStudentsCount,
                inventoryExpenditure,
                activeStudents: approvedStudents.length,
                pendingApprovals: pendingStudents.length
            });
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

}

module.exports = new AdminController();

