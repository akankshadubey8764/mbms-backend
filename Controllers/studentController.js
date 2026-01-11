const studentService = require('../Services/studentService');
const authService = require('../Services/authService');
const bcrypt = require('bcryptjs');

class StudentController {
    async register(request, reply) {
        try {
            const { email, password, username, ...data } = request.body;

            // 1. Check if user exists
            const existingUser = await authService.getOne({ email });
            if (existingUser) {
                return reply.status(400).send({ message: 'User already exists' });
            }

            // 2. Hash password and Create User account
            const hashedPassword = await bcrypt.hash(password, 10);
            await authService.add({
                email,
                password: hashedPassword,
                username,
                role: 'student'
            });

            // 3. Create Student profile
            const studentProfile = {
                email,
                firstName: data.firstname || data.firstName,
                lastName: data.lastname || data.lastName,
                regNumber: data.regnumber || data.regNumber,
                department: data.department,
                year: data.year,
                roomNo: data.roomno,
                block: data.block,
                phone: data.phnnum || data.phone,
                photo: data.photo,
                status: 'PENDING',
                is_Approved: false,
                is_rejected: false
            };

            const student = await studentService.add(studentProfile);
            return reply.status(201).send({
                message: 'Registration request submitted. Pending approval.',
                studentId: student._id
            });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getMyProfile(request, reply) {
        try {
            const profile = await studentService.getOne({ email: request.user.email });
            if (!profile) return reply.status(404).send({ message: 'Profile not found' });
            return reply.send(profile);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async getLatestMessBill(request, reply) {
        try {
            const student = await studentService.getOne({ email: request.user.email });
            if (!student || !student.messBills || student.messBills.length === 0) {
                return reply.send({ message: 'No mess bills found' });
            }
            const bill = student.messBills[student.messBills.length - 1];
            return reply.send(bill);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async getMessBillHistory(request, reply) {
        try {
            const student = await studentService.getOne({ email: request.user.email });
            if (!student) return reply.status(404).send({ message: 'Student not found' });
            return reply.send(student.messBills);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async uploadPaymentProof(request, reply) {
        try {
            const { month, year, receiptUrl } = request.body;
            const email = request.user.email;

            const student = await studentService.getOne({ email });
            if (!student) return reply.status(404).send({ message: 'Student not found' });

            const billIndex = student.messBills.findIndex(b => b.month === month && b.year === year);
            if (billIndex === -1) return reply.status(404).send({ message: 'Bill not found for specified month/year' });

            const updatedBills = [...student.messBills];
            updatedBills[billIndex].receiptUrl = receiptUrl;
            updatedBills[billIndex].paymentStatus = 'PARTIAL';

            await studentService.updateOne({ email }, { messBills: updatedBills });
            return reply.send({ message: 'Payment receipt uploaded successfully', bill: updatedBills[billIndex] });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }
}

module.exports = new StudentController();


