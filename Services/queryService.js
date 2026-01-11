const { Query } = require('../mbmsModels/MessOps');

// Standard CRUD operations
const add = async objToSave => new Query(objToSave).save();

const get = async (criteria, projection, options, populate = '') =>
    Query.find(criteria, projection, options).populate(populate).lean();

const getOne = async (criteria, projection, options, populate = '') =>
    Query.findOne(criteria, projection, options).populate(populate).lean();

const updateOne = async (criteria, dataToSet, options) =>
    Query.findOneAndUpdate(criteria, dataToSet, options).lean();

const count = async (criteria) => Query.countDocuments(criteria);

module.exports = {
    add,
    get,
    getOne,
    updateOne,
    count
};
