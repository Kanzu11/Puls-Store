'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, PackageSearch } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';
import type { ProductDTO, CategoryDTO } from '@/types';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [page, setPage] = useState(1);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search, selectedCategory, sortBy, page],
    queryFn: () =>
      api
        .get(
          `/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(
            selectedCategory
          )}&sort=${sortBy}&page=${page}`
        )
        .then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data),
  });

  const hasActiveFilters = Boolean(search || selectedCategory || sortBy !== 'createdAt_desc');

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
          Catalog
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
          All Instruments & Goods
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Precision keyboards, planar studio headphones, and solid wood workspace equipment.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-8 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by title, material, or specification..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:border-zinc-900 focus:outline-none transition-colors placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl text-zinc-800 focus:border-zinc-900 focus:outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories?.data?.map((cat: CategoryDTO) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl text-zinc-800 focus:border-zinc-900 focus:outline-none cursor-pointer"
          >
            <option value="createdAt_desc">Latest Arrival</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name A-Z</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSortBy('createdAt_desc');
                setPage(1);
              }}
              className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border border-zinc-200 rounded-xl bg-zinc-50 aspect-square animate-pulse"
            />
          ))}
        </div>
      ) : products?.data?.items?.length === 0 ? (
        <div className="border border-zinc-200 rounded-2xl py-24 text-center px-6">
          <PackageSearch className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="font-semibold text-zinc-900">No matching products found</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or clear your current filters.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('');
              setSortBy('createdAt_desc');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products?.data?.items?.map((product: ProductDTO) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products?.data?.meta && products.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-16 pt-8 border-t border-zinc-200">
              {Array.from({ length: products.data.meta.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                    p === page
                      ? 'bg-zinc-950 text-white'
                      : 'border border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

