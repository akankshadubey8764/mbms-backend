const authService = require('../Services/authService');
const Student = require('../mbmsModels/Student');
const bcrypt = require('bcryptjs');

class AuthController {
    async login(request, reply) {
        try {
            const { email, password } = request.body;

            // Logic moved from service
            const user = await authService.getOne({ email });
            if (!user) {
                return reply.status(401).send({ message: 'This User is not registered with us. Please Register before Signin' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return reply.status(401).send({ message: 'Invalid credentials' });
            }

            // Student approval check
            if (user.role === 'student') {
                const student = await Student.findOne({ email: user.email });
                if (!student || student.status !== 'APPROVED') {
                    return reply.status(401).send({ message: 'Your account is pending approval or has been rejected.' });
                }
            }

            const token = await reply.jwtSign({
                id: user._id,
                email: user.email,
                role: user.role
            });

            return reply.send({
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    username: user.username
                }
            });
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async logout(request, reply) {
        return reply.send({ message: 'Logged out successfully' });
    }

    async updatePassword(request, reply) {
        try {
            const { currentPassword, newPassword } = request.body;
            const userId = request.user.id;

            const user = await authService.getOne({ _id: userId });
            if (!user) return reply.status(404).send({ message: 'User not found' });

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return reply.status(400).send({ message: 'Current password is incorrect' });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await authService.updateOne({ _id: userId }, { password: hashedPassword });

            return reply.send({ message: 'Password updated successfully' });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async user_details(request, reply) {
        return reply.send(request.user);
    }
}

module.exports = new AuthController();


