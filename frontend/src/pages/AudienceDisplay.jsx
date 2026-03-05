import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { PrashanBaanHeroLogo } from '../components/PrashanBaanLogo';
import TimerBar from '../components/TimerBar';
import Leaderboard from '../components/Leaderboard';
import TypeWriter from '../components/TypeWriter';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const LABELS = ['A', 'B', 'C', 'D'];

let displaySocket = null;
function getDisplaySocket() {
  if (!displaySocket) {
    displaySocket = io(SOCKET_URL, { transports: ['websocket'] });
  }
  return displaySocket;
}

export default function AudienceDisplay() {
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [question, setQuestion] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [lastResult, setLastResult] = useState(null);
  const [buzzWinner, setBuzzWinner] = useState(null);
  const [roundData, setRoundData] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-read room code from URL: /display?code=XXXXX
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) { setInputCode(code.toUpperCase()); }
  }, []);

  const handleConnect = () => {
    if (!inputCode.trim()) return;
    const code = inputCode.toUpperCase();
    const sock = getDisplaySocket();

    sock.emit('join_display', { roomCode: code });

    sock.on('display_joined', ({ roomState }) => {
      setConnected(true);
      setRoomCode(code);
      setRoomState(roomState);
      setError('');
    });

    sock.on('display_error', ({ message }) => setError(message));

    // Game events
    sock.on('player_joined', ({ roomState }) => setRoomState(roomState));
    sock.on('host_question', ({ question, roomState }) => {
      setRoomState(roomState); setQuestion(question); setLastResult(null); setBuzzWinner(null);
    });
    sock.on('turn_changed', ({ roomState }) => {
      setRoomState(roomState); setLastResult(null); setBuzzWinner(null);
    });
    sock.on('tossup_activated', ({ roomState }) => { setRoomState(roomState); setBuzzWinner(null); });
    sock.on('buzz_winner', ({ winnerName, roomState }) => { setRoomState(roomState); setBuzzWinner(winnerName); });
    sock.on('answer_result', ({ roomState, ...result }) => { setRoomState(roomState); setLastResult(result); });
    sock.on('timer_tick', ({ seconds }) => setTimerSeconds(seconds));
    sock.on('round_complete', (data) => { setRoomState(data.roomState); setRoundData(data); });
    sock.on('round_starting', ({ roomState }) => { setRoomState(roomState); setRoundData(null); setQuestion(null); });
    sock.on('game_finished', ({ roomState }) => { setRoomState(roomState); setGameOver(true); });
  };

  const currentRound = roomState?.rounds?.[roomState?.currentRoundIndex];
  const isBlitz = currentRound?.type === 'BLITZ';
  const players = [...(roomState?.players || [])].sort((a, b) => b.score - a.score);
  const qNum = (roomState?.currentQuestionIndex || 0) + 1;

  // ── CONNECT SCREEN ────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="min-h-screen grid-bg flex flex-col items-center justify-center gap-8 p-8">
        <PrashanBaanHeroLogo />
        <div className="text-center">
          <div className="font-body text-xs text-white/25 tracking-[0.5em] uppercase mb-6">
            Audience / Projector Display Mode
          </div>
          <div className="flex gap-3 justify-center">
            <input
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              maxLength={5}
              placeholder="ROOM CODE"
              className="bg-dark-800 border border-neon-cyan/30 text-white font-display text-3xl px-6 py-3 w-48 text-center tracking-[0.5em] focus:outline-none focus:border-neon-cyan"
            />
            <button onClick={handleConnect}
              className="btn-neon-cyan px-8 py-3 text-xl font-display tracking-widest">
              CONNECT
            </button>
          </div>
          {error && <div className="font-body text-xs text-neon-pink mt-4 tracking-widest">{error}</div>}
        </div>
      </div>
    );
  }

  // ── GAME OVER SCREEN ──────────────────────────────────────────────────────
  if (gameOver) {
    return (
      <div className="min-h-screen grid-bg flex flex-col items-center justify-center p-8">
        <div className="font-display neon-text-yellow mb-4 tracking-widest" style={{ fontSize: '8rem', lineHeight: 1 }}>GAME OVER</div>
        <div className="font-body text-xs text-white/25 tracking-[0.5em] uppercase mb-8">IT UTSAV 4.0 · Final Results</div>
        <div className="w-full max-w-xl neon-border-yellow p-6 bg-dark-800">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 p-3 mb-2"
              style={{ background: i === 0 ? 'rgba(255,190,0,0.07)' : 'transparent' }}>
              <span className="text-3xl">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
              <span className="flex-1 font-body text-lg text-white/80 uppercase">{p.name}</span>
              <span className="font-display text-3xl neon-text-yellow">{p.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── MAIN DISPLAY ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid-bg flex gap-0 overflow-hidden" style={{ fontFamily: 'inherit' }}>

      {/* LEFT: Leaderboard panel */}
      <div className="w-72 flex-shrink-0 bg-dark-800/90 border-r border-white/5 flex flex-col p-5 gap-4">
        <PrashanBaanHeroLogo compact />
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #00f5ff30, transparent)' }} />

        <div className="font-body text-[9px] text-white/20 uppercase tracking-widest">&gt; Live Standings</div>
        <div className="flex-1 overflow-y-auto">
          <Leaderboard players={roomState?.players || []} />
        </div>

        {/* Timer */}
        {roomState?.state === 'ACTIVE' && (
          <div className="mt-auto">
            <TimerBar seconds={timerSeconds} maxSeconds={currentRound?.timerSeconds || 30} size="large" />
          </div>
        )}

        <div className="font-body text-[8px] text-white/10 tracking-widest text-center border-t border-white/5 pt-3">
          {roomCode} · R{(roomState?.currentRoundIndex ?? 0) + 1}/{roomState?.rounds?.length} · {isBlitz ? '⚡ BLITZ' : '◉ SEQ'}
        </div>
      </div>

      {/* RIGHT: Main stage */}
      <div className="flex-1 flex flex-col p-8 relative overflow-hidden">

        {/* Round badge */}
        <div className="flex items-center justify-between mb-6">
          <div className={`px-8 py-2 font-display text-2xl tracking-[0.2em] border ${
            isBlitz ? 'border-neon-pink text-neon-pink' : 'neon-text-cyan border-neon-cyan/50'
          }`} style={{ clipPath: 'polygon(10px 0%,100% 0%,calc(100%-10px) 100%,0% 100%)' }}>
            {currentRound?.name || `ROUND ${(roomState?.currentRoundIndex ?? 0) + 1}`}
          </div>
          <div className="font-display text-3xl text-white/20">
            Q <span className="text-white">{qNum}</span> / {currentRound?.questionCount}
          </div>
        </div>

        {/* Question area */}
        <AnimatePresence mode="wait">
          {question ? (
            <motion.div key={`q-${qNum}`}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col">

              {/* Question text — large for projector */}
              <div className="neon-border-cyan p-8 bg-dark-800/60 mb-6 flex-1 flex flex-col justify-center">
                <p className="font-body leading-relaxed text-white border-l-4 border-neon-cyan pl-6"
                  style={{ fontSize: '2rem' }}>
                  <TypeWriter text={question.question} speed={18} />
                </p>
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {question.options?.map((opt, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.12 }}
                    className="p-5 border border-white/8 bg-dark-700/50 flex items-center gap-4">
                    <span className="font-display text-4xl text-white/15">{LABELS[i]}</span>
                    <span className="font-body text-xl text-white/85">{opt}</span>
                  </motion.div>
                ))}
              </div>

              {/* Status: buzz winner, result */}
              <AnimatePresence>
                {buzzWinner && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center py-4 border border-neon-yellow/30 bg-neon-yellow/5 mb-3">
                    <div className="font-display text-4xl neon-text-yellow tracking-widest">⚡ {buzzWinner} BUZZED IN!</div>
                  </motion.div>
                )}
                {lastResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className={`text-center py-5 border-t-4 border-b-4 ${
                      lastResult.correct ? 'border-neon-green bg-neon-green/5' : 'border-neon-pink bg-neon-pink/5'
                    }`}>
                    <div className={`font-display tracking-widest ${lastResult.correct ? 'neon-text-green' : 'neon-text-pink'}`}
                      style={{ fontSize: '4rem' }}>
                      {lastResult.correct ? `✓ CORRECT  +${lastResult.pointsAwarded}` : `✗ WRONG  ${lastResult.pointsAwarded}`}
                    </div>
                    <div className="font-body text-sm text-white/30 uppercase tracking-widest mt-1">
                      {lastResult.playerName}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-20">
              <div className="w-16 h-16 border-2 border-t-neon-cyan rounded-full animate-spin" />
              <div className="font-display text-3xl tracking-[0.5em]">ARENA STANDBY</div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
