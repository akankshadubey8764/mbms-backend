const messOpsController = require('../Controllers/messOpsController');
const S = require('fluent-json-schema');

async function messOpsRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.authenticate);

    // Menu routes
    fastify.route({
        method: 'GET',
        url: '/menu',
        async handler(request, reply) {
            return messOpsController.getMenu(request, reply);
        }
    });

    fastify.route({
        method: 'POST',
        url: '/menu',
        preHandler: [fastify.authorize(['admin', 'warden1', 'warden2'])],
        schema: {
            body: S.object()
                .prop('day', S.string().required())
                .prop('mealTime', S.string().enum(['Breakfast', 'Lunch', 'Dinner']).required())
                .prop('items', S.array().items(S.string()).required())
        },
        async handler(request, reply) {
            return messOpsController.addMenu(request, reply);
        }
    });

    fastify.route({
        method: 'PUT',
        url: '/menu/:id',
        preHandler: [fastify.authorize(['admin', 'warden1', 'warden2'])],
        schema: {
            params: S.object().prop('id', S.string().required()),
            body: S.object()
                .prop('items', S.array().items(S.string()))
        },
        async handler(request, reply) {
            return messOpsController.updateMenu(request, reply);
        }
    });

    fastify.route({
        method: 'DELETE',
        url: '/menu/:id',
        preHandler: [fastify.authorize(['admin', 'warden1', 'warden2'])],
        schema: {
            params: S.object().prop('id', S.string().required())
        },
        async handler(request, reply) {
            return messOpsController.deleteMenu(request, reply);
        }
    });

    // Query routes
    fastify.route({
        method: 'POST',
        url: '/query',
        schema: {
            body: S.object()
                .prop('area', S.string().required())
                .prop('text', S.string().required())
        },
        async handler(request, reply) {
            return messOpsController.submitQuery(request, reply);
        }
    });

    fastify.route({
        method: 'GET',
        url: '/query/my',
        async handler(request, reply) {
            return messOpsController.getMyQueries(request, reply);
        }
    });

    fastify.route({
        method: 'GET',
        url: '/query',
        preHandler: [fastify.authorize(['admin', 'warden1', 'warden2'])],
        async handler(request, reply) {
            return messOpsController.getAllQueries(request, reply);
        }
    });

    fastify.route({
        method: 'PATCH',
        url: '/query/:id/resolve',
        preHandler: [fastify.authorize(['admin', 'warden1', 'warden2'])],
        schema: {
            params: S.object().prop('id', S.string().required())
        },
        async handler(request, reply) {
            return messOpsController.resolveQuery(request, reply);
        }
    });
}

module.exports = messOpsRoutes;

