import React, { useState } from 'react';
import { 
  Wrench, Trash2, Database, EyeOff, RefreshCw, 
  Stethoscope, Zap, FileText, Loader2, CheckCircle2,
  AlertTriangle, Gauge, PackageSearch, Ghost
} from 'lucide-react';
import { Button } from './ui';
import { cn } from '../lib/utils';

export default function SystemMaintenance({ activeSite }: { activeSite: any }) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const stats = [
    { label: 'Brouillons', value: '3', icon: Ghost, color: 'text-indigo-400' },
    { label: 'Rupture Stock', value: '3', icon: PackageSearch, color: 'text-rose-400' },
    { label: 'Vitesse API', value: '5000ms', icon: Gauge, color: 'text-emerald-400' },
  ];

  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleAction = (actionId: string, label: string) => {
    setIsProcessing(actionId);
    setFeedback(null);
    
    // Simulate process
    setTimeout(() => {
      setIsProcessing(null);
      
      if (actionId === 'generate-report') {
        setShowReport(true);
        setReportData({
          date: new Date().toLocaleString('fr-FR'),
          overallScore: 88,
          metrics: [
            { label: 'SEO technique', score: 92, status: 'excellent' },
            { label: 'Performance Base de données', score: 78, status: 'warning' },
            { label: 'Temps de réponse API', score: 85, status: 'good' },
            { label: 'Cohérence Taxonomie', score: 95, status: 'excellent' }
          ],
          anomalies: [
            "34 produits sans balises ALT d'images",
            "12 catégories vides détectées",
            "Transients WordPress dépassant 500Mo"
          ]
        });
      }

      setFeedback({
        type: 'success',
        message: `${label} terminé avec succès.`
      });
      setTimeout(() => setFeedback(null), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <Wrench className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Maintenance Système</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-1">
            Nettoyage, Optimisation & Santé WooCommerce
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group">
            <stat.icon className="absolute -right-2 -top-2 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity" />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={cn("text-3xl font-black italic tracking-tighter", stat.color)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cleaning Group */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[32px] p-8 space-y-6">
           <div className="flex items-center gap-3 mb-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-black text-white italic uppercase tracking-widest">Nettoyage Intelligent</h3>
           </div>
           
           <div className="space-y-4">
              <div 
                onClick={() => !isProcessing && handleAction('clear-drafts', 'Nettoyage des brouillons')}
                className={cn(
                  "group flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl transition-all cursor-pointer overflow-hidden relative",
                  !isProcessing ? "hover:border-rose-500/30 hover:bg-rose-500/5" : "opacity-50 cursor-wait"
                )}
              >
                 {isProcessing === 'clear-drafts' && (
                   <div className="absolute bottom-0 left-0 h-1 bg-rose-500 animate-progress-fast shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                 )}
                 <div className="flex-1">
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">Supprimer les brouillons</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Efface tous les produits en mode brouillon.</p>
                 </div>
                 <div 
                   className={cn(
                     "w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all",
                     isProcessing === 'clear-drafts' ? "bg-rose-600 border-rose-500 text-white" : "group-hover:bg-rose-600 group-hover:border-rose-500"
                   )}
                 >
                    {isProcessing === 'clear-drafts' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-rose-500 group-hover:text-white transition-colors" />}
                 </div>
              </div>

              <div 
                onClick={() => !isProcessing && handleAction('clear-transients', 'Nettoyage des transients')}
                className={cn(
                  "group flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl transition-all cursor-pointer overflow-hidden relative",
                  !isProcessing ? "hover:border-indigo-500/30 hover:bg-indigo-500/5" : "opacity-50 cursor-wait"
                )}
              >
                 {isProcessing === 'clear-transients' && (
                   <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-progress-fast shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                 )}
                 <div className="flex-1">
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">Nettoyer les transients</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Libère la mémoire cache obsolète de WordPress.</p>
                 </div>
                 <div 
                   className={cn(
                     "w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all",
                     isProcessing === 'clear-transients' ? "bg-indigo-600 border-indigo-500 text-white" : "group-hover:bg-indigo-600 group-hover:border-indigo-500"
                   )}
                 >
                    {isProcessing === 'clear-transients' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 text-indigo-500 group-hover:text-white transition-colors" />}
                 </div>
              </div>
           </div>
        </div>

        {/* Optimization Group */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[32px] p-8 space-y-6">
           <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-black text-white italic uppercase tracking-widest">Optimisation Boutique</h3>
           </div>

           <div className="space-y-4">
              <div 
                onClick={() => !isProcessing && handleAction('hide-out-stock', 'Masquage des ruptures')}
                className={cn(
                  "group flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl transition-all cursor-pointer overflow-hidden relative",
                  !isProcessing ? "hover:border-amber-500/30 hover:bg-amber-500/5" : "opacity-50 cursor-wait"
                )}
              >
                 {isProcessing === 'hide-out-stock' && (
                   <div className="absolute bottom-0 left-0 h-1 bg-amber-500 animate-progress-fast shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                 )}
                 <div className="flex-1">
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">Masquer les ruptures</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Masque automatiquement les produits sans stock du catalogue.</p>
                 </div>
                 <div 
                   className={cn(
                     "w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all",
                     isProcessing === 'hide-out-stock' ? "bg-amber-600 border-amber-500 text-white" : "group-hover:bg-amber-600 group-hover:border-amber-500"
                   )}
                 >
                    {isProcessing === 'hide-out-stock' ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4 text-amber-500 group-hover:text-white transition-colors" />}
                 </div>
              </div>

              <div 
                onClick={() => !isProcessing && handleAction('refresh-prices', 'Mise à jour des tarifs')}
                className={cn(
                  "group flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl transition-all cursor-pointer overflow-hidden relative",
                  !isProcessing ? "hover:border-emerald-500/30 hover:bg-emerald-500/5" : "opacity-50 cursor-wait"
                )}
              >
                 {isProcessing === 'refresh-prices' && (
                   <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 animate-progress-fast shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 )}
                 <div className="flex-1">
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">Réactualiser les tarifs</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Recalcule les prix synchronisés avec les fournisseurs.</p>
                 </div>
                 <div 
                   className={cn(
                     "w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all",
                     isProcessing === 'refresh-prices' ? "bg-emerald-600 border-emerald-500 text-white" : "group-hover:bg-emerald-600 group-hover:border-emerald-500"
                   )}
                 >
                    {isProcessing === 'refresh-prices' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-emerald-500 group-hover:text-white transition-colors" />}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* AI Health Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-indigo-950/40 border border-zinc-800/50 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-10">
         <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <Stethoscope className="w-8 h-8 text-indigo-400" />
         </div>
         <div className="flex-1 text-center md:text-left space-y-3">
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Analyse de santé IA</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-relaxed max-w-2xl">
               Diagnostic automatique de votre infrastructure e-commerce. Votre boutique présente un ratio de conversion stable, mais 12% de vos produits n'ont pas de méta-descriptions optimisées. Nous recommandons une passe SEO sur la catégorie <span className="text-indigo-400">"Lunettes de soleil"</span> pour maximiser le trafic organique.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
               <Button 
                 onClick={() => handleAction('ai-optimize', 'Auto-optimisation IA')}
                 disabled={!!isProcessing}
                 className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] gap-3 shadow-xl shadow-indigo-600/20"
               >
                 {isProcessing === 'ai-optimize' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                 Lancer auto-optimisation
               </Button>
               <Button 
                 onClick={() => handleAction('generate-report', 'Génération du rapport de santé')}
                 disabled={!!isProcessing}
                 variant="outline" 
                 className="h-12 px-8 bg-transparent border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 transition-all active:scale-95"
               >
                 {isProcessing === 'generate-report' ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <FileText className="w-4 h-4" />}
                 {isProcessing === 'generate-report' ? 'Analyse en cours...' : 'Rapport Complet'}
               </Button>
            </div>
         </div>
      </div>

      {/* Detailed System Report */}
      {showReport && reportData && (
        <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-6">
           <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                 <h3 className="text-lg font-black text-white italic uppercase tracking-wider">Rapport d'Audit Système détaillé</h3>
              </div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                 Générée le : <span className="text-zinc-300">{reportData.date}</span>
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Score Global</p>
                 <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                       <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-900" />
                       <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - reportData.overallScore / 100)} className="text-indigo-500 transition-all duration-1000" />
                    </svg>
                    <span className="absolute text-2xl font-black italic text-white">{reportData.overallScore}%</span>
                 </div>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {reportData.metrics.map((metric: any, i: number) => (
                    <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5 flex items-center justify-between group hover:bg-zinc-900/50 transition-all">
                       <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{metric.label}</p>
                          <div className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest inline-block",
                            metric.status === 'excellent' ? "bg-emerald-500/10 text-emerald-400" : 
                            metric.status === 'warning' ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"
                          )}>
                             {metric.status}
                          </div>
                       </div>
                       <p className="text-2xl font-black italic text-white">{metric.score}<span className="text-xs opacity-30 text-zinc-500">%</span></p>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-zinc-950/80 border border-zinc-800/50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                 <AlertTriangle className="w-4 h-4 text-amber-500" />
                 <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Actions recommandées & Anomalies</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                 {reportData.anomalies.map((anom: string, i: number) => (
                    <div key={i} className="flex items-start gap-4 group">
                       <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-amber-500/50 transition-all">
                          <span className="text-[9px] font-bold text-zinc-500">{i + 1}</span>
                       </div>
                       <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-1">{anom}</p>
                    </div>
                 ))}
              </div>
           </div>

           <div className="flex justify-center pt-8">
              <Button 
                onClick={() => window.print()}
                variant="outline" 
                className="h-10 px-8 border-dashed border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 text-[10px] uppercase font-black tracking-widest"
              >
                 Exporter le PDF <FileText className="w-3 h-3 ml-2" />
              </Button>
           </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
           <div className={cn(
             "px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-xl",
             feedback.type === 'success' ? "bg-emerald-600 border-emerald-500 text-white" : "bg-rose-600 border-rose-500 text-white"
           )}>
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-[10px] font-black uppercase tracking-widest">{feedback.message}</p>
           </div>
        </div>
      )}
    </div>
  );
}
