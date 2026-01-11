const studentService = require('../Services/studentService');
const authService = require('../Services/authService');
const groceryService = require('../Services/groceryService');
const queryService = require('../Services/queryService');
const bcrypt = require('bcryptjs');

class AdminController {
    async getPendingApprovals(request, reply) {
        try {
            const result = await studentService.get({ status: 'PENDING' });
            return reply.send(result);
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
            const result = await studentService.get({ status: 'APPROVED' });
            return reply.send(result);
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
            const { month, year, dailyRate, attendance } = request.body;
            const results = [];

            for (const record of attendance) {
                const { studentId, daysPresent, daysAbsent } = record;
                const amount = daysPresent * dailyRate;

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

    async getAllMessBills(request, reply) {
        try {
            const students = await studentService.get({ 'messBills.0': { $exists: true } });
            const result = students.map(s => ({
                studentId: s._id,
                name: `${s.firstName} ${s.lastName}`,
                regNumber: s.regNumber,
                bills: s.messBills
            }));
            return reply.send(result);
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
            const result = await groceryService.get({});
            return reply.send(result);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async getAllQueries(request, reply) {
        try {
            const result = await queryService.get({}, {}, {}, 'student');
            return reply.send(result);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
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
}

module.exports = new AdminController();

