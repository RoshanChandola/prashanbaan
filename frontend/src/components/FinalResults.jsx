import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrashanBaanMiniLogo } from './PrashanBaanLogo';
import { Sounds } from '../hooks/useSound';
import { useGameStore } from '../store/gameStore';

const MEDALS = ['🥇', '🥈', '🥉'];

function RollingNumber({ target, delay = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let s = 0, steps = 40;
      const iv = setInterval(() => {
        s++; setVal(Math.round((s / steps) * target));
        if (s >= steps) clearInterval(iv);
      }, 30);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return <>{val}</>;
}

function Confetti() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const cols = ['#00f5ff','#ff006e','#ffbe00','#39ff14','#ffffff'];
    const parts = Array.from({ length: 80 }, () => ({
      x: Math.random() * c.width, y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1.5,
      size: Math.random() * 7 + 3,
      color: cols[Math.floor(Math.random() * cols.length)],
      spin: (Math.random() - 0.5) * 0.12,
      angle: Math.random() * Math.PI * 2,
      alpha: 0.8 + Math.random() * 0.2,
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.angle += p.spin;
        if (p.y > c.height + 10) { p.y = -10; p.x = Math.random() * c.width; }
        ctx.save(); ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.35);
        ctx.restore();
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />;
}

export default function FinalResults({ roomState, isHost, onPlayAgain }) {
  const isMuted = useGameStore(s => s.isMuted);
  const [revealed, setRevealed] = useState([]);

  const sorted = [...(roomState?.players || [])].sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (!isMuted) Sounds.gameOver?.();
    sorted.forEach((_, i) => setTimeout(() => setRevealed(r => [...r, i]), 300 + i * 150));
  }, []);

  return (
    <div className="fixed inset-0 grid-bg flex flex-col items-center justify-center p-6 overflow-hidden">
      <Confetti />
      <div className="scanlines" />

      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-72 blur-3xl opacity-[0.07] rounded-full" style={{ background: '#ffbe00' }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,190,0,0.4),transparent)' }} />
      </div>

      <div className="w-full max-w-xl z-10 flex flex-col gap-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <PrashanBaanMiniLogo />
          <div className="text-center">
            <p className="font-body text-[8px] text-white/25 tracking-widest uppercase">Final Standings</p>
            <h1 className="font-display text-4xl neon-text-yellow tracking-widest">RESULTS</h1>
          </div>
          <div className="text-right">
            <p className="font-body text-[8px] text-white/20 tracking-widest uppercase">Players</p>
            <p className="font-display text-4xl text-white/50">{sorted.length}</p>
          </div>
        </motion.div>

        <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,190,0,0.4),transparent)' }} />

        {/* Leaderboard */}
        <div className="flex flex-col gap-2 max-h-[52vh] overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,190,0,0.2) transparent' }}>
          {sorted.map((p, i) => (
            <motion.div key={p.name}
              initial={{ opacity: 0, x: -30 }}
              animate={revealed.includes(i) ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="relative overflow-hidden flex items-center gap-3 px-4 py-3"
              style={{
                background: i === 0 ? 'rgba(255,190,0,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${i === 0 ? 'rgba(255,190,0,0.35)' : i < 3 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
              }}>

              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {i < 3
                  ? <span className="text-xl">{MEDALS[i]}</span>
                  : <span className="font-display text-lg text-white/20">#{i+1}</span>}
              </div>

              {/* Name + stats */}
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm uppercase tracking-widest truncate"
                  style={{ color: i === 0 ? '#ffbe00' : 'rgba(255,255,255,0.7)' }}>{p.name}</p>
                <div className="flex gap-2 mt-0.5 flex-wrap">
                  {p.roundScores?.map((rs, ri) => (
                    <span key={ri} className="font-body text-[8px] text-white/20">R{ri+1}: {rs}</span>
                  ))}
                  {p.streak >= 3 && (
                    <span className="streak-badge">🔥 {p.streak}</span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <span className="font-display text-3xl"
                  style={{ color: i === 0 ? '#ffbe00' : 'rgba(255,255,255,0.45)',
                    textShadow: i === 0 ? '0 0 16px rgba(255,190,0,0.5)' : 'none' }}>
                  <RollingNumber target={p.score} delay={i * 80} />
                </span>
                <span className="font-body text-[8px] text-white/20 ml-1">pts</span>
              </div>

              {i === 0 && (
                <motion.div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,190,0,0.05),transparent)' }}
                  animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Play again */}
        {isHost ? (
          <motion.button onClick={onPlayAgain}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
            className="btn-neon-cyan w-full py-4 text-xl font-display tracking-widest">
            ⟳ PLAY AGAIN
          </motion.button>
        ) : (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-center font-body text-xs text-white/20 tracking-widest uppercase animate-pulse py-3">
            Waiting for host to start a new game...
          </motion.p>
        )}
      </div>
    </div>
  );
}
