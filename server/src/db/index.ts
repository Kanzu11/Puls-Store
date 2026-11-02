import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient, Prisma } from '../../generated/prisma/index.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

// Strip any accidental surrounding quotes if pasted into Render/cloud env dashboards
const cleanDbUrl = (process.env.DATABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
if (cleanDbUrl) {
  process.env.DATABASE_URL = cleanDbUrl;
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient(
    cleanDbUrl
      ? {
          datasources: {
            db: { url: cleanDbUrl },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export { Prisma };
export * from '../../generated/prisma/index.js';
