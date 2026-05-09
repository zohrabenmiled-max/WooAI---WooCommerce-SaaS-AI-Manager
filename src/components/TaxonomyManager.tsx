import React, { useState, useEffect } from 'react';
import { 
  Layers, Tag, Search, Plus, Trash2, Edit3, 
  Loader2, X, Check, AlertTriangle, ExternalLink, Sparkles, Wand2,
  BrainCircuit, ArrowUpRight, Target
} from 'lucide-react';
import { Button, Input, Card } from './ui';
import { cn } from '../lib/utils';
import { 
  fetchCategories, fetchTags, deleteCategory, deleteTag, 
  updateCategory, updateTag, createCategory, createTag, WooCredentials 
} from '../services/wooService';
import { decrypt } from '../lib/crypto';
import { GoogleGenAI } from "@google/genai";

interface TaxonomyManagerProps {
  sites: any[];
  activeSite: any;
}

export default function TaxonomyManager({ sites, activeSite }: TaxonomyManagerProps) {
  const [items, setItems] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: 0
  });
  const [allCategories, setAllCategories] = useState<any[]>([]); // For parent selection
  const [saving, setSaving] = useState(false);
  const [optimizingName, setOptimizingName] = useState(false);
  const [optimizingDesc, setOptimizingDesc] = useState(false);
  const [isNexusModalOpen, setIsNexusModalOpen] = useState(false);
  const [nexusLoading, setNexusLoading] = useState(false);
  const [nexusRecs, setNexusRecs] = useState<any[]>([]);

  const loadNexusIntelligence = async () => {
    if (!activeSite.geminiApiKeyEnc) {
      alert("Clé API Gemini requise.");
      return;
    }
    setIsNexusModalOpen(true);
    setNexusLoading(true);
    try {
      const apiKey = decrypt(activeSite.geminiApiKeyEnc);
      const ai = new GoogleGenAI({ apiKey });
      const existingNames = items.slice(0, 30).map(i => i.name).join(', ');
      const prompt = `Based on these WooCommerce ${activeTab} names: "${existingNames}". 
      Generate 4 strategic recommendations for this store. 
      Format: JSON array of objects with { 
        type: "suggestion" | "optimization", 
        title: string, 
        reason: string, 
        suggestion: string,
        affectedItem?: string // Name of the existing category/tag it affects (REQUIRED for optimization)
      }.
      Type "suggestion" means a new category/tag to create.
      Type "optimization" means an improvement for an existing one.
      Keep it professional, high-end, and focused on growth. Return only JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text?.trim() || '[]';
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const recs = JSON.parse(jsonStr);
      setNexusRecs(recs);
    } catch (error) {
      console.error('Nexus Intelligence error:', error);
    } finally {
      setNexusLoading(false);
    }
  };

  const applyNexusSuggestion = (rec: any) => {
    if (rec.type === 'suggestion') {
      setEditingItem(null);
      setFormData({
        name: rec.title,
        description: rec.suggestion,
        parent: 0
      });
      setIsNexusModalOpen(false);
      setIsModalOpen(true);
    } else if (rec.type === 'optimization' && rec.affectedItem) {
      // Find the item it's talking about
      const item = items.find(i => 
        i.name.toLowerCase() === rec.affectedItem.toLowerCase() || 
        i.slug.toLowerCase() === rec.affectedItem.toLowerCase() ||
        rec.title.toLowerCase().includes(i.name.toLowerCase())
      );

      if (item) {
        setEditingItem(item);
        setFormData({
          name: item.name,
          description: rec.suggestion, // Inject the AI's optimization into the description
          parent: item.parent || 0
        });
        setIsNexusModalOpen(false);
        setIsModalOpen(true);
      } else {
        // If not found, fallback to search but use affectedItem instead of the long title
        setSearch(rec.affectedItem);
        setIsNexusModalOpen(false);
      }
    } else {
      // General fallback
      setSearch(rec.title);
      setIsNexusModalOpen(false);
    }
  };

  const optimizeWithAI = async (field: 'name' | 'description') => {
    if (!activeSite.geminiApiKeyEnc) {
      alert("Clé API Gemini requise.");
      return;
    }
    if (!formData.name && field === 'description') return;
    
    if (field === 'name') setOptimizingName(true);
    else setOptimizingDesc(true);

    try {
      const apiKey = decrypt(activeSite.geminiApiKeyEnc);
      const ai = new GoogleGenAI({ apiKey });
      const prompt = field === 'name' 
        ? `Improve this WooCommerce ${activeTab.slice(0, -1)} name to be more professional and catchy: "${formData.name}". Return only the improved name.`
        : `Generate a compelling, short SEO description (max 2 sentences) for a WooCommerce ${activeTab.slice(0, -1)} named "${formData.name}". Use the following info if available: "${formData.description}". Return only the description text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const result = response.text?.trim() || '';
      if (result) {
        setFormData(prev => ({ ...prev, [field]: result }));
      }
    } catch (error) {
      console.error('AI Optimization error:', error);
    } finally {
      if (field === 'name') setOptimizingName(false);
      else setOptimizingDesc(false);
    }
  };

  useEffect(() => {
    if (activeSite) {
      loadData();
    }
  }, [activeSite, activeTab]);

  const getDecryptedCreds = (): WooCredentials | null => {
    if (!activeSite) return null;
    return {
      url: activeSite.url.endsWith('/') ? activeSite.url.slice(0, -1) : activeSite.url,
      consumerKey: activeSite.consumerKeyEnc ? decrypt(activeSite.consumerKeyEnc) : '',
      consumerSecret: activeSite.consumerSecretEnc ? decrypt(activeSite.consumerSecretEnc) : ''
    };
  };

  const loadData = async () => {
    const creds = getDecryptedCreds();
    if (!creds) return;

    setLoading(true);
    try {
      if (activeTab === 'categories') {
        const data = await fetchCategories(creds);
        setItems(data);
        setAllCategories(data);
      } else {
        const data = await fetchTags(creds);
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading taxonomies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    const creds = getDecryptedCreds();
    if (!creds) return;

    try {
      if (activeTab === 'categories') {
        await deleteCategory(creds, id);
      } else {
        await deleteTag(creds, id);
      }
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting taxonomy:', error);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      parent: item.parent || 0
    });
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      parent: 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const creds = getDecryptedCreds();
    if (!creds) return;

    setSaving(true);
    try {
      if (editingItem) {
        if (activeTab === 'categories') {
          await updateCategory(creds, editingItem.id, formData);
        } else {
          // Tags don't have parent
          const { parent, ...tagData } = formData;
          await updateTag(creds, editingItem.id, tagData);
        }
      } else {
        if (activeTab === 'categories') {
          await createCategory(creds, formData);
        } else {
          const { parent, ...tagData } = formData;
          await createTag(creds, tagData);
        }
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving taxonomy:', error);
      alert('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (!activeSite) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24">
        <Layers className="w-16 h-16 text-zinc-900 mb-6" />
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Boutique non identifiée</h3>
        <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mt-2 max-w-xs text-center leading-relaxed">
          ACTIVEZ UN NŒUD DANS LE GESTIONNAIRE DE SITES POUR ACCÉDER AUX TAXONOMIES.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Gestion des Taxonomies</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
              {items.length} {activeTab === 'categories' ? 'Catégories' : 'Tags'} Synchronisés
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={loadNexusIntelligence}
            className="flex items-center bg-indigo-950/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest gap-2 rounded-none px-4 py-2 text-indigo-400 hover:bg-indigo-500/20 transition-all group"
          >
            <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" /> Nexus Intelligence
          </button>
          <Button 
            onClick={handleCreateNew}
            className="bg-white text-black hover:bg-zinc-200 text-[9px] font-black uppercase tracking-widest gap-2 rounded-none px-6 h-10"
          >
            <Plus className="w-4 h-4" /> Nouvel Élément
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-zinc-900 pb-6">
        <div className="flex p-1 bg-zinc-900/50 rounded-none border border-zinc-800">
          <button 
            onClick={() => setActiveTab('categories')}
            className={cn(
              "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'categories' ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Catégories
          </button>
          <button 
            onClick={() => setActiveTab('tags')}
            className={cn(
              "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'tags' ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Tags
          </button>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
          <Input 
            placeholder="Chercher par nom ou slug..." 
            className="pl-10 bg-zinc-900/20 border-zinc-800 rounded-none text-xs font-mono placeholder:text-zinc-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
          <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.4em] italic animate-pulse">Extraction de la structure des données...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="bg-zinc-900/30 border-zinc-800/40 p-5 group hover:border-indigo-500/30 transition-all rounded-none relative flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="text-zinc-800 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">{item.name}</h4>
                <div className="text-[9px] font-mono text-zinc-600 mt-1">/{item.slug}</div>
              </div>

              <div className="mt-6 flex justify-between items-end border-t border-zinc-800/50 pt-4">
                <div>
                   <div className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Produits</div>
                   <div className="text-xl font-black text-indigo-500">{item.count || 0}</div>
                </div>
                <button 
                  onClick={() => handleEdit(item)}
                  className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all shadow-inner"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Top accent line */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent group-hover:via-indigo-500/50 transition-all"></div>
            </Card>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 border border-dashed border-zinc-900 flex flex-col items-center justify-center">
               <AlertTriangle className="w-8 h-8 text-zinc-800 mb-4" />
               <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Aucun résultat trouvé pour votre requête</p>
            </div>
          )}
        </div>
      )}

      {/* Nexus Intelligence Modal */}
      {isNexusModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl relative shadow-[0_0_150px_rgba(79,70,229,0.2)] overflow-hidden rounded-3xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"></div>
            
            <div className="p-10 border-b border-zinc-900 flex justify-between items-start">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                   <Sparkles className="w-8 h-8 animate-pulse" />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Nexus Intelligence</h3>
                   <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                     <BrainCircuit className="w-3 h-3" /> Analyse Structurelle IA Active
                   </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsNexusModalOpen(false)}
                className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all transform hover:rotate-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {nexusLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                    <BrainCircuit className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
                  </div>
                  <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.5em] italic mt-8 animate-pulse">Décodage des patterns de croissance...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nexusRecs.map((rec, i) => (
                    <div 
                      key={i}
                      className="group bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden"
                      onClick={() => applyNexusSuggestion(rec)}
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                              rec.type === 'suggestion' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            )}>
                              {rec.type === 'suggestion' ? 'Nouveauté Stratégique' : 'Optimisation SEO'}
                            </span>
                          </div>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight">{rec.title}</h4>
                          <p className="text-zinc-500 text-xs mt-2 font-medium leading-relaxed">{rec.reason}</p>
                          <div className="mt-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800 italic text-[11px] text-indigo-400 font-mono">
                            "{rec.suggestion}"
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-700 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 h-1 w-0 bg-indigo-500 group-hover:w-full transition-all duration-700"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-10 pt-4 bg-zinc-950/50 border-t border-zinc-900 flex justify-between items-center">
              <div className="flex items-center gap-2 text-zinc-600">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">IA Formée sur le Marché WooCommerce</span>
              </div>
              <Button 
                onClick={() => setIsNexusModalOpen(false)}
                className="rounded-xl h-12 px-8 text-[11px] font-black uppercase tracking-[0.2em] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all shadow-lg"
              >
                Fermer l'Analyse
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg relative shadow-[0_0_100px_rgba(30,30,30,0.5)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-600"></div>
            
            <div className="p-8 border-b border-zinc-900 flex justify-between items-start bg-zinc-950">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                   <Edit3 className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-white tracking-widest uppercase italic">
                     {editingItem ? 'Modifier Nexus' : 'Créer Nexus'}
                   </h3>
                   <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                     {editingItem ? `ID: ${editingItem.id} | ${activeTab.slice(0, -1).toUpperCase()}` : `TRANSFERT_INITIÉ | ${activeTab.slice(0, -1).toUpperCase()}`}
                   </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-8 bg-zinc-950">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Nom de l'élément</label>
                  <button 
                    type="button"
                    onClick={() => optimizeWithAI('name')}
                    disabled={optimizingName || !formData.name}
                    className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    {optimizingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    Optimiser
                  </button>
                </div>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Beauté et santé"
                  className="bg-indigo-950/20 border-indigo-500/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl h-14 font-bold text-zinc-100 px-6 text-sm"
                  required
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Description (Optionnel)</label>
                  <button 
                    type="button"
                    onClick={() => optimizeWithAI('description')}
                    disabled={optimizingDesc || !formData.name}
                    className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    {optimizingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Générer
                  </button>
                </div>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[140px] bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-6 font-medium text-xs text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all resize-none leading-relaxed"
                  placeholder="Décrivez l'impact de cette taxonomie sur l'écosystème commercial..."
                />
              </div>

              {activeTab === 'categories' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Catégorie Parente</label>
                  <div className="relative">
                    <select 
                      value={formData.parent}
                      onChange={e => setFormData({ ...formData, parent: parseInt(e.target.value) })}
                      className="w-full h-14 bg-indigo-950/20 border border-indigo-500/30 rounded-xl px-6 font-bold text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all appearance-none cursor-pointer text-sm"
                    >
                      <option value={0}>Aucune (Parent Principal)</option>
                      {allCategories.filter(c => c.id !== editingItem?.id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-8 flex gap-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl h-14 text-[11px] font-black uppercase tracking-[0.2em] border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-white transition-all shadow-lg"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={saving}
                  className="flex-[2] rounded-2xl h-14 text-[11px] font-black uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-500 text-white gap-3 shadow-[0_10px_30px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {editingItem ? 'Enregistrer les Modifications' : 'Créer l\'Élément Nexus'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
