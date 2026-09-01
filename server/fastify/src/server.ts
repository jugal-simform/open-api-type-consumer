import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { blogRoutes } from './routes/blogs.js';

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Blog API (Fastify)',
      version: '1.0.0',
    },
  },
});

await fastify.register(swaggerUi, { routePrefix: '/docs' });

await fastify.register(blogRoutes);

fastify.get('/swagger.json', async () => fastify.swagger());

const port = Number(process.env.PORT ?? 8080);

fastify.listen({ port, host: '0.0.0.0' }).catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
