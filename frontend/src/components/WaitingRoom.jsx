import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { PrashanBaanMiniLogo } from './PrashanBaanLogo';
import QuizBuilder from './QuizBuilder';
import { getSocket } from '../App';
import { useGameStore } from '../store/gameStore';
import { Sounds } from '../hooks/useSound';

export default function WaitingRoom({ roomState, isHost, onStartGame, onSaveRounds }) {
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [quizSavedMsg, setQuizSavedMsg] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [quizConfigured, setQuizConfigured] = useState(false);
  const [prevPlayerCount, setPrevPlayerCount] = useState(0);
  const [newPlayerFlash, setNewPlayerFlash] = useState(false);
  const isMuted = useGameStore(s => s.isMuted);

  const playerCount = roomState?.players?.length || 0;
  const code = roomState?.code || '';
  const joinUrl = `${window.location.origin}?code=${code}`;
  const rounds = roomState?.rounds || [];
  const canStart = playerCount > 0;

  useEffect(() => {
    if (playerCount > prevPlayerCount && prevPlayerCount > 0) {
      setNewPlayerFlash(true);
      if (!isMuted) Sounds.correct();
      setTimeout(() => setNewPlayerFlash(false), 800);
    }
    setPrevPlayerCount(playerCount);
  }, [playerCount]);

  useEffect(() => {
    const sock = getSocket();
    const sessionId = localStorage.getItem('pb_sessionId');
    if (isHost && sessionId) sock.emit('get_my_quizzes', { sessionId });
    sock.on('my_quizzes', ({ quizzes }) => { setSavedQuizzes(quizzes); setDbConnected(true); });
    sock.on('quiz_saved', ({ title }) => { setQuizSavedMsg(`✓ "${title}" saved`); setShowSaveDialog(false); setTimeout(() => setQuizSavedMsg(''), 3000); });
    sock.on('quiz_save_error', ({ message }) => { setQuizSavedMsg(`✗ ${message}`); setTimeout(() => setQuizSavedMsg(''), 3000); });
    sock.on('quiz_loaded', ({ title }) => { setQuizSavedMsg(`✓ "${title}" loaded`); setTimeout(() => setQuizSavedMsg(''), 3000); });
    return () => { sock.off('my_quizzes'); sock.off('quiz_saved'); sock.off('quiz_save_error'); sock.off('quiz_loaded'); };
  }, [isHost]);

  const handleSaveQuizToDB = () => {
    if (!saveTitle.trim()) return;
    getSocket().emit('save_quiz_template', { roomCode: roomState?.code, title: saveTitle.trim() });
  };
  const handleLoadQuiz = (quizId) => {
    getSocket().emit('load_quiz', { roomCode: roomState?.code, quizId });
    setQuizConfigured(true);
  };

  useEffect(() => {
    const sock = getSocket();
    const handleCountdown = () => {
      if (!isMuted) Sounds.countdown();
      let c = 3; setCountdown(c);
      const iv = setInterval(() => {
        c--;
        if (c <= 0) { clearInterval(iv); setCountdown('GO!'); setTimeout(() => setCountdown(null), 900); }
        else setCountdown(c);
      }, 1000);
    };
    sock.on('start_countdown', handleCountdown);
    return () => sock.off('start_countdown', handleCountdown);
  }, [isMuted]);

  const handleSaveQuiz = (rounds) => { onSaveRounds(rounds); setQuizConfigured(true); setShowBuilder(false); };

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center p-5 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 blur-3xl opacity-[0.06]" style={{ background: '#00f5ff' }} />
        <div className="absolute bottom-0 right-0 w-80 h-64 blur-3xl opacity-[0.05]" style={{ background: '#ff006e' }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,245,255,0.25),transparent)' }} />
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div key="cd" className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-900/95 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="font-body text-xs text-neon-cyan tracking-[0.6em] uppercase mb-8 animate-pulse">
              Launching Arena · IT UTSAV 4.0
            </p>
            <motion.div key={countdown}
              initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              className="font-display"
              style={{ fontSize: countdown === 'GO!' ? '9rem' : '17rem', lineHeight: 1,
                color: countdown === 'GO!' ? '#39ff14' : '#00f5ff',
                textShadow: countdown === 'GO!' ? '0 0 60px rgba(57,255,20,0.9)' : '0 0 60px rgba(0,245,255,0.9)' }}>
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showBuilder && <QuizBuilder onSave={handleSaveQuiz} onCancel={() => setShowBuilder(false)} />}

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/85 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQR(false)}>
            <motion.div className="neon-border-cyan bg-dark-800 p-8 text-center"
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }} onClick={e => e.stopPropagation()}>
              <p className="font-body text-[9px] text-neon-cyan tracking-widest uppercase mb-5">Scan to Join</p>
              <div className="bg-white p-3 inline-block mb-5">
                <QRCodeSVG value={joinUrl} size={180} bgColor="#fff" fgColor="#050508" />
              </div>
              <p className="font-display text-4xl neon-text-cyan tracking-widest">{code}</p>
              <p className="font-body text-[9px] text-white/20 mt-3">Tap outside to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm"
          onClick={() => setShowSaveDialog(false)}>
          <div className="neon-border-cyan bg-dark-800 p-6 w-80" onClick={e => e.stopPropagation()}>
            <p className="font-body text-[9px] text-neon-cyan tracking-widest uppercase mb-3">Save Quiz Template</p>
            <input value={saveTitle} onChange={e => setSaveTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveQuizToDB()}
              placeholder="Quiz title..."
              className="w-full bg-dark-700 border border-white/10 text-white font-body text-sm px-3 py-2 focus:outline-none focus:border-neon-cyan/50 mb-3" />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-2 border border-white/10 text-white/40 font-display text-sm">CANCEL</button>
              <button onClick={handleSaveQuizToDB}
                className="flex-1 btn-neon-cyan py-2 font-display text-sm">SAVE</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl z-10 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <PrashanBaanMiniLogo />
          <button onClick={() => setShowQR(true)}
            className="flex flex-col items-end gap-1 group">
            <span className="font-body text-[8px] text-white/25 tracking-widest uppercase">Room Code</span>
            <div className="flex items-center gap-2 px-4 py-2 border border-neon-cyan/30 bg-neon-cyan/5 group-hover:border-neon-cyan/60 group-hover:bg-neon-cyan/10 transition-all">
              <span className="font-display text-3xl neon-text-cyan tracking-widest">{code}</span>
              <span className="font-body text-[9px] text-neon-cyan/40 border border-neon-cyan/20 px-1 py-0.5">QR</span>
            </div>
          </button>
        </div>

        <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,245,255,0.3),transparent)' }} />

        {/* Round config */}
        <div className="neon-border-cyan bg-dark-800/60">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="font-body text-[9px] text-white/30 tracking-widest uppercase italic">&gt; Quiz Configuration</span>
            {isHost && (
              <div className="flex items-center gap-2">
                {quizSavedMsg && (
                  <span className={`font-body text-[9px] tracking-widest ${quizSavedMsg.startsWith('✓') ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {quizSavedMsg}
                  </span>
                )}
                {quizConfigured && (
                  <button onClick={() => setShowSaveDialog(true)}
                    className="font-body text-[9px] text-neon-cyan border border-neon-cyan/30 px-2 py-1 hover:border-neon-cyan/60 transition-all tracking-widest uppercase">
                    💾 Save
                  </button>
                )}
                {savedQuizzes.length > 0 && (
                  <div className="relative group">
                    <button className="font-body text-[9px] text-neon-yellow border border-neon-yellow/30 px-2 py-1 hover:border-neon-yellow/60 transition-all tracking-widest uppercase">
                      📂 Load ({savedQuizzes.length})
                    </button>
                    <div className="absolute right-0 bottom-full mb-1 w-52 bg-dark-800 border border-white/10 z-20 hidden group-hover:block shadow-xl">
                      {savedQuizzes.map(q => (
                        <button key={q._id} onClick={() => handleLoadQuiz(q._id)}
                          className="w-full text-left px-3 py-2.5 font-body text-xs text-white/60 hover:text-white hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors">
                          <div className="truncate">{q.title}</div>
                          <div className="text-white/25 text-[8px] mt-0.5">{q.totalQuestions}Q · played {q.playCount}×</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setShowBuilder(true)}
                  className={`btn-neon-cyan px-3 py-1 text-xs ${quizConfigured ? 'border-neon-green text-neon-green' : ''}`}>
                  {quizConfigured ? '✓ Edit' : 'Configure'}
                </button>
              </div>
            )}
          </div>
          <div className="p-4">
            {rounds.length === 0 ? (
              <p className="text-center font-body text-xs text-white/15 tracking-widest py-3">
                {isHost ? 'Click Configure to set up rounds' : 'Host is setting up the quiz...'}
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {rounds.map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className={`p-3 border ${r.type === 'BLITZ' ? 'border-neon-pink/25 bg-neon-pink/5' : 'border-neon-cyan/25 bg-neon-cyan/5'}`}>
                    <div className={`font-body text-[8px] uppercase tracking-widest mb-1 ${r.type === 'BLITZ' ? 'text-neon-pink' : 'text-neon-cyan'}`}>
                      {r.type === 'BLITZ' ? '⚡ Blitz' : '◉ Sequential'}
                    </div>
                    <div className="font-display text-sm text-white truncate">{r.name}</div>
                    <div className="font-body text-[8px] text-white/25 mt-0.5">{r.questionCount}Q · {r.timerSeconds}s</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Players */}
        <div className={`border bg-dark-800/60 transition-all duration-300 ${newPlayerFlash ? 'border-neon-cyan/70 shadow-[0_0_20px_rgba(0,245,255,0.12)]' : 'border-neon-cyan/20'}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5"
            style={{ background: 'linear-gradient(90deg,rgba(0,245,255,0.03),transparent)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" style={{ boxShadow: '0 0 6px #39ff14' }} />
              <span className="font-body text-[9px] text-white/30 tracking-widest uppercase">Players Joined</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl neon-text-cyan">{playerCount}</span>
              <span className="font-body text-sm text-white/20">/ 20</span>
            </div>
          </div>
          {playerCount === 0 ? (
            <div className="py-10 text-center">
              <p className="font-body text-xs text-white/15 tracking-[0.4em] uppercase animate-pulse">Waiting for players...</p>
              <p className="font-body text-[9px] text-white/8 tracking-widest mt-1">Share the room code above</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-2 gap-2">
              <AnimatePresence>
                {roomState?.players.map((p, i) => (
                  <motion.div key={p.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
                    className="player-card flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-neon-green" style={{ boxShadow: '0 0 5px rgba(57,255,20,0.8)' }} />
                    <span className="font-body text-xs text-white/75 truncate uppercase tracking-wide">{p.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Launch */}
        {isHost ? (
          <div>
            <motion.button
              whileHover={canStart ? { scale: 1.01 } : {}}
              whileTap={canStart ? { scale: 0.98 } : {}}
              onClick={canStart ? onStartGame : undefined}
              disabled={!canStart}
              className={`btn-neon-yellow w-full py-5 text-2xl font-display tracking-widest relative overflow-hidden ${!canStart ? '' : 'shadow-[0_0_30px_rgba(255,190,0,0.2)]'}`}>
              {canStart && (
                <motion.div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,190,0,0.08),transparent)' }}
                  animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }} />
              )}
              <span className="relative z-10">
                {canStart ? `⚡ LAUNCH ARENA (${playerCount} PLAYER${playerCount > 1 ? 'S' : ''})` : 'WAITING FOR PLAYERS...'}
              </span>
            </motion.button>
            <p className="font-body text-[8px] text-white/10 tracking-widest text-center mt-2">
              PrashanBaan · IT UTSAV 4.0 · System Ready
            </p>
          </div>
        ) : (
          <div className="border border-white/8 bg-dark-800/40 py-5 text-center flex flex-col items-center gap-2">
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-yellow animate-pulse" style={{ boxShadow: '0 0 8px #ffbe00' }} />
              <span className="font-body text-xs text-neon-yellow tracking-[0.4em] uppercase">Awaiting Host to Launch</span>
            </motion.div>
            <p className="font-body text-[9px] text-white/15 tracking-widest">
              {rounds.map(r => r.name).join(' → ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
