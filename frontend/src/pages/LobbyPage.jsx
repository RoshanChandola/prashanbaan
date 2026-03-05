import { useState, useEffect, useRef } from 'react';
import { PrashanBaanHeroLogo } from '../components/PrashanBaanLogo';
import { getOrCreateSessionId, saveRoomData } from '../hooks/useSession';

function Particles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      r: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.5 ? '#00f5ff' : '#ff006e',
      alpha: Math.random() * 0.4 + 0.08,
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fill();
      });
      ctx.globalAlpha = 1;
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

export default function LobbyPage({ onHostGame, onJoinGame }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const nameRef = useRef(null);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };

  const handleHost = () => {
    if (!name.trim()) { setError('Enter your name'); triggerShake(); return; }
    saveRoomData(null, 'host', name.trim());
    onHostGame({ hostName: name.trim(), sessionId: getOrCreateSessionId() });
  };
  const handleJoin = () => {
    if (!name.trim()) { setError('Enter your name'); triggerShake(); return; }
    if (!roomCode.trim()) { setError('Enter room code'); triggerShake(); return; }
    saveRoomData(roomCode.toUpperCase(), 'player', name.trim());
    onJoinGame({ playerName: name.trim(), roomCode: roomCode.toUpperCase(), sessionId: getOrCreateSessionId() });
  };
  useEffect(() => { if (mode) setTimeout(() => nameRef.current?.focus(), 80); }, [mode]);

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Particles />

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.07]" style={{ background: '#00f5ff' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: '#ff006e' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm gap-8">

        {/* Logo */}
        <PrashanBaanHeroLogo />

        {/* Cards */}
        {!mode ? (
          <div className="w-full flex flex-col gap-3">
            <button onClick={() => setMode('host')}
              className="btn-neon-cyan w-full py-5 text-2xl flex items-center justify-center gap-3">
              <span>⚙</span> HOST ARENA
            </button>
            <button onClick={() => setMode('join')}
              className="btn-neon-pink w-full py-5 text-2xl flex items-center justify-center gap-3">
              <span>⚡</span> JOIN BATTLE
            </button>
          </div>
        ) : (
          <div className="w-full neon-border-cyan bg-dark-800/90">
            <div className="h-0.5" style={{ background: 'linear-gradient(90deg,transparent,#00f5ff,transparent)' }} />
            <div className="p-7 flex flex-col gap-5">
              <div className="font-display text-2xl tracking-widest neon-text-cyan text-center">
                {mode === 'host' ? '— HOST ARENA —' : '— JOIN BATTLE —'}
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-body text-[9px] tracking-[0.35em] text-white/40 uppercase">Your Name</label>
                <input ref={nameRef} type="text" value={name} maxLength={20}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && (mode === 'host' ? handleHost() : handleJoin())}
                  placeholder="Enter name..."
                  className={`w-full bg-dark-700 border text-white font-body px-4 py-3 text-sm focus:outline-none placeholder-white/10 tracking-wide transition-all ${shake ? 'border-neon-pink' : 'border-white/10 focus:border-neon-cyan/60'}`} />
              </div>

              {mode === 'join' && (
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[9px] tracking-[0.35em] text-white/40 uppercase">Room Code</label>
                  <input type="text" value={roomCode} maxLength={5}
                    onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    placeholder="XXXXX"
                    className="w-full bg-dark-700 border border-white/10 text-white font-display px-4 py-3 text-2xl tracking-[0.5em] text-center focus:outline-none focus:border-neon-pink/60 placeholder-white/10 transition-all" />
                </div>
              )}

              {error && <p className="font-body text-[10px] text-neon-pink tracking-widest uppercase flex items-center gap-2"><span>⚠</span>{error}</p>}

              <button onClick={mode === 'host' ? handleHost : handleJoin}
                className={`w-full py-4 text-xl font-display tracking-[0.2em] ${mode === 'host' ? 'btn-neon-cyan' : 'btn-neon-pink'}`}>
                {mode === 'host' ? '⚙ CREATE ARENA' : '⚡ ENGAGE'}
              </button>

              <button onClick={() => { setMode(null); setError(''); setName(''); setRoomCode(''); }}
                className="font-body text-[9px] text-white/20 hover:text-neon-cyan tracking-[0.4em] uppercase text-center transition-colors">
                ← BACK
              </button>
            </div>
          </div>
        )}

        <p className="font-body text-[9px] text-white/10 tracking-[0.5em] uppercase">
          IT UTSAV 4.0 · Uttaranchal University
        </p>
      </div>
    </div>
  );
}
