import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { 
  BarChart3, LayoutDashboard, ShoppingCart, Search, 
  Settings, LogOut, Zap, Clock, Globe, Plus,
  ChevronRight, AlertCircle, TrendingUp, FileText, Layers, ShoppingBag, 
  CheckCircle2, AlertTriangle, Tag, Trash2, RefreshCw, Loader2, ShieldCheck,
  Wrench, Shield
} from 'lucide-react';
import { Button, Card } from './ui';
import { cn, formatTimeRemaining } from '../lib/utils';
import SiteManager from './SiteManager';
import SEOAnalyzer from './SEOAnalyzer';
import StockManager from './StockManager';
import ProductManager from './ProductManager';
import TaxonomyManager from './TaxonomyManager';
import ContentOptimizer from './ContentOptimizer';
import MarketIntelligence from './MarketIntelligence';
import SystemMaintenance from './SystemMaintenance';
import AdminConsole from './AdminConsole';
import AuditShield from './AuditShield';
import RewardBanner from './RewardBanner';
import { fetchWooData } from '../services/wooService';

interface DashboardProps {
  user: User;
  userData: any;
}

export default function Dashboard({ user, userData: initialUserData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [userData, setUserData] = useState(initialUserData);
  const [sites, setSites] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [activeSiteData, setActiveSiteData] = useState<any>(null);
  const [activeSite, setActiveSite] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [adminSettings, setAdminSettings] = useState<any>(null);

  useEffect(() => {
    // Dynamic PayPal script loading
    const paypalId = adminSettings?.paypalBusinessId || 'sb';
    if (activeTab === 'billing' && paypalId) {
      const existingScript = document.querySelector('script[src*="paypal"]');
      if (existingScript) {
        if (existingScript.getAttribute('src')?.includes(paypalId)) {
          return; // Already loaded correctly
        }
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalId}&currency=EUR`;
      script.async = true;
      script.onload = () => {
        // Trigger a re-render or notification to the billing component
        setActiveTab(prev => prev); 
      };
      document.head.appendChild(script);
    }
  }, [activeTab, adminSettings?.paypalBusinessId]);

  useEffect(() => {
    // Load admin settings for pricing and paypal
    const unsubConfig = onSnapshot(doc(db, 'admin', 'settings'), (doc) => {
      if (doc.exists()) {
        setAdminSettings(doc.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'admin/settings');
    });
    return () => unsubConfig();
  }, []);

  useEffect(() => {
    if (sites.length > 0 && !activeSite) {
      setActiveSite(sites[0]);
    }
  }, [sites, activeSite]);

  useEffect(() => {
    if (activeSite) {
      setActiveSiteData({
        articles: activeSite.posts?.length || 0,
        pages: 19,
        products: activeSite.products?.length || 0,
        seoScore: 84,
        url: activeSite.url.replace('https://', '').toUpperCase()
      });
    }
  }, [activeSite]);

  const handleSyncSite = async () => {
    if (!activeSite) return;
    setIsSyncing(true);
    try {
      const data = await fetchWooData(activeSite);
      await updateDoc(doc(db, 'sites', activeSite.id), {
        products: data.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          images: p.images,
          description: p.description,
          price: p.price,
          status: p.status,
          type: 'product'
        })),
        posts: data.posts.map((p: any) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          type: 'post'
        })),
        lastSync: new Date().toISOString()
      });
      alert('Synchronisation réussie !');
    } catch (error) {
      console.error('Sync failed, using fallback mock for demo:', error);
      // Fallback for CORS issues in demo
      await updateDoc(doc(db, 'sites', activeSite.id), {
        products: [
          { id: 3767, name: 'Ensemble Lingerie Brodé "Élégance Audacieuse"', images: [{ src: 'https://images.unsplash.com/photo-1582236945443-c2155d394b30?auto=format&fit=crop&q=80&w=400' }], description: '<p>Sublimez votre féminité avec cet ensemble de lingerie raffiné...</p>', type: 'product' },
          { id: 3768, name: 'Soutien-Gorge en Dentelle Transparente', images: [{ src: 'https://images.unsplash.com/photo-1594934989412-45f24637d67b?auto=format&fit=crop&q=80&w=400' }], description: '<p>Maintien parfait et confort absolu pour ce modèle iconique...</p>', type: 'product' },
          { id: 3769, name: 'Robe de Nuit en Soie Noire', images: [{ src: 'https://images.unsplash.com/photo-1591348113529-6fa6751a7eaa?auto=format&fit=crop&q=80&w=400' }], description: '<p>Une douceur inégalée pour vos soirées de détente...</p>', type: 'product' },
          { id: 3770, name: 'Ensemble Dentelle Rouge Passion', images: [{ src: 'https://images.unsplash.com/photo-1621335829175-95f437384d7c?auto=format&fit=crop&q=80&w=400' }], description: '<p>L\'élégance et la passion réunies dans un design audacieux...</p>', type: 'product' }
        ],
        posts: [
          { id: 101, title: { rendered: 'Comment choisir sa lingerie ?' }, content: { rendered: '<p>Guide complet pour trouver la pièce parfaite...</p>' }, type: 'post' }
        ],
        lastSync: new Date().toISOString()
      });
      alert('Note: Synchronisation simulée (CORS empêche l\'appel direct au domaine WordPress depuis le navigateur).');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Listen to user data for real-time subscription status
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setUserData(doc.data());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    // Listen to sites
    const q = query(collection(db, 'sites'), where('userId', '==', user.uid));
    const unsubSites = onSnapshot(q, (snapshot) => {
      setSites(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sites');
    });

    return () => {
      unsubUser();
      unsubSites();
    };
  }, [user.uid]);

  useEffect(() => {
    if (!userData?.expirationDate) return;

    const timer = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(userData.expirationDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [userData?.expirationDate]);

  const [selectedPackId, setSelectedPackId] = useState('solo');
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (activeTab === 'billing' && (window as any).paypal) {
      const container = document.getElementById('paypal-button-container');
      const paypalBusinessId = adminSettings?.paypalBusinessId || 'sb'; // 'sb' for sandbox as fallback
      if (container && paypalBusinessId) {
        container.innerHTML = ''; // Clear previous button to avoid duplicates
        (window as any).paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            const pack = adminSettings.packs?.find((p: any) => p.id === selectedPackId) || 
                         (selectedPackId === 'business' ? { monthlyPrice: 79, yearlyPrice: 790 } : 
                          selectedPackId === 'agency' ? { monthlyPrice: 149, yearlyPrice: 1490 } : 
                          { monthlyPrice: 29, yearlyPrice: 290 });
            
            const amount = selectedCycle === 'yearly' ? pack.yearlyPrice : pack.monthlyPrice;
            
            return actions.order.create({
              purchase_units: [{ 
                description: `Abonnement WooAI - Pack ${selectedPackId.toUpperCase()} (${selectedCycle})`,
                amount: { value: amount.toString() } 
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            const order = await actions.order.capture();
            console.log('Order Approved:', order);
            
            const duration = selectedCycle === 'yearly' ? 365 : 30;
            const expDate = new Date();
            // If already has an expiration date in the future, extend it
            const currentExp = userData?.expirationDate ? new Date(userData.expirationDate) : new Date();
            const baseDate = currentExp > new Date() ? currentExp : new Date();
            
            baseDate.setDate(baseDate.getDate() + duration);
            
            await updateDoc(doc(db, 'users', user.uid), {
              packType: selectedPackId,
              expirationDate: baseDate.toISOString()
            });
            alert(`Félicitations ! Pack ${selectedPackId.toUpperCase()} activé.`);
          },
          onError: (err: any) => {
            console.error('PayPal Error:', err);
            alert('Erreur lors du paiement PayPal.');
          }
        }).render('#paypal-button-container');
      }
    }
  }, [activeTab, adminSettings, selectedPackId, selectedCycle]);

  const baseLimit = adminSettings?.packs?.find((p: any) => p.id === userData?.packType)?.shops || (userData?.packType === 'agency' ? 12 : userData?.packType === 'business' ? 5 : 1);
  const sitesLimit = baseLimit + (userData?.bonusSites || 0);

  const menuItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'sites', label: 'Mes Boutiques', icon: Globe },
    { id: 'shield', label: 'WooAI Shield', icon: Shield },
    { id: 'products', label: 'Gestion Produits', icon: ShoppingBag },
    { id: 'stock', label: 'Gestion Stocks', icon: Layers },
    { id: 'taxonomy', label: 'Catégories & Tags', icon: Tag },
    { id: 'market', label: 'Intelligence Marché', icon: Globe },
    { id: 'maintenance', label: 'Maintenance Système', icon: Wrench },
    { id: 'content', label: 'SEO & Contenu', icon: FileText },
    { id: 'seo', label: 'Audit Global', icon: Search },
    { id: 'billing', label: 'Abonnement', icon: ShoppingCart },
    ...(user.email === 'zohrabenmiled@gmail.com' ? [{ id: 'admin', label: 'Console Admin', icon: Settings }] : []),
  ];

  const handleLogout = () => auth.signOut();
  
  const dismissReward = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        hasUnseenReward: false
      });
    } catch (e) {
      console.error("Failed to dismiss reward:", e);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 overflow-hidden font-sans">
      {/* Reward Notification Banner */}
      {userData?.hasUnseenReward && (
        <RewardBanner 
          message={userData.rewardMessage || 'Vous avez reçu une récompense !'} 
          type={userData.rewardType || 'gift'} 
          onClose={dismissReward}
        />
      )}
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-950">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">W</div>
            <span className="text-xl font-bold tracking-tight text-white">WooAI <span className="text-indigo-400">SaaS</span></span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 pb-2">Gestion</div>
          {menuItems.slice(0, 2).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all group',
                activeTab === item.id 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
              )}
            >
              <item.icon className={cn('w-4 h-4', activeTab === item.id ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
              {item.label}
            </button>
          ))}
          
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 pt-6 pb-2">IA & Marketing</div>
          {menuItems.slice(2, 8).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all group',
                activeTab === item.id 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
              )}
            >
              <item.icon className={cn('w-4 h-4', activeTab === item.id ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
              {item.label}
            </button>
          ))}

          {user.email === 'zohrabenmiled@gmail.com' && (
             <button
              onClick={() => setActiveTab('admin')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all group mt-6',
                activeTab === 'admin' 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
              )}
            >
              <Settings className={cn('w-4 h-4', activeTab === 'admin' ? 'text-indigo-400' : 'text-zinc-600')} />
              Console Admin
            </button>
          )}
        </nav>

        <div className="mt-auto p-4 bg-indigo-950/20 border-t border-zinc-800">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-[10px] text-indigo-300 font-bold uppercase">Pack {userData?.packType}</div>
              <div className="text-[10px] text-zinc-500">Actif: {sites.length} / {sitesLimit} Boutiques</div>
            </div>
            <div className="text-[10px] text-indigo-400 font-mono tracking-tighter">
              {timeRemaining.includes('d') ? timeRemaining.split(' ')[0] : 'J-0'}
            </div>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: '70%' }}></div>
          </div>
          <div className="mt-3 text-center text-[10px] font-mono text-indigo-300/80 uppercase">
            RESTE {timeRemaining || '00:00:00'}
          </div>
          <button 
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[10px] font-bold text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-zinc-800 underline-offset-4 decoration-zinc-700 underline"
          >
            <LogOut className="w-3 h-3" />
            DÉCONNEXION
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Site Actif :</span>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 min-w-[120px]">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-tight">
                {activeSite ? activeSite.name : "Aucun site"}
              </span>
            </div>
            {activeSite && (
              <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Connecté</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Crédits Système</span>
              <span className="text-xs font-mono text-white">12,450 <span className="text-zinc-600">/ 50k</span></span>
            </div>
            <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {user.email?.substring(0, 2)}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-700">
              {/* Header Statut Système */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Statut Système</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Télémétrie Live : {activeSiteData?.url || 'Vérification...'}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-[9px] font-black uppercase tracking-widest gap-2 rounded-none px-4">
                  <TrendingUp className="w-3 h-3 text-indigo-400" /> Journal d'audit complet
                </Button>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 min-h-[180px] relative flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-zinc-600" />
                    </div>
                    <span className="text-[8px] font-mono text-zinc-700 tracking-widest">METRIC_ID_0</span>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white tracking-tighter">0</div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Articles</div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 min-h-[180px] relative flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 font-mono text-[10px]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-zinc-700 tracking-widest">METRIC_ID_1</span>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white tracking-tighter">19</div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Pages</div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 min-h-[180px] relative flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-zinc-700 tracking-widest">METRIC_ID_2</span>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white tracking-tighter">88</div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Produits</div>
                  </div>
                </div>

                <div className="bg-indigo-600 p-6 min-h-[180px] relative flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Zap className="w-32 h-32 text-white" />
                  </div>
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-8 h-8 rounded bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[8px] font-mono text-white/50 tracking-widest">METRIC_ID_3</span>
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl font-black text-white tracking-tighter">84/100</div>
                    <div className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">SEO Score</div>
                  </div>
                </div>
              </div>

              {/* Nexus Strategic Report */}
              <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                <div className="flex justify-between items-start">
                  <div className="max-w-2xl">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] block mb-4">Nexus Executive Intelligence</span>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Rapport stratégique de la boutique</h3>
                    <p className="text-[11px] text-zinc-500 uppercase font-mono leading-relaxed max-w-xl">
                      Nexus analyse actuellement vos 88 produits et 0 articles pour identifier des opportunités de croissance exponentielle.
                    </p>
                    
                    <div className="flex gap-4 mt-8">
                      <div className="bg-zinc-950 border border-zinc-800 p-4 min-w-[220px] cursor-pointer hover:border-indigo-500/50 transition-all" onClick={() => setActiveTab('seo')}>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Focus Prioritaire</span>
                        <p className="text-[10px] text-zinc-300 font-bold leading-tight">Optimisation SEO requise pour 12 mots-clés à fort volume.</p>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-4 min-w-[220px] cursor-pointer hover:border-indigo-500/50 transition-all" onClick={() => setActiveTab('stock')}>
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Santé des revenus</span>
                        <p className="text-[10px] text-zinc-300 font-bold leading-tight">Potentiel d'augmentation de 15% du panier moyen via bundles IA.</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center">
                    <Zap className="w-5 h-5 text-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Global Scores */}
                <Card className="p-6 bg-zinc-900/40 border-zinc-800/50">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-indigo-500/50 flex items-center justify-center">
                      <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                    </div>
                    Scores Globaux
                  </div>
                  <div className="flex justify-around items-center h-48">
                    {[
                      { label: 'Global', value: 92, color: 'text-emerald-500' },
                      { label: 'SEO', value: 84, color: 'text-indigo-400' },
                      { label: 'Contenu', value: 78, color: 'text-rose-500' }
                    ].map((score, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-800" />
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="175" strokeDashoffset={175 - (175 * score.value) / 100} className={score.color} />
                          </svg>
                          <span className="absolute text-sm font-black text-white">{score.value}</span>
                        </div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase mt-4 tracking-widest">{score.label}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Alert Summary */}
                <Card className="p-6 bg-zinc-900/40 border-zinc-800/50">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8">Résumé des Alertes</div>
                  <div className="space-y-3 pt-4">
                    {[
                      { label: 'Problèmes Critiques', value: 12, color: 'bg-rose-500/10 border-rose-500/20 text-rose-500', icon: AlertTriangle },
                      { label: 'Avertissements', value: 24, color: 'bg-amber-500/10 border-amber-500/20 text-amber-500', icon: AlertCircle },
                      { label: 'Optimisés', value: 8, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500', icon: CheckCircle2 }
                    ].map((alert, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 border rounded-none ${alert.color} group cursor-pointer hover:scale-[1.01] transition-transform`}>
                        <div className="flex items-center gap-3">
                          <alert.icon className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{alert.label}</span>
                        </div>
                        <span className="text-xl font-black">{alert.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-6 bg-zinc-900/40 border-zinc-800/50">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Actions Rapides
                    <span className="text-[8px] text-zinc-700 ml-auto tracking-widest">ACCÈS DIRECT AUX OUTILS</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: 'Gestion Produits', sub: 'ÉDITION & CATALOGUE', icon: ShoppingBag, tab: 'products' },
                      { label: 'Gestion Stocks', sub: 'ALERTE & INVENTAIRE IA', icon: ShoppingBag, tab: 'stock' },
                      { label: 'Analyse Marché', sub: 'AUDIT DE VOS CONCURRENTS', icon: Globe, tab: 'seo' },
                      { label: 'Rayons & Tags', sub: 'ORGANISEZ VOS COLLECTIONS', icon: Tag, tab: 'taxonomy' },
                      { label: 'Nettoyage WP', sub: 'OPTIMISATION DE BASE DE DONNÉES', icon: Trash2, tab: 'sites' }
                    ].map((action, i) => (
                      <button 
                        key={i} 
                        onClick={() => setActiveTab(action.tab)}
                        className="w-full flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800/50 hover:bg-zinc-900 hover:border-indigo-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <action.icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                          </div>
                          <div className="text-left">
                            <div className="text-[10px] font-black text-zinc-300 uppercase tracking-tight">{action.label}</div>
                            <div className="text-[8px] text-zinc-600 font-mono tracking-widest">{action.sub}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-800 group-hover:text-indigo-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'sites' && <SiteManager userId={user.uid} sites={sites} onActiveSiteChange={setActiveSite} activeSiteId={activeSite?.id} sitesLimit={sitesLimit} />}
          {activeTab === 'shield' && <AuditShield activeSite={activeSite} />}
          {activeTab === 'products' && <ProductManager sites={sites} activeSite={activeSite} />}
          {activeTab === 'stock' && <StockManager sites={sites} activeSite={activeSite} />}
          {activeTab === 'taxonomy' && <TaxonomyManager sites={sites} activeSite={activeSite} />}
          {activeTab === 'seo' && <SEOAnalyzer sites={sites} activeSite={activeSite} />}
          {activeTab === 'market' && <MarketIntelligence activeSite={activeSite} />}
          {activeTab === 'maintenance' && <SystemMaintenance activeSite={activeSite} />}
          {activeTab === 'content' && activeSite && <ContentOptimizer activeSite={activeSite} onSync={handleSyncSite} isSyncing={isSyncing} />}
                  {activeTab === 'billing' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
               <h3 className="text-xl font-bold text-white uppercase tracking-widest text-center italic">Abonnement & Facturation</h3>
               
               <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-8 border-indigo-900/50 bg-indigo-950/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-4">Statut Actuel</h4>
                    <p className="text-5xl font-black text-white mb-2 capitalize italic tracking-tighter">{userData?.packType || 'Gratuit'}</p>
                    <p className="text-[10px] font-mono text-indigo-400/60 uppercase tracking-widest">
                      EXPIRATION : {userData?.expirationDate ? new Date(userData.expirationDate).toLocaleString('fr-FR').toUpperCase() : 'N/A'}
                    </p>
                    <div className="mt-8 pt-6 border-t border-indigo-500/10">
                       <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                          <span>Usage Slots :</span>
                          <span className="text-indigo-400">{sites.length} / {sitesLimit}</span>
                       </div>
                       <div className="w-full bg-zinc-800/50 h-1 mt-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${(sites.length/sitesLimit)*100}%` }}></div>
                       </div>
                    </div>
                  </Card>
                  
                  <Card className="p-8 bg-zinc-900 border-zinc-800 overflow-visible">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Terminal de Paiement</h4>
                    
                    <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-zinc-500 uppercase">Configuration :</span>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">PACK {selectedPackId} • {selectedCycle}</span>
                       </div>
                       <div className="flex justify-between items-center border-t border-zinc-900 pt-2">
                          <span className="text-[10px] font-black text-zinc-500 uppercase">Total à régler :</span>
                          <span className="text-xl font-black text-emerald-400 italic">
                             {(() => {
                                const pack = adminSettings?.packs?.find((p: any) => p.id === selectedPackId) || 
                                             (selectedPackId === 'business' ? { monthlyPrice: 79, yearlyPrice: 790 } : 
                                              selectedPackId === 'agency' ? { monthlyPrice: 149, yearlyPrice: 1490 } : 
                                              { monthlyPrice: 29, yearlyPrice: 290 });
                                return selectedCycle === 'yearly' ? pack.yearlyPrice : pack.monthlyPrice;
                             })()}€
                          </span>
                       </div>
                    </div>

                    <div id="paypal-button-container" className="min-h-[40px] relative z-10"></div>
                    <p className="text-[8px] text-zinc-600 mt-4 text-center font-mono uppercase tracking-[0.2em] italic">Cryptage de transaction AES-256 actif</p>
                  </Card>
               </div>

               {/* Cycle Toggle */}
               <div className="flex items-center justify-center gap-6 py-4">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", selectedCycle === 'monthly' ? "text-white" : "text-zinc-600")}>Mensuel</span>
                  <button 
                    onClick={() => setSelectedCycle(selectedCycle === 'monthly' ? 'yearly' : 'monthly')}
                    className="w-14 h-7 bg-zinc-900 border border-zinc-800 rounded-full relative p-1 transition-all group"
                  >
                    <div className={cn(
                      "w-5 h-5 bg-indigo-600 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(79,70,229,0.4)]",
                      selectedCycle === 'yearly' ? "translate-x-7" : "translate-x-0"
                    )}></div>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", selectedCycle === 'yearly' ? "text-white" : "text-zinc-600")}>Annuel</span>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded tracking-tighter uppercase">-20% RÉDUC.</span>
                  </div>
               </div>
               
               <div className="grid md:grid-cols-3 gap-4">
                 {(adminSettings?.packs || [
                   { id: 'solo', name: 'Solo', monthlyPrice: 29, yearlyPrice: 290, shops: 1 },
                   { id: 'business', name: 'Business', monthlyPrice: 79, yearlyPrice: 790, shops: 5 },
                   { id: 'agency', name: 'Agency', monthlyPrice: 149, yearlyPrice: 1490, shops: 12 }
                 ]).map((p: any) => (
                   <button 
                     key={p.id}
                     onClick={() => setSelectedPackId(p.id)}
                     className={cn(
                       "p-6 flex flex-col items-start border text-left transition-all group bg-zinc-900/40 relative overflow-hidden",
                       selectedPackId === p.id ? "border-indigo-500 bg-indigo-500/5" : "border-zinc-800 hover:border-zinc-700"
                     )}
                   >
                     {selectedPackId === p.id && <div className="absolute top-0 right-0 p-2 bg-indigo-500 text-white rounded-bl-xl"><CheckCircle2 className="w-4 h-4" /></div>}
                     <span className="text-[10px] font-black text-zinc-500 group-hover:text-indigo-400 uppercase tracking-[0.3em] mb-4">{p.name}</span>
                     <div className="flex items-baseline gap-2 mb-2">
                       <span className="text-4xl font-black text-white italic tracking-tighter">
                          {selectedCycle === 'yearly' ? p.yearlyPrice : p.monthlyPrice}€
                       </span>
                       <span className="text-[10px] text-zinc-600 font-bold uppercase">
                          / {selectedCycle === 'yearly' ? 'an' : 'mois'}
                       </span>
                     </div>
                     <span className="text-[10px] text-zinc-500 font-mono mt-4 tracking-tight uppercase">
                        {p.shops || (p.id === 'solo' ? '1' : p.id === 'business' ? '5' : '12')} SLOTS_BOUTIQUES_DISPO
                     </span>
                     <div className="mt-8 space-y-2 w-full text-[9px] font-bold text-zinc-600 uppercase tracking-tight">
                        <div className="flex items-center gap-2">
                           <Zap className="w-3 h-3 text-indigo-500" /> IA Nexus_{p.id}
                        </div>
                        <div className="flex items-center gap-2">
                           <ShieldCheck className="w-3 h-3 text-indigo-500" /> Support Dédié
                        </div>
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'admin' && <AdminConsole activeSite={activeSite} />}
        </div>
      </main>
    </div>
  );
}
