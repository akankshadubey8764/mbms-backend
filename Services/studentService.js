const Student = require('../mbmsModels/Student');
const User = require('../mbmsModels/User');
const authService = require('./authService');

class StudentService {
    async registerStudent(studentData) {
        const { email, password, username, ...data } = studentData;

        // 1. Create User account first
        const user = await authService.register({
            email,
            password,
            username,
            role: 'student'
        });

        // 2. Map fields to match Student model structure
        const studentProfile = {
            firstName: data.firstName || data.firstname,
            lastName: data.lastName || data.lastname,
            regNumber: data.regNumber || data.regnumber,
            department: data.department,
            year: data.year,
            roomDetails: {
                roomNo: data.roomDetails?.roomNo || data.roomno,
                block: data.roomDetails?.block || data.block
            },
            phone: data.phnnum || data.phone,
            photo: data.photo,
            user: user._id,
            isApproved: false
        };

        const student = new Student(studentProfile);
        return await student.save();
    }

    async getAllRequests() {
        return await Student.find({ isApproved: false }).populate('user', 'email username');
    }

    async approveStudent(studentId) {
        const student = await Student.findByIdAndUpdate(
            studentId,
            { isApproved: true },
            { new: true }
        );
        if (!student) throw new Error('Student not found');
        return student;
    }

    async getProfile(userId) {
        const student = await Student.findOne({ user: userId }).populate('user', 'email username');
        if (!student) throw new Error('Profile not found');
        return student;
    }

    async updateProfile(userId, updateData) {
        const student = await Student.findOneAndUpdate(
            { user: userId },
            updateData,
            { new: true }
        );
        if (!student) throw new Error('Profile not found');
        return student;
    }

    async getAllStudents() {
        return await Student.find({ isApproved: true }).populate('user', 'email username');
    }
}

module.exports = new StudentService();
