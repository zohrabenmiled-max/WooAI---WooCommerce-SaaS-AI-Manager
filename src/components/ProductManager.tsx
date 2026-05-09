import React, { useState, useEffect } from 'react';
import { 
  Zap, TrendingUp, ShoppingBag, Eye, Edit3, Plus, Trash2, 
  ChevronDown, Search, Filter, Loader2, Sparkles, BrainCircuit,
  ArrowUpRight, Target, MousePointer2, AlertCircle, X, Percent, Tag,
  Lightbulb, CheckCircle2, Info, Globe, Calculator, ArrowRight, ExternalLink as ExternalLinkIcon
} from 'lucide-react';
import { Button, Card } from './ui';
import { decrypt } from '../lib/crypto';
import { cn } from '../lib/utils';
import { getWooProducts, updateWooProductStock, updateWooProductPrice, WooCredentials, fetchOrders } from '../services/wooService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

interface AISuggestion {
  productId?: number;
  name?: string;
  reason: string;
  recommendation: string;
  suggestedDiscountType?: 'percent' | 'fixed';
  suggestedDiscountValue?: number;
}

interface ProductManagerProps {
  sites: any[];
  activeSite: any;
}

export default function ProductManager({ sites, activeSite }: ProductManagerProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [promoModalProduct, setPromoModalProduct] = useState<any>(null);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  
  const [whatIfProduct, setWhatIfProduct] = useState<any>(null);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [nexusAnalysis, setNexusAnalysis] = useState<string | null>(null);
  const [loadingNexus, setLoadingNexus] = useState(false);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiFeatureName, setAiFeatureName] = useState('');

  // Real data states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [promoStats, setPromoStats] = useState({ totalOrders: 0, saleDiscounts: 0, percentage: 0, latestBatch: 0 });

  useEffect(() => {
    if (activeSite) {
      loadAllData();
    }
  }, [activeSite]);

  const getDecryptedCreds = (): WooCredentials | null => {
    if (!activeSite) return null;
    return {
      url: activeSite.url.endsWith('/') ? activeSite.url.slice(0, -1) : activeSite.url,
      consumerKey: activeSite.consumerKeyEnc ? decrypt(activeSite.consumerKeyEnc) : '',
      consumerSecret: activeSite.consumerSecretEnc ? decrypt(activeSite.consumerSecretEnc) : ''
    };
  };

  const loadAllData = async () => {
    const creds = getDecryptedCreds();
    if (!creds) return;

    setLoading(true);
    try {
      const [productsData, ordersData] = await Promise.all([
        getWooProducts(creds),
        fetchOrders(creds)
      ]);

      setProducts(productsData.filter((p: any) => p.type !== 'variable'));
      processStats(ordersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processStats = (orders: any[]) => {
    // 1. Revenue Data (Last 7 days)
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const revenueMap: { [key: string]: number } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      revenueMap[dayName] = 0;
    }

    let totalDiscounts = 0;
    const sellersMap: { [key: string]: any } = {};

    orders.forEach(order => {
      const date = new Date(order.date_created);
      const dayName = days[date.getDay()];
      if (revenueMap[dayName] !== undefined) {
        revenueMap[dayName] += parseFloat(order.total);
      }

      totalDiscounts += parseFloat(order.discount_total || '0');

      order.line_items.forEach((item: any) => {
        if (!sellersMap[item.product_id]) {
          sellersMap[item.product_id] = { 
            name: item.name, 
            sales: 0, 
            revenue: 0 
          };
        }
        sellersMap[item.product_id].sales += item.quantity;
        sellersMap[item.product_id].revenue += parseFloat(item.total);
      });
    });

    const revenueArray = Object.entries(revenueMap).map(([name, revenue]) => ({ name, revenue }));
    setRevenueData(revenueArray);

    // 2. Best Sellers
    const sortedSellers = Object.values(sellersMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);
    setBestSellers(sortedSellers);

    // 3. Promo Stats
    const totalRev = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    setPromoStats({
      totalOrders: orders.length,
      saleDiscounts: totalDiscounts,
      percentage: totalRev > 0 ? (totalDiscounts / totalRev) * 100 : 0,
      latestBatch: orders.length > 0 ? parseFloat(orders[0].total) : 0
    });
  };

  const handleAIFeature = async (feature: 'flash' | 'promo' | 'advice') => {
    if (products.length === 0 || !activeSite.geminiApiKeyEnc) {
      alert("Clé API Gemini requise. Veuillez la configurer dans la gestion des boutiques.");
      return;
    }
    
    setAiLoading(true);
    setAiModalOpen(true);
    setAiSuggestions([]);
    
    const featureLabels = {
      flash: 'FLASH SALES (IA)',
      promo: 'AUTO-PROMOS (IA)',
      advice: 'CONSEILS IA'
    };
    setAiFeatureName(featureLabels[feature]);

    try {
      const apiKey = decrypt(activeSite.geminiApiKeyEnc);
      const ai = new GoogleGenAI({ apiKey });
      
      const productSummary = products.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock_quantity || 0,
        price: p.price,
        on_sale: p.on_sale
      }));

      let systemInstruction = "";
      if (feature === 'flash') {
        systemInstruction = "Tu es un expert en e-commerce. Analyse la liste de produits fournie et suggère 3 produits pour une vente flash immédiate. Privilégie les articles avec beaucoup de stock (>20) ou les invendus. Pour chaque suggestion, donne le nom du produit, la raison stratégique et la recommandation de réduction. Ajoute obligatoirement 'suggestedDiscountType' ('percent' ou 'fixed') et 'suggestedDiscountValue' (nombre sans le signe %). Réponds exclusivement en JSON.";
      } else if (feature === 'promo') {
        systemInstruction = "Tu es un expert en e-commerce. Analyse la liste de produits et suggère 3-5 promotions intelligentes pour booster le chiffre d'affaires. Suggère des réductions modérées (5-15%). Pour chaque suggestion, donne le nom du produit, la raison stratégique et la recommandation précise. Ajoute obligatoirement 'suggestedDiscountType' ('percent' ou 'fixed') et 'suggestedDiscountValue' (nombre sans le signe %). Réponds exclusivement en JSON.";
      } else {
        systemInstruction = "Tu es un consultant business expert. Analyse l'état global du catalogue (stocks, prix) et donne 3 conseils stratégiques majeurs pour améliorer la rentabilité globale. Pour chaque conseil, donne un titre (name), une analyse détaillée (reason) et une action concrète (recommendation). Réponds exclusivement en JSON.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Voici les produits: ${JSON.stringify(productSummary)}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.NUMBER },
                name: { type: Type.STRING },
                reason: { type: Type.STRING },
                recommendation: { type: Type.STRING },
                suggestedDiscountType: { type: Type.STRING, enum: ['percent', 'fixed'] },
                suggestedDiscountValue: { type: Type.NUMBER }
              },
              required: ["reason", "recommendation"]
            }
          }
        },
      });

      const suggestions = JSON.parse(response.text || "[]");
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const generateNexusAnalysis = async (product: any) => {
    if (!activeSite.geminiApiKeyEnc) {
      alert("Clé API Gemini requise.");
      return;
    }
    setLoadingNexus(true);
    setNexusAnalysis(null);
    try {
      const apiKey = decrypt(activeSite.geminiApiKeyEnc);
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analyse stratégique profonde pour ce produit WooCommerce:
      Nom: ${product.name}
      Prix actuel: ${product.price} ${activeSite.currency || 'DT'}
      Stock: ${product.stock_quantity || 0}
      Ventes (estimées): 0 (nouveau ou rupture)
      
      Génère une 'ANALYSE PRÉDICTIVE NEXUS' structurée exactement comme ceci:
      - Titre: Analyse Stratégique: [Nom du Produit]
      - Expertise: Pricing & Revenue Management
      - Analyse de l'état actuel (Stock vs Ventes)
      - SCÉNARIO 1: OPTIMISATION DE LA CONVERSION (Objectif: Pénétration de marché)
      - Détails du scénario (Ajustement de prix suggéré, Élasticité Prix estimée, Impact Marge Brute, LTV).
      
      Reste extrêmement professionnel, utilise un ton 'high-end' et persuasif.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setNexusAnalysis(response.text || "Impossible de générer l'analyse.");
    } catch (error) {
      console.error('Nexus Analysis Error:', error);
      setNexusAnalysis("Erreur lors de la génération de l'analyse.");
    } finally {
      setLoadingNexus(false);
    }
  };

  const handleExecuteAISuggestion = async (s: AISuggestion) => {
    if (!s.productId || !s.suggestedDiscountValue || !s.suggestedDiscountType) return;
    const creds = getDecryptedCreds();
    if (!creds) return;

    setAiLoading(true);
    try {
      const product = products.find(p => p.id === s.productId);
      if (!product) return;

      const regularPrice = parseFloat(product.regular_price || product.price || '0');
      let salePrice = 0;
      
      if (s.suggestedDiscountType === 'percent') {
         const discount = (regularPrice * s.suggestedDiscountValue) / 100;
         salePrice = regularPrice - discount;
      } else {
         salePrice = regularPrice - s.suggestedDiscountValue;
      }

      await updateWooProductPrice(creds, s.productId, salePrice.toFixed(2));
      
      setProducts(prev => prev.map(p => 
        p.id === s.productId 
          ? { ...p, sale_price: salePrice.toFixed(2), on_sale: true } 
          : p
      ));
      
      setAiSuggestions(prev => prev.filter(item => item.productId !== s.productId));
    } catch (error) {
      console.error('AI Execution Error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    const creds = getDecryptedCreds();
    if (!promoModalProduct || !discountValue || !creds) return;
    
    setUpdatingPrice(true);
    try {
      const regularPrice = parseFloat(promoModalProduct.regular_price || promoModalProduct.price || '0');
      let salePrice = 0;
      
      if (discountType === 'percent') {
        const discount = (regularPrice * parseFloat(discountValue)) / 100;
        salePrice = regularPrice - discount;
      } else {
        salePrice = regularPrice - parseFloat(discountValue);
      }

      await updateWooProductPrice(creds, promoModalProduct.id, salePrice.toFixed(2));
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === promoModalProduct.id 
          ? { ...p, sale_price: salePrice.toFixed(2), on_sale: true } 
          : p
      ));
      
      setPromoModalProduct(null);
      setDiscountValue('');
    } catch (error) {
      console.error('Price update error:', error);
    } finally {
      setUpdatingPrice(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           p.categories?.some((cat: any) => cat.id.toString() === selectedCategory);
    
    let matchesStock = true;
    if (selectedStock === 'instock') matchesStock = p.stock_status === 'instock';
    if (selectedStock === 'outofstock') matchesStock = p.stock_status === 'outofstock';
    if (selectedStock === 'lowstock') matchesStock = p.stock_quantity !== null && p.stock_quantity > 0 && p.stock_quantity <= 5;

    let matchesPrice = true;
    const price = parseFloat(p.price || p.regular_price || '0');
    if (selectedPrice === '0-50') matchesPrice = price <= 50;
    if (selectedPrice === '50-100') matchesPrice = price > 50 && price <= 100;
    if (selectedPrice === '100+') matchesPrice = price > 100;

    return matchesSearch && matchesCategory && matchesStock && matchesPrice;
  });

  const categories = Array.from(new Set(products.flatMap(p => p.categories || []).map(c => JSON.stringify(c))))
    .map(s => JSON.parse(s as string));

  if (!activeSite) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Globe className="w-12 h-12 text-zinc-800 mb-4" />
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Aucun site actif</h3>
        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mt-2 max-w-xs">Sélectionnez une boutique dans "Mes Boutiques" pour commencer la gestion.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between p-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Gestion des Produits</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Gérez vos prix, stocks et stratégies de vente par IA</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => handleAIFeature('flash')}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest gap-2 rounded-full px-6 h-10 group"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-500 group-hover:scale-110 transition-transform" /> FLASH SALES (IA)
          </Button>
          <Button 
            onClick={() => handleAIFeature('promo')}
            className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest gap-2 rounded-full px-6 h-10 group"
          >
            <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" /> AUTO-PROMOS (IA)
          </Button>
          <Button 
            onClick={() => handleAIFeature('advice')}
            className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white text-[9px] font-black uppercase tracking-widest gap-2 rounded-full px-6 h-10"
          >
            <BrainCircuit className="w-3.5 h-3.5" /> CONSEILS IA
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar space-y-6">
        {/* Dashboard Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Performance */}
          <Card className="lg:col-span-2 p-6 bg-zinc-900/20 border-zinc-900/50 relative overflow-hidden h-[340px]">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Revenue Performance</h3>
                  <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Variation des ventes suite aux promotions</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-white tracking-tighter">{promoStats.latestBatch.toFixed(2)} {activeSite.currency || 'DT'}</div>
                <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Latest Batch</div>
              </div>
            </div>
            
            <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d1d21" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#52525b', fontSize: 10}} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '4px' }}
                      itemStyle={{ color: '#818cf8', fontSize: '10px' }}
                      labelStyle={{ color: '#52525b', fontSize: '10px' }}
                      formatter={(value: any) => [`${parseFloat(value).toFixed(2)} ${activeSite.currency || 'DT'}`, "Chiffre d'affaires"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </Card>

          {/* Promo Impact */}
          <Card className="p-6 bg-zinc-900/20 border-zinc-900/50 h-[340px] flex flex-col justify-between">
             <div>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Eye className="w-4 h-4" />
                  </div>
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Promo Impact</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                       <span>Total Orders</span>
                       <span className="text-white">{promoStats.totalOrders}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-indigo-500 w-[100%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                       <span>Sale Discounts Applied</span>
                       <span className="text-amber-500 uppercase">{promoStats.saleDiscounts.toFixed(2)} {activeSite.currency || 'DT'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                        style={{ width: `${Math.min(promoStats.percentage * 5, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-zinc-950/50 border border-zinc-800/50 p-4 rounded text-center">
                <p className="text-[9px] text-zinc-500 leading-relaxed italic">
                  Pro Tip: Promotions currently represent approx. <span className="text-indigo-400 font-bold">{promoStats.percentage.toFixed(1)}%</span> of your total revenue.
                </p>
             </div>
          </Card>
        </div>

        {/* Best Sellers */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
               <ShoppingBag className="w-4 h-4 text-zinc-600" />
             </div>
             <div>
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Best Selling Products</h3>
                <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Leaderboard</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bestSellers.length > 0 ? bestSellers.map((p, i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-900/50 p-4 flex items-center justify-between hover:bg-zinc-900/60 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                      <span className="text-[8px] font-black text-zinc-700">#0{i+1}</span>
                   </div>
                   <div>
                      <div className="text-[9px] font-black text-white uppercase tracking-tight truncate max-w-[120px]">{p.name}</div>
                      <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{p.sales} Ventes</div>
                   </div>
                </div>
                <div className="text-[10px] font-black text-white">{parseFloat(p.revenue).toFixed(2)} {activeSite.currency || 'DT'}</div>
              </div>
            )) : (
              <div className="col-span-3 py-10 bg-zinc-900/20 border border-dashed border-zinc-800 rounded flex items-center justify-center">
                 <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Aucune donnée de vente disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Product Table Dashboard */}
        <div className="space-y-4 pt-4">
          <div className="bg-zinc-900/20 border border-zinc-900/50">
            {/* Table Filters */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between gap-4">
               <div className="flex-1 relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                 <input 
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="w-full bg-zinc-950 border-none text-[11px] font-mono text-zinc-300 py-2.5 pl-10 focus:ring-1 focus:ring-indigo-500/50 rounded-none placeholder:text-zinc-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                 />
               </div>
               <div className="flex items-center gap-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-500 z-10" />
                    <select 
                      className="appearance-none bg-zinc-950 border border-zinc-900 text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-8 pr-8 py-2 hover:border-zinc-700 focus:ring-0 rounded-none cursor-pointer"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">Toutes les catégories</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id.toString()}>{cat.name.toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-700 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-500 z-10" />
                    <select 
                      className="appearance-none bg-zinc-950 border border-zinc-900 text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-8 pr-8 py-2 hover:border-zinc-700 focus:ring-0 rounded-none cursor-pointer"
                      value={selectedStock}
                      onChange={(e) => setSelectedStock(e.target.value)}
                    >
                      <option value="all">Tous les stocks</option>
                      <option value="instock">En stock</option>
                      <option value="outofstock">Hors stock</option>
                      <option value="lowstock">Stock faible (≤5)</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-700 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-500 z-10" />
                    <select 
                      className="appearance-none bg-zinc-950 border border-zinc-900 text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-8 pr-8 py-2 hover:border-zinc-700 focus:ring-0 rounded-none cursor-pointer"
                      value={selectedPrice}
                      onChange={(e) => setSelectedPrice(e.target.value)}
                    >
                      <option value="all">Tous les prix</option>
                      <option value="0-50">0 - 50 {activeSite.currency || 'DT'}</option>
                      <option value="50-100">50 - 100 {activeSite.currency || 'DT'}</option>
                      <option value="100+">100 {activeSite.currency || 'DT'} +</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-700 pointer-events-none" />
                  </div>
                  <div className="ml-4 text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                    {filteredProducts.length} Produits
                  </div>
               </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[30px_1fr_140px_140px_120px_120px_180px] gap-4 px-6 py-4 bg-zinc-950 border-b border-zinc-900 text-[9px] font-black text-zinc-600 uppercase tracking-widest sticky top-0 z-10">
               <div></div>
               <div>Produit</div>
               <div className="text-center">Catégorie</div>
               <div className="text-center">État du stock</div>
               <div className="text-center">Prix Régulier</div>
               <div className="text-center uppercase">En Promo</div>
               <div className="text-right pr-4">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-zinc-900/50">
               {loading && products.length === 0 && (
                 <div className="py-20 text-center">
                   <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic animate-pulse">Initialisation des métadonnées produits...</p>
                 </div>
               )}

               {filteredProducts.map((p, idx) => (
                 <div key={p.id} className="grid grid-cols-[30px_1fr_140px_140px_120px_120px_180px] gap-4 px-6 py-4 items-center group hover:bg-zinc-900/40 transition-colors border-b border-zinc-900/10">
                    <div className="flex items-center justify-center">
                       <div className="w-3.5 h-3.5 border border-zinc-800 bg-zinc-950 rounded-none shrink-0"></div>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                       <div className="w-9 h-9 bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1 overflow-hidden shrink-0">
                          <img src={p.images?.[0]?.src || "https://placehold.co/40"} className="w-full h-full object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <div className="min-w-0 h-full flex flex-col justify-center">
                          <h4 className="text-[10px] font-black text-zinc-300 uppercase leading-snug truncate group-hover:text-white transition-colors">{p.name}</h4>
                          <p className="text-[8px] font-bold text-zinc-600 uppercase mt-0.5 tracking-tight truncate">SKU: {p.sku || '---'}</p>
                       </div>
                    </div>
                    <div className="flex justify-center">
                       <span className="text-[8px] px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-500 uppercase font-black tracking-widest">{p.categories?.[0]?.name || 'GENERAL'}</span>
                    </div>
                    <div className="flex justify-center">
                       <div className="flex items-center gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.stock_status === 'instock' ? 'bg-emerald-500' : 'bg-rose-500')}></div>
                          <span className={cn("text-[8px] font-black uppercase tracking-widest", p.stock_status === 'instock' ? 'text-emerald-500' : 'text-rose-500')}>
                            {p.stock_status === 'instock' ? (p.stock_quantity !== null ? `${p.stock_quantity} EN STOCK` : 'EN STOCK') : 'HORS STOCK'}
                          </span>
                       </div>
                    </div>
                    <div className="text-center text-[10px] font-black text-zinc-300">
                      {p.regular_price || p.price} {activeSite.currency || 'DT'}
                    </div>
                    <div className="flex justify-center">
                       <span className={cn("text-[8px] font-black uppercase tracking-widest", p.on_sale ? 'text-amber-500' : 'text-zinc-700')}>
                         {p.on_sale ? `OUI (${p.sale_price} DT)` : 'NON'}
                       </span>
                    </div>
                    <div className="flex justify-end pr-2 gap-1.5">
                       <button 
                        onClick={() => {
                          setWhatIfProduct(p);
                          setIsWhatIfOpen(true);
                          setNexusAnalysis(null);
                        }}
                        className="w-8 h-8 rounded border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                        title="Simulation What-If (IA)"
                       >
                         <Calculator className="w-3.5 h-3.5" />
                       </button>
                       <button className="w-8 h-8 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"><Eye className="w-3.5 h-3.5" /></button>
                       <button className="w-8 h-8 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                       <button 
                        onClick={() => setPromoModalProduct(p)}
                        className="w-8 h-8 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-600 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                       >
                         <Plus className="w-3.5 h-3.5" />
                       </button>
                       <button className="w-8 h-8 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-600 hover:text-rose-400 hover:border-rose-500/30 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Promo Management Modal */}
      {promoModalProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg bg-zinc-950 border-zinc-900 relative overflow-hidden flex flex-col p-0 shadow-[0_0_100px_rgba(0,0,0,1)] rounded-3xl">
             <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                         <Percent className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">Gérer la promotion</h2>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-2 max-w-[280px]">Manuel: {promoModalProduct.name}</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => setPromoModalProduct(null)}
                    className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 flex justify-between items-center mb-8 rounded-2xl">
                   <div>
                      <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Prix Actuel</div>
                      <div className="text-2xl font-black text-white italic">{promoModalProduct.price || promoModalProduct.regular_price} DT</div>
                   </div>
                   <div className="h-12 w-px bg-zinc-800/50"></div>
                   <div className="text-right">
                      <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 text-right">Sur le site</div>
                      <div className="text-[10px] font-black text-zinc-400 uppercase">Prix Régulier</div>
                   </div>
                </div>

                <div className="space-y-8 pb-8">
                   <div>
                      <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Type de réduction</div>
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                          onClick={() => setDiscountType('percent')}
                          className={cn(
                            "py-4 text-[10px] font-black flex items-center justify-center uppercase tracking-widest transition-all gap-2 rounded-2xl relative",
                            discountType === 'percent' 
                              ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] ring-1 ring-white/20" 
                              : "bg-zinc-900/50 text-zinc-600 border border-zinc-800 hover:bg-zinc-900"
                          )}
                         >
                           {discountType === 'percent' && <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse"></div>}
                           Pourcentage (%)
                         </button>
                         <button 
                          onClick={() => setDiscountType('fixed')}
                          className={cn(
                            "py-4 text-[10px] font-black flex items-center justify-center uppercase tracking-widest transition-all gap-2 rounded-2xl relative",
                            discountType === 'fixed' 
                              ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] ring-1 ring-white/20" 
                              : "bg-zinc-900/50 text-zinc-600 border border-zinc-800 hover:bg-zinc-900"
                          )}
                         >
                           {discountType === 'fixed' && <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse"></div>}
                           Montant Fixe (DT)
                         </button>
                      </div>
                   </div>

                   <div>
                      <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Valeur de la réduction</div>
                      <div className="relative">
                         <input 
                          type="number"
                          placeholder="Ex: 20"
                          className="w-full bg-zinc-900/30 border border-zinc-800/80 rounded-2xl py-6 px-8 text-2xl font-black text-white italic focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-zinc-800 appearance-none"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                         />
                         <div className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-800 italic">
                           {discountType === 'percent' ? '%' : 'DT'}
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-8 pt-0 flex gap-4 mt-auto">
                <Button 
                  onClick={() => setPromoModalProduct(null)}
                  variant="outline" 
                  className="flex-1 py-10 uppercase font-black text-[11px] tracking-widest border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-white rounded-3xl transition-all"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleApplyPromo}
                  disabled={updatingPrice || !discountValue}
                  className="flex-1 py-10 uppercase font-black text-[11px] tracking-widest bg-zinc-400 hover:bg-white text-zinc-950 gap-2 rounded-3xl transition-all shadow-xl disabled:opacity-50"
                >
                  {updatingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-zinc-950" />}
                  Appliquer la promotion
                </Button>
             </div>
          </Card>
        </div>
      )}
      {/* AI Suggestions Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
           <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-900 relative overflow-hidden flex flex-col p-0 shadow-[0_0_150px_rgba(0,0,0,1)] rounded-3xl">
              {/* Header */}
              <div className="p-8 border-b border-zinc-900/50 bg-gradient-to-b from-zinc-900/20 to-transparent">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 animate-pulse">
                          <Sparkles className="w-6 h-6" />
                       </div>
                       <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">{aiFeatureName}</h2>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-2 italic">Intelligence Artificielle de Gestion</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setAiModalOpen(false)}
                      className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                 </div>
              </div>

              {/* Content */}
              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {aiLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                       <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-6" />
                       <div className="text-center space-y-2">
                          <p className="text-xs font-black text-white uppercase tracking-widest animate-pulse">Analyse du catalogue en cours...</p>
                          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Le moteur IA examine vos stocks et performances</p>
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       {aiSuggestions.map((s, i) => (
                          <div key={i} className="group bg-zinc-900/30 border border-zinc-800/80 hover:border-indigo-500/30 p-6 rounded-2xl transition-all hover:bg-zinc-900/50">
                             <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-colors shrink-0">
                                   {s.productId ? <ShoppingBag className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center justify-between mb-2">
                                      <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{s.name || "Suggestion Stratégique"}</h3>
                                      <div className="text-[8px] font-black px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full uppercase tracking-widest">Score IA: 98%</div>
                                   </div>
                                   
                                   <div className="space-y-4">
                                      <div>
                                         <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                                            <Info className="w-3 h-3 text-zinc-600" /> Analyse
                                         </div>
                                         <p className="text-xs text-zinc-400 leading-relaxed italic">{s.reason}</p>
                                      </div>
                                      
                                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <div className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">Recommandation</div>
                                         </div>
                                         <div className="flex items-center gap-4">
                                            <div className="text-xs font-black text-emerald-400 italic uppercase">{s.recommendation}</div>
                                            {s.productId && s.suggestedDiscountValue && (
                                               <Button 
                                                onClick={() => handleExecuteAISuggestion(s)}
                                                className="h-8 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20"
                                               >
                                                  Appliquer
                                               </Button>
                                            )}
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Footer */}
              <div className="p-8 pt-0 mt-auto">
                 <Button 
                    onClick={() => setAiModalOpen(false)}
                    className="w-full py-8 bg-zinc-400 hover:bg-white text-zinc-950 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl"
                 >
                    Terminer l'analyse
                 </Button>
              </div>
           </Card>
        </div>
      )}
      {/* Simulation What-If Side Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-[120] w-full max-w-lg bg-[#050505] border-l border-zinc-900 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] transform transition-transform duration-500 ease-out flex flex-col",
        isWhatIfOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {whatIfProduct && (
          <>
            {/* Header */}
            <div className="p-8 border-b border-zinc-900 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Détails Produit</h3>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2 flex items-center gap-2">
                       Fiche Catalogue <span className="w-1 h-1 rounded-full bg-indigo-500"></span> ID: {whatIfProduct.id}
                    </p>
                  </div>
               </div>
               <button 
                onClick={() => setIsWhatIfOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all transform hover:rotate-90"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
               {/* Product Identity */}
               <div className="flex gap-6 items-start">
                  <div className="w-40 h-40 rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 group">
                    <img 
                      src={whatIfProduct.images?.[0]?.src || "https://placehold.co/160"} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none italic">{whatIfProduct.name}</h2>
                     <p className="text-[11px] font-mono text-indigo-400 font-black tracking-widest">{whatIfProduct.sku || 'N/A'}</p>
                     <div className="inline-flex px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                        {whatIfProduct.categories?.[0]?.name || 'Lingeries Intimes'}
                     </div>
                  </div>
               </div>

               {/* Stock & Quantity Grid */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-3xl group hover:border-emerald-500/30 transition-all">
                     <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Statut Stock</p>
                     <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          whatIfProduct.stock_status === 'instock' ? "bg-emerald-500" : "bg-rose-500"
                        )}></div>
                        <span className={cn(
                          "text-sm font-black uppercase tracking-widest",
                          whatIfProduct.stock_status === 'instock' ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {whatIfProduct.stock_status === 'instock' ? "En Stock" : "Hors Stock"}
                        </span>
                     </div>
                  </div>
                  <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-3xl group hover:border-indigo-500/30 transition-all">
                     <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Quantité réelle</p>
                     <div className="text-4xl font-black text-white leading-none italic">
                        {whatIfProduct.stock_quantity || 0}
                     </div>
                  </div>
               </div>

               {/* Performance Section */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                     <TrendingUp className="w-4 h-4" />
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Performances & Seuil</h4>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl divide-y divide-zinc-900">
                     <div className="p-6 flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Prix de vente</span>
                        <span className="text-sm font-black text-white">{whatIfProduct.price} {activeSite.currency || 'DT'}</span>
                     </div>
                     <div className="p-6 flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Seuil alerte (Low Stock)</span>
                        <span className="text-sm font-black text-amber-500 uppercase">5 Unités</span>
                     </div>
                     <div className="p-6 flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ventes (Mois)</span>
                        <span className="text-sm font-black text-indigo-400 uppercase">0 Unités</span>
                     </div>
                  </div>
               </div>

               {/* Actions Section */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                     <CheckCircle2 className="w-4 h-4" />
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Actions d'administration</h4>
                  </div>
                  <div className="space-y-3">
                     <a 
                      href={whatIfProduct.permalink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full h-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between px-6 hover:bg-zinc-900 transition-all group"
                     >
                        <div className="flex items-center gap-4">
                           <ExternalLinkIcon className="w-5 h-5 text-indigo-500" />
                           <span className="text-[11px] font-black text-white uppercase tracking-widest">Voir en boutique</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:translate-x-1 transition-transform" />
                     </a>
                     <button 
                      onClick={() => generateNexusAnalysis(whatIfProduct)}
                      disabled={loadingNexus}
                      className="w-full h-16 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-between px-6 transition-all group relative overflow-hidden"
                     >
                        <div className="flex items-center gap-4">
                           <Calculator className="w-5 h-5 text-amber-500" />
                           <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Scénario What-If (IA)</span>
                        </div>
                        <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
                     </button>
                  </div>
               </div>

               {/* Nexus Analysis Result Inside Side Panel */}
               {(loadingNexus || nexusAnalysis) && (
                 <div className="mt-8 pt-8 border-t border-zinc-900 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[32px] overflow-hidden relative">
                       <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/40">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <Calculator className="w-5 h-5" />
                             </div>
                             <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Analyse Prédictive Nexus</h4>
                          </div>
                          <button onClick={() => setNexusAnalysis(null)} className="text-zinc-700 hover:text-white transition-colors">
                             <X className="w-4 h-4" />
                          </button>
                       </div>

                       <div className="p-8">
                          {loadingNexus ? (
                            <div className="py-12 flex flex-col items-center justify-center">
                               <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">Calcul des vecteurs de profit...</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                               <p className="text-[11px] text-zinc-400 font-medium leading-relaxed italic opacity-80">
                                 Voici une analyse stratégique approfondie de votre produit, structurée pour maximiser la rentabilité et la pénétration de marché dès le réapprovisionnement.
                               </p>
                               
                               <div className="space-y-6">
                                  {nexusAnalysis?.split('\n').map((line, i) => {
                                    if (line.includes('ANALYSE') || line.includes('SCÉNARIO') || line.includes('Expertise')) {
                                      const icon = line.includes('Expertise') ? '📊' : line.includes('SCÉNARIO') ? '📈' : '✨';
                                      return (
                                        <div key={i} className="pt-4 border-t border-zinc-800/50">
                                          <div className="text-amber-500 font-black text-xs mb-3 tracking-widest uppercase flex items-center gap-2">
                                            <span>{icon}</span> {line.replace(/[*#]/g, '').trim()}
                                          </div>
                                        </div>
                                      );
                                    }
                                    if (line.startsWith('-') || line.startsWith('*')) {
                                      return (
                                        <div key={i} className="flex items-start gap-3 mt-3">
                                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                          <p className="text-[11px] font-bold text-zinc-200 leading-relaxed tracking-tight">
                                            {line.replace(/[*#-]/g, '').trim()}
                                          </p>
                                        </div>
                                      );
                                    }
                                    if (line.trim().length > 0) {
                                      return <p key={i} className="text-[11px] text-zinc-500 font-medium leading-relaxed ml-4.5">{line.replace(/[*]/g, '')}</p>;
                                    }
                                    return null;
                                  })}
                               </div>
                               
                               <div className="mt-8 pt-6 border-t border-zinc-800/50 flex items-center gap-2 text-zinc-700">
                                  <BrainCircuit className="w-3.5 h-3.5" />
                                  <span className="text-[8px] font-black uppercase tracking-widest">Nexus AI Engine v2.0 • Predictive Logic</span>
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-8 border-t border-zinc-900 bg-zinc-950 flex justify-center">
               <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.5em]">Nexus Predictive Edge v1.2</span>
            </div>
          </>
        )}
      </div>

      {/* Nexus Analysis Result Overlay (REMOVED) */}
    </div>
  );
}
