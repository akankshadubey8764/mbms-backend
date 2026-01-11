const User = require('../mbmsModels/User');

// Standard CRUD operations
const add = async objToSave => new User(objToSave).save();

const get = async (criteria, projection, options, populate = '') =>
    User.find(criteria, projection, options).populate(populate).lean();

const getOne = async (criteria, projection, options, populate = '') =>
    User.findOne(criteria, projection, options).populate(populate).lean();

const updateOne = async (criteria, dataToSet, options) =>
    User.findOneAndUpdate(criteria, dataToSet, options).lean();

const count = async (criteria) => User.countDocuments(criteria);

module.exports = {
    add,
    get,
    getOne,
    updateOne,
    count
};
