import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrashanBaanMiniLogo } from './PrashanBaanLogo';
import { Sounds } from '../hooks/useSound';
import { useGameStore } from '../store/gameStore';

export default function RoundStartScreen({ round, roomState }) {
  const [phase, setPhase] = useState('announce'); // announce → countdown → go
  const [count, setCount] = useState(3);
  const isMuted = useGameStore(s => s.isMuted);

  useEffect(() => {
    if (!isMuted) Sounds.roundStart();
    const t1 = setTimeout(() => { setPhase('countdown'); }, 2200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (!isMuted) Sounds.countdown();
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(interval); setPhase('go'); return 0; }
        return c - 1;
      });
    }, 900);
    return () => clearInterval(interval);
  }, [phase]);

  const isBlitz = round?.type === 'BLITZ';

  return (
    <div className="fixed inset-0 grid-bg flex flex-col items-center justify-center overflow-hidden">
      <div className="scanlines" />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full animate-ping-slow"
          style={{ background: `radial-gradient(circle, ${isBlitz ? 'rgba(255,0,110,0.08)' : 'rgba(0,245,255,0.08)'} 0%, transparent 70%)` }} />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'announce' && (
          <motion.div key="announce" className="text-center z-10"
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}>
            <PrashanBaanMiniLogo />
            <div className="mt-10 mb-4 font-body text-xs tracking-[0.6em] text-white/30 uppercase">
              Initiating
            </div>
            <div className={`font-display text-7xl md:text-9xl tracking-widest ${isBlitz ? 'neon-text-pink' : 'neon-text-cyan'}`}
              style={{ lineHeight: 1 }}>
              {round?.name || `ROUND ${round?.roundNumber}`}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className={`px-6 py-2 border font-display text-2xl tracking-widest ${isBlitz ? 'border-neon-pink text-neon-pink' : 'border-neon-cyan neon-text-cyan'}`}
                style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100%-8px) 100%, 0% 100%)' }}>
                {isBlitz ? '⚡ BUZZER BLITZ' : '◉ SEQUENTIAL'}
              </div>
              <div className="px-4 py-2 border border-neon-yellow/30 font-body text-xs text-neon-yellow tracking-widest">
                {round?.questionCount} QUESTIONS · {round?.timerSeconds}s EACH
              </div>
            </div>
            {round?.roundNumber > 1 && (
              <div className="mt-4 font-body text-xs text-white/20 tracking-widest">
                Round {round.roundNumber} of {roomState?.rounds?.length}
              </div>
            )}
          </motion.div>
        )}

        {phase === 'countdown' && count > 0 && (
          <motion.div key={`count-${count}`} className="z-10 text-center"
            initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.35 }}>
            <div className="font-display neon-text-cyan"
              style={{ fontSize: '22rem', lineHeight: 1,
                textShadow: '0 0 60px rgba(0,245,255,0.9), 0 0 120px rgba(0,245,255,0.4)' }}>
              {count}
            </div>
          </motion.div>
        )}

        {phase === 'go' && (
          <motion.div key="go" className="z-10 text-center"
            initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <div className="font-display neon-text-green"
              style={{ fontSize: '16rem', lineHeight: 1,
                textShadow: '0 0 60px rgba(57,255,20,0.9), 0 0 120px rgba(57,255,20,0.4)' }}>
              GO!
            </div>
            <div className="font-body text-sm text-white/30 tracking-[0.5em] uppercase mt-4 animate-pulse">
              The Arrow of Knowledge is Released!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
