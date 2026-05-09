import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Star, Sparkles } from 'lucide-react';
import { Button } from './ui';
import { cn } from '../lib/utils';

interface RewardBannerProps {
  message: string;
  type: 'gift' | 'upgrade' | 'slots';
  onClose: () => void;
}

export default function RewardBanner({ message, type, onClose }: RewardBannerProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg"
      >
        <div className="relative overflow-hidden bg-zinc-900 border-2 border-indigo-500 rounded-3xl p-6 shadow-[0_20px_50px_rgba(99,102,241,0.3)]">
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl"
          />

          <div className="relative flex items-center gap-6">
            <div className="shrink-0 relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-12 border border-white/20"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
              <div className="absolute -top-2 -right-2">
                <motion.div
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400" />
                </motion.div>
              </div>
            </div>

            <div className="grow space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] italic">Recompense Premium</span>
                <div className="h-px grow bg-indigo-500/30" />
              </div>
              <h3 className="text-xl font-black text-white italic leading-tight tracking-tighter uppercase">
                {type === 'upgrade' ? 'Evolution de Compte' : type === 'slots' ? 'Extension de Capacité' : 'Cadeau Spécial'}
              </h3>
              <p className="text-xs text-zinc-400 font-bold leading-relaxed">{message}</p>
              
              <div className="pt-2">
                <Button 
                  onClick={onClose}
                  className="bg-white text-black hover:bg-zinc-200 text-[10px] font-black uppercase tracking-widest h-9 px-6 rounded-xl shadow-lg"
                >
                  MERCI ! PROFITER MAINTENANT
                </Button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-0 right-0 p-1 text-zinc-600 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Particle Effects */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ 
                x: (Math.random() - 0.5) * 200, 
                y: (Math.random() - 0.5) * 200, 
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="absolute top-1/2 left-1/2"
            >
              <Star className="w-2 h-2 text-indigo-400 fill-indigo-400" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
