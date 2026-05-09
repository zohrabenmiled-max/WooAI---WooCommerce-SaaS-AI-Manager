import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { Globe, Plus, Trash2, Key, Loader2, ExternalLink, HelpCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { Button, Input, Card } from './ui';
import { encrypt } from '../lib/crypto';
import { cn } from '../lib/utils';
import CryptoJS from 'crypto-js';

export default function SiteManager({ userId, sites, onActiveSiteChange, activeSiteId, sitesLimit }: { 
  userId: string; 
  sites: any[]; 
  onActiveSiteChange: (site: any) => void;
  activeSiteId?: string;
  sitesLimit: number;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const limitReached = sites.length >= sitesLimit;

  const [formData, setFormData] = useState({
    url: '',
    consumerKey: '',
    consumerSecret: '',
    geminiApiKey: '',
    niche: '',
    country: 'FR'
  });

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limitReached) {
      alert("Limite de boutiques atteinte pour votre pack actuel. Veuillez passer au pack supérieur.");
      return;
    }
    setLoading(true);
    
    // Normalisation de l'URL pour la vérification d'unicité
    const normalizedUrl = formData.url.toLowerCase().replace(/\/+$/, '').trim();
    const urlHash = CryptoJS.SHA256(normalizedUrl).toString();

    try {
      // 1. Vérification d'existence globale
      const registryRef = doc(db, 'registered_sites', urlHash);
      const registrySnap = await getDoc(registryRef);

      if (registrySnap.exists()) {
        alert("ALERTE SÉCURITÉ : Ce site est déjà enregistré dans le système par un autre utilisateur. Un site ne peut posséder qu'une seule instance active dans WooAI.");
        setLoading(false);
        return;
      }

      // 2. Création atomique (ou séquentielle sécurisée)
      const batch = writeBatch(db);
      
      const siteRef = doc(collection(db, 'sites'));
      batch.set(siteRef, {
        userId,
        url: normalizedUrl, // Utiliser l'URL normalisée
        consumerKeyEnc: encrypt(formData.consumerKey),
        consumerSecretEnc: encrypt(formData.consumerSecret),
        geminiApiKeyEnc: formData.geminiApiKey ? encrypt(formData.geminiApiKey) : '',
        niche: formData.niche,
        country: formData.country,
        urlHash, // Optionnel mais utile pour le debug
        createdAt: new Date().toISOString()
      });

      batch.set(registryRef, {
        url: normalizedUrl,
        ownerId: userId,
        siteId: siteRef.id,
        createdAt: new Date().toISOString()
      });

      await batch.commit();

      setIsAdding(false);
      setFormData({ url: '', consumerKey: '', consumerSecret: '', geminiApiKey: '', niche: '', country: 'FR' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sites');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (site: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir déconnecter le site ${site.url} ? cette action libérera l'URL pour d'autres utilisateurs.`)) return;
    try {
      const batch = writeBatch(db);
      
      // Supprimer le site
      batch.delete(doc(db, 'sites', site.id));
      
      // Supprimer du registre global si on a le hash
      const normalizedUrl = site.url.toLowerCase().replace(/\/+$/, '').trim();
      const urlHash = CryptoJS.SHA256(normalizedUrl).toString();
      batch.delete(doc(db, 'registered_sites', urlHash));

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sites/${site.id}`);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Gestion des Nœuds</h3>
          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mt-1">
            Configurez vos connecteurs API WooCommerce sécurisés • {sites.length}/{sitesLimit} SLOTS UTILISÉS
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2 text-[10px] h-9 px-4 uppercase font-black tracking-widest rounded-none">
          <Plus className="w-3 h-3" /> Connecter Nouveau Site
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6 border-indigo-900/40 bg-zinc-900/40 rounded-none animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
          <form onSubmit={handleAddSite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Identité URL du Site</label>
              <Input 
                placeholder="HTTPS://LABOUTIQUE.COM" 
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                className="bg-zinc-950 border-zinc-800 rounded-none h-10 font-mono text-[11px] uppercase placeholder:text-zinc-800"
                required
              />
            </div>
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Niche de Marché</label>
              <Input 
                placeholder="CUISINE, MODE, TECH..." 
                value={formData.niche}
                onChange={e => setFormData({...formData, niche: e.target.value})}
                className="bg-zinc-950 border-zinc-800 rounded-none h-10 font-mono text-[11px] uppercase placeholder:text-zinc-800"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Clé Client [PUBLIQUE]</label>
                <a 
                  href="https://woocommerce.com/document/woocommerce-rest-api/#section-3" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1 text-[8px] font-black uppercase group"
                  title="Comment générer vos clés WooCommerce ?"
                >
                  <HelpCircle className="w-2.5 h-2.5" /> Guide API
                </a>
              </div>
              <Input 
                placeholder="CK_..." 
                value={formData.consumerKey}
                onChange={e => setFormData({...formData, consumerKey: e.target.value})}
                className="bg-zinc-950 border-zinc-800 rounded-none h-10 font-mono text-[11px] uppercase placeholder:text-zinc-800"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Secret Client [RESTREINT]</label>
                <span className="text-[8px] text-zinc-700 italic font-mono uppercase">Standard AES-256</span>
              </div>
              <Input 
                type="password"
                placeholder="••••••••" 
                value={formData.consumerSecret}
                onChange={e => setFormData({...formData, consumerSecret: e.target.value})}
                className="bg-zinc-950 border-zinc-800 rounded-none h-10 font-mono text-[11px] placeholder:text-zinc-800"
                required
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest text-indigo-400">Clé API Google Gemini (Quota Personnel)</label>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-amber-500 hover:text-amber-400 transition-all flex items-center gap-1 text-[8px] font-black uppercase group"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" /> Obtenir une clé gratuite
                </a>
              </div>
              <Input 
                placeholder="AIzaSy..." 
                value={formData.geminiApiKey}
                onChange={e => setFormData({...formData, geminiApiKey: e.target.value})}
                className="bg-zinc-950 border-indigo-500/20 rounded-none h-10 font-mono text-[11px] uppercase placeholder:text-zinc-800"
                required
              />
              <p className="text-[8px] text-zinc-600 italic">Obligatoire pour utiliser les fonctions IA de WooAI Shield et Product Management.</p>
            </div>
            <div className="flex gap-2 col-span-2 mt-6 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="text-[10px] uppercase font-bold tracking-widest">Annuler</Button>
              <Button type="submit" disabled={loading} className="text-[10px] uppercase font-black tracking-widest px-8 rounded-none h-10">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Exécuter la Connexion'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sites.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center border border-dashed border-zinc-800">
            <Globe className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Aucune connexion de nœud détectée dans le_coffre_sécurisé</p>
          </div>
        )}
        {sites.map(site => {
          const isActive = site.id === activeSiteId;
          return (
            <Card key={site.id} className={cn(
              "p-4 flex items-center justify-between group bg-zinc-900/20 border-zinc-800 hover:border-indigo-500/30 transition-all rounded-none relative",
              isActive && "border-indigo-500/50 bg-indigo-500/5"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center font-black text-lg p-0",
                  isActive ? "text-indigo-400 border-indigo-500/30" : "text-zinc-600"
                )}>
                  {site.url.replace('https://', '').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-white text-[11px] uppercase tracking-tight">{site.name || site.url.replace('https://', '')}</h4>
                    <a href={site.url} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-indigo-400 transition-colors">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {isActive && (
                      <span className="text-[7px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest ml-2">ACTIF</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 font-mono">
                    <span className="text-[8px] border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase font-bold">{site.niche || 'N/A'}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[8px] text-emerald-500 font-black uppercase">CONNECTÉ</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isActive && (
                  <Button 
                    onClick={() => onActiveSiteChange(site)}
                    className="h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-zinc-800 hover:bg-indigo-600 text-white transition-all"
                  >
                    Activer
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-zinc-600 hover:text-red-400 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-all p-0 w-8 h-8"
                  onClick={() => handleDelete(site)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
