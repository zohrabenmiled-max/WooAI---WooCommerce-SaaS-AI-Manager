import React, { useState, useEffect } from 'react';
import { 
  Package, Search, RefreshCw, Filter, ArrowUpDown, 
  Eye, Plus, Minus, Trash2, Loader2, Sparkles, AlertTriangle,
  X, ExternalLink, TrendingUp, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Input, Card } from './ui';
import { fetchProducts, updateProduct, fetchCategories, fetchVariations, deleteProduct, WooCredentials } from '../services/wooService';
import { decrypt } from '../lib/crypto';
import { cn } from '../lib/utils';

export default function StockManager({ sites, activeSite }: { sites: any[]; activeSite: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [filter, setFilter] = useState<'all' | 'out' | 'low'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'min' | 'max'>('name');
  const [updating, setUpdating] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeSite) {
      handleInitialLoad();
    }
  }, [activeSite]);

  const handleInitialLoad = async () => {
    setLoading(true);
    setProducts([]); // Clear before loading
    const site = activeSite;
    if (!site) return;

    try {
      const creds: WooCredentials = {
        url: site.url.endsWith('/') ? site.url.slice(0, -1) : site.url,
        consumerKey: site.consumerKeyEnc ? decrypt(site.consumerKeyEnc) : '',
        consumerSecret: site.consumerSecretEnc ? decrypt(site.consumerSecretEnc) : ''
      };

      // Fetch categories first
      const [categoriesData] = await Promise.all([
        fetchCategories(creds, { per_page: 100 })
      ]);
      setCategories(categoriesData);

      // Recursive fetch for all products
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 5) { 
        setLoadProgress(page);
        const productsData = await fetchProducts(creds, { per_page: 50, page });
        if (!productsData || productsData.length === 0) {
          hasMore = false;
          break;
        }
        
        // Process products: fetch variations for 'variable' products
        const processedBatch = await Promise.all(productsData.map(async (p: any) => {
          if (p.type === 'variable') {
            try {
              const variants = await fetchVariations(creds, p.id);
              return variants.map((v: any) => ({
                ...v,
                parent_id: p.id,
                parent_name: p.name,
                name: `${p.name} (${v.attributes.map((a: any) => a.option).join(', ')})`,
                categories: p.categories,
                images: (v.image && v.image.src) ? [v.image] : p.images
              }));
            } catch (e) {
              console.error("Failed to fetch variants for product", p.id);
              return [];
            }
          }
          return [p];
        }));

        const flattenedBatch = processedBatch.flat();
        
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const netProducts = flattenedBatch.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...netProducts];
        });

        if (productsData.length < 50) {
          hasMore = false;
        } else {
          page++;
        }
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      // Fallback mocks
      setProducts([
        { id: 1, name: "2ÈME GÉNÉRATION VERRUES AMÉLIORÉES RÉPARER LA RACINE DES VERRUES UICKLY", sku: "10050809954515321", stock_quantity: 5, stock_status: 'instock', price: '46', categories: [{ name: "BEAUTÉ ET SANTÉ" }], images: [{ src: "https://placehold.co/400" }], permalink: "#" },
        { id: 2, name: "6 PAIRES PUNK MÉTAL GÉOMÉTRIQUE CCB BOUCLES D'OREILLES MODE CRÉATIVE COULEUR OR GOUTTE D'EAU COEUR BOUCLES D'OREILLES B...", sku: "1005080625486772", stock_quantity: 1, stock_status: 'instock', price: '25', categories: [{ name: "BIJOUX & ACCESSOIRES" }], images: [{ src: "https://placehold.co/400" }], permalink: "#" },
      ]);
      setCategories([
        { id: '1', name: "BEAUTÉ ET SANTÉ" },
        { id: '2', name: "BIJOUX & ACCESSOIRES" }
      ]);
    }
    setLoading(false);
  };

  const handleUpdateStock = async (productId: number, newQuantity: number) => {
    const site = activeSite;
    if (!site) return;

    setUpdating(productId);
    try {
      const creds: WooCredentials = {
        url: site.url.endsWith('/') ? site.url.slice(0, -1) : site.url,
        consumerKey: site.consumerKeyEnc ? decrypt(site.consumerKeyEnc) : '',
        consumerSecret: site.consumerSecretEnc ? decrypt(site.consumerSecretEnc) : ''
      };
      
      const product = products.find(p => p.id === productId);
      const parentId = product?.parent_id;
      
      await updateProduct(creds, productId, { stock_quantity: newQuantity }, parentId);
      setProducts(products.map(p => p.id === productId ? { ...p, stock_quantity: newQuantity, stock_status: newQuantity > 0 ? 'instock' : 'outofstock' } : p));
      if (selectedProduct?.id === productId) {
        setSelectedProduct({ ...selectedProduct, stock_quantity: newQuantity });
      }
    } catch (err) {
      console.error("Update stock failed:", err);
    }
    setUpdating(null);
  };

  const handleDeleteProduct = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (confirmDelete !== productId) {
      setConfirmDelete(productId);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }

    const site = activeSite;
    if (!site) return;

    setUpdating(productId);
    setError(null);
    try {
      const creds: WooCredentials = {
        url: site.url.endsWith('/') ? site.url.slice(0, -1) : site.url,
        consumerKey: site.consumerKeyEnc ? decrypt(site.consumerKeyEnc) : '',
        consumerSecret: site.consumerSecretEnc ? decrypt(site.consumerSecretEnc) : ''
      };
      
      await deleteProduct(creds, productId, product.parent_id, true);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setConfirmDelete(null);
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
    } catch (err) {
      console.error("Delete product failed:", err);
      setError("Erreur lors de la suppression. Vérifiez vos permissions.");
    }
    setUpdating(null);
  };

  const sortedProducts = [...products]
    .filter(p => {
      if (p.type === 'variable') return false;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
      const isOutOfStock = p.stock_status === 'outofstock' || (p.manage_stock && p.stock_quantity === 0);
      const isLowStock = p.manage_stock && p.stock_quantity !== null && p.stock_quantity > 0 && p.stock_quantity <= 5;
      const matchesFilter = filter === 'all' || (filter === 'out' && isOutOfStock) || (filter === 'low' && isLowStock);
      const matchesCategory = selectedCategory === 'all' || p.categories?.some((c: any) => c.name === selectedCategory);
      return matchesSearch && matchesFilter && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'min') {
        const qA = a.stock_quantity === null ? Infinity : a.stock_quantity;
        const qB = b.stock_quantity === null ? Infinity : b.stock_quantity;
        return qA - qB;
      }
      if (sortBy === 'max') {
        const qA = a.stock_quantity === null ? -1 : a.stock_quantity;
        const qB = b.stock_quantity === null ? -1 : b.stock_quantity;
        return qB - qA;
      }
      return 0;
    });

  return (
    <div className="relative h-full flex flex-col max-w-[1600px] mx-auto font-sans overflow-hidden">
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-rose-500 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3"
          >
            <AlertTriangle className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-2 hover:opacity-50"><X className="w-3 h-3" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Sidebar Overlay */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-900 z-50 overflow-y-auto flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-500/10">
                    <Eye className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Détails Produit</h3>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Nexus Insight X86</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="p-8 space-y-8">
                {/* Hero section */}
                <div className="space-y-6">
                  <div className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 overflow-hidden flex items-center justify-center">
                    <img 
                      src={selectedProduct.images?.[0]?.src || "https://placehold.co/400"} 
                      alt="" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-xl font-black text-white uppercase leading-tight tracking-tight italic">{selectedProduct.name}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-indigo-400 font-bold">{selectedProduct.sku || 'NO_SKU'}</span>
                      <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[8px] font-black text-zinc-500 uppercase rounded tracking-widest">
                        {selectedProduct.categories?.[0]?.name || 'Général'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Pills */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Statut Stock</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        selectedProduct.stock_status === 'instock' ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      )} />
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">
                        {selectedProduct.stock_status === 'instock' ? 'En Stock' : 'Rupture'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Quantité Réelle</span>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-black text-white leading-none">
                        {selectedProduct.stock_quantity !== null ? selectedProduct.stock_quantity : '∞'}
                      </div>
                      <span className="text-[8px] font-bold text-zinc-600 uppercase">
                        {selectedProduct.manage_stock ? 'Unités (Géré)' : 'Stock non géré'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Performances & Seuil</span>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl divide-y divide-zinc-800/50">
                    <div className="flex justify-between items-center p-4">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Prix de vente</span>
                      <span className="text-[10px] font-black text-white">{selectedProduct.price || '0'} DT</span>
                    </div>
                    <div className="flex justify-between items-center p-4">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Seuil alerte (low stock)</span>
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">5 UNITÉS</span>
                    </div>
                    <div className="flex justify-between items-center p-4">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Ventes (mois)</span>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">0 UNITÉS</span>
                    </div>
                  </div>
                </div>

                {/* Administration Actions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Package className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Actions d'administration</span>
                  </div>
                  <a 
                    href={selectedProduct.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-[#111827] border border-indigo-500/30 text-white h-14 rounded-xl flex items-center justify-between px-6 group hover:bg-[#1f2937] transition-all font-black text-[10px] uppercase tracking-widest"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      Voir en boutique
                    </div>
                    <ArrowUpDown className="w-4 h-4 rotate-90 text-white/50" />
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header Widget */}
      <Card className="bg-zinc-950 border-zinc-900 border-x-0 border-t-0 rounded-none p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center">
            <Package className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Gestion des Stocks</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
              {products.length > 0 ? `${products.length} articles synchronisés` : "Contrôle rapide des inventaires & réapprovisionnement"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 text-[10px] font-black uppercase tracking-widest gap-2 bg-zinc-900 border-zinc-800 rounded-none">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Advice
          </Button>
          <Button variant="outline" onClick={handleInitialLoad} size="icon" className="h-10 w-10 bg-zinc-900 border-zinc-800 rounded-none">
            <RefreshCw className={cn("w-3.5 h-3.5 text-zinc-500", loading && "animate-spin")} />
          </Button>
        </div>
      </Card>

      {/* Control Bar */}
      <div className="flex flex-col xl:flex-row gap-4 px-6 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <Input 
            placeholder="Rechercher par nom ou SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/50 border-zinc-800 h-11 pl-12 rounded-none text-xs font-mono uppercase tracking-widest placeholder:text-zinc-700"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select 
            className="h-11 px-6 bg-zinc-900/50 border border-zinc-800 text-[10px] font-black text-white uppercase tracking-widest rounded-none focus:outline-none focus:border-indigo-500 transition-all"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>

          <div className="flex border border-zinc-800 rounded-none p-0.5 bg-zinc-900/50">
            {[
              { id: 'all', label: 'TOUS' },
              { id: 'out', label: 'RUPTURE' },
              { id: 'low', label: 'BAS' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-black tracking-widest transition-all rounded-none",
                  filter === f.id ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex border border-zinc-800 rounded-none p-0.5 bg-zinc-900/50 ml-2">
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setSortBy('name')}
               className={cn(
                 "h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 rounded-none px-3",
                 sortBy === 'name' ? "text-indigo-400 bg-zinc-950 shadow-inner" : "text-zinc-500 hover:text-zinc-300"
               )}
             >
               <ArrowUpDown className="w-3 h-3" /> A-Z
             </Button>
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setSortBy('min')}
               className={cn(
                 "h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 rounded-none px-3 border-x border-zinc-800/30",
                 sortBy === 'min' ? "text-indigo-400 bg-zinc-950 shadow-inner" : "text-zinc-500 hover:text-zinc-300"
               )}
             >
               Min Stock
             </Button>
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setSortBy('max')}
               className={cn(
                 "h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 rounded-none px-3",
                 sortBy === 'max' ? "text-indigo-400 bg-zinc-950 shadow-inner" : "text-zinc-500 hover:text-zinc-300"
               )}
             >
               Max Stock
             </Button>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 px-6 pb-20 overflow-y-auto custom-scrollbar">
        <Card className="bg-zinc-900/10 border-0 rounded-none shadow-none min-w-[1250px]">
          <div className="grid grid-cols-[1fr_120px_180px_200px_160px] gap-8 px-6 py-4 border-b border-zinc-900/50 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] sticky top-0 bg-zinc-950 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div>PRODUIT</div>
            <div className="pl-4">SKU</div>
            <div className="pl-4">INVENTAIRE</div>
            <div className="text-center">ACTIONS RAPIDES</div>
            <div className="text-right pr-4">MISE À JOUR MANUELLE</div>
          </div>

          <div className="divide-y divide-zinc-900/50">
            {!activeSite && (
              <div className="py-32 text-center h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                  <Info className="w-10 h-10 text-zinc-800" />
                </div>
                <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.3em]">Veuillez sélectionner un nœud boutique pour charger les données</p>
              </div>
            )}
            
            {activeSite && loading && products.length === 0 && (
              <div className="py-32 text-center h-full flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-6" />
                <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.3em] italic">Synchronisation chiffrée des inventaires en cours (Page {loadProgress})...</p>
              </div>
            )}

            {activeSite && sortedProducts.map(product => (
              <div key={`${product.parent_id || 'p'}-${product.id}`} className="grid grid-cols-[1fr_120px_180px_200px_160px] items-center gap-8 px-6 py-4 group hover:bg-zinc-900/40 transition-all border-b border-zinc-900/10">
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex-shrink-0 p-1 flex items-center justify-center group-hover:border-indigo-500/30 transition-colors shadow-sm">
                    <img 
                      src={product.images?.[0]?.src || "https://placehold.co/40"} 
                      alt="" 
                      className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[10px] font-black text-zinc-300 uppercase leading-snug truncate group-hover:text-white transition-colors" title={product.name}>
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest italic truncate">{product.categories?.[0]?.name || 'GENERAL'}</p>
                      {product.parent_id && (
                        <span className="text-[7px] px-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded uppercase font-black shrink-0">Variante</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="font-mono text-[9px] text-zinc-500 group-hover:text-indigo-400 transition-colors font-bold pl-4 truncate">
                  {product.sku || 'NO_SKU'}
                </div>

                <div className="space-y-1.5 px-4">
                  <div className="flex justify-between items-end">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-tighter italic",
                      product.stock_status === 'outofstock' ? "text-rose-500" : 
                      (product.stock_quantity !== null && product.stock_quantity <= 5) ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {product.stock_quantity !== null ? `${product.stock_quantity} Units` : (product.stock_status === 'instock' ? '∞ Illimité' : '0 Units')}
                    </span>
                    <span className="text-[7px] text-zinc-700 font-bold uppercase shrink-0">
                      {product.manage_stock ? 'GÉRÉ' : 'NON GÉRÉ'}
                    </span>
                  </div>
                  <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        product.stock_status === 'outofstock' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                        (product.stock_quantity !== null && product.stock_quantity <= 5) ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      )} 
                      style={{ 
                        width: product.stock_quantity === null 
                          ? (product.stock_status === 'instock' ? '100%' : '0%') 
                          : `${Math.min((product.stock_quantity / 20) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-center items-center gap-1.5">
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-600 hover:text-indigo-400 hover:border-indigo-500/50 transition-all shadow-lg"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleUpdateStock(product.id, (product.stock_quantity || 0) + 10)}
                    disabled={updating === product.id}
                    className="h-8 px-2 bg-zinc-950 border border-zinc-800 text-[9px] font-black text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all rounded shadow-md disabled:opacity-50"
                  >
                    +10
                  </button>
                  <button 
                    onClick={() => handleUpdateStock(product.id, (product.stock_quantity || 0) + 50)}
                    disabled={updating === product.id}
                    className="h-8 px-2 bg-zinc-950 border border-zinc-800 text-[9px] font-black text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all rounded shadow-md disabled:opacity-50"
                  >
                    +50
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    disabled={updating === product.id}
                    className={cn(
                      "w-8 h-8 rounded-full border bg-zinc-950 flex items-center justify-center transition-all shadow-lg disabled:opacity-50",
                      confirmDelete === product.id ? "border-rose-500 text-rose-500 bg-rose-500/10 scale-110" : "border-zinc-800 text-zinc-600 hover:text-rose-400 hover:border-rose-500/50"
                    )}
                  >
                    {updating === product.id ? <Loader2 className="w-3 h-3 animate-spin text-rose-500" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex justify-end pr-4">
                   <div className="flex items-center h-8 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden w-28 group-hover:border-zinc-700 transition-colors">
                     <button 
                      onClick={() => handleUpdateStock(product.id, Math.max(0, (product.stock_quantity || 0) - 1))}
                      disabled={updating === product.id}
                      className="w-8 h-full flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-50 border-r border-zinc-900"
                     >
                       <Minus className="w-3 h-3" />
                     </button>
                     <div className="flex-1 text-center text-[11px] font-mono font-black text-white bg-zinc-900/20">
                       {updating === product.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto text-indigo-400" /> : (product.stock_quantity !== null ? product.stock_quantity : '∞')}
                     </div>
                     <button 
                      onClick={() => handleUpdateStock(product.id, (product.stock_quantity || 0) + 1)}
                      disabled={updating === product.id}
                      className="w-8 h-full flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-50 border-l border-zinc-900"
                     >
                       <Plus className="w-3 h-3" />
                     </button>
                   </div>
                </div>
              </div>
            ))}

            {activeSite && !loading && sortedProducts.length === 0 && (
              <div className="py-32 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-900/50 mx-auto mb-4" />
                <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest font-bold">Aucun produit ne correspond à votre filtre de catégorie ou recherche</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
