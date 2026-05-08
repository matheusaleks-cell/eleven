"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShoppingCart, LayoutGrid, Menu, Search, Star, ArrowRight, Package, ShieldCheck, BadgePercent, TrendingUp, History, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { WhatsAppWidget } from "@/components/shared/WhatsAppWidget";

const B2B_PRODUCTS = [
  {
    id: "1",
    name: "VR-12P Carrera",
    brand: "Vezir Arms",
    price_b2c: 8500,
    price_b2b: 6200,
    stock: 45,
    tag: "MAIS VENDIDO",
    origin: "TURQUIA",
  },
  {
    id: "2",
    name: "TP9 SFx Rival",
    brand: "Canik",
    price_b2c: 9200,
    price_b2b: 6800,
    stock: 12,
    tag: "PROFISSIONAL",
    origin: "TURQUIA",
  },
  {
    id: "3",
    name: "MK-12 AS-250",
    brand: "Derya Arms",
    price_b2c: 11500,
    price_b2b: 8400,
    stock: 8,
    tag: "MILITAR",
    origin: "TURQUIA",
  }
];

export default function RevendaPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-white font-rajdhani selection:bg-brand-accent selection:text-brand-bg">
       {/* B2B Header */}
       <header className="border-b border-brand-accent/30 bg-brand-surface/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
             <div className="flex items-center gap-10">
                <Link href="/loja">
                   <Image src="/logos/logo-alta-a.png" alt="Eleven" width={110} height={36} className="invert brightness-0" />
                </Link>
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-brand-accent/10 border border-brand-accent/30 rounded text-brand-accent">
                   <ShieldCheck size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Portal do Lojista (B2B)</span>
                </div>
             </div>
             
             <div className="flex items-center gap-6">
                <nav className="hidden lg:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-text-secondary">
                   <a href="#" className="hover:text-brand-accent transition-colors">Tabela de Preços</a>
                   <a href="#" className="hover:text-brand-accent transition-colors">Pedidos em Aberto</a>
                   <a href="#" className="hover:text-brand-accent transition-colors">Meus Créditos</a>
                </nav>
                <div className="h-6 w-px bg-brand-border" />
                <div className="flex items-center gap-4">
                   <button className="relative p-2 text-brand-accent hover:text-brand-accent/80 transition-colors">
                     <ShoppingCart size={22} />
                     <span className="absolute top-1 right-1 bg-brand-accent text-brand-bg text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
                   </button>
                   <div className="flex items-center gap-3 bg-brand-input border border-brand-border p-1.5 pr-4 rounded-full">
                      <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-brand-bg text-xs font-bold">CT</div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold leading-none uppercase">Clube de Tiro Sniper</span>
                         <span className="text-[8px] text-brand-text-muted uppercase font-bold mt-0.5 tracking-tighter">ID: #B2B-SP-044</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </header>

       <main className="max-w-7xl mx-auto px-4 py-12">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             <Card className="bg-brand-surface/40 border-brand-border flex items-center gap-4">
                <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
                   <BadgePercent size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-widest">Nível de Desconto</p>
                   <p className="text-xl font-bold font-mono">OURO (25-30%)</p>
                </div>
             </Card>
             <Card className="bg-brand-surface/40 border-brand-border flex items-center gap-4">
                <div className="p-3 bg-brand-success/10 rounded border border-brand-success/20 text-brand-success">
                   <TrendingUp size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-widest">Crédito Disponível</p>
                   <p className="text-xl font-bold font-mono">R$ 85.000,00</p>
                </div>
             </Card>
             <Card className="bg-brand-surface/40 border-brand-border flex items-center gap-4">
                <div className="p-3 bg-brand-warning/10 rounded border border-brand-warning/20 text-brand-warning">
                   <History size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-widest">Pedidos em Processo</p>
                   <p className="text-xl font-bold font-mono">03 ATIVOS</p>
                </div>
             </Card>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
             <h2 className="text-2xl font-bold font-rajdhani uppercase tracking-tighter">Catálogo de Atacado</h2>
             <div className="flex gap-4">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
                   <Input className="pl-10 h-10 w-[300px]" placeholder="Buscar SKU ou Modelo..." />
                </div>
                <Button variant="secondary" className="h-10 text-[10px]">VER TABELA COMPLETA (PDF)</Button>
             </div>
          </div>

          {/* B2B Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
             <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden">
                <table className="table-base">
                   <thead>
                      <tr className="bg-brand-bg/60">
                         <th>Produto</th>
                         <th>Marca</th>
                         <th>Estoque Lojista</th>
                         <th>Preço Sugerido (B2C)</th>
                         <th>Seu Preço (B2B)</th>
                         <th>Margem Bruta</th>
                         <th className="text-right">Ação</th>
                      </tr>
                   </thead>
                   <tbody>
                      {B2B_PRODUCTS.map((prod) => (
                         <tr key={prod.id} className="hover:bg-brand-accent/5 transition-colors group">
                            <td>
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-brand-bg rounded border border-brand-border flex items-center justify-center text-brand-text-muted">
                                     <Package size={20} />
                                  </div>
                                  <span className="text-sm font-bold text-white uppercase group-hover:text-brand-accent transition-colors">{prod.name}</span>
                               </div>
                            </td>
                            <td className="text-xs font-bold text-brand-text-muted uppercase">{prod.brand}</td>
                            <td>
                               <div className="flex flex-col gap-1">
                                  <div className="flex justify-between items-center w-24">
                                     <span className={cn(
                                        "text-[10px] font-bold uppercase",
                                        prod.stock > 10 ? "text-brand-success" : "text-brand-warning"
                                     )}>{prod.stock} UN</span>
                                  </div>
                                  <div className="w-24 h-1 bg-brand-border rounded-full">
                                     <div 
                                        className={cn("h-full rounded-full", prod.stock > 10 ? "bg-brand-success" : "bg-brand-warning")} 
                                        style={{ width: `${Math.min(prod.stock * 2, 100)}%` }} 
                                     />
                                  </div>
                               </div>
                            </td>
                            <td className="font-mono text-sm text-brand-text-muted">R$ {prod.price_b2c.toLocaleString()}</td>
                            <td className="font-mono text-sm font-bold text-white">R$ {prod.price_b2b.toLocaleString()}</td>
                            <td>
                               <span className="text-[10px] font-bold text-brand-success bg-brand-success/10 px-2 py-0.5 rounded border border-brand-success/20">
                                  +{Math.round((prod.price_b2c / prod.price_b2b - 1) * 100)}% MARGEM
                               </span>
                            </td>
                            <td className="text-right">
                               <Button className="h-9 px-4 text-[10px] gap-2 font-bold uppercase tracking-widest">
                                  <ShoppingCart size={14} /> ADICIONAR
                               </Button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </Card>
          </div>
       </main>

       <footer className="border-t border-brand-border py-12 bg-brand-surface/30 mt-20">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex flex-col items-center md:items-start gap-4">
                <Image src="/logos/logo-alta-a.png" alt="Eleven" width={100} height={32} className="invert brightness-0 opacity-50" />
                <p className="text-[10px] text-brand-text-muted uppercase tracking-widest font-bold">Portal de Revenda Eleven Firearms · Suporte B2B: (11) 98888-7777</p>
             </div>
             <div className="flex gap-6">
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted hover:text-brand-accent">Política de Revenda</Button>
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted hover:text-white">Ajuda B2B</Button>
             </div>
          </div>
       </footer>

       <WhatsAppWidget />
    </div>
  );
}
