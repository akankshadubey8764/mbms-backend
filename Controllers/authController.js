const authService = require('../Services/authService');
const studentService = require('../Services/studentService');

class AuthController {
    async register(request, reply) {
        try {
            const role = request.body.role || 'student';
            let result;

            if (role === 'student') {
                result = await studentService.registerStudent(request.body);
            } else {
                result = await authService.register(request.body);
            }

            return reply.status(201).send({
                message: role === 'student' ? 'Registration request submitted. Pending approval.' : 'User registered successfully',
                userId: result._id
            });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async login(request, reply) {
        try {
            const { email, password } = request.body;
            const user = await authService.login(email, password);

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
            return reply.status(401).send({ message: err.message });
        }
    }

    async me(request, reply) {
        return reply.send(request.user);
    }
}

module.exports = new AuthController();
