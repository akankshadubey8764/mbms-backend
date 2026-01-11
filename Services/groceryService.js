const Grocery = require('../mbmsModels/Grocery');

// Standard CRUD operations
const add = async objToSave => new Grocery(objToSave).save();

const get = async (criteria, projection, options, populate = '') =>
    Grocery.find(criteria, projection, options).populate(populate).lean();

const getOne = async (criteria, projection, options, populate = '') =>
    Grocery.findOne(criteria, projection, options).populate(populate).lean();

const updateOne = async (criteria, dataToSet, options) =>
    Grocery.findOneAndUpdate(criteria, dataToSet, options).lean();

const count = async (criteria) => Grocery.countDocuments(criteria);

module.exports = {
    add,
    get,
    getOne,
    updateOne,
    count
};
