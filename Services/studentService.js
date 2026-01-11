const Student = require('../mbmsModels/Student');

// Standard CRUD operations
const add = async objToSave => new Student(objToSave).save();

const get = async (criteria, projection, options, populate = '') =>
    Student.find(criteria, projection, options).populate(populate).lean();

const getOne = async (criteria, projection, options, populate = '') =>
    Student.findOne(criteria, projection, options).populate(populate).lean();

const updateOne = async (criteria, dataToSet, options) =>
    Student.findOneAndUpdate(criteria, dataToSet, options).lean();

const count = async (criteria) => Student.countDocuments(criteria);

module.exports = {
    add,
    get,
    getOne,
    updateOne,
    count
};
