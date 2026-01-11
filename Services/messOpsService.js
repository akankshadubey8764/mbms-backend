const { Menu, Query } = require('../mbmsModels/MessOps');
const Student = require('../mbmsModels/Student');

class MessOpsService {
    // Menu Management
    async createMenu(menuData) {
        const menu = new Menu(menuData);
        return await menu.save();
    }

    async getMenu() {
        return await Menu.find({});
    }

    async updateMenu(id, updateData) {
        return await Menu.findByIdAndUpdate(id, updateData, { new: true });
    }

    async deleteMenu(id) {
        return await Menu.findByIdAndDelete(id);
    }

    // Query/Complaint Handling
    async createQuery(userId, queryData) {
        const student = await Student.findOne({ user: userId });
        if (!student) throw new Error('Student profile not found');

        const query = new Query({
            ...queryData,
            student: student._id
        });
        return await query.save();
    }

    async getAllQueries() {
        return await Query.find({}).populate({
            path: 'student',
            populate: { path: 'user', select: 'email username' }
        });
    }

    async getMyQueries(userId) {
        const student = await Student.findOne({ user: userId });
        if (!student) throw new Error('Student profile not found');
        return await Query.find({ student: student._id });
    }

    async resolveQuery(id) {
        return await Query.findByIdAndUpdate(id, { status: 'Resolved' }, { new: true });
    }
}

module.exports = new MessOpsService();
