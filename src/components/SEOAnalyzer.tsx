import React, { useState } from 'react';
import { 
  Search, Loader2, TrendingUp, AlertTriangle, ChevronRight, Globe, 
  CheckCircle2, ShieldCheck, BrainCircuit, Target, Sparkles, Layout, 
  Eye, Zap, BarChart3, Activity, ArrowRight, Check
} from 'lucide-react';
import { Button, Card } from './ui';
import { cn } from '../lib/utils';

interface AuditItem {
  id: string;
  title: string;
  category: 'seo' | 'content' | 'nexus';
  selected: boolean;
}

export default function SEOAnalyzer({ sites, activeSite }: { sites: any[]; activeSite: any }) {
  const [auditStatus, setAuditStatus] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [loadingStep, setLoadingStep] = useState(0);
  const [seoRecs, setSeoRecs] = useState<AuditItem[]>([
    { id: 'seo-1', title: 'Provide a descriptive title for the post.', category: 'seo', selected: false },
    { id: 'seo-2', title: 'Include a focus keyword in the content.', category: 'seo', selected: false },
    { id: 'seo-3', title: 'Add a meta description.', category: 'seo', selected: false },
    { id: 'seo-4', title: 'Use header tags (H1-H3) for better structure.', category: 'seo', selected: false },
  ]);
  const [contentRecs, setContentRecs] = useState<AuditItem[]>([
    { id: 'content-1', title: 'Draft an introduction that clearly defines the topic.', category: 'content', selected: false },
    { id: 'content-2', title: 'Break content into manageable sections with headings.', category: 'content', selected: false },
    { id: 'content-3', title: 'Add relevant internal and external links.', category: 'content', selected: false },
    { id: 'content-4', title: 'Ensure content reaches at least 300 words for better ranking.', category: 'content', selected: false },
  ]);
  const [nexusRec, setNexusRec] = useState<AuditItem>({ 
    id: 'nexus-1', 
    title: activeSite?.name ? `"${activeSite.name} - Boutique Officielle (Optimisée AI)"` : '"Draft: New Post - Content Required"', 
    category: 'nexus', 
    selected: false 
  });

  const loadingTexts = [
    "Analyse de la Structure...",
    "Extraction des Meta-données...",
    "Calcul des Vecteurs SEO...",
    "Génération des Scénarios Nexus..."
  ];

  const handleStartAudit = async () => {
    setAuditStatus('scanning');
    setLoadingStep(0);
    
    // Simulate multi-step loading
    for (let i = 0; i < 4; i++) {
      setLoadingStep(i);
      await new Promise(r => setTimeout(r, 1200));
    }
    
    setAuditStatus('results');
  };

  const toggleRec = (id: string, type: 'seo' | 'content' | 'nexus') => {
    if (type === 'seo') {
      setSeoRecs(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
    } else if (type === 'content') {
      setContentRecs(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
    } else {
      setNexusRec(prev => ({ ...prev, selected: !prev.selected }));
    }
  };

  const selectedCount = [...seoRecs, ...contentRecs, nexusRec].filter(r => r.selected).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-32">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 bg-zinc-900/40 border-zinc-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-2 right-2 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors">
             <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Layout className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Articles</p>
          </div>
          <div className="text-4xl font-black text-white italic tracking-tighter">{activeSite.posts?.length || 0}</div>
        </Card>

        <Card className="p-8 bg-zinc-900/40 border-zinc-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-2 right-2 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors">
             <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Zap className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Produits</p>
          </div>
          <div className="text-4xl font-black text-white italic tracking-tighter">{activeSite.products?.length || 0}</div>
        </Card>

        <Card className="p-8 bg-zinc-900/40 border-zinc-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-2 right-2 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors">
             <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <BarChart3 className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Score SEO Global</p>
          </div>
          <div className="text-4xl font-black text-white italic tracking-tighter">--</div>
        </Card>
      </div>

      {auditStatus === 'idle' && (
        <Card className="py-32 px-10 text-center bg-zinc-900/20 border border-zinc-900 rounded-[40px] relative overflow-hidden group">
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                <ShieldCheck className="w-10 h-10 group-hover:animate-pulse" />
             </div>
             <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Audit Global Recommandé</h3>
             <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-12 font-medium leading-relaxed">
               L'IA va scanner vos pages et produits pour détecter les opportunités d'amélioration SEO et de conversion.
             </p>
             <Button 
               onClick={handleStartAudit}
               className="h-14 px-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 gap-3 group/btn transition-all hover:-translate-y-1"
             >
               Lancer l'audit de site <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
             </Button>
          </div>
        </Card>
      )}

      {auditStatus === 'scanning' && (
        <Card className="py-32 bg-zinc-900/20 border border-zinc-900 rounded-[40px] flex flex-col items-center justify-center">
          <div className="relative mb-12">
             <div className="w-20 h-20 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
             <BrainCircuit className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
             {loadingTexts[loadingStep]}
          </h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
             Le Maestro scanne le DOM et les meta-données WordPress.
          </p>
        </Card>
      )}

      {auditStatus === 'results' && (
        <div className="animate-in fade-in duration-700 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Focus SEO */}
              <Card className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                         <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Focus SEO</h4>
                   </div>
                </div>
                <div className="p-8 space-y-4">
                   {seoRecs.map((rec, i) => (
                      <button 
                        key={rec.id}
                        onClick={() => toggleRec(rec.id, 'seo')}
                        className={cn(
                          "w-full p-4 rounded-xl border flex items-center gap-4 transition-all group text-left",
                          rec.selected 
                            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400" 
                            : "bg-zinc-950/50 border-zinc-900 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-tighter w-6",
                           rec.selected ? "text-emerald-500" : "text-zinc-700"
                         )}>
                           {String(i + 1).padStart(2, '0')}.
                         </span>
                         <span className="text-[11px] font-bold uppercase tracking-tight flex-1">{rec.title}</span>
                         {rec.selected && <Check className="w-4 h-4" />}
                      </button>
                   ))}
                </div>
              </Card>

              {/* Qualité du Contenu */}
              <Card className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                         <Target className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Qualité du Contenu</h4>
                   </div>
                </div>
                <div className="p-8 space-y-4">
                   {contentRecs.map((rec, i) => (
                      <button 
                        key={rec.id}
                        onClick={() => toggleRec(rec.id, 'content')}
                        className={cn(
                          "w-full p-4 rounded-xl border flex items-center gap-4 transition-all group text-left",
                          rec.selected 
                            ? "bg-indigo-500/5 border-indigo-500/30 text-indigo-400" 
                            : "bg-zinc-950/50 border-zinc-900 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-tighter w-6",
                           rec.selected ? "text-indigo-500" : "text-zinc-700"
                         )}>
                           {String(i + 1).padStart(2, '0')}.
                         </span>
                         <span className="text-[11px] font-bold uppercase tracking-tight flex-1">{rec.title}</span>
                         {rec.selected && <Check className="w-4 h-4" />}
                      </button>
                   ))}
                </div>
              </Card>
           </div>

           {/* Nexus Titre Optimization */}
           <Card className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden p-10 relative group">
              {/* Glow effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] pointer-events-none group-hover:bg-indigo-600/10 transition-all"></div>
              
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-6 h-6" />
                 </div>
                 <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Optimisation des Titres (Nexus)</h4>
              </div>

              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-8 mb-6">
                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Titre suggéré pour l'élément analysé :</p>
                 <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-8">
                    {nexusRec.title}
                 </h2>
                 <Button 
                   onClick={() => toggleRec(nexusRec.id, 'nexus')}
                   className={cn(
                     "h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                     nexusRec.selected 
                       ? "bg-emerald-600 text-white hover:bg-emerald-500" 
                       : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                   )}
                 >
                   {nexusRec.selected ? <><Check className="w-3.5 h-3.5 mr-2" /> TITRE SÉLECTIONNÉ</> : "SÉLECTIONNER CE TITRE"}
                 </Button>
              </div>
           </Card>

           {/* Health Bar */}
           <Card className="bg-indigo-600/5 border border-indigo-600/30 p-4 rounded-2xl flex items-center gap-8 group">
              <div className="flex-1">
                 <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    Résumé Global Santé <Activity className="w-3 h-3" />
                 </p>
                 <h5 className="text-sm font-black text-white uppercase tracking-tight italic">
                    {(activeSite.products?.length > 0 || activeSite.posts?.length > 0) ? "Optimisation requise - Améliorez vos scores" : "Critical - No content detected"}
                 </h5>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="32" cy="32" r="28" 
                      fill="transparent" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      className="text-zinc-800"
                    />
                    <circle 
                      cx="32" cy="32" r="28" 
                      fill="transparent" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      strokeDasharray={175} 
                      strokeDashoffset={175 * 0.95} 
                      className="text-indigo-500 group-hover:animate-pulse"
                    />
                 </svg>
                 <span className="absolute text-xl font-black italic text-white leading-none">0%</span>
              </div>
           </Card>

           {/* In-flow Action Button */}
           {selectedCount > 0 && (
             <div className="flex justify-center pt-4 scale-100 hover:scale-[1.01] transition-transform duration-300">
                <button className="w-full h-16 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(16,185,129,0.2)] group transition-all">
                   <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                   <span className="text-[11px] font-black uppercase tracking-[0.2em]">Appliquer les {selectedCount} recommandations sélectionnés</span>
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
