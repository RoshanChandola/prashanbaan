import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrashanBaanMiniLogo } from './PrashanBaanLogo';
import { Sounds } from '../hooks/useSound';
import { useGameStore } from '../store/gameStore';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RoundEndScreen({ data, roomState, isHost }) {
  const isMuted = useGameStore(s => s.isMuted);
  const [revealed, setRevealed] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(6);

  const players = data?.leaderboard || [];
  const isBlitz = roomState?.rounds?.[data?.roundIndex]?.type === 'BLITZ';
  const totalRounds = roomState?.rounds?.length || 1;
  const isLastRound = (data?.roundIndex ?? 0) >= totalRounds - 1;
  const accentColor = isBlitz ? 'neon-text-pink' : 'neon-text-cyan';
  const borderColor = isBlitz ? 'rgba(255,0,110,0.4)' : 'rgba(0,245,255,0.4)';
  const glowColor = isBlitz ? '#ff006e' : '#00f5ff';

  useEffect(() => {
    if (!isMuted) Sounds.roundStart();
    players.forEach((_, i) => setTimeout(() => setRevealed(r => [...r, i]), 300 + i * 200));
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 grid-bg flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="scanlines" />

      {/* Glow backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-64 blur-3xl opacity-[0.08] rounded-full"
          style={{ background: glowColor }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${glowColor}50,transparent)` }} />
      </div>

      <div className="w-full max-w-lg z-10 flex flex-col gap-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="flex justify-center mb-5"><PrashanBaanMiniLogo /></div>
          <p className="font-body text-[9px] text-white/25 tracking-[0.5em] uppercase mb-2">
            Round {(data?.roundIndex ?? 0) + 1} of {totalRounds} Complete
          </p>
          <h1 className={`font-display text-5xl tracking-widest ${accentColor}`}>
            {data?.roundName || 'ROUND COMPLETE'}
          </h1>
          <div className="h-px mt-4 mx-auto w-64"
            style={{ background: `linear-gradient(90deg,transparent,${glowColor},transparent)` }} />
        </motion.div>

        {/* Leaderboard */}
        <div className="flex flex-col gap-2">
          {players.map((p, i) => (
            <motion.div key={p.name}
              initial={{ opacity: 0, x: -30 }}
              animate={revealed.includes(i) ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="flex items-center gap-4 px-4 py-3 relative overflow-hidden"
              style={{
                background: i === 0 ? 'rgba(255,190,0,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${i === 0 ? 'rgba(255,190,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}>

              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {i < 3
                  ? <span className="text-xl">{MEDALS[i]}</span>
                  : <span className="font-display text-lg text-white/20">#{i + 1}</span>}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm uppercase tracking-widest truncate"
                  style={{ color: i === 0 ? '#ffbe00' : 'rgba(255,255,255,0.7)' }}>{p.name}</p>
                {p.roundScores?.length > 0 && (
                  <div className="flex gap-2 mt-0.5">
                    {p.roundScores.map((rs, ri) => (
                      <span key={ri} className="font-body text-[8px] text-white/20">R{ri+1}: {rs}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <span className="font-display text-3xl"
                  style={{ color: i === 0 ? '#ffbe00' : 'rgba(255,255,255,0.55)',
                    textShadow: i === 0 ? '0 0 16px rgba(255,190,0,0.5)' : 'none' }}>
                  {p.score}
                </span>
                <span className="font-body text-[8px] text-white/20 ml-1">pts</span>
              </div>

              {/* Winner sweep */}
              {i === 0 && (
                <motion.div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,190,0,0.05),transparent)' }}
                  animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Timer */}
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          {isLastRound ? (
            <p className="font-body text-sm text-neon-yellow tracking-widest uppercase animate-pulse">
              ⚡ Final results loading...
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="font-body text-[9px] text-white/20 tracking-widest uppercase">Next round in</p>
              <span className="font-display text-5xl" style={{
                color: secondsLeft <= 2 ? '#ff006e' : '#00f5ff',
                textShadow: `0 0 20px ${secondsLeft <= 2 ? 'rgba(255,0,110,0.7)' : 'rgba(0,245,255,0.7)'}`,
              }}>{secondsLeft}</span>
              <div className="w-40 h-0.5 bg-white/8 overflow-hidden">
                <motion.div className="h-full" style={{ background: glowColor }}
                  initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 6, ease: 'linear' }} />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
