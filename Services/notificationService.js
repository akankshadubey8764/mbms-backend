const Notification = require('../mbmsModels/Notification');

class NotificationService {
    async create(data) {
        return await Notification.create(data);
    }

    async getMany(criteria) {
        return await Notification.find(criteria).sort({ createdAt: -1 });
    }

    async markAsRead(id) {
        return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    }
    
    async markAllAsRead(studentId) {
        return await Notification.updateMany({ student: studentId, read: false }, { read: true });
    }
}

module.exports = new NotificationService();
