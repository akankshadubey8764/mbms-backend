module.exports = function (fastify, options, done) {
    fastify.register(
        require('./authRoutes'),
        { prefix: '/api/v1/auth' }
    );
    fastify.register(
        require('./studentRoutes'),
        { prefix: '/api/v1/students' }
    );
    fastify.register(
        require('./adminRoutes'),
        { prefix: '/api/v1/admin' }
    );
    fastify.register(
        require('./messOpsRoutes'),
        { prefix: '/api/v1/mess' }
    );
    fastify.register(
        require('./queryRoutes'),
        { prefix: '/api/v1/queries' }
    );
    done();
};
