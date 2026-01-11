const messOpsService = require('../Services/messOpsService');

class MessOpsController {
    // Menu
    async addMenu(request, reply) {
        try {
            const menu = await messOpsService.createMenu(request.body);
            return reply.status(201).send(menu);
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getMenu(request, reply) {
        try {
            const menu = await messOpsService.getMenu();
            return reply.send(menu);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async updateMenu(request, reply) {
        try {
            const menu = await messOpsService.updateMenu(request.params.id, request.body);
            return reply.send(menu);
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async deleteMenu(request, reply) {
        try {
            await messOpsService.deleteMenu(request.params.id);
            return reply.send({ message: 'Menu item deleted' });
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    // Queries
    async submitQuery(request, reply) {
        try {
            const query = await messOpsService.createQuery(request.user.id, request.body);
            return reply.status(201).send(query);
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getMyQueries(request, reply) {
        try {
            const queries = await messOpsService.getMyQueries(request.user.id);
            return reply.send(queries);
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }

    async getAllQueries(request, reply) {
        try {
            const queries = await messOpsService.getAllQueries();
            return reply.send(queries);
        } catch (err) {
            return reply.status(500).send({ message: err.message });
        }
    }

    async resolveQuery(request, reply) {
        try {
            const query = await messOpsService.resolveQuery(request.params.id);
            return reply.send(query);
        } catch (err) {
            return reply.status(400).send({ message: err.message });
        }
    }
}

module.exports = new MessOpsController();
