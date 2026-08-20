import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { Sparkles, Zap, Star, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface GameCardProps {
  product: Product;
}

export default function GameCard({ product }: GameCardProps) {
  const lowestPrice = product.skus.length > 0
    ? Math.min(...product.skus.map(s => s.sellingPrice))
    : 0;

  return (
    <Link 
      href={`/topup/${product.slug}`}
      className="group relative flex flex-col rounded-2xl bg-surface/80 border border-surface-border/80 hover:border-violet-500/50 hover:bg-surface-elevated/90 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-violet-950/30 hover:-translate-y-1"
    >
      {/* Banner / Poster Header */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        <img 
          src={product.bannerImage} 
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.badge && (
            <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-violet-600/90 text-white rounded-lg backdrop-blur-md shadow-md border border-violet-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {product.badge}
            </span>
          )}
          {product.instantDelivery && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 rounded-lg backdrop-blur-md border border-cyan-500/40 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
              Instant
            </span>
          )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 text-[11px] font-bold text-amber-300">
            <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
            {product.rating.toFixed(1)}
          </div>
        )}

        {/* Category Tag */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase bg-black/50 px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm">
            {product.category}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5" />
          </div>
          <p className="text-xs text-slate-400 line-clamp-1 mb-3">
            {product.publisher}
          </p>
        </div>

        <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Starts from</span>
            <span className="text-sm font-bold text-white font-mono text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">
              IDR {lowestPrice.toLocaleString('id-ID')}
            </span>
          </div>
          <span className="px-3 py-1.5 text-xs font-semibold text-violet-300 bg-violet-600/20 group-hover:bg-violet-600 group-hover:text-white rounded-xl border border-violet-500/30 transition-all">
            Top Up
          </span>
        </div>
      </div>
    </Link>
  );
}
