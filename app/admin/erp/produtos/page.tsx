"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Edit2, Plus, Search, Filter, MoreHorizontal, Image as ImageIcon, ArrowUpDown, Save, X as CloseIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useCallback } from "react";
import { getProducts, createProduct, deleteProduct, updateProduct } from "./actions";
import { maskDecimal } from "@/lib/masks";



export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("Todas as Marcas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    brand: "Canik",
    model: "",
    caliber: "9mm",
    species: "Pistola",
    actionType: "Semiautomática",
    capacity: "18",
    barrelLength: "4.5",
    finish: "Preto Fosco",
    originCountry: "Turquia",
    ncm: "9302.00.00",
    priceB2C: "",
    priceB2B: "",
    stockInitial: "0",
    technicalDescription: "",
    photos: ""
  });

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const name = (p.commercialName || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const searchLower = search.toLowerCase();

      const matchesSearch = name.includes(searchLower) || 
                           sku.includes(searchLower) ||
                           brand.includes(searchLower);
      const matchesBrand = filterBrand === "Todas as Marcas" || p.brand === filterBrand;
      return matchesSearch && matchesBrand;
    });
  }, [products, search, filterBrand]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku) {
      toast.error("Nome e SKU são obrigatórios.");
      return;
    }

    try {
      let res;
      if (editingId) {
        res = await updateProduct(editingId, {
          ...newProduct,
          stockAvailable: Number(newProduct.stockInitial)
        });
      } else {
        res = await createProduct(newProduct);
      }

      if (res.success) {
        toast.success(editingId ? "Arma atualizada!" : "Arma cadastrada com sucesso!");
        setIsModalOpen(false);
        setEditingId(null);
        setNewProduct({
          name: "", sku: "", brand: "Canik", model: "", caliber: "9mm",
          species: "Pistola", actionType: "Semiautomática", capacity: "18",
          barrelLength: "4.5", finish: "Preto Fosco", originCountry: "Turquia",
          ncm: "9302.00.00", priceB2C: "", priceB2B: "", stockInitial: "0",
          technicalDescription: "", photos: ""
        });
        refreshProducts();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Erro ao processar operação.");
    }
  };

  const handleOpenEdit = (product: any) => {
    setNewProduct({
      name: product.commercialName,
      sku: product.sku,
      brand: product.brand,
      model: product.model,
      caliber: product.caliber,
      species: product.species,
      actionType: product.actionType,
      capacity: String(product.capacity),
      barrelLength: String(product.barrelLength),
      finish: product.finish,
      originCountry: product.originCountry,
      ncm: product.ncm,
      priceB2C: String(product.priceB2C),
      priceB2B: String(product.priceB2B),
      stockInitial: String(product.stockAvailable),
      technicalDescription: product.technicalDescription || "",
      photos: product.photos || ""
    });
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar exclusão permanente deste SKU?")) return;
    const res = await deleteProduct(id);
    if (res.success) {
      toast.success("Produto removido.");
      refreshProducts();
    } else {
      toast.error(res.error);
    }
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
            <p className="text-2xl font-bold font-mono text-brand-success">{products.reduce((acc, p) => acc + (p.stockAvailable || 0), 0)}</p>
          </Card>
          <Card className="py-4 px-5 border-l-2 border-l-brand-warning bg-brand-surface/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">Reservados</p>
            <p className="text-2xl font-bold font-mono text-brand-warning">{products.reduce((acc, p) => acc + (p.stockReserved || 0), 0)}</p>
          </Card>
          <Card className="py-4 px-5 border-l-2 border-l-brand-danger bg-brand-surface/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">Esgotados</p>
            <p className="text-2xl font-bold font-mono text-brand-danger">{products.filter(p => (p.stockAvailable || 0) === 0).length}</p>
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
                          (product.stockAvailable || 0) <= 5 ? "text-brand-danger" : "text-white"
                        )}>
                          {String(product.stockAvailable || 0).padStart(2, '0')} UN
                        </span>
                        {(product.stockReserved || 0) > 0 && (
                          <span className="text-[10px] text-brand-text-muted uppercase font-bold">
                            {product.stockReserved} reservadas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-sm text-brand-accent font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.priceB2C)}
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
                          onClick={() => handleOpenEdit(product)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-2 h-auto text-brand-text-muted hover:text-brand-danger"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 size={16} />
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
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "EDITAR ARMAMENTO DO CATÁLOGO" : "CADASTRAR NOVO PRODUTO NO CATÁLOGO"}
        className="max-w-2xl"
      >
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Nome Comercial *</label>
                 <Input 
                   placeholder="Ex: Canik TP9 SFx Rival" 
                   value={newProduct.name}
                   onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">SKU (Único) *</label>
                 <Input 
                   placeholder="Ex: CNK-TP9-RIV" 
                   value={newProduct.sku}
                   onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                 />
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Marca</label>
                 <Input 
                   value={newProduct.brand}
                   onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Modelo</label>
                 <Input 
                   value={newProduct.model}
                   onChange={(e) => setNewProduct({...newProduct, model: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Calibre</label>
                 <Input 
                   value={newProduct.caliber}
                   onChange={(e) => setNewProduct({...newProduct, caliber: e.target.value})}
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Espécie</label>
                 <select 
                    className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white"
                    value={newProduct.species}
                    onChange={(e) => setNewProduct({...newProduct, species: e.target.value})}
                 >
                    <option>Pistola</option>
                    <option>Revolver</option>
                    <option>Rifle</option>
                    <option>Espingarda</option>
                    <option>Carabina</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">NCM (Fiscal) *</label>
                 <Input 
                   maxLength={8}
                   placeholder="Ex: 93032000"
                   value={newProduct.ncm}
                   onChange={(e) => setNewProduct({...newProduct, ncm: e.target.value.replace(/\D/g, "")})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">País de Origem</label>
                 <Input 
                   value={newProduct.originCountry}
                   onChange={(e) => setNewProduct({...newProduct, originCountry: e.target.value})}
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Preço B2C (R$)</label>
                 <Input 
                   placeholder="0.00"
                   value={newProduct.priceB2C}
                   onChange={(e) => setNewProduct({...newProduct, priceB2C: maskDecimal(e.target.value)})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Preço B2B (R$)</label>
                 <Input 
                   placeholder="0.00"
                   value={newProduct.priceB2B}
                   onChange={(e) => setNewProduct({...newProduct, priceB2B: maskDecimal(e.target.value)})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Estoque Inicial</label>
                 <Input 
                   type="number"
                   value={newProduct.stockInitial}
                   onChange={(e) => setNewProduct({...newProduct, stockInitial: e.target.value})}
                 />
              </div>

              <div className="md:col-span-3 h-px bg-brand-border/30 my-2" />

              {/* Especificações Técnicas */}
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Tipo de Ação</label>
                 <Input 
                   placeholder="Ex: Semiautomática" 
                   value={newProduct.actionType}
                   onChange={(e) => setNewProduct({...newProduct, actionType: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Capacidade</label>
                 <Input 
                   placeholder="Ex: 18+1" 
                   value={newProduct.capacity}
                   onChange={(e) => setNewProduct({...newProduct, capacity: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Cano (Pol.)</label>
                 <Input 
                   placeholder="Ex: 4.5" 
                   value={newProduct.barrelLength}
                   onChange={(e) => setNewProduct({...newProduct, barrelLength: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Acabamento</label>
                 <Input 
                   placeholder="Ex: Cerakote" 
                   value={newProduct.finish}
                   onChange={(e) => setNewProduct({...newProduct, finish: e.target.value})}
                 />
              </div>
              <div className="space-y-2 md:col-span-1">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">URL da Foto</label>
                 <Input 
                   placeholder="https://..." 
                   value={newProduct.photos}
                   onChange={(e) => setNewProduct({...newProduct, photos: e.target.value})}
                 />
              </div>
              <div className="space-y-2 md:col-span-1">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Preview Visual</label>
                 <div className="w-full h-10 bg-brand-bg rounded border border-brand-border flex items-center justify-center overflow-hidden">
                    {newProduct.photos ? (
                      <img src={newProduct.photos} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-brand-text-muted opacity-30" />
                    )}
                 </div>
              </div>
              <div className="space-y-2 md:col-span-3">
                 <label className="text-[10px] font-bold uppercase text-brand-text-muted">Descrição Técnica / Marketing</label>
                 <textarea 
                   className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white h-20 outline-none focus:border-brand-accent transition-colors"
                   placeholder="Destaque as principais características..."
                   value={newProduct.technicalDescription}
                   onChange={(e) => setNewProduct({...newProduct, technicalDescription: e.target.value})}
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

