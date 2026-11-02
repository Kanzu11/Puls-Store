import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminProducts, createAdminProduct, updateAdminProduct } from '../lib/api';
import { toast } from '../components/Toaster';
import { Plus, Edit2, X, Loader2, ToggleLeft, ToggleRight, Package, Minus } from 'lucide-react';
import type { ProductDTO } from '../types';

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
}

const initialForm: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stock: '10',
  imageUrl: '',
  isActive: true,
};

const inputClass =
  'w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs bg-white text-zinc-950 focus:outline-none focus:border-zinc-950 transition-colors placeholder:text-zinc-400';

export function Products() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);
  const [form, setForm] = useState<ProductFormState>(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchAdminProducts,
  });

  const createMutation = useMutation({
    mutationFn: createAdminProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Product Published', `${form.name} added to catalog`);
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateAdminProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Product Updated', 'Catalog changes saved');
      handleClose();
    },
  });

  const quickUpdateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateAdminProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.info('Inventory Synced', 'Product stock/visibility updated');
    },
  });

  function handleOpen(product?: ProductDTO) {
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name,
        description: product.description || '',
        price: String(product.price),
        stock: String(product.stock),
        imageUrl: product.imageUrl || '',
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setForm(initialForm);
    }
    setShowModal(true);
  }

  function handleClose() {
    setShowModal(false);
    setEditingProduct(null);
    setForm(initialForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      imageUrl: form.imageUrl || null,
      isActive: form.isActive,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Inventory & Pricing
          </p>
          <h2 className="text-sm font-bold text-zinc-950">Catalog Products ({data?.length ?? 0})</h2>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center gap-1.5 bg-zinc-950 text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Product</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      ) : data?.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-12 text-center">
          <Package className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-zinc-800">No products configured</p>
          <button
            onClick={() => handleOpen()}
            className="mt-4 px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold"
          >
            Add First Product
          </button>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden divide-y divide-zinc-100 shadow-sm">
          {data?.map(product => (
            <div key={product.id} className="p-3.5 flex items-center gap-3 hover:bg-zinc-50/50 transition-colors">
              <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-5 h-5 text-zinc-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-zinc-950 truncate">{product.name}</p>
                  {!product.isActive && (
                    <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="font-mono font-bold text-zinc-900">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  <span className="text-zinc-300">·</span>
                  <div className="inline-flex items-center gap-1 border border-zinc-200 rounded-md px-1 py-0.5 bg-zinc-50">
                    <button
                      onClick={() =>
                        quickUpdateMutation.mutate({
                          id: product.id,
                          payload: { ...product, stock: Math.max(0, product.stock - 1) },
                        })
                      }
                      className="p-0.5 hover:bg-zinc-200 rounded text-zinc-600"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span
                      className={`px-1 font-mono text-[10px] font-bold ${
                        product.stock > 0 ? 'text-zinc-800' : 'text-rose-600'
                      }`}
                    >
                      {product.stock}
                    </span>
                    <button
                      onClick={() =>
                        quickUpdateMutation.mutate({
                          id: product.id,
                          payload: { ...product, stock: product.stock + 1 },
                        })
                      }
                      className="p-0.5 hover:bg-zinc-200 rounded text-zinc-600"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpen(product)}
                  className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    quickUpdateMutation.mutate({
                      id: product.id,
                      payload: { isActive: !product.isActive },
                    })
                  }
                  className="p-1.5"
                >
                  {product.isActive ? (
                    <ToggleRight className="w-6 h-6 text-zinc-950" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-zinc-300" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/40 z-50 flex items-end justify-center backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-sm text-zinc-950">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Product Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Pulse Studio Monitor..."
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="149.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Stock Units *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stock}
                    onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                    placeholder="25"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Image URL
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Materials, dimensions, technical specs..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Visible in Storefront</p>
                  <p className="text-[11px] text-zinc-400">Customers can purchase immediately</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.isActive ? 'bg-zinc-950' : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      form.isActive ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-zinc-950 text-white py-3.5 rounded-xl font-semibold text-xs hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

