import { Router, Request, Response } from 'express';
import { prisma, Prisma } from '../db/index.js';

export const productsRouter = Router();

// GET /api/products — Live search, filtering, pagination
productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const sort = (req.query.sort as string) || 'createdAt_desc';
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const perPage = 12;

    const [rawField, rawDir] = sort.split('_');
    const allowedSortFields = new Set(['createdAt', 'price', 'name', 'stock']);
    const sortField = allowedSortFields.has(rawField) ? rawField : 'createdAt';
    const sortDir: 'asc' | 'desc' = rawDir === 'asc' ? 'asc' : 'desc';

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { categoryId: category }),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { [sortField]: sortDir },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ]);

    const serialized = items.map(p => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      category: p.category
        ? {
            ...p.category,
            createdAt: p.category.createdAt.toISOString(),
            updatedAt: p.category.updatedAt.toISOString(),
          }
        : null,
    }));

    res.json({
      data: {
        items: serialized,
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/featured
productsRouter.get('/featured', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const serialized = products.map(p => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      category: p.category
        ? {
            ...p.category,
            createdAt: p.category.createdAt.toISOString(),
            updatedAt: p.category.updatedAt.toISOString(),
          }
        : null,
    }));

    res.json({ data: serialized });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:slug
productsRouter.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { category: true },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({
      data: {
        ...product,
        price: Number(product.price),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        category: product.category
          ? {
              ...product.category,
              createdAt: product.category.createdAt.toISOString(),
              updatedAt: product.category.updatedAt.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

