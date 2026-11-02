import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductDetail } from '@/components/ProductDetail';
import { Loader2 } from 'lucide-react';
import { Link } from '@/lib/router';

interface Props {
  params: { slug: string };
}

export default function ProductPage({ params }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', params.slug],
    queryFn: () => api.get(`/api/products/${encodeURIComponent(params.slug)}`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="max-w-md mx-auto px-6 py-28 text-center">
        <h1 className="text-2xl font-bold text-zinc-950 mb-2">Product Not Found</h1>
        <p className="text-xs text-zinc-500 mb-6">
          This item may have been removed or is temporarily unavailable.
        </p>
        <Link
          href="/products"
          className="inline-flex bg-zinc-950 text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return <ProductDetail product={data.data} />;
}

