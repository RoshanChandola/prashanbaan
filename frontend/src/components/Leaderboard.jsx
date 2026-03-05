import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Leaderboard({ players = [], compact = false }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const prevScores = useRef({});
  const [deltas, setDeltas] = useState({});

  useEffect(() => {
    const newDeltas = {};
    sorted.forEach(p => {
      const prev = prevScores.current[p.id] ?? p.score;
      if (prev !== p.score) newDeltas[p.id] = p.score - prev;
    });
    setDeltas(newDeltas);
    const ids = {};
    sorted.forEach(p => { ids[p.id] = p.score; });
    prevScores.current = ids;
    if (Object.keys(newDeltas).length > 0) {
      setTimeout(() => setDeltas({}), 1800);
    }
  }, [JSON.stringify(sorted.map(p => p.score))]);

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {sorted.map((player, i) => {
          const delta = deltas[player.id];
          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`player-card relative overflow-hidden ${player.isActive ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-body text-[9px] text-white/20 w-4 flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {player.isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse flex-shrink-0"
                        style={{ boxShadow: '0 0 6px #00f5ff' }} />
                    )}
                    <span className={`font-body text-xs truncate uppercase tracking-tighter ${player.isActive ? 'text-white' : 'text-white/70'}`}>
                      {player.name}
                    </span>
                    {player.streak >= 3 && (
                      <span className="streak-badge flex-shrink-0">🔥{player.streak}</span>
                    )}
                  </div>
                  {!compact && (
                    <div className="flex gap-1 mt-0.5">
                      {(player.roundScores || []).map((rs, ri) => (
                        <span key={ri} className="font-body text-[8px] text-white/20 border border-white/10 px-1">
                          R{ri + 1}: {rs}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex-shrink-0">
                  <span className="font-display text-xl neon-text-yellow">{player.score}</span>
                  {delta && (
                    <motion.span
                      key={`delta-${player.id}-${delta}`}
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: delta > 0 ? -28 : 12 }}
                      transition={{ duration: 1.2 }}
                      className="absolute -top-3 right-0 font-display text-sm pointer-events-none"
                      style={{ color: delta > 0 ? '#39ff14' : '#ff006e', textShadow: `0 0 8px ${delta > 0 ? '#39ff14' : '#ff006e'}` }}
                    >
                      {delta > 0 ? '+' : ''}{delta}
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
