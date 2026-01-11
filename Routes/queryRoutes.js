const messOpsController = require('../Controllers/messOpsController');
const S = require('fluent-json-schema');

async function queryRoutes(fastify, options) {
    // 27. Raise Student Query API
    fastify.route({
        method: 'POST',
        url: '/raise_queries',
        preHandler: [fastify.authenticate, fastify.authorize(['student'])],
        schema: {
            body: S.object()
                .prop('queryArea', S.string().required())
                .prop('queryText', S.string().required())
        },
        handler: messOpsController.submitQuery
    });

    // 28. Get All Student Queries API (Admin)
    fastify.route({
        method: 'GET',
        url: '/get_queries',
        preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
        handler: messOpsController.getAllQueries
    });
}

module.exports = queryRoutes;
