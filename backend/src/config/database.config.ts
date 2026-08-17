import { PrismaClient } from '@prisma/client';
import { logger } from './logger.config';
import { env } from './env.config';

const prismaClient = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

// Configure Winston structured logging for database queries
(prismaClient as any).$on('query', (e: any) => {
  if (env.NODE_ENV === 'development') {
    logger.debug(`SQL: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
  } else if (e.duration > 100) {
    logger.warn(`Slow SQL: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`, {
      duration: e.duration,
      query: e.query,
    });
  }
});

// Prisma Client Soft Delete and Concurrency extensions
export const db = prismaClient.$extends({
  query: {
    $allModels: {
      async findMany({ args, query }: { args: any; query: any }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
      async findFirst({ args, query }: { args: any; query: any }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
      async findUnique({ args, query }: { args: any; query: any }) {
        const result = await query(args);
        if (result && (result as any).deletedAt !== null) {
          return null;
        }
        return result;
      },
      async count({ args, query }: { args: any; query: any }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
      async delete({ model, args, _query }: any) {
        // Automatically map delete commands to soft deletes
        logger.info(`Intercepting delete operation for model: ${model} to execute soft delete.`);
        return (prismaClient as any)[model].update({
          where: args.where,
          data: {
            deletedAt: new Date(),
            version: { increment: 1 },
          },
        });
      },
      async deleteMany({ model, args, _query }: any) {
        logger.info(`Intercepting deleteMany operation for model: ${model} to execute soft delete.`);
        return (prismaClient as any)[model].updateMany({
          where: args.where,
          data: {
            deletedAt: new Date(),
          },
        });
      },
    },
  },
});

export default db;
