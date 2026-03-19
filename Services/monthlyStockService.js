const MonthlyStock = require('../mbmsModels/MonthlyStock');

class MonthlyStockService {
    async get(criteria, projection = {}, options = {}) {
        return MonthlyStock.find(criteria, projection, options).lean();
    }

    async getOne(criteria, projection = {}) {
        return MonthlyStock.findOne(criteria, projection).lean();
    }

    async add(data) {
        return MonthlyStock.create(data);
    }

    async updateOne(criteria, data, options = { new: true }) {
        return MonthlyStock.findOneAndUpdate(criteria, data, options);
    }

    async delete(id) {
        return MonthlyStock.deleteOne({ _id: id });
    }

    async count(criteria) {
        return MonthlyStock.countDocuments(criteria);
    }
}

module.exports = new MonthlyStockService();
