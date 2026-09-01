import type { FastifyInstance } from 'fastify';
import { addBlog, deleteBlog, getBlog, listBlogs, updateBlog } from '../storage.js';

const blogSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    content: { type: 'string' },
    author: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'title', 'content', 'author', 'createdAt'],
} as const;

export async function blogRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/blogs',
    {
      schema: {
        tags: ['blogs'],
        response: {
          200: { type: 'array', items: blogSchema },
        },
      },
    },
    async () => listBlogs(),
  );

  fastify.get<{ Params: { id: string } }>(
    '/blogs/:id',
    {
      schema: {
        tags: ['blogs'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: {
          200: blogSchema,
          404: {
            type: 'object',
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const blog = await getBlog(request.params.id);
      if (!blog) {
        return reply.code(404).send({ message: 'Blog not found' });
      }
      return blog;
    },
  );

  fastify.post<{ Body: { title: string; content: string; author: string } }>(
    '/blogs',
    {
      schema: {
        tags: ['blogs'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            author: { type: 'string' },
          },
          required: ['title', 'content', 'author'],
        },
        response: {
          201: blogSchema,
        },
      },
    },
    async (request, reply) => {
      const blog = await addBlog(request.body);
      return reply.code(201).send(blog);
    },
  );

  fastify.put<{ Params: { id: string }; Body: { title?: string; content?: string; author?: string } }>(
    '/blogs/:id',
    {
      schema: {
        tags: ['blogs'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            author: { type: 'string' },
          },
        },
        response: {
          200: blogSchema,
          404: {
            type: 'object',
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const blog = await updateBlog(request.params.id, request.body);
      if (!blog) {
        return reply.code(404).send({ message: 'Blog not found' });
      }
      return blog;
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/blogs/:id',
    {
      schema: {
        tags: ['blogs'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: {
          204: { type: 'null' },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const deleted = await deleteBlog(request.params.id);
      if (!deleted) {
        return reply.code(404).send({ message: 'Blog not found' });
      }
      return reply.code(204).send();
    },
  );
}
