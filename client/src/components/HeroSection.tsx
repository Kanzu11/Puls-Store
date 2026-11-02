import React from 'react';
import { Link } from '@/lib/router';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="border-b border-zinc-200 bg-[#f7f6f2]">
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-zinc-300 text-zinc-800 text-xs font-semibold mb-6 bg-white shadow-sm">
              <span>Series 04 — Precision Industrial Goods</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-950 leading-[1.06]">
              Tactile tools for{' '}
              <span className="underline decoration-[#ea580c] decoration-4 underline-offset-8">
                focused work.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl">
              CNC-machined aluminum keyboards, planar studio acoustics, and minimalist workspace instruments engineered to last decades—not seasons.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-9">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-[#ea580c] text-white px-7 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#c2410c] transition-colors shadow-sm"
              >
                Shop Collection <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 border border-zinc-300 bg-white text-zinc-900 px-6 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:border-zinc-950 transition-colors"
              >
                Track Your Order
              </Link>
            </div>

            {/* Key stats bar */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-zinc-300/80 max-w-md">
              <div>
                <p className="text-2xl font-bold font-mono text-zinc-950">6063</p>
                <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Anodized Aluminum</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-[#ea580c]">24h</p>
                <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Direct Dispatch</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-[#15803d]">2 Yr</p>
                <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Hardware Warranty</p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Showcase Card */}
          <div className="lg:col-span-5">
            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="aspect-[4/3] overflow-hidden bg-zinc-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80"
                  alt="Pulse Monolith Mechanical Keyboard"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-[#ea580c] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  Flagship Edition
                </div>
                <div className="absolute bottom-3 left-3 bg-white/95 border border-zinc-200 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold text-[#15803d]">
                  IN STOCK · READY TO SHIP
                </div>
              </div>
              <div className="p-5 bg-white flex items-center justify-between border-t border-zinc-100">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#ea580c]">
                    Hardware / Input
                  </p>
                  <p className="text-sm font-bold text-zinc-950 mt-0.5">
                    Pulse Monolith Mechanical Keyboard
                  </p>
                </div>
                <Link
                  href="/products/pulse-monolith-keyboard"
                  className="px-4 py-2 rounded-lg bg-zinc-950 text-white text-xs font-mono font-bold hover:bg-[#ea580c] transition-colors"
                >
                  $249
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantees Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 pt-10 border-t border-zinc-300/70">
          <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-zinc-200/80">
            <div className="w-9 h-9 rounded-lg bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center flex-shrink-0 text-[#ea580c]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950">Complimentary Shipping</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Tracked express courier delivery on all orders over $50.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-zinc-200/80">
            <div className="w-9 h-9 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center flex-shrink-0 text-[#15803d]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950">2-Year Protection</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Full replacement coverage against mechanical or acoustic defects.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-zinc-200/80">
            <div className="w-9 h-9 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center flex-shrink-0 text-[#1d4ed8]">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950">30-Day Trial</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Test in your own studio. Easy returns with zero restocking fees.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 bg-white p-4 rounded-xl border border-zinc-200/80">
            <div className="w-9 h-9 rounded-lg bg-[#fefce8] border border-[#fef08a] flex items-center justify-center flex-shrink-0 text-[#a16207]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950">Small-Batch QC</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Individually serialized units inspected prior to dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
