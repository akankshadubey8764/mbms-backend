const studentService = require('../Services/studentService');

class StudentController {
    async register(request, reply) {
        try {
            const student = await studentService.registerStudent(request.body);
            return reply.status(201).send({
                message: 'Registration request submitted. Pending approval.',
                studentId: student._id
            });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getRequests(request, reply) {
        try {
            const requests = await studentService.getAllRequests();
            return reply.send(requests);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async approve(request, reply) {
        try {
            const { id } = request.params;
            const student = await studentService.approveStudent(id);
            return reply.send({ message: 'Student approved successfully', student });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getMyProfile(request, reply) {
        try {
            const profile = await studentService.getProfile(request.user.id);
            return reply.send(profile);
        } catch (err) {
            return reply.status(404).send({ message: err.message });
        }
    }

    async updateMyProfile(request, reply) {
        try {
            const profile = await studentService.updateProfile(request.user.id, request.body);
            return reply.send({ message: 'Profile updated successfully', profile });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getAll(request, reply) {
        try {
            const students = await studentService.getAllStudents();
            return reply.send(students);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }
}

module.exports = new StudentController();
