"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, ShoppingCart, ShieldCheck, Star, ArrowRight, Package, LayoutGrid, Menu, User, Filter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { WhatsAppWidget } from "@/components/shared/WhatsAppWidget";

const PUBLIC_PRODUCTS = [
  {
    id: "1",
    name: "VR-12P Carrera",
    brand: "Vezir Arms",
    category: "Espingardas",
    caliber: "12 Gauge",
    price: 8500,
    rating: 5,
    tag: "MAIS VENDIDO",
    origin: "TURQUIA",
  },
  {
    id: "2",
    name: "TP9 SFx Rival",
    brand: "Canik",
    category: "Pistolas",
    caliber: "9mm",
    price: 9200,
    rating: 5,
    tag: "PROFISSIONAL",
    origin: "TURQUIA",
  },
  {
    id: "3",
    name: "MK-12 AS-250",
    brand: "Derya Arms",
    category: "Espingardas",
    caliber: "12 Gauge",
    price: 11500,
    rating: 4.8,
    tag: "MILITAR",
    origin: "TURQUIA",
  },
  {
    id: "4",
    name: "Combat Master",
    brand: "Taran Tactical",
    category: "Pistolas",
    caliber: "9mm",
    price: 24500,
    rating: 5,
    tag: "CUSTOM",
    origin: "EUA",
  }
];

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-white font-rajdhani selection:bg-brand-accent selection:text-brand-bg">
       {/* Public Nav */}
       <header className="border-b border-brand-border bg-brand-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
             <div className="flex items-center gap-10">
                <Link href="/">
                   <Image src="/logos/logo-alta-a.png" alt="Eleven" width={110} height={36} className="invert brightness-0" />
                </Link>
                <nav className="hidden lg:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-text-secondary">
                   <a href="#" className="hover:text-brand-accent transition-colors text-brand-accent">Catálogo</a>
                   <a href="#" className="hover:text-brand-accent transition-colors">Novidades</a>
                   <a href="#" className="hover:text-brand-accent transition-colors">Sobre Nós</a>
                   <a href="#" className="hover:text-brand-accent transition-colors">Contato</a>
                </nav>
             </div>
             <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1 mr-4 px-3 py-1.5 rounded-full bg-brand-accent/5 border border-brand-accent/10 text-brand-accent">
                   <ShieldCheck size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-wider">Loja Autorizada</span>
                </div>
                <button className="relative p-2 text-brand-text-secondary hover:text-brand-accent transition-colors">
                  <ShoppingCart size={22} />
                  <span className="absolute top-1 right-1 bg-brand-accent text-brand-bg text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
                </button>
                <Link href="/login">
                   <Button size="sm" className="hidden sm:flex gap-2">
                     <User size={16} /> ENTRAR
                   </Button>
                </Link>
                <button className="lg:hidden p-2 text-brand-text-secondary">
                  <Menu size={24} />
                </button>
             </div>
          </div>
       </header>

       <main className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
          {/* Hero Section */}
          <div className="relative mb-20">
             <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />
             <div className="relative z-10">
                <span className="text-brand-accent text-xs font-bold tracking-[0.4em] uppercase mb-4 block">Exclusive Weaponry</span>
                <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tighter leading-none">
                   ARMAMENTO DE <span className="text-brand-accent uppercase">ELITE</span> <br/>
                   IMPORTADO
                </h1>
                <p className="text-brand-text-secondary text-base lg:text-lg max-w-2xl mb-10 leading-relaxed font-medium">
                   Curadoria especializada em armamentos de alto desempenho. Importação direta da Turquia e Estados Unidos com garantia de autenticidade e suporte técnico especializado.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 p-2 bg-brand-surface rounded-xl border border-brand-border max-w-3xl shadow-2xl">
                   <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" size={20} />
                      <Input className="pl-12 border-none bg-transparent h-12 text-base" placeholder="Qual armamento você busca?" />
                   </div>
                   <Button className="h-12 px-10 text-xs">BUSCAR NO ACERVO</Button>
                </div>
             </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border/50">
             <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-brand-accent border-b-2 border-brand-accent pb-4 text-xs font-bold uppercase tracking-widest">
                   TODOS OS PRODUTOS
                </button>
                <button className="flex items-center gap-2 text-brand-text-muted hover:text-white transition-colors pb-4 text-xs font-bold uppercase tracking-widest">
                   PISTOLAS
                </button>
                <button className="flex items-center gap-2 text-brand-text-muted hover:text-white transition-colors pb-4 text-xs font-bold uppercase tracking-widest">
                   ESPINGARDAS
                </button>
             </div>
             <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-[10px] gap-2 border border-brand-border">
                  <Filter size={14} /> FILTROS AVANÇADOS
                </Button>
                <div className="flex gap-1">
                   <button className="p-2 bg-brand-surface rounded border border-brand-accent text-brand-accent"><LayoutGrid size={16} /></button>
                   <button className="p-2 bg-brand-surface rounded border border-brand-border text-brand-text-muted"><Menu size={16} /></button>
                </div>
             </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {PUBLIC_PRODUCTS.map((product) => (
                <Card key={product.id} className="p-0 border-brand-border bg-brand-surface/30 group hover:border-brand-accent/50 transition-all duration-300 flex flex-col hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                   <div className="aspect-[1/1] bg-brand-bg relative overflow-hidden flex items-center justify-center p-12 group-hover:bg-brand-bg/80 transition-colors">
                      <div className="text-brand-text-muted opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Package size={120} />
                      </div>
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                         {product.tag && (
                           <span className="bg-brand-accent text-brand-bg text-[9px] font-bold px-2 py-1 rounded shadow-lg tracking-wider">
                              {product.tag}
                           </span>
                         )}
                         <span className="bg-brand-bg/80 text-white text-[9px] font-bold px-2 py-1 rounded border border-brand-border backdrop-blur-sm tracking-wider">
                            {product.origin}
                         </span>
                      </div>
                   </div>
                   <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-[0.2em]">{product.brand}</span>
                         <div className="flex gap-0.5 text-brand-accent">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} className={i >= Math.floor(product.rating) ? "opacity-30" : ""} />
                            ))}
                         </div>
                      </div>
                      <h3 className="font-bold text-xl mb-1 group-hover:text-brand-accent transition-colors leading-tight">{product.name}</h3>
                      <p className="text-[11px] text-brand-text-secondary uppercase tracking-widest font-bold mb-4">{product.category} · {product.caliber}</p>
                      
                      <div className="mt-auto pt-6 border-t border-brand-border/50 flex items-center justify-between">
                         <div>
                            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest mb-1">Preço Sugerido</p>
                            <p className="text-2xl font-bold font-mono text-brand-accent">R$ {product.price.toLocaleString('pt-BR')}</p>
                         </div>
                         <Button size="sm" variant="secondary" className="w-12 h-12 p-0 flex items-center justify-center group-hover:bg-brand-accent group-hover:text-brand-bg transition-all">
                           <ArrowRight size={20} />
                         </Button>
                      </div>
                   </div>
                </Card>
             ))}
          </div>

          {/* Newsletter / CTA */}
          <Card className="mt-20 p-12 border-brand-accent/20 bg-brand-accent/[0.02] flex flex-col items-center text-center">
             <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent mb-6">
                <ShieldCheck size={32} />
             </div>
             <h2 className="text-3xl font-bold mb-4 tracking-tighter">RECEBA AS NOVIDADES DO PRÓXIMO LOTE</h2>
             <p className="text-brand-text-secondary max-w-xl mb-8">Nossos estoques são limitados e esgotam rapidamente. Cadastre-se para receber aviso prévio sobre chegadas e reservas antecipadas.</p>
             <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <Input placeholder="Seu melhor e-mail" className="h-12" />
                <Button className="h-12 px-8">CADASTRAR</Button>
             </div>
          </Card>
       </main>

       <footer className="border-t border-brand-border bg-brand-surface py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex flex-col items-center md:items-start gap-4">
                <Image src="/logos/logo-alta-a.png" alt="Eleven" width={100} height={32} className="invert brightness-0 opacity-50" />
                <p className="text-[10px] text-brand-text-muted uppercase tracking-widest font-medium">© 2026 ELEVEN FIREARMS · ALL RIGHTS RESERVED</p>
             </div>
             <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">
                <a href="#" className="hover:text-brand-accent">Privacidade</a>
                <a href="#" className="hover:text-brand-accent">Termos</a>
                <a href="#" className="hover:text-brand-accent">Compliance</a>
             </div>
          </div>
       </footer>

       <WhatsAppWidget />
    </div>
  );
}
