import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Zap, TrendingUp, ShieldCheck, Globe, List } from 'lucide-react';
import { Button } from './ui';
import { cn } from '../lib/utils';
import Auth from './Auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function LandingPage() {
  const [showAuth, setShowAuth] = React.useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [adminSettings, setAdminSettings] = useState<any>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'admin', 'settings'));
        if (configDoc.exists()) {
          setAdminSettings(configDoc.data());
        }
      } catch (error) {
        console.error("Error loading landing pricing:", error);
      }
    };
    loadConfig();
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (showAuth) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }

  const navLinks = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#pricing", label: "Tarifs" },
    { href: "#testimonials", label: "Témoignages" },
  ];

  const defaultPacks = [
    { id: 'free', name: "Gratuit", monthlyPrice: 0, shops: "Toutes les opt.", duration: "1 Heure", cta: "Initialiser_Essai", detail: "Jeton à usage unique" },
    { id: 'solo', name: "Solo", monthlyPrice: 29, yearlyPrice: 290, shops: 1, duration: "30 Jours", cta: "Acquérir_Nœud", detail: "Instance personnalisée" },
    { id: 'business', name: "Business", monthlyPrice: 79, yearlyPrice: 790, shops: 5, duration: "30 Jours", cta: "Déployer_Réseau", popular: true, detail: "Flotte standard" },
    { id: 'agency', name: "Agency", monthlyPrice: 149, yearlyPrice: 1490, shops: 12, duration: "30 Jours", cta: "Commande_Totale", detail: "Infrastructure complète" },
  ];

  const packs = defaultPacks.map(p => {
    const savedPack = adminSettings?.packs?.find((sp: any) => sp.id === p.id);
    if (savedPack) {
      return { ...p, ...savedPack };
    }
    return p;
  });

  return (
    <div id="top" className="min-h-screen bg-[#020205] text-zinc-300 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#020205]/80 backdrop-blur-xl border-b border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(99,102,241,0.4)]">W</div>
            <span className="font-black text-2xl tracking-tighter text-white uppercase italic">Woo<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">AI</span></span>
          </a>
          <nav className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="hover:text-indigo-400 transition-colors">{link.label}</a>
            ))}
          </nav>
          <div className="flex gap-2 sm:gap-4 items-center">
            <Button variant="ghost" size="sm" className="text-xs uppercase font-bold tracking-wider hidden md:flex" onClick={() => setShowAuth(true)}>Connexion</Button>
            <Button size="sm" className="text-xs uppercase font-bold tracking-wider" onClick={() => setShowAuth(true)}>Commencer</Button>
            
            <button 
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-zinc-950 border-b border-zinc-900 px-4 py-8 space-y-6"
          >
            {navLinks.map(link => (
              <a 
                key={link.href} 
                href={link.href} 
                className="block text-xl font-black text-white uppercase tracking-tighter"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-6 border-t border-zinc-900 flex gap-4">
               <Button variant="outline" className="flex-1 uppercase font-black text-[10px]" onClick={() => setShowAuth(true)}>Connexion</Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-4 relative flex flex-col items-center">
        {/* Dynamic Animated Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[160px] rounded-full mix-blend-screen animate-pulse pointer-events-none"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[160px] rounded-full mix-blend-screen animate-pulse delay-700 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-600/10 blur-[130px] rounded-full mix-blend-screen animate-pulse delay-1000 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-400 text-[10px] font-black mb-10 uppercase tracking-[0.2em] backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
              Système d'Intelligence WooCommerce v2.5 • Opérationnel
            </motion.div>
            
            <h1 className="text-6xl md:text-[8vw] font-[1000] text-white tracking-[-0.05em] mb-10 leading-[0.85] uppercase italic">
              Scalez Votre <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                Empire Woo
              </span>
            </h1>

            <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-16 px-4">
              <p className="text-base md:text-xl text-zinc-400 max-w-2xl leading-relaxed font-medium uppercase tracking-tight">
                L'infrastructure IA ultime pour transformer vos boutiques <span className="text-white">WordPress & WooCommerce</span> en machines de vente automatiques.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" className="px-14 h-16 rounded-2xl font-black uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-500 shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all duration-500 hover:translate-y-[-4px] active:translate-y-0" onClick={() => setShowAuth(true)}>
                Commencer l'ascension
              </Button>
              <Button size="lg" variant="outline" className="px-14 h-16 rounded-2xl font-black uppercase tracking-[0.2em] bg-white/[0.03] border-white/[0.1] text-zinc-400 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.2] transition-all duration-500" onClick={() => setShowAuth(true)}>
                Lancer la démo
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-zinc-500 to-transparent"></div>
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Faire défiler pour scanner</span>
        </motion.div>
      </section>

      {/* Trust Marquee */}
      <div className="py-16 border-y border-white/[0.03] bg-[#020205] overflow-hidden relative">
        <div className="flex gap-20 whitespace-nowrap animate-marquee">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="flex gap-24 items-center grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <span className="text-3xl font-black text-white italic tracking-tighter group flex items-center gap-4">
                <div className="w-8 h-8 bg-[#7f54b3] rounded-lg"></div> WOOCOMMERCE
              </span>
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 tracking-widest flex items-center gap-4">
                <div className="w-8 h-8 border-2 border-indigo-500 rounded-full"></div> GEMINI PRO
              </span>
              <span className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                <div className="w-8 h-8 bg-[#21759b] rounded-md"></div> WORDPRESS
              </span>
              <span className="text-3xl font-black text-zinc-500 tracking-widest">AES-256</span>
              <span className="text-3xl font-black text-indigo-400 italic tracking-tighter underline decoration-indigo-500/50 underline-offset-8">AUTO_SYNC</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-40 border-t border-white/[0.03] bg-[#020205] relative overflow-hidden scroll-mt-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-32 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-[1000] text-white uppercase tracking-tighter mb-6 leading-none italic">
                Dominez <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Le E-Commerce</span>
              </h2>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.4em] mb-4">Architecture WooAI : Synchronisation Maximale</p>
            </div>
            <div className="hidden md:block text-right">
              <div className="w-20 h-[2px] bg-gradient-to-r from-indigo-500 to-pink-500 mb-4 ml-auto"></div>
              <span className="text-zinc-700 font-mono text-[10px] uppercase">Statut_Système : 100% NOMINAL</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "WooAI Shield", desc: "Audit de sécurité et performance complet pour vos boutiques WooCommerce.", tag: "SHIELD_ON", color: "from-emerald-500/20 to-transparent" },
              { icon: Globe, title: "SEO Automatique", desc: "Méta titres et descriptions optimisés pour WordPress.", tag: "SEARCH_MAX", color: "from-purple-500/20 to-transparent" },
              { icon: TrendingUp, title: "Analyse Marché", desc: "Décryptez les tendances et prix de vos concurrents en temps réel.", tag: "INTEL_OPS", color: "from-pink-500/20 to-transparent" },
              { icon: ShoppingBag, title: "Gestion Woo", desc: "Synchronisation instantanée des stocks entre votre dashboard et WordPress.", tag: "SYNC_CORE", color: "from-amber-500/20 to-transparent" },
              { icon: ShieldCheck, title: "Sécurité SSL", desc: "Vos clés API WooCommerce chiffrées avec le standard militaire AES-256.", tag: "SAFE_PASS", color: "from-emerald-500/20 to-transparent" },
              { icon: List, title: "Catalogues IA", desc: "Organisation automatique de vos catégories et étiquettes WordPress.", tag: "DATA_NODE", color: "from-blue-500/20 to-transparent" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-12 bg-white/[0.02] border border-white/[0.05] rounded-3xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-700 group relative overflow-hidden"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none", f.color)}></div>
                <div className="absolute top-6 right-6">
                  <span className="text-[10px] font-black text-zinc-600 bg-white/[0.05] px-2 py-1 rounded-lg uppercase tracking-widest">{f.tag}</span>
                </div>
                <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative z-10 shadow-2xl">
                  <f.icon className="text-indigo-400 w-8 h-8" />
                </div>
                <h3 className="font-black text-white text-2xl mb-6 uppercase tracking-tight relative z-10 italic">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed font-bold uppercase tracking-tight relative z-10 group-hover:text-zinc-300 transition-colors">{f.desc}</p>
                <div className="mt-10 pt-10 border-t border-white/[0.05] flex items-center gap-3 relative z-10">
                  <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Accéder au module</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-[#020205] border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
            {[
              { label: "GÉNÉRATIONS_IA", value: "12M+", sub: "Sorties totales", color: "text-indigo-400" },
              { label: "BOOST_SEO_MOYEN", value: "+42%", sub: "Impact mesuré", color: "text-purple-400" },
              { label: "LATENCE_NŒUD", value: "<15ms", sub: "Flux temps réel", color: "text-pink-400" },
              { label: "UPTIME_RÉSEAU", value: "99.99%", sub: "SLA Entreprise", color: "text-emerald-400" },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left relative group">
                <div className="absolute -inset-4 bg-white/[0.02] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">{s.label}</div>
                  <div className={cn("text-5xl md:text-6xl font-[1000] tracking-tighter mb-2 italic", s.color)}>{s.value}</div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase italic font-bold tracking-widest">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-40 bg-[#020205] border-t border-white/[0.03] relative scroll-mt-20">
        <div className="absolute top-1/2 left-0 w-full h-[600px] bg-indigo-600/5 blur-[160px] rounded-full pointer-events-none -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-[1000] text-white uppercase tracking-tighter mb-8 leading-none italic">Plans <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">D'Accès Nœud</span></h2>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.4em] max-w-2xl mx-auto mb-16 italic">Scalez votre infrastructure WooCommerce selon vos besoins réels.</p>
            
            <div className="flex items-center justify-center gap-8 mb-16">
              <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", billingCycle === 'monthly' ? "text-white" : "text-zinc-600")}>Mensuel</span>
              <button 
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-20 h-10 bg-white/[0.03] border border-white/[0.1] rounded-full relative p-1.5 transition-all group scale-125"
              >
                <div className={cn(
                  "w-6 h-6 bg-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_25px_rgba(79,70,229,0.6)]",
                  billingCycle === 'yearly' ? "translate-x-10" : "translate-x-0"
                )}></div>
              </button>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", billingCycle === 'yearly' ? "text-white" : "text-zinc-600")}>Annuel</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 tracking-tighter uppercase">-20% RÉDUC.</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {packs.map((p: any) => {
              const currentPrice = billingCycle === 'yearly' ? p.yearlyPrice : p.monthlyPrice;
              const perMonth = billingCycle === 'yearly' ? Math.round(p.yearlyPrice / 12) : p.monthlyPrice;
              
              return (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={cn(
                    "p-12 bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] flex flex-col items-start relative overflow-hidden group shadow-2xl transition-all duration-500 hover:translate-y-[-8px]",
                    p.popular && "bg-gradient-to-b from-indigo-500/10 to-transparent border-indigo-500/30 scale-105 z-10"
                  )}
                >
                  {p.popular && (
                    <div className="absolute top-8 right-8">
                      <div className="bg-indigo-500 text-white text-[10px] font-black py-1 px-4 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.5)]">Popularité_Max</div>
                    </div>
                  )}
                  
                  <h3 className="font-black text-zinc-500 text-xs mb-10 uppercase tracking-[0.4em] italic">{p.name}</h3>
                  <div className="mb-10">
                    <div className="text-6xl font-black text-white tracking-tighter group-hover:text-indigo-400 transition-colors italic">
                      {currentPrice}€
                    </div>
                    {billingCycle === 'yearly' && p.id !== 'free' && (
                      <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-3 italic font-bold">
                        Soit {perMonth}€ / mois (Facturé {p.yearlyPrice}€/an)
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full h-px bg-white/[0.05] mb-10"></div>

                  <ul className="mb-12 text-xs text-zinc-400 space-y-8 flex-1 font-bold uppercase tracking-tight w-full">
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-3 text-zinc-500"><Zap className="w-4 h-4 text-indigo-500" /> Nœuds Actifs</span>
                      <span className="text-white italic">{typeof p.shops === 'number' ? `${p.shops} Boutiques` : p.shops || p.sites}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-3 text-zinc-500"><Globe className="w-4 h-4 text-purple-500" /> Durée Système</span>
                      <span className="text-white italic">{p.duration || '30 Jours'}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-3 text-zinc-500"><ShieldCheck className="w-4 h-4 text-pink-500" /> Priorité API</span>
                      <span className="text-white italic">{p.popular ? "Tier_Elite" : "Standard"}</span>
                    </li>
                  </ul>
                  <Button variant={p.popular ? 'primary' : 'outline'} className={cn(
                    "w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 active:scale-95",
                    p.popular ? "bg-indigo-600 hover:bg-indigo-500 shadow-[0_15px_40px_rgba(79,70,229,0.4)]" : "bg-transparent border-white/[0.1] text-zinc-500 hover:text-white hover:border-white/[0.2]"
                  )} onClick={() => setShowAuth(true)}>
                    {p.cta || 'S\'abonner'}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-40 bg-[#020205] border-t border-white/[0.03] relative overflow-hidden scroll-mt-20">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-600/5 blur-[160px] rounded-full pointer-events-none translate-x-[-20%] translate-y-[20%]"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-32 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-[1000] text-white uppercase tracking-tighter mb-6 leading-none italic">
                Preuves <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-500">D'Impact Réel</span>
              </h2>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.4em]">Flux_Retour : Validation de l'infrastructure WooAI</p>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 font-black text-xl italic tracking-tighter">SATISFACTION_CLIENT : 4.98/5.0</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Marc D.",
                role: "CEO @ ShopNode",
                content: "WooAI a radicalement transformé notre pipeline WooCommerce. Nous sommes passés de 2 boutiques à 15 en 3 mois grâce à l'automatisation totale.",
                impact: "+120% TRAFIC_ORGA",
                tag: "PARTNER_ELITE",
                color: "text-indigo-400",
                bg: "from-indigo-500/10"
              },
              {
                name: "Sarah L.",
                role: "Directrice E-commerce",
                content: "La précision des descriptions IA Gemini Pro pour nos produits WordPress est bluffante. Le taux de conversion a bondi de façon spectaculaire.",
                impact: "+35% CONVERSION",
                tag: "BETA_SYSTEM",
                color: "text-purple-400",
                bg: "from-purple-500/10"
              },
              {
                name: "Thomas K.",
                role: "Fondateur d'Agence",
                content: "Le centre de commande WooAI est indispensable pour gérer des dizaines de boutiques WooCommerce sans perdre la tête. Un gain de temps monstrueux.",
                impact: "-80% TEMPS_GESTION",
                tag: "POWER_CORE",
                color: "text-pink-400",
                bg: "from-pink-500/10"
              }
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-12 bg-white/[0.02] border border-white/[0.05] rounded-[3rem] flex flex-col group relative overflow-hidden"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none", t.bg, "to-transparent")}></div>
                <div className="absolute top-8 right-8">
                  <span className="text-[10px] font-black text-zinc-600 bg-white/[0.05] px-3 py-1 rounded-full uppercase tracking-widest">{t.tag}</span>
                </div>
                
                <div className="flex items-center gap-5 mb-10 relative z-10">
                  <div className="w-14 h-14 bg-white/[0.05] border border-white/[0.1] rounded-2xl flex items-center justify-center font-[1000] text-xl text-indigo-400 italic shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-lg font-[1000] text-white uppercase tracking-tight italic">{t.name}</div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] font-bold">{t.role}</div>
                  </div>
                </div>

                <div className="flex-1 mb-12 relative z-10">
                  <p className="text-zinc-400 text-lg italic font-bold leading-relaxed uppercase tracking-tight group-hover:text-white transition-colors">
                    "{t.content}"
                  </p>
                </div>

                <div className="pt-10 border-t border-white/[0.05] relative z-10">
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3">Rapport d'Impact :</div>
                  <div className={cn("text-3xl font-[1000] italic tracking-tighter", t.color)}>
                    {t.impact}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-[#020205] border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl font-black text-white italic shadow-lg group-hover:scale-110 transition-transform">W</div>
            <span className="font-[1000] text-white text-2xl uppercase tracking-tighter italic">Woo<span className="text-indigo-400">AI</span> <span className="text-zinc-700 text-sm font-mono ml-2 not-italic font-bold">V2.5.0</span></span>
          </div>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.3em] font-bold">© 2026 WOOAI_SYSTEMS. TOUS DROITS RÉSERVÉS. DÉPLOYÉ_PAR_AI_STUDIO.</p>
        </div>
      </footer>
    </div>
  );
}
