const fp = require('fastify-plugin');
const jwt = require('@fastify/jwt');

async function authPlugin(fastify, options) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is not set.');
    }
    fastify.register(jwt, { secret });

    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    fastify.decorate('authorize', (roles) => {
        return async (request, reply) => {
            const { role } = request.user;
            if (!roles.includes(role)) {
                return reply.status(403).send({ message: 'Forbidden: You do not have permission' });
            }
        };
    });
}

module.exports = fp(authPlugin);
