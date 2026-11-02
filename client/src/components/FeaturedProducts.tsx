import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductCard } from './ProductCard';
import type { ProductDTO } from '@/types';
import { Link } from '@/lib/router';
import { ArrowRight } from 'lucide-react';

export function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => api.get('/api/products/featured').then(r => r.data),
  });

  const products: ProductDTO[] = data?.data ?? [];

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="flex items-end justify-between mb-10 pb-4 border-b border-zinc-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
            Curated Release
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Featured Instruments
          </h2>
        </div>
        <Link
          href="/products"
          className="text-xs font-semibold text-zinc-950 hover:text-zinc-600 transition-colors flex items-center gap-1 uppercase tracking-wider"
        >
          View Full Catalog <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-zinc-200 rounded-xl bg-zinc-50 aspect-square animate-pulse"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-zinc-200 rounded-xl py-16 text-center">
          <p className="text-sm font-medium text-zinc-600">No products published yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.slice(0, 6).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

