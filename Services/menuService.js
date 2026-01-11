const { Menu } = require('../mbmsModels/MessOps');

// Standard CRUD operations
const add = async objToSave => new Menu(objToSave).save();

const get = async (criteria, projection, options, populate = '') =>
    Menu.find(criteria, projection, options).populate(populate).lean();

const getOne = async (criteria, projection, options, populate = '') =>
    Menu.findOne(criteria, projection, options).populate(populate).lean();

const updateOne = async (criteria, dataToSet, options) =>
    Menu.findOneAndUpdate(criteria, dataToSet, options).lean();

const count = async (criteria) => Menu.countDocuments(criteria);

module.exports = {
    add,
    get,
    getOne,
    updateOne,
    count
};
