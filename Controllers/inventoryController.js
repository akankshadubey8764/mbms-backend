const inventoryService = require('../Services/inventoryService');

class InventoryController {
    async add(request, reply) {
        try {
            const item = await inventoryService.addItem(request.body);
            return reply.status(201).send(item);
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async updateStock(request, reply) {
        try {
            const { id } = request.params;
            const { quantity, purchaseDetails } = request.body;
            const item = await inventoryService.updateStock(id, quantity, purchaseDetails);
            return reply.send(item);
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getAll(request, reply) {
        try {
            const items = await inventoryService.getAllItems();
            return reply.send(items);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async getById(request, reply) {
        try {
            const item = await inventoryService.getItemById(request.params.id);
            if (!item) return reply.status(404).send({ message: 'Item not found' });
            return reply.send(item);
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async remove(request, reply) {
        try {
            await inventoryService.deleteItem(request.params.id);
            return reply.send({ message: 'Item deleted successfully' });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }
}

module.exports = new InventoryController();
