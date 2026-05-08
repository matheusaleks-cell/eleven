"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Plus, Search, Filter, MoreHorizontal, Image as ImageIcon, ArrowUpDown, Save, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const INITIAL_PRODUCTS = [
  {
    id: "1",
    name: "Vezir Arms Carrera VR-12P",
    sku: "VEZIR-VR12P",
    brand: "Vezir Arms",
    model: "VR-12P",
    caliber: "12 Gauge",
    stock: 12,
    reserved: 8,
    price: 8500,
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Canik TP9 SFx Rival",
    sku: "CANIK-TP9-RIVAL",
    brand: "Canik",
    model: "TP9 SFx",
    caliber: "9mm",
    stock: 25,
    reserved: 10,
    price: 9200,
    status: "ACTIVE",
  },
  {
    id: "3",
    name: "Derya MK-12 AS-250",
    sku: "DERYA-MK12-250",
    brand: "Derya Arms",
    model: "MK-12",
    caliber: "12 Gauge",
    stock: 5,
    reserved: 0,
    price: 11500,
    status: "OUT_OF_STOCK",
  }
];

export default function ProductsPage() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("Todas as Marcas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    brand: "",
    model: "",
    caliber: "",
    price: "",
    stock: ""
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                           p.sku.toLowerCase().includes(search.toLowerCase()) ||
                           p.brand.toLowerCase().includes(search.toLowerCase());
      const matchesBrand = filterBrand === "Todas as Marcas" || p.brand === filterBrand;
      return matchesSearch && matchesBrand;
    });
  }, [products, search, filterBrand]);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.sku) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    const product = {
      id: Math.random().toString(36).substr(2, 9),
      ...newProduct,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      reserved: 0,
      status: "ACTIVE"
    };

    setProducts([product as any, ...products]);
    setIsModalOpen(false);
    setNewProduct({ name: "", sku: "", brand: "", model: "", caliber: "", price: "", stock: "" });
    toast.success("Produto adicionado ao catálogo com sucesso!");
  };

  return (
    <DashboardLayout role="ADMIN" userName="Admin Eleven" userEmail="admin@elevenfirearms.com.br">
      <div className="flex flex-col gap-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">CATÁLOGO DE PRODUTOS</h1>
            <p className="text-brand-text-secondary text-[10px] uppercase font-bold tracking-wider opacity-70">Gestão centralizada de inventário e especificações técnicas.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="gap-2" onClick={() => toast.info("Funcionalidade de importação XML em breve.")}>
              IMPORTAR XML
            </Button>
            <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.1)]" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              NOVO PRODUTO
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="py-4 px-5 border-l-2 border-l-brand-accent bg-brand-surface/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">Total de SKUs</p>
            <p className="text-2xl font-bold font-mono text-white">{products.length}</p>
          </Card>
          <Card className="py-4 px-5 border-l-2 border-l-brand-success bg-brand-surface/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">Em Estoque</p>
            <p className="text-2xl font-bold font-mono text-brand-success">{products.reduce((acc, p) => acc + p.stock, 0)}</p>
          </Card>
          <Card className="py-4 px-5 border-l-2 border-l-brand-warning bg-brand-surface/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">Reservados</p>
            <p className="text-2xl font-bold font-mono text-brand-warning">18</p>
          </Card>
          <Card className="py-4 px-5 border-l-2 border-l-brand-danger bg-brand-surface/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">Esgotados</p>
            <p className="text-2xl font-bold font-mono text-brand-danger">{products.filter(p => p.stock === 0).length}</p>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="p-4 bg-brand-surface/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
              <Input 
                className="pl-10" 
                placeholder="Buscar por SKU, Nome ou Marca..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-brand-text-secondary outline-none focus:border-brand-accent"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
              >
                <option>Todas as Marcas</option>
                <option>Vezir Arms</option>
                <option>Canik</option>
                <option>Derya Arms</option>
              </select>
              <Button variant="secondary" size="sm" className="gap-2">
                <Filter size={16} />
                FILTRAR
              </Button>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        <Card className="p-0 overflow-hidden border-brand-border bg-brand-surface/10">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-[300px]">PRODUTO</th>
                  <th>SKU</th>
                  <th>CALIBRE</th>
                  <th>ESTOQUE</th>
                  <th>VALOR B2C</th>
                  <th>STATUS</th>
                  <th className="text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-brand-accent/5 transition-colors group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-brand-bg rounded border border-brand-border flex items-center justify-center text-brand-text-muted group-hover:text-brand-accent transition-colors">
                          <ImageIcon size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm uppercase text-white">{product.name}</span>
                          <span className="text-[11px] text-brand-text-muted uppercase font-bold tracking-tighter">{product.brand} · {product.model}</span>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-brand-text-secondary">
                      {product.sku}
                    </td>
                    <td className="text-sm text-brand-text-secondary">
                      {product.caliber}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-bold text-sm font-mono",
                          product.stock <= 5 ? "text-brand-danger" : "text-white"
                        )}>
                          {String(product.stock).padStart(2, '0')} UN
                        </span>
                        {product.reserved > 0 && (
                          <span className="text-[10px] text-brand-text-muted uppercase font-bold">
                            {product.reserved} reservadas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-sm text-brand-accent font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </td>
                    <td>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded border tracking-widest",
                        product.status === "ACTIVE" 
                          ? "bg-brand-success/10 text-brand-success border-brand-success/20"
                          : "bg-brand-danger/10 text-brand-danger border-brand-danger/20"
                      )}>
                        {product.status === "ACTIVE" ? "ATIVO" : "ESGOTADO"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-2 h-auto text-brand-text-muted hover:text-brand-accent"
                          onClick={() => toast.info(`Ajuste de estoque para ${product.sku}`)}
                        >
                          <ArrowUpDown size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2 h-auto text-brand-text-muted hover:text-white">
                          <MoreHorizontal size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-brand-border flex items-center justify-between bg-brand-surface/20">
            <span className="text-[10px] text-brand-text-muted uppercase tracking-widest font-bold">Mostrando {filteredProducts.length} de {products.length} produtos</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled className="text-[10px] font-bold uppercase tracking-widest">Anterior</Button>
              <Button variant="secondary" size="sm" className="text-[10px] font-bold uppercase tracking-widest">Próximo</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal Novo Produto */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="CADASTRAR NOVO PRODUTO NO CATÁLOGO"
        className="max-w-2xl"
      >
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Nome do Produto *</label>
                 <Input 
                   placeholder="Ex: Canik TP9 SFx" 
                   value={newProduct.name}
                   onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">SKU de Controle *</label>
                 <Input 
                   placeholder="Ex: CNK-TP9" 
                   value={newProduct.sku}
                   onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Marca</label>
                 <Input 
                   placeholder="Ex: Canik" 
                   value={newProduct.brand}
                   onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Calibre</label>
                 <Input 
                   placeholder="Ex: 9mm" 
                   value={newProduct.caliber}
                   onChange={(e) => setNewProduct({...newProduct, caliber: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Preço B2C (R$)</label>
                 <Input 
                   type="number"
                   placeholder="0,00" 
                   value={newProduct.price}
                   onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Estoque Inicial</label>
                 <Input 
                   type="number"
                   placeholder="0" 
                   value={newProduct.stock}
                   onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                 />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[10px] font-bold tracking-widest uppercase">
                 CANCELAR
              </Button>
              <Button onClick={handleAddProduct} className="gap-2 text-[10px] font-bold tracking-widest uppercase">
                 <Save size={16} /> SALVAR PRODUTO
              </Button>
           </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}

