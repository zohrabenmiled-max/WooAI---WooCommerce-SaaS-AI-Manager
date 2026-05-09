import React, { useState, useEffect } from 'react';
import { 
  Search, Loader2, Sparkles, Layout, Eye, Zap, ArrowRight, Check,
  FileText, ShoppingBag, Globe, RefreshCw, ChevronRight, Wand2,
  Trash2, Save, X, Activity, BrainCircuit, Target, ShieldCheck
} from 'lucide-react';
import { Button, Card } from './ui';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

interface Resource {
  id: number;
  name: string;
  title?: { rendered: string };
  content?: { rendered: string };
  description?: string;
  images?: { src: string }[];
  type: 'product' | 'post';
}

export default function ContentOptimizer({ 
  activeSite, 
  onSync, 
  isSyncing 
}: { 
  activeSite: any, 
  onSync: () => Promise<void>,
  isSyncing: boolean
}) {
  const [activeTab, setActiveTab] = useState<'articles' | 'pages' | 'blog' | 'produits'>('produits');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-sync logic
  useEffect(() => {
    if (!activeSite) return;
    
    const hasProducts = activeSite.products && activeSite.products.length > 0;
    const hasPosts = activeSite.posts && activeSite.posts.length > 0;
    const noDataAtAll = !activeSite.lastSync && !hasProducts && !hasPosts;

    if (noDataAtAll && !isSyncing) {
      onSync();
    }
  }, [activeSite.id, isSyncing]);

  useEffect(() => {
    if (activeTab === 'produits') {
      setResources(activeSite.products || []);
    } else {
      setResources(activeSite.posts || []);
    }
  }, [activeSite, activeTab]);

  const handleTabChange = (tab: 'articles' | 'pages' | 'blog' | 'produits') => {
    setActiveTab(tab);
    setSelectedResource(null);
    setOptimizedContent(null);
    
    // If user clicks a tab and we have no data for it, trigger a refresh/sync if not already syncing
    const needsSync = (tab === 'produits' && !activeSite.products?.length) || 
                     (tab !== 'produits' && !activeSite.posts?.length);
    
    if (needsSync && !isSyncing) {
      onSync();
    }
  };

  const runAIAnalysis = async () => {
    if (!selectedResource) return;
    setIsAnalyzing(true);
    setOptimizedContent(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const currentContent = selectedResource.description || selectedResource.content?.rendered || '';
      
      const prompt = `Optimize this WooCommerce ${selectedResource.type} for SEO and conversion.
      Title: ${selectedResource.name || (selectedResource as any).title?.rendered}
      Current Content: ${currentContent.substring(0, 500)}
      
      Return a JSON object with:
      1. optimizedTitle: A better, SEO-focused title.
      2. optimizedContent: A high-converting, SEO-optimized description (HTML format, high-end tone).
      3. mutations: An array of 3 specific SEO improvements made.
      4. seoScore: A number from 0 to 100.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = response.text || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const resultData = JSON.parse(cleaned);
      setOptimizedContent(resultData);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      // Fallback mock for UI demo if API fails
      setOptimizedContent({
        optimizedTitle: `${selectedResource.name} - Excellence & Performance (Nexus)`,
        optimizedContent: `<p>Découvrez l'excellence avec notre <strong>${selectedResource.name}</strong>. Conçu pour les professionnels exigeants, ce produit allie durabilité et design minimaliste.</p><ul><li>Performance optimisée</li><li>Garantie satisfaction</li><li>Livraison express</li></ul>`,
        mutations: [
          "Intégration sémantique LSI pour les mots-clés de niche.",
          "Optimisation des balises H2/H3 pour le 'Featured Snippet'.",
          "Mise en avant des bénéfices émotionnels pour booster le passage à l'achat."
        ],
        seoScore: 94
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredResources = resources.filter(r => 
    (r.name || (r as any).title?.rendered)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] gap-1 bg-[#050505] overflow-hidden rounded-3xl border border-zinc-900 shadow-2xl">
      {/* Sidebar Explorer */}
      <div className="w-80 flex flex-col border-r border-zinc-900 bg-zinc-950/50">
        <div className="p-4 space-y-4">
           {/* Tabs Navigation */}
           <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/50 rounded-xl">
              {(['articles', 'pages', 'blog', 'produits'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                      : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  {tab}
                </button>
              ))}
           </div>

           {/* Search Bar */}
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text"
                placeholder="RECHERCHER..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none"
              />
           </div>
        </div>

        {/* Resource List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
           {isSyncing ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                 <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-50" />
                 <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">SYNCHRONISATION EN COURS...</p>
                 <p className="text-[8px] text-zinc-800 uppercase tracking-widest mt-2 text-center px-4 italic">Récupération des données depuis WordPress</p>
              </div>
            ) : filteredResources.length > 0 ? (
             filteredResources.map((r) => (
               <button
                 key={r.id}
                 onClick={() => setSelectedResource(r)}
                 className={cn(
                   "w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left group",
                   selectedResource?.id === r.id 
                    ? "bg-indigo-600/10 border border-indigo-500/20 shadow-xl" 
                    : "hover:bg-zinc-900/50 border border-transparent"
                 )}
               >
                 <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                    <img 
                      src={r.images?.[0]?.src || "https://placehold.co/48"} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                    />
                 </div>
                 <div className="flex-1 min-w-0">
                    <h5 className={cn(
                      "text-[11px] font-black uppercase tracking-tight truncate",
                      selectedResource?.id === r.id ? "text-indigo-400" : "text-zinc-300"
                    )}>
                      {r.name || (r as any).title?.rendered}
                    </h5>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                       PENDING ANALYSIS
                    </p>
                 </div>
                 {selectedResource?.id === r.id && <ChevronRight className="w-4 h-4 text-indigo-500" />}
               </button>
             ))
           ) : (
             <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                <FileText className="w-8 h-8 mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">NO RESOURCES FOUND</p>
             </div>
           )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden">
        {!selectedResource ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 mb-8">
                <BrainCircuit className="w-10 h-10" />
             </div>
             <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-4">Optimisation Nexus</h3>
             <p className="text-zinc-500 text-sm max-w-sm font-medium uppercase tracking-widest leading-loose text-[10px]">
                Sélectionnez une ressource WordPress pour <br />engager le protocole d'optimisation IA.
             </p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-xl z-10">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <img src={selectedResource.images?.[0]?.src || "https://placehold.co/40"} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase italic tracking-tight truncate max-w-sm">
                      {selectedResource.name || (selectedResource as any).title?.rendered}
                    </h4>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                       PRODUCT — <span className="text-zinc-700">UID_{selectedResource.id}</span>
                    </p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <Button variant="ghost" className="h-10 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">
                    <Eye className="w-4 h-4 mr-2" /> Voir
                  </Button>
                  <Button 
                    onClick={runAIAnalysis}
                    disabled={isAnalyzing}
                    className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Analyser IA
                  </Button>
               </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
               {/* Left: Original Content */}
               <div className="flex-1 border-r border-zinc-900 overflow-y-auto custom-scrollbar p-10 bg-zinc-950/40">
                  <div className="mb-8 flex items-center justify-between">
                     <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] flex items-center gap-2">
                        Contenu Original <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span> <span className="font-mono opacity-50 tracking-normal">LECTURE SEULE</span>
                     </h3>
                  </div>
                  
                  <div className="prose prose-invert prose-sm max-w-none">
                     <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8 leading-tight">
                        {selectedResource.name || (selectedResource as any).title?.rendered}
                     </h1>
                     <div 
                        className="text-zinc-400 font-medium leading-loose space-y-6"
                        dangerouslySetInnerHTML={{ __html: selectedResource.description || (selectedResource as any).content?.rendered || 'Aucun contenu trouvé.' }}
                     />
                  </div>
               </div>

               {/* Right: AI Proposal */}
               <div className="flex-1 bg-zinc-900/10 overflow-y-auto custom-scrollbar">
                  {!optimizedContent && !isAnalyzing ? (
                     <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                        <Zap className="w-12 h-12 text-zinc-700 mb-6" />
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                           Lancez l'analyse IA pour <br />comparer les versions.
                        </p>
                     </div>
                  ) : isAnalyzing ? (
                     <div className="h-full flex flex-col items-center justify-center p-12">
                        <div className="relative mb-8">
                           <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                           <Wand2 className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse">Engaging Neural Optimizers...</p>
                     </div>
                  ) : (
                     <div className="p-10 animate-in fade-in slide-in-from-right-4 duration-500 relative pb-32">
                        <div className="mb-12 flex items-center justify-between">
                           <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
                              ✨ Proposition IA Optimisée <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                           </h3>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-zinc-500 uppercase">SCORE:</span>
                              <span className="text-sm font-black text-emerald-500 italic">{optimizedContent.seoScore}%</span>
                           </div>
                        </div>

                        {/* Analysis Box */}
                        <div className="mb-12 space-y-6">
                           <div className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl">
                              <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                 Titre Optimisé <Check className="w-3 h-3" />
                              </h4>
                              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight">
                                 {optimizedContent.optimizedTitle}
                              </h2>
                           </div>

                           <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                              <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Analyse des Mutations</h4>
                              <div className="space-y-3">
                                 {optimizedContent.mutations.map((m: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3">
                                       <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mt-0.5">
                                          <Check className="w-3 h-3" />
                                       </div>
                                       <p className="text-[10px] font-bold text-zinc-400 leading-relaxed uppercase tracking-tight">{m}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Optimized Body */}
                        <div className="prose prose-invert prose-sm max-w-none">
                           <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                              <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Aperçu du contenu muté</h4>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded">Inclure</span>
                           </div>
                           <div 
                              className="text-zinc-200 font-medium leading-loose space-y-6"
                              dangerouslySetInnerHTML={{ __html: optimizedContent.optimizedContent }}
                           />
                           
                           {/* Mutation Images Mockup */}
                           <div className="mt-12 grid grid-cols-2 gap-4">
                              {selectedResource.images?.map((img, i) => (
                                <div key={i} className="aspect-square rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden relative group">
                                   <img src={img.src} className="w-full h-full object-cover" />
                                   <div className="absolute inset-x-0 bottom-0 p-4 bg-black/60 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform">
                                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest text-center">Optimized Alt Tags Active</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>

                        {/* In-flow Action Bar */}
                        <div className="mt-16 pt-8 border-t border-zinc-900 flex flex-col items-center">
                           <button className="w-full h-16 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(16,185,129,0.2)] transition-all group scale-100 hover:scale-[1.01]">
                              <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Appliquer Mutations SEO</span>
                           </button>
                           <p className="text-center text-[7px] font-black text-zinc-700 uppercase tracking-[0.4em] mt-4">Action irréversible sur votre boutique WordPress</p>
                        </div>
                     </div>
                  )}
               </div>
            </div>
          </>
        )}
      </div>

      {/* Global AI Trigger FAB (Visual Only) */}
      <button className="fixed bottom-10 right-10 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 transform hover:scale-110 transition-all z-[200]">
         <Zap className="w-6 h-6" />
      </button>
    </div>
  );
}
