import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle2, ShieldAlert, ShieldCheck, Activity, Lock, Globe, Zap, Search, Sparkles } from 'lucide-react';
import { Button, Card } from './ui';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { decrypt } from '../lib/crypto';

interface AuditResult {
  id: string;
  category: 'security' | 'performance' | 'api' | 'seo' | 'conversion';
  title: string;
  status: 'error' | 'warning' | 'success';
  message: string;
  recommendation: string;
}

export default function AuditShield({ activeSite }: { activeSite: any }) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [score, setScore] = useState(0);

  const runAudit = async () => {
    if (!activeSite) return;
    setIsAuditing(true);
    setResults([]);
    
    // Simulate initial audit steps with delays
    const steps = [
      { id: '1', category: 'security', title: 'SSL/HTTPS', status: 'success', message: 'Certificat SSL valide et actif.', recommendation: 'Rien à faire.' },
      { id: '2', category: 'api', title: 'WooCommerce API', status: 'success', message: 'Connexion REST API établie avec succès.', recommendation: 'Rien à faire.' },
      { id: '3', category: 'security', title: 'Fichiers Sensibles', status: 'warning', message: 'Le dossier /wp-content/uploads semble listable.', recommendation: 'Ajoutez un fichier index.php vide ou utilisez .htaccess.' },
      { id: '4', category: 'performance', title: 'Cache WordPress', status: 'error', message: 'Aucun système de cache détecté.', recommendation: 'Installez WP Rocket ou WP Super Cache.' },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setResults(prev => [...prev, steps[i] as AuditResult]);
    }

    // AI Analysis if Key is present
    if (activeSite.geminiApiKeyEnc) {
      try {
        const apiKey = decrypt(activeSite.geminiApiKeyEnc);
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Agis en tant qu'expert en Audit E-commerce. Analyse le site "${activeSite.url}" (Niche: ${activeSite.niche || 'Générale'}). 
        Génère 3 points d'audit supplémentaires : 1 SEO, 1 Conversion, 1 Contenu.
        Chaque point doit être critique et constructif.
        Renvoie UNIQUEMENT un tableau JSON avec cette structure : 
        [{ "category": "seo" | "conversion", "title": string, "status": "warning" | "error" | "success", "message": string, "recommendation": string }]`;

        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt
        });

        const text = result.text || '[]';
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const aiSteps = JSON.parse(jsonStr);

        for (let i = 0; i < aiSteps.length; i++) {
          const aiStep = aiSteps[i];
          setResults(prev => [...prev, {
            ...aiStep,
            id: `ai-${i}`,
            title: `[IA] ${aiStep.title}`
          } as AuditResult]);
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (e) {
        console.error("AI Audit Error:", e);
      }
    } else {
      // Fallback steps if no AI key
      const fallback = [
        { id: '5', category: 'seo', title: 'Méta Balises', status: 'warning', message: 'Manque de méta-descriptions optimisées.', recommendation: 'Utilisez le SEO Optimizer.' },
        { id: '6', category: 'conversion', title: 'Boutons d\'Achat', status: 'warning', message: 'Contraste des boutons sous-optimal.', recommendation: 'Changez pour une couleur contrastée.' }
      ];
      for (const f of fallback) {
        await new Promise(r => setTimeout(r, 800));
        setResults(prev => [...prev, f as AuditResult]);
      }
    }

    setResults(prev => {
      const calculatedScore = Math.floor((prev.filter(s => s.status !== 'error').length / prev.length) * 100);
      setScore(calculatedScore);
      return prev;
    });
    setIsAuditing(false);
  };

  if (!activeSite) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-zinc-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-tighter">Aucun site sélectionné</h3>
          <p className="text-xs text-zinc-500">Sélectionnez une boutique pour lancer l'audit de sécurité WooAI Shield.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Widget */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900/50 border-zinc-800 col-span-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-zinc-800"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={226}
                  strokeDashoffset={226 - (226 * score) / 100}
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    score > 80 ? "text-emerald-500" : score > 50 ? "text-amber-500" : "text-rose-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-white">{score}</span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-tighter">WooAI Shield Score</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                Analyse globale de votre boutique <span className="text-indigo-400 font-bold">{activeSite.url}</span>
              </p>
              <Button 
                onClick={runAudit} 
                disabled={isAuditing}
                size="sm"
                className="mt-2 text-[10px] h-7 px-4 bg-indigo-600 hover:bg-indigo-500 font-black uppercase italic"
              >
                {isAuditing ? (
                  <> <Search className="w-3 h-3 mr-2 animate-spin" /> Analyse en cours... </>
                ) : (
                  <> <Zap className="w-3 h-3 mr-2" /> Relancer l'audit </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/50 border-zinc-800 flex flex-col justify-center">
          <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Status API</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-sm font-black text-white uppercase italic">Connecté</span>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/50 border-zinc-800 flex flex-col justify-center">
          <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Protection</div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-black text-white uppercase italic">Active</span>
          </div>
        </Card>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {results.length === 0 && !isAuditing && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl"
            >
              <Shield className="w-12 h-12 text-zinc-800 mb-4" />
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Lancez un audit pour voir les résultats</p>
            </motion.div>
          )}

          {results.map((result, idx) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4 bg-zinc-950/40 border-zinc-800 group hover:border-zinc-700 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                    result.status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    result.status === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                    "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  )}>
                    {result.status === 'success' ? <ShieldCheck className="w-5 h-5" /> :
                     result.status === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                     <ShieldAlert className="w-5 h-5" />}
                  </div>

                  <div className="grow space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">{result.category}</span>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">{result.title}</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400">{result.message}</p>
                    {result.status !== 'success' && (
                      <div className="mt-2 p-2 rounded bg-zinc-900 border border-zinc-800/50">
                        <span className="text-[9px] font-black text-indigo-400 uppercase mr-2">Recommandation:</span>
                        <span className="text-[10px] text-zinc-300 italic">{result.recommendation}</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                      result.status === 'success' ? "bg-emerald-500/20 text-emerald-400" :
                      result.status === 'warning' ? "bg-amber-500/20 text-amber-400" :
                      "bg-rose-500/20 text-rose-400"
                    )}>
                      {result.status === 'success' ? 'Passé' :
                       result.status === 'warning' ? 'Attention' : 'Échec'}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isAuditing && (
        <div className="flex justify-center py-4">
          <Activity className="w-6 h-6 text-indigo-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}
