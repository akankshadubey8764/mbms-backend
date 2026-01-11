const User = require('../mbmsModels/User');
const Student = require('../mbmsModels/Student');
const bcrypt = require('bcryptjs');

class AuthService {

    async register(userData) {
        const { email, password, username, role } = userData;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            email,
            password: hashedPassword,
            username,
            role: role || 'student'
        });

        return await user.save();
    }

    async login(email, password) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('This User is not registered with us. Please Register before Signin');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Business Rule: Students must be approved to log in
        if (user.role === 'student') {
            const student = await Student.findOne({ user: user._id });
            if (!student || !student.isApproved) {
                // Return generic error for security
                throw new Error('Invalid credentials');
            }
        }

        return user;
    }
}

module.exports = new AuthService();

