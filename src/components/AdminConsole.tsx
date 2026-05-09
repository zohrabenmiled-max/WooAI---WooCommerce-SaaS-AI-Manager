import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Settings, Save, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Calendar, CreditCard,
  Plus, Edit3, Trash2, Check, X, Shield, BarChart2,
  AlertCircle, ShoppingCart, Trophy
} from 'lucide-react';
import { Button, Card } from './ui';
import { cn } from '../lib/utils';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AdminConsoleProps {
  activeSite?: any;
}

export default function AdminConsole({ activeSite }: AdminConsoleProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [paypalId, setPaypalId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'revenue' | 'packs' | 'config'>('users');
  
  const [packs, setPacks] = useState([
    { id: 'solo', name: 'Solo', monthlyPrice: 29, yearlyPrice: 290, billingCycle: 'monthly', shops: 1, features: ['IA Standard'] },
    { id: 'business', name: 'Business', monthlyPrice: 79, yearlyPrice: 790, billingCycle: 'monthly', shops: 5, features: ['IA Avancée'] },
    { id: 'agency', name: 'Agency', monthlyPrice: 149, yearlyPrice: 1490, billingCycle: 'monthly', shops: 12, features: ['IA Priority'] }
  ]);

  // Mock revenue data
  const revenueStats = {
    daily: [
      { name: 'Lun', amount: 450 },
      { name: 'Mar', amount: 380 },
      { name: 'Mer', amount: 620 },
      { name: 'Jeu', amount: 510 },
      { name: 'Ven', amount: 890 },
      { name: 'Sam', amount: 420 },
      { name: 'Dim', amount: 350 },
    ],
    monthly: [
      { name: 'Jan', amount: 12400 },
      { name: 'Fév', amount: 15600 },
      { name: 'Mar', amount: 13800 },
      { name: 'Avr', amount: 18900 },
      { name: 'Mai', amount: 22450 },
    ],
    yearly: [
      { name: '2023', amount: 145000 },
      { name: '2024', amount: 215000 },
      { name: '2025', amount: 285000 },
    ]
  };

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Load admin config
    const loadConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'admin', 'settings'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          setPaypalId(data.paypalBusinessId || '');
          if (data.packs) setPacks(data.packs);
        }
      } catch (error) {
        console.error("Error loading admin config:", error);
      }
    };
    loadConfig();

    return () => unsubUsers();
  }, []);

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
      alert('Utilisateur mis à jour !');
    } catch (error) {
      console.error('Update failed:', error);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const handleSaveConfig = async () => {
    try {
      setIsLoading(true);
      await setDoc(doc(db, 'admin', 'settings'), {
        paypalBusinessId: paypalId,
        packs: packs,
        updatedAt: new Date().toISOString()
      });
      alert('Configuration enregistrée avec succès !');
    } catch (error) {
      console.error('Error saving config:', error);
      handleFirestoreError(error, OperationType.WRITE, 'admin/settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePackField = (id: string, field: string, value: any) => {
    setPacks(packs.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const toggleBillingCycle = (id: string) => {
    setPacks(packs.map(p => p.id === id ? { ...p, billingCycle: p.billingCycle === 'monthly' ? 'yearly' : 'monthly' } : p));
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {!auth.currentUser?.emailVerified && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
            Attention : Votre compte n'est pas vérifié. Vous ne pourrez pas enregistrer les modifications de configuration (règles de sécurité).
          </p>
        </Card>
      )}
      
      {/* Admin Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Utilisateurs Totaux', value: users.length, icon: Users, color: 'text-indigo-400' },
          { label: 'Revenus (Mois)', value: '22,450 €', icon: DollarSign, color: 'text-emerald-400', trend: '+12%' },
          { label: 'Taux Conversion', value: '3.8%', icon: TrendingUp, color: 'text-amber-400', trend: '+0.4%' },
          { label: 'Serveur Status', value: 'Optimal', icon: Shield, color: 'text-indigo-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-2xl flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              {stat.trend && (
                <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                  {stat.trend} <ArrowUpRight className="w-3 h-3" />
                </span>
              )}
            </div>
            <div>
              <div className="text-3xl font-black text-white italic tracking-tighter">{stat.value}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Control */}
      <div className="flex gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit">
        {[
          { id: 'users', label: 'Utilisateurs', icon: Users },
          { id: 'revenue', label: 'Revenus', icon: BarChart2 },
          { id: 'packs', label: 'Packs & Prix', icon: CreditCard },
          { id: 'config', label: 'Config PayPal', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeSubTab === tab.id 
                ? "bg-zinc-900 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)]" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        
        {/* USERS MANAGEMENT */}
        {activeSubTab === 'users' && (
          <Card className="border-zinc-800 bg-zinc-900/20 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Identité Utilisateur</th>
                  <th className="px-6 py-4">Niveau Pack</th>
                  <th className="px-6 py-4">Date_Exp</th>
                  <th className="px-6 py-4 text-right">Ops Directes</th>
                </tr>
              </thead>
              <tbody className="text-[11px] divide-y divide-zinc-900 font-mono">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-900/50 text-zinc-400 group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-200">{u.email}</span>
                        <span className="text-[8px] text-zinc-600 uppercase tracking-tighter">UID: {u.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                        u.packType === 'agency' ? "bg-indigo-950/40 text-indigo-400 border-indigo-400/20" :
                        u.packType === 'business' ? "bg-emerald-950/40 text-emerald-400 border-emerald-400/20" :
                        "bg-zinc-900 text-zinc-500 border-zinc-800"
                      )}>
                        {u.packType}
                      </span>
                      {u.bonusSites > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 uppercase tracking-tighter">
                          +{u.bonusSites} slots
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{u.expirationDate ? new Date(u.expirationDate).toISOString().split('T')[0] : 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <Button 
                            onClick={() => handleUpdateUser(u.id, { 
                              bonusSites: (u.bonusSites || 0) + 1,
                              hasUnseenReward: true,
                              rewardType: 'slots',
                              rewardMessage: 'Vous venez de recevoir +1 slot boutique offert par l\'administrateur !'
                            })}
                            variant="outline" size="sm" className="text-[9px] h-7 px-2 font-black border-indigo-500/30 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10"
                          >
                             +1 SLOT
                          </Button>
                          <Button 
                            onClick={() => handleUpdateUser(u.id, { bonusSites: Math.max(0, (u.bonusSites || 0) - 1) })}
                            variant="outline" size="sm" className="text-[9px] h-7 px-2 font-black border-zinc-800 text-zinc-600 hover:text-rose-400"
                          >
                             -1 SLOT
                          </Button>
                          <Button 
                            onClick={() => handleUpdateUser(u.id, { 
                              packType: 'solo',
                              hasUnseenReward: true,
                              rewardType: 'upgrade',
                              rewardMessage: 'Votre pack a été mis à jour par l\'administrateur !'
                            })}
                            variant="outline" size="sm" className="text-[9px] h-7 px-2 font-black border-zinc-800"
                          >
                             TO_SOLO
                          </Button>
                          <Button 
                            onClick={() => handleUpdateUser(u.id, { 
                              packType: 'business',
                              hasUnseenReward: true,
                              rewardType: 'upgrade',
                              rewardMessage: 'Votre pack a été mis à jour par l\'administrateur !'
                            })}
                            variant="outline" size="sm" className="text-[9px] h-7 px-2 font-black border-zinc-800"
                          >
                             TO_BIZ
                          </Button>
                          <Button 
                            onClick={() => handleUpdateUser(u.id, { 
                              packType: 'agency',
                              hasUnseenReward: true,
                              rewardType: 'upgrade',
                              rewardMessage: 'Votre pack a été mis à jour par l\'administrateur ! Félicitations !'
                            })}
                            variant="outline" size="sm" className="text-[9px] h-7 px-2 font-black border-zinc-800"
                          >
                             TO_AGENCY
                          </Button>
                       </div>
                    </td>
                 </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* REVENUE ANALYSIS */}
        {activeSubTab === 'revenue' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="p-8 bg-zinc-900/40 border-zinc-800/50">
                <div className="flex items-center justify-between mb-8">
                   <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                     <TrendingUp className="w-4 h-4 text-emerald-500" /> Courbe des revenus mensuels
                   </h4>
                   <div className="flex gap-2">
                     <Button variant="outline" size="sm" className="text-[9px] uppercase tracking-widest p-1 px-3">2025</Button>
                     <Button variant="outline" size="sm" className="text-[9px] uppercase tracking-widest p-1 px-3 opacity-50">2024</Button>
                   </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueStats.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} tickFormatter={(value) => `${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px'}}
                        itemStyle={{color: '#fff', fontWeight: 'bold'}}
                        cursor={{fill: '#18181b', opacity: 0.4}}
                      />
                      <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-8 bg-zinc-900/40 border-zinc-800/50">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-8">Rapport de performance journalier</h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueStats.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px'}}
                        itemStyle={{color: '#fff', fontWeight: 'bold'}}
                      />
                      <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{fill: '#10b981', r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
               <Card className="p-6 bg-zinc-950 border-zinc-800">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Résumé par Période</h4>
                  <div className="space-y-4">
                     {[
                       { label: 'Aujourd\'hui', value: '450 €', trend: '+5%' },
                       { label: 'Ce Mois', value: '22,450 €', trend: '+12%' },
                       { label: 'Cette Année', value: '284,900 €', trend: '+28%' }
                     ].map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{p.label}</p>
                            <p className="text-xl font-black text-white italic">{p.value}</p>
                          </div>
                          <span className="text-[9px] font-black text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded-lg">{p.trend}</span>
                        </div>
                     ))}
                  </div>
               </Card>

               <Card className="p-6 bg-indigo-600 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                  <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-6 relative z-10">Estimation Projection Q3</h4>
                  <div className="relative z-10">
                    <p className="text-4xl font-black text-white tracking-tighter italic mb-2">345,000 €</p>
                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest max-w-[150px]">Objectif de croissance annuel basé sur l'IA</p>
                  </div>
               </Card>
            </div>
          </div>
        )}

        {/* PACKS & PRICING MANAGEMENT */}
        {activeSubTab === 'packs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Configuration des Offres Commerciales</h4>
              <Button 
                onClick={handleSaveConfig}
                className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest h-10 px-6 gap-2"
              >
                <Save className="w-3.5 h-3.5" /> Enregistrer les prix
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
               {packs.map((pack) => (
                 <Card key={pack.id} className="p-8 bg-zinc-900 border-zinc-800 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-indigo-500 transition-all"></div>
                    
                    <div className="flex justify-between items-start mb-8">
                       <div className="flex-1 mr-4">
                         <input 
                           type="text" 
                           value={pack.name}
                           onChange={(e) => updatePackField(pack.id, 'name', e.target.value)}
                           className="text-2xl font-black text-white italic uppercase tracking-tighter bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 outline-none w-full"
                         />
                         <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Identifiant: {pack.id}</p>
                       </div>
                       <button 
                         onClick={() => toggleBillingCycle(pack.id)}
                         className={cn(
                           "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all shrink-0",
                           pack.billingCycle === 'monthly' ? "bg-zinc-950 text-indigo-400 border-indigo-400/30" : "bg-indigo-600 text-white border-indigo-500"
                         )}
                       >
                         {pack.billingCycle === 'monthly' ? 'Moteur: Mensuel' : 'Moteur: Annuel'}
                       </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-3">Prix Mensuel (€)</label>
                          <div className="relative">
                             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                             <input 
                               type="number" 
                               value={pack.monthlyPrice}
                               onChange={(e) => updatePackField(pack.id, 'monthlyPrice', parseFloat(e.target.value))}
                               className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 text-lg font-black text-white italic focus:border-indigo-500/50 outline-none transition-all"
                             />
                          </div>
                       </div>

                       <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-3">Prix Annuel (€)</label>
                          <div className="relative">
                             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                             <input 
                               type="number" 
                               value={pack.yearlyPrice}
                               onChange={(e) => updatePackField(pack.id, 'yearlyPrice', parseFloat(e.target.value))}
                               className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 text-lg font-black text-white italic focus:border-indigo-500/50 outline-none transition-all"
                             />
                          </div>
                       </div>
                    </div>

                    <div>
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-3">Nombre de Boutiques (Slots)</label>
                       <div className="relative">
                          <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                          <input 
                            type="number" 
                            value={pack.shops || 0}
                            onChange={(e) => updatePackField(pack.id, 'shops', parseInt(e.target.value))}
                            className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                          />
                       </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-zinc-800 space-y-3">
                       {pack.features.map((f, i) => (
                         <div key={i} className="flex items-center gap-2">
                           <Check className="w-3 h-3 text-emerald-500" />
                           <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{f}</span>
                         </div>
                       ))}
                    </div>
                 </Card>
               ))}
            </div>
          </div>
        )}

        {/* PAYPAL CONFIGURATION */}
        {activeSubTab === 'config' && (
          <div className="max-w-2xl mx-auto py-12">
             <Card className="p-10 bg-zinc-900 border-zinc-800 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                
                <div className="flex items-center gap-4 mb-10 relative z-10">
                   <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      <Settings className="w-8 h-8 text-white" />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">Passerelle PayPal</h4>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Configuration des paiements business</p>
                   </div>
                </div>

                <div className="space-y-8 relative z-10">
                   <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-4">PayPal Business ID (Client ID)</label>
                      <div className="relative group">
                         <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                         <input 
                           type="text" 
                           value={paypalId}
                           onChange={(e) => setPaypalId(e.target.value)}
                           placeholder="Entrez votre Client ID PayPal..."
                           className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-2xl pl-14 pr-6 text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-800"
                         />
                      </div>
                      <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest mt-4 flex items-center gap-2">
                        <ArrowDownRight className="w-3 h-3" /> Utilisé pour générer les boutons de paiement dynamique sur le front-end
                      </p>
                   </div>

                   <Button 
                     onClick={handleSaveConfig}
                     className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-xs font-black uppercase tracking-widest mt-4 rounded-2xl shadow-lg shadow-indigo-600/10"
                   >
                     Mettre à jour la configuration sécurisée
                   </Button>
                </div>
             </Card>

             <Card className="mt-8 p-6 bg-amber-500/5 border-amber-500/20">
                <div className="flex gap-4">
                   <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                   <div>
                      <h5 className="text-[11px] font-black text-amber-500 uppercase tracking-wider mb-2">Note de sécurité importante</h5>
                      <p className="text-[10px] text-amber-500/70 leading-relaxed uppercase font-bold">
                        L'identifiant PayPal configuré ici est public mais crucial pour le routing des fonds. Assurez-vous d'utiliser un compte PayPal Business vérifié pour éviter les blocages de transactions.
                      </p>
                   </div>
                </div>
             </Card>
          </div>
        )}

      </div>
    </div>
  );
}
