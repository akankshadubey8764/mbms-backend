const menuService = require('../Services/menuService');
const queryService = require('../Services/queryService');
const groceryService = require('../Services/groceryService');
const studentService = require('../Services/studentService');

class MessOpsController {
    // Menu
    async getMenu(request, reply) {
        try {
            // Get latest menu
            const menus = await menuService.get({}, {}, { sort: { updatedAt: -1 }, limit: 1 });
            return reply.send(menus[0] || {});
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async updateMenu(request, reply) {
        try {
            const { week, menuItems } = request.body;
            const menu = await menuService.updateOne(
                { week },
                { week, menuItems, updatedBy: request.user.id },
                { upsert: true, new: true }
            );
            return reply.send({ message: 'Menu updated successfully', menu });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    // Queries
    async submitQuery(request, reply) {
        try {
            const student = await studentService.getOne({ email: request.user.email });
            if (!student) return reply.status(404).send({ message: 'Student profile not found' });

            const query = await queryService.add({
                ...request.body,
                student: student._id
            });
            return reply.status(201).send({ message: 'Query submitted successfully', query });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getAllQueries(request, reply) {
        try {
            const queries = await queryService.get({}, {}, {}, 'student');
            return reply.send(queries);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    // Grocery Management
    async addGroceryPurchase(request, reply) {
        try {
            const { itemName, quantity, rate, seller, unit } = request.body;
            const total = quantity * rate;

            let item = await groceryService.getOne({ itemName });
            if (!item) {
                // If doesn't exist, we'll create it via the updateOne with upsert or manual add
                // But for lean() compatibility and complex updates, let's fetch first.
                // Since lean() doesn't return a mongoose doc, we use updateOne directly.
                await groceryService.updateOne(
                    { itemName },
                    { $setOnInsert: { unit, stock: { remaining: 0, issued: 0 } } },
                    { upsert: true }
                );
                item = await groceryService.getOne({ itemName });
            }

            const newRemaining = (item.stock?.remaining || 0) + quantity;
            const historyEntry = {
                seller,
                quantity,
                rate,
                totalPrice: total,
                date: new Date()
            };

            const updatedItem = await groceryService.updateOne(
                { itemName },
                {
                    $inc: { quantity: quantity },
                    $set: { 'stock.remaining': newRemaining },
                    $push: { purchaseHistory: historyEntry }
                },
                { new: true }
            );

            return reply.status(201).send({ message: 'Grocery purchase recorded', item: updatedItem });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getGroceryHistory(request, reply) {
        try {
            const history = await groceryService.get({});
            return reply.send(history);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async issueStock(request, reply) {
        try {
            const { itemId, issuedQty } = request.body;
            const item = await groceryService.getOne({ _id: itemId });
            if (!item) return reply.status(404).send({ message: 'Item not found' });

            if (item.stock.remaining < issuedQty) {
                return reply.status(400).send({ message: 'Insufficient stock' });
            }

            const updatedItem = await groceryService.updateOne(
                { _id: itemId },
                {
                    $inc: { 'stock.remaining': -issuedQty, 'stock.issued': issuedQty }
                },
                { new: true }
            );

            return reply.send({ message: 'Stock issued successfully', item: updatedItem });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async uploadGroceryInvoice(request, reply) {
        try {
            const { itemId, invoiceUrl } = request.body;
            const item = await groceryService.getOne({ _id: itemId });
            if (!item) return reply.status(404).send({ message: 'Item not found' });

            if (!item.purchaseHistory || item.purchaseHistory.length === 0) {
                return reply.status(400).send({ message: 'No purchase history found for this item' });
            }

            // Update the last entry in purchase history
            const history = [...item.purchaseHistory];
            history[history.length - 1].invoiceUrl = invoiceUrl;

            const updatedItem = await groceryService.updateOne(
                { _id: itemId },
                { purchaseHistory: history },
                { new: true }
            );

            return reply.send({ message: 'Invoice uploaded successfully', item: updatedItem });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }
}

module.exports = new MessOpsController();


