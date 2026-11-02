import React, { useState } from 'react';
import { Minus, Plus, ShoppingBag, ChevronLeft, Shield, Truck, RotateCcw } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import type { ProductDTO } from '@/types';
import { Link } from '@/lib/router';

interface Props {
  product: ProductDTO;
}

export function ProductDetail({ product }: Props) {
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(product.imageUrl ?? '');
  const addItem = useCartStore(s => s.addItem);

  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];

  const handleAddToCart = () => {
    addItem(product, qty);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors uppercase tracking-wider mb-8"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-4">
          <div className="aspect-square bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden flex items-center justify-center">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-zinc-300 font-mono text-sm">NO IMAGE</div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl border overflow-hidden flex-shrink-0 transition-all ${
                    activeImage === img ? 'border-zinc-950 ring-1 ring-zinc-950' : 'border-zinc-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            {product.category && (
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
                {product.category.name}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 mb-3">
              {product.name}
            </h1>
            <p className="text-3xl font-extrabold text-zinc-950 mb-6 font-mono">
              ${Number(product.price).toFixed(2)}
            </p>

            <div className="border-t border-b border-zinc-200 py-6 mb-8">
              <p className="text-sm font-semibold text-zinc-900 mb-2">Specifications & Overview</p>
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                {product.description || 'Precision crafted with quality materials designed to elevate your everyday setup.'}
              </p>
            </div>

            <div className="flex items-center gap-2 mb-8 text-xs font-semibold">
              <span
                className={
                  product.stock > 5
                    ? 'text-[#15803d]'
                    : product.stock > 0
                    ? 'text-[#ea580c]'
                    : 'text-rose-600'
                }
              >
                {product.stock > 5
                  ? `In Stock (${product.stock} units available)`
                  : product.stock > 0
                  ? `Low Stock: Only ${product.stock} units remaining`
                  : 'Currently Out of Stock'}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-10">
                <div className="flex items-center border border-zinc-200 rounded-xl px-2 py-1 justify-between sm:justify-start">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-semibold text-sm text-zinc-950">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#ea580c] text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-[#c2410c] transition-colors shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag — ${(Number(product.price) * qty).toFixed(2)}</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-100 text-zinc-500 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-zinc-800 flex-shrink-0" />
              <span>Free delivery $50+</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-zinc-800 flex-shrink-0" />
              <span>30-day returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-zinc-800 flex-shrink-0" />
              <span>2-year warranty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

