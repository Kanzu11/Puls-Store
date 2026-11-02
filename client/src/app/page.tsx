import React from 'react';
import { Link } from '@/lib/router';
import { ArrowUpRight, Cpu, Headphones, Layers, Star } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { FeaturedProducts } from '@/components/FeaturedProducts';

const CATEGORIES = [
  {
    name: 'Precision Hardware',
    slug: 'hardware',
    tag: '01 / INPUT & POWER',
    description:
      'CNC-milled mechanical keyboards, programmable rotary encoders, and high-density GaN power delivery hubs.',
    image:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
    icon: Cpu,
  },
  {
    name: 'Studio Audio',
    slug: 'audio',
    tag: '02 / ACOUSTICS',
    description:
      'Reference-grade planar magnetic headphones and zero-latency monitoring equipment for critical listening.',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    icon: Headphones,
  },
  {
    name: 'Workspace Architecture',
    slug: 'workspace',
    tag: '03 / DESK SYSTEMS',
    description:
      'Solid American black walnut risers and vegetable-tanned full-grain leather mats built for daily calm.',
    image:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80',
    icon: Layers,
  },
];

const REVIEWS = [
  {
    quote:
      'The Pulse Monolith keyboard feels like a piece of Leica camera hardware on my desk. Zero flex, extraordinary acoustic profile.',
    author: 'Henrik Lindqvist',
    role: 'Industrial Designer, Stockholm',
    item: 'Pulse Monolith Keyboard',
  },
  {
    quote:
      'Finally an e-commerce store that curates only functional, durable equipment without gimmicks. Same-day dispatch was effortless.',
    author: 'claire.m@studio.io',
    role: 'Mastering Engineer, Berlin',
    item: 'Acoustic Studio Headphones',
  },
  {
    quote:
      'The solid walnut riser and full-grain leather mat transformed my setup. Clean packaging and instant email updates.',
    author: 'Marcus Vance',
    role: 'Principal Architect, San Francisco',
    item: 'Walnut Riser & Desk Pad',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Shop by Category */}
      <section className="border-b border-zinc-200 bg-zinc-50/50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                Departments
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                Engineered by Discipline
              </h2>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm">
              Every object in our catalog is designed around tactile permanence, repairability, and clean industrial geometry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/products`}
                  className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-950 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/10] bg-zinc-100 overflow-hidden relative">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 bg-[#ea580c] text-white px-2.5 py-1 rounded-md text-[10px] font-mono font-bold shadow-sm">
                        {cat.tag}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-zinc-950 group-hover:text-[#ea580c] transition-colors">{cat.name}</h3>
                        <Icon className="w-4 h-4 text-zinc-400 group-hover:text-[#ea580c] transition-colors" />
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">{cat.description}</p>
                    </div>
                  </div>
                  <div className="px-6 py-3.5 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-950 bg-zinc-50/40">
                    <span>Explore {cat.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Featured Collection */}
      <FeaturedProducts />

      {/* 4. Architectural / Material Philosophy */}
      <section className="border-t border-b border-zinc-200 bg-zinc-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                Design Philosophy
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                Zero plastic. Zero visual noise. Built to outlast your setup.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We partner directly with precision CNC mills and acoustic laboratories to produce small-batch hardware without middlemen. Every switch, housing, and cable is user-serviceable.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Chassis Tolerance
                  </p>
                  <p className="text-xl font-mono font-bold text-white mt-1">±0.02 mm</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Switch Rating
                  </p>
                  <p className="text-xl font-mono font-bold text-white mt-1">80M Actuations</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/50 space-y-2">
                <p className="text-xs font-mono text-zinc-400">01</p>
                <h3 className="text-sm font-bold text-white">Bead-Blasted Anodization</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Micro-textured surface treatment resists fingerprints and wear over years of daily use.
                </p>
              </div>
              <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/50 space-y-2">
                <p className="text-xs font-mono text-zinc-400">02</p>
                <h3 className="text-sm font-bold text-white">Planar Magnetic Drivers</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ultra-thin diaphragm transducers reproduce transient detail without harmonic distortion.
                </p>
              </div>
              <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/50 space-y-2">
                <p className="text-xs font-mono text-zinc-400">03</p>
                <h3 className="text-sm font-bold text-white">GaN Power Architecture</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gallium Nitride semiconductors deliver 100W output in half the thermal footprint.
                </p>
              </div>
              <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/50 space-y-2">
                <p className="text-xs font-mono text-zinc-400">04</p>
                <h3 className="text-sm font-bold text-white">Vegetable-Tanned Hide</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Full-grain hides drum-dyed with natural tannins that develop a rich patina.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customer Reviews */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
            Verified Owners
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            In Studios Worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              className="border border-zinc-200 rounded-2xl p-6 bg-white flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-[#ea580c]">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-[#ea580c]" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">“{r.quote}”</p>
              </div>
              <div className="pt-4 border-t border-zinc-100">
                <p className="text-xs font-bold text-zinc-950">{r.author}</p>
                <p className="text-[11px] text-zinc-400">{r.role}</p>
                <p className="text-[10px] font-mono font-semibold text-zinc-600 mt-1.5 uppercase">
                  Verified Purchase · {r.item}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

