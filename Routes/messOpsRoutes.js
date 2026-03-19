const messOpsController = require('../Controllers/messOpsController');
const S = require('fluent-json-schema');

async function messOpsRoutes(fastify, options) {
    // 12. View Mess Menu API (All authenticated users)
    fastify.route({
        method: 'GET',
        url: '/get_mess_menu',
        preHandler: [fastify.authenticate],
        handler: messOpsController.getMenu
    });

    // 13. Update Mess Menu API (Admin or Mess Manager)
    fastify.route({
        method: 'PUT',
        url: '/update_mess_menu',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'mess_manager'])],
        schema: {
            body: S.object()
                .prop('week', S.string().required())
                .prop('menuItems', S.object().required().additionalProperties(true))
        },
        handler: messOpsController.updateMenu
    });

    // 22. Add Grocery Purchase API (Mess Manager)
    fastify.route({
        method: 'POST',
        url: '/add_grocery_purchase',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'mess_manager'])],
        schema: {
            body: S.object()
                .prop('itemName', S.string().required())
                .prop('quantity', S.number().required())
                .prop('rate', S.number().required())
                .prop('seller', S.string().required())
                .prop('unit', S.string().default('kg'))
        },
        handler: messOpsController.addGroceryPurchase
    });

    // 23. View Grocery Purchase History API (Admin/Manager)
    fastify.route({
        method: 'GET',
        url: '/grocery',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'mess_manager'])],
        handler: messOpsController.getGroceryHistory
    });

    // 24. Update Issued Stock API (Mess Manager)
    fastify.route({
        method: 'PATCH',
        url: '/stock/issue',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'mess_manager'])],
        schema: {
            body: S.object()
                .prop('itemId', S.string().required())
                .prop('issuedQty', S.number().required())
        },
        handler: messOpsController.issueStock
    });
    // 26. Upload Grocery Invoice API (Mess Manager)
    fastify.route({
        method: 'POST',
        url: '/grocery/upload-invoice',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'mess_manager'])],
        handler: messOpsController.uploadGroceryInvoice
    });

    // Monthly Stock Management
    fastify.route({
        method: 'GET',
        url: '/monthly-stock',
        preHandler: [fastify.authenticate],
        handler: messOpsController.getMonthlyStock
    });

    fastify.route({
        method: 'POST',
        url: '/monthly-stock/item',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'mess_manager'])],
        handler: messOpsController.addMonthlyStockItem
    });

    fastify.route({
        method: 'PATCH',
        url: '/monthly-stock/item',
        preHandler: [fastify.authenticate, fastify.authorize(['admin', 'mess_manager'])],
        handler: messOpsController.updateMonthlyStockItem
    });
}

module.exports = messOpsRoutes;


