import React from 'react';
import { Link } from '@/lib/router';
import { Plus } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import type { ProductDTO } from '@/types';

interface Props {
  product: ProductDTO;
}

export function ProductCard({ product }: Props) {
  const addItem = useCartStore(s => s.addItem);

  return (
    <div className="group relative flex flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-950 transition-all shadow-sm">
      <Link
        href={`/products/${product.slug}`}
        className="block relative aspect-square bg-[#f7f6f2] overflow-hidden"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300 font-mono text-xs">
            NO IMAGE
          </div>
        )}

        {/* Top Stock Pill (No Dot) */}
        <div className="absolute top-3 left-3">
          {product.stock > 5 ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#15803d] border border-zinc-200">
              In Stock
            </span>
          ) : product.stock > 0 ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#ea580c] border border-zinc-200">
              Only {product.stock} left
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-white">
              Sold Out
            </span>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {product.category && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c] mb-1">
              {product.category.name}
            </p>
          )}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-zinc-950 text-sm group-hover:text-[#ea580c] transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <div>
            <p className="text-base font-bold font-mono text-zinc-950">
              ${Number(product.price).toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => addItem(product, 1)}
            disabled={product.stock <= 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-950 text-white hover:bg-[#ea580c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
            aria-label={`Add ${product.name} to bag`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>
    </div>
  );
}
