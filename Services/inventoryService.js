const Inventory = require('../mbmsModels/Inventory');

class InventoryService {
    async addItem(itemData) {
        const item = new Inventory(itemData);
        return await item.save();
    }

    async updateStock(id, quantity, purchaseDetails = null) {
        const item = await Inventory.findById(id);
        if (!item) throw new Error('Item not found');

        item.stock.current += quantity;

        if (purchaseDetails) {
            item.purchaseHistory.push({
                ...purchaseDetails,
                quantity,
                date: new Date()
            });
        }

        return await item.save();
    }

    async getAllItems() {
        return await Inventory.find({});
    }

    async getItemById(id) {
        return await Inventory.findById(id);
    }

    async deleteItem(id) {
        return await Inventory.findByIdAndDelete(id);
    }
}

module.exports = new InventoryService();
