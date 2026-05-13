const studentService = require('../Services/studentService');
const authService = require('../Services/authService');
const notificationService = require('../Services/notificationService');
const verificationService = require('../Services/verificationService');
const bcrypt = require('bcryptjs');

class StudentController {
    async register(request, reply) {
        try {
            const { email, password, username, ...data } = request.body;

            // 1. Check if user exists and domain restriction
            if (!email.endsWith('@tpgit.com')) {
                return reply.status(400).send({ message: 'Access denied. Only @tpgit.com emails are accepted.' });
            }

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
            const { month, year, base64Data, mimeType } = request.body;
            const email = request.user.email;

            const student = await studentService.getOne({ email });
            if (!student) return reply.status(404).send({ message: 'Student not found' });

            const billIndex = student.messBills.findIndex(b => b.month === month && b.year === year);
            if (billIndex === -1) return reply.status(404).send({ message: 'Bill not found' });

            const bill = student.messBills[billIndex];
            
            // 1. AI VERIFICATION FIRST
            console.log(`Smart Check: AI Verifying image before upload for ${email}...`);
            const verification = await verificationService.verifyBase64Receipt(base64Data, mimeType, bill.amountIssued);

            if (!verification.success) {
                return reply.status(400).send({ 
                    message: verification.message,
                    details: verification.data 
                });
            }

            // 2. ONLY IF VERIFIED, UPLOAD TO CLOUDINARY
            console.log("AI Verified! Now uploading to Cloudinary...");
            const upload = await verificationService.uploadToCloudinary(base64Data);

            if (!upload.success) {
                return reply.status(500).send({ message: 'Verification passed, but failed to save image to cloud.' });
            }

            // 3. UPDATE DATABASE
            const updatedBills = [...student.messBills];
            updatedBills[billIndex].receiptUrl = upload.url;
            updatedBills[billIndex].paymentStatus = 'PAID'; // Since AI verified it!
            updatedBills[billIndex].isVerified = true;
            updatedBills[billIndex].receiptUploadedAt = new Date();
            updatedBills[billIndex].verificationData = verification.data;

            await studentService.updateOne({ email }, { messBills: updatedBills });

            // 4. NOTIFY STUDENT
            await notificationService.create({
                student: student._id,
                message: `Success! Your payment for ${month}/${year} has been verified and processed automatically.`,
                type: 'PAYMENT_VERIFIED'
            });

            return reply.send({ 
                message: 'Payment verified and uploaded successfully!', 
                bill: updatedBills[billIndex] 
            });
        } catch (err) {
            console.error("Upload/Verify Error:", err);
            return reply.status(500).send({ message: err.message });
        }
    }

    async runAutoVerification(email, month, year, expectedAmount, receiptUrl) {
        try {
            console.log(`Starting AI Verification for ${email} (${month}/${year})...`);
            const result = await verificationService.verifyReceipt(receiptUrl, expectedAmount);
            
            if (result.success) {
                const student = await studentService.getOne({ email });
                const updatedBills = [...student.messBills];
                const billIdx = updatedBills.findIndex(b => b.month === month && b.year === year);
                
                if (billIdx !== -1) {
                    updatedBills[billIdx].isVerified = true;
                    updatedBills[billIdx].paymentStatus = 'PAID';
                    updatedBills[billIdx].verificationData = result.extractedData;
                    
                    await studentService.updateOne({ email }, { messBills: updatedBills });
                    console.log(`AI Verification Successful for ${email}`);
                    
                    // Notify Student
                    await notificationService.create({
                        student: student._id,
                        message: `Great news! Your payment for ${month}/${year} has been automatically verified by our AI system.`,
                        type: 'PAYMENT_VERIFIED'
                    });
                }
            } else {
                console.log(`AI Verification Failed for ${email}: ${result.message}`);
                // Optional: Notify student or admin about failure
            }
        } catch (err) {
            console.error("Background Verification Failed:", err);
        }
    }

    async editStudent(request, reply) {
        try {
            const { id } = request.params;
            const updateData = request.body;
            const result = await studentService.updateOne({ _id: id }, updateData, { new: true });
            if (!result) return reply.status(404).send({ message: 'Student not found' });
            return reply.send({ message: 'Student updated successfully', student: result });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async deleteStudent(request, reply) {
        try {
            const { id } = request.params;

            // 1. Find student to get the email
            const student = await studentService.getOne({ _id: id });
            if (!student) return reply.status(404).send({ message: 'Student not found' });

            // 2. Delete the User account (Auth record)
            await authService.remove({ email: student.email });

            // 3. Delete the Student profile
            const result = await studentService.remove({ _id: id });

            if (result.deletedCount === 0) return reply.status(404).send({ message: 'Student profile not found during deletion' });
            return reply.send({ message: 'Student and associated user account deleted successfully' });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getStudentCounts(request, reply) {
        try {
            const allStudents = await studentService.get({ status: 'APPROVED' });
            const counts = {};
            allStudents.forEach(student => {
                const dept = student.department || 'Unknown';
                const year = student.year || 'Unknown';
                if (!counts[dept]) {
                    counts[dept] = { count: 0, 'departments-count': [] };
                }
                counts[dept].count += 1;
                let yearObj = counts[dept]['departments-count'].find(o => Object.keys(o)[0] === year);
                if (!yearObj) {
                    yearObj = { [year]: 0 };
                    counts[dept]['departments-count'].push(yearObj);
                }
                yearObj[year] += 1;
            });
            return reply.send(counts);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async exportCSV(request, reply) {
        try {
            const allStudents = await studentService.get({ status: 'APPROVED' });
            let csv = 'S.No.,RegNumber,Name,Email,Mobile,Department,Year,Room No.,Block\n';
            allStudents.forEach((s, index) => {
                const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
                const cleanName = `"${name.replace(/"/g, '""')}"`;
                csv += `${index + 1},${s.regNumber || ''},${cleanName},${s.email || ''},${s.phone || ''},${s.department || ''},${s.year || ''},${s.roomNo || ''},${s.block || ''}\n`;
            });
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', 'attachment; filename="students.csv"');
            return reply.send(csv);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async getNotifications(request, reply) {
        try {
            const student = await studentService.getOne({ email: request.user.email });
            if (!student) return reply.status(404).send({ message: 'Student profile not found' });

            const notifications = await notificationService.getMany({ student: student._id });
            return reply.send(notifications);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async markNotificationRead(request, reply) {
        try {
            const { id } = request.params;
            await notificationService.markAsRead(id);
            return reply.send({ message: 'Notification marked as read' });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }
}

// Create an instance and bind all methods to ensure 'this' context is preserved
const controller = new StudentController();
const proto = StudentController.prototype;
Object.getOwnPropertyNames(proto).forEach(key => {
    if (key !== 'constructor' && typeof proto[key] === 'function') {
        controller[key] = controller[key].bind(controller);
    }
});

module.exports = controller;


