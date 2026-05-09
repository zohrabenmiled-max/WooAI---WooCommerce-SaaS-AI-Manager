import React, { useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Zap, Mail, Chrome, ArrowLeft, Loader2 } from 'lucide-react';
import { Button, Input, Card } from './ui';

export default function Auth({ onBack }: { onBack: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-sm">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-indigo-400 mb-8 transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft className="w-3 h-3" />
          Retour au portail d'accès
        </button>

        <Card className="p-8 bg-zinc-900 border border-zinc-800 rounded-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center mb-4 text-white font-black text-xl">W</div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{isLogin ? 'Authentification Requise' : 'Initialiser Compte'}</h2>
            <p className="text-zinc-500 text-[10px] mt-2 uppercase font-mono tracking-widest leading-relaxed">
              Établissement d'une liaison chiffrée sécurisée vers le Nœud WooAI_v2.4
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-10 gap-3 font-bold text-[10px] uppercase tracking-widest border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 rounded-none"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <Chrome className="w-4 h-4 text-indigo-400" />
              SSO Direct via Google
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.2em]">
                <span className="bg-zinc-900 px-3 text-zinc-600">Entrée Manuelle</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Identité Email</label>
                <Input 
                  type="email" 
                  placeholder="UTILISATEUR@RESEAU.COM" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-[11px] font-mono h-10 rounded-none uppercase placeholder:text-zinc-700"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Clé d'Accès</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-[11px] font-mono h-10 rounded-none uppercase placeholder:text-zinc-700"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-[9px] font-mono mt-2 uppercase tracking-tight">{error}</p>}

              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button type="submit" className="h-12 text-[10px] font-black uppercase tracking-[0.3em] rounded-none shadow-[0_0_20px_rgba(79,70,229,0.2)]" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'Initier' : 'Déployer')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12 text-[10px] font-black uppercase tracking-[0.3em] rounded-none border-zinc-800 text-zinc-500 hover:text-white"
                  onClick={() => {
                    setEmail('demo@wooai.io');
                    setPassword('demo1234');
                  }}
                >
                  Mode Démo
                </Button>
              </div>
            </form>

            <div className="text-center text-[10px] text-zinc-600 mt-8 font-bold uppercase tracking-widest leading-relaxed">
              {isLogin ? "Pas d'identité détectée ?" : "Compte déjà existant ?"}{" "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-400 hover:text-indigo-300 ml-1 underline underline-offset-4 decoration-indigo-400/30 transition-colors"
              >
                {isLogin ? "Générer ID" : "Sync Existant"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
