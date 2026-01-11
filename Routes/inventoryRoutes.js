const inventoryController = require('../Controllers/inventoryController');
const S = require('fluent-json-schema');

async function inventoryRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.authenticate);

    // View inventory (All authenticated users can see)
    fastify.route({
        method: 'GET',
        url: '/',
        async handler(request, reply) {
            return inventoryController.getAll(request, reply);
        }
    });

    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: S.object().prop('id', S.string().required())
        },
        async handler(request, reply) {
            return inventoryController.getById(request, reply);
        }
    });

    // Manage inventory (Admin/Warden only)
    fastify.route({
        method: 'POST',
        url: '/',
        preHandler: [fastify.authorize(['admin', 'warden1', 'warden2'])],
        schema: {
            body: S.object()
                .prop('itemName', S.string().required())
                .prop('category', S.string())
                .prop('stock', S.object().prop('current', S.number()).prop('threshold', S.number()))
        },
        async handler(request, reply) {
            return inventoryController.add(request, reply);
        }
    });

    fastify.route({
        method: 'PATCH',
        url: '/:id/stock',
        preHandler: [fastify.authorize(['admin', 'warden1', 'warden2'])],
        schema: {
            params: S.object().prop('id', S.string().required()),
            body: S.object()
                .prop('quantity', S.number().required())
                .prop('purchaseDetails', S.object()
                    .prop('sellerName', S.string())
                    .prop('rate', S.number())
                    .prop('totalPrice', S.number())
                )
        },
        async handler(request, reply) {
            return inventoryController.updateStock(request, reply);
        }
    });

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        preHandler: [fastify.authorize(['admin', 'warden1', 'warden2'])],
        schema: {
            params: S.object().prop('id', S.string().required())
        },
        async handler(request, reply) {
            return inventoryController.remove(request, reply);
        }
    });
}

module.exports = inventoryRoutes;

