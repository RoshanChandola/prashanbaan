import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimerBar from './TimerBar';
import TypeWriter from './TypeWriter';
import { Sounds } from '../hooks/useSound';
import { useGameStore } from '../store/gameStore';

import prashanbaanLogo from '../assets/prashanbaan-logo.png';
import uttaranchalLogo from '../assets/uttaranchal-logo.png';

const LABELS = ['A', 'B', 'C', 'D'];

// Compact dual-logo header used across all player screens
function PlayerHeader({ score, myPlayer }) {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/8">
      {/* Left — Uttaranchal University */}
      <img src={uttaranchalLogo} alt="Uttaranchal University"
        className="h-10 object-contain opacity-80" />

      {/* Centre — PrashanBaan */}
      <img src={prashanbaanLogo} alt="PrashanBaan IT UTSAV 4.0"
        className="h-12 object-contain" />

      {/* Right — Score */}
      <div className="text-right">
        <div className="font-body text-[8px] text-neon-yellow uppercase tracking-widest">Score</div>
        <motion.div
          key={score}
          initial={{ scale: 1.4, color: '#39ff14' }}
          animate={{ scale: 1, color: '#ffbe00' }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl neon-text-yellow">
          {score ?? 0}
        </motion.div>
      </div>
    </div>
  );
}

export default function PlayerView({
  roomState, mySocketId, question, timerSeconds,
  onSubmitAnswer, onPassQuestion, onBuzzIn, onSubmitTossUp,
  lastResult, buzzWinner, isTossUpQuestion, state,
}) {
  const [selected, setSelected]           = useState(null);
  const [submitted, setSubmitted]         = useState(false);
  const [passed, setPassed]               = useState(false);
  const [buzzed, setBuzzed]               = useState(false);
  const [floats, setFloats]               = useState([]);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const isMuted    = useGameStore(s => s.isMuted);
  const prevResult = useRef(null);

  const myPlayer    = roomState?.players?.find(p => p.id === mySocketId);
  const activePlayer = roomState?.players?.[roomState?.currentPlayerIndex];
  const isMyTurn    = activePlayer?.id === mySocketId;
  const isTossUp    = state === 'TOSS_UP';
  const isBuzzLocked = state === 'BUZZ_LOCKED';
  const qNum        = (roomState?.currentQuestionIndex || 0) + 1;
  const roundIdx    = roomState?.currentRoundIndex ?? 0;
  const currentRound = roomState?.rounds?.[roundIdx];
  const maxTimer    = currentRound?.timerSeconds || 30;
  const canPass     = isMyTurn && state === 'ACTIVE' && currentRound?.passAllowed && !submitted && !passed;
  // The passer cannot buzz in the toss-up they created
  const iAmPasser   = passed && roomState?.passedBy === myPlayer?.name;
  const iAmBuzzWinner = buzzWinner === myPlayer?.name || roomState?.buzzLock === mySocketId;

  // Reset per question
  useEffect(() => {
    setSelected(null); setSubmitted(false); setPassed(false);
    setBuzzed(false); setOptionsVisible(false);
  }, [qNum, roundIdx, state]);

  // When toss-up question arrives for buzz winner — clear passed state
  useEffect(() => {
    if (isTossUpQuestion) {
      setPassed(false); setSubmitted(false);
      setSelected(null); setOptionsVisible(false);
    }
  }, [isTossUpQuestion]);

  const handleTyped = useCallback(() => {
    setTimeout(() => setOptionsVisible(true), 150);
  }, []);

  // Score float on result
  useEffect(() => {
    if (!lastResult || lastResult === prevResult.current) return;
    prevResult.current = lastResult;
    if (lastResult.playerName === myPlayer?.name) {
      setFloats(f => [...f, { id: Date.now(), points: lastResult.pointsAwarded }]);
      if (!isMuted) lastResult.correct ? Sounds.correct() : Sounds.wrong();
    }
  }, [lastResult]);

  // Buzz handler
  const handleBuzz = useCallback(() => {
    if (buzzed || !isTossUp || iAmPasser) return;
    setBuzzed(true);
    if (!isMuted) Sounds.buzz();
    onBuzzIn();
  }, [buzzed, isTossUp, iAmPasser, isMuted, onBuzzIn]);

  useEffect(() => {
    if (!isTossUp || iAmPasser) return;
    const handler = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBuzz(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isTossUp, iAmPasser, handleBuzz]);

  const handleSelect = (i) => {
    if (submitted || passed) return;
    if (!isMyTurn && !isTossUpQuestion) return;
    setSelected(i);
  };

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    isTossUpQuestion ? onSubmitTossUp(selected) : onSubmitAnswer(selected);
  };

  const handlePass = () => {
    if (!canPass) return;
    setPassed(true);
    if (!isMuted) Sounds.pass();
    onPassQuestion();
  };

  // ── TOSS-UP SCREEN (question revealed + buzz button) ──────────────────────
  // Shows for everyone EXCEPT the passer, when state is TOSS_UP and not yet buzzed
  if (isTossUp && !buzzed && !iAmPasser && !isTossUpQuestion) {
    return (
      <motion.div className="fixed inset-0 flex flex-col bg-dark-900 overflow-hidden"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        <div className="scanlines" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 60%, rgba(255,0,110,0.08) 0%, transparent 65%)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/8 flex-shrink-0">
          <img src={uttaranchalLogo} alt="Uttaranchal University" className="h-9 object-contain opacity-75" />
          <img src={prashanbaanLogo} alt="PrashanBaan" className="h-11 object-contain" />
          <div className="text-right">
            <div className="font-body text-[8px] text-neon-yellow uppercase tracking-widest">Score</div>
            <div className="font-display text-3xl neon-text-yellow">{myPlayer?.score ?? 0}</div>
          </div>
        </div>

        {/* Toss-up label */}
        <div className="text-center pt-4 pb-2 flex-shrink-0">
          <div className="inline-block px-6 py-1 font-display text-sm tracking-[0.2em] text-neon-pink border border-neon-pink/40 bg-neon-pink/8"
            style={{ clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)' }}>
            ⚡ TOSS-UP — FIRST TO BUZZ WINS
          </div>
        </div>

        {/* Question — visible to all */}
        {question && (
          <div className="flex-1 flex flex-col px-5 pb-4 overflow-auto">
            <div className="neon-border-cyan p-5 bg-dark-800/80 mb-4 flex-shrink-0">
              <div className="font-body text-[8px] text-neon-cyan uppercase tracking-widest mb-3 italic">
                &gt; Question · {currentRound?.name}
              </div>
              <p className="font-body text-xl text-white leading-relaxed border-l-2 border-neon-cyan pl-3">
                <TypeWriter text={question.question} speed={20} onDone={handleTyped} />
              </p>
            </div>

            {/* Options — visible but NOT selectable before buzz */}
            <AnimatePresence>
              {optionsVisible && (
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {question.options?.map((opt, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-3 border border-white/8 bg-dark-700/60 flex items-center gap-2">
                      <span className="font-display text-lg text-white/15 italic flex-shrink-0">{LABELS[i]}</span>
                      <span className="font-body text-sm text-white/60">{opt}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* BIG BUZZ BUTTON */}
            <motion.button
              onClick={handleBuzz}
              animate={{ scale: [1, 1.03, 1], boxShadow: ['0 0 20px rgba(255,0,110,0.4)', '0 0 50px rgba(255,0,110,0.8)', '0 0 20px rgba(255,0,110,0.4)'] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="w-full py-8 font-display tracking-[0.3em] text-4xl neon-text-pink border-2 border-neon-pink bg-neon-pink/10 active:scale-95 mt-auto">
              ⚡ BUZZ IN
            </motion.button>
            <div className="text-center font-body text-[9px] text-white/20 tracking-widest uppercase mt-2">
              Tap · Press ENTER or SPACE
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ── PASSER WAITING SCREEN (you passed, toss-up is open) ───────────────────
  if (iAmPasser && isTossUp) {
    return (
      <div className="fixed inset-0 flex flex-col bg-dark-900 overflow-hidden">
        <div className="scanlines" />
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/8">
          <img src={uttaranchalLogo} alt="Uttaranchal University" className="h-9 object-contain opacity-75" />
          <img src={prashanbaanLogo} alt="PrashanBaan" className="h-11 object-contain" />
          <div className="text-right">
            <div className="font-body text-[8px] text-neon-yellow uppercase tracking-widest">Score</div>
            <div className="font-display text-3xl neon-text-yellow">{myPlayer?.score ?? 0}</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5">
          <div className="font-display text-5xl neon-text-pink tracking-widest">YOU PASSED</div>
          <div className="font-body text-xs text-white/30 tracking-widest uppercase text-center">
            Question is now open to all players
          </div>

          {/* Show the question text so passer knows what they passed */}
          {question && (
            <div className="w-full neon-border-pink p-4 bg-dark-800/60 mt-4">
              <div className="font-body text-[8px] text-neon-pink uppercase tracking-widest mb-2 italic">
                &gt; Passed Question
              </div>
              <p className="font-body text-lg text-white/70 leading-relaxed border-l-2 border-neon-pink/40 pl-3">
                {question.question}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-neon-pink" style={{ boxShadow: '0 0 8px #ff006e' }} />
            <div className="font-body text-[9px] text-white/25 tracking-widest uppercase">
              Awaiting a player to buzz in...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── BUZZ LOCKED — I won, waiting for question ─────────────────────────────
  if ((isBuzzLocked || (isTossUp && buzzed)) && !isTossUpQuestion && iAmBuzzWinner) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-dark-900 gap-6">
        <img src={prashanbaanLogo} alt="PrashanBaan" className="h-16 object-contain" />
        <div className="font-display text-5xl neon-text-cyan tracking-widest animate-pulse">SIGNAL ACQUIRED</div>
        <div className="w-10 h-10 border-t-2 border-neon-cyan rounded-full animate-spin" />
        <div className="font-body text-[9px] text-white/20 tracking-widest uppercase">Transferring question...</div>
      </div>
    );
  }

  // ── BUZZ LOCKED — I lost the buzzer ──────────────────────────────────────
  if (isBuzzLocked && buzzWinner && !iAmBuzzWinner) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-dark-900 gap-4">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,0,110,0.06) 0%, transparent 65%)' }} />
        <img src={prashanbaanLogo} alt="PrashanBaan" className="h-14 object-contain" />
        <div className="font-display text-6xl neon-text-pink animate-flicker">LOCKED OUT</div>
        <div className="font-body text-sm text-white/30 tracking-widest uppercase">
          {buzzWinner} got the buzzer
        </div>
        <div className="mt-4 font-body text-[9px] text-white/15 tracking-widest">
          Stand by for result...
        </div>
      </div>
    );
  }

  // ── MAIN PLAYER HUD ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid-bg flex flex-col p-4 relative overflow-hidden">

      {/* Score float overlays */}
      <AnimatePresence>
        {floats.map(f => (
          <motion.div key={f.id}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.3, y: -60 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
            onAnimationComplete={() => setFloats(fl => fl.filter(x => x.id !== f.id))}>
            <div className="font-display"
              style={{
                fontSize: '9rem', lineHeight: 1,
                color: f.points > 0 ? '#39ff14' : '#ff006e',
                textShadow: `0 0 40px ${f.points > 0 ? '#39ff14' : '#ff006e'}`,
              }}>
              {f.points > 0 ? '+' : ''}{f.points}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* HEADER with both logos */}
      <PlayerHeader score={myPlayer?.score} myPlayer={myPlayer} />

      {/* STATUS BAR */}
      <div className="mb-3 px-3 py-2 bg-dark-800 border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isMyTurn ? 'bg-neon-cyan animate-pulse' : 'bg-white/10'}`} />
          <span className="font-body text-[9px] text-white/40 tracking-widest uppercase">
            {isMyTurn ? '▶ YOUR TURN' : `Standby · ${activePlayer?.name || '—'} active`}
          </span>
          {myPlayer?.streak >= 3 && (
            <span className="streak-badge ml-2">🔥{myPlayer.streak}</span>
          )}
        </div>
        <span className="font-body text-[8px] text-white/20 tracking-widest">
          Q{qNum} · R{roundIdx + 1}/{roomState?.rounds?.length}
        </span>
      </div>

      {/* TIMER */}
      {(state === 'ACTIVE' || state === 'BUZZ_LOCKED') && (
        <div className="mb-4">
          <TimerBar seconds={timerSeconds} maxSeconds={maxTimer} size="normal" />
        </div>
      )}

      {/* QUESTION VIEW — my turn or toss-up winner */}
      <AnimatePresence mode="wait">
        {(isMyTurn || isTossUpQuestion) && question && !passed ? (
          <motion.div key={`my-turn-${qNum}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} className="flex-1 flex flex-col">

            <div className="neon-border-cyan p-5 bg-dark-800/80 mb-4 flex-1 shadow-2xl relative overflow-hidden">
              <div className="font-body text-[8px] text-neon-cyan uppercase tracking-widest mb-3 italic">
                &gt; {isTossUpQuestion ? `TOSS-UP · ${currentRound?.penaltyPoints}pts penalty` : `Your Question · +${currentRound?.correctPoints || 10}pts`}
              </div>
              <p className="font-body text-xl text-white leading-relaxed mb-5 border-l-2 border-neon-cyan pl-3">
                <TypeWriter text={question.question} speed={24} onDone={handleTyped} />
              </p>
              <AnimatePresence>
                {optionsVisible && question.options?.map((opt, i) => (
                  <motion.button key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.09 }}
                    onClick={() => handleSelect(i)}
                    disabled={submitted}
                    className={`option-btn mb-2 w-full ${selected === i ? 'selected' : ''} ${submitted ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    <span className="font-display text-lg mr-3 opacity-30 italic">{LABELS[i]}</span>
                    <span className="font-body text-base">{opt}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {!submitted && (
              <div className="flex gap-3">
                {canPass && (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                    onClick={handlePass}
                    className="btn-neon-pink flex-none px-8 py-4 text-lg font-display tracking-widest">
                    PASS ↷
                  </motion.button>
                )}
                <motion.button
                  whileHover={selected !== null ? { scale: 1.01 } : {}}
                  whileTap={selected !== null ? { scale: 0.97 } : {}}
                  onClick={handleSubmit}
                  disabled={selected === null}
                  className={`flex-1 py-4 text-xl font-display tracking-[0.2em] shadow-neon-cyan ${
                    isTossUpQuestion ? 'btn-neon-yellow' : 'btn-neon-cyan'
                  } ${selected === null ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isTossUpQuestion ? '⚡ SUBMIT TOSS-UP' : 'SUBMIT ANSWER'}
                </motion.button>
              </div>
            )}
            {submitted && (
              <div className="text-center py-4 font-body text-[9px] text-white/30 tracking-widest uppercase animate-pulse">
                Answer transmitted · awaiting verdict...
              </div>
            )}
          </motion.div>

        ) : passed && state === 'LOCKED' ? (
          /* PASSED — waiting for host to open toss-up */
          <motion.div key="passed-waiting"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="font-display text-5xl neon-text-pink tracking-widest">PASSED</div>
            <div className="font-body text-xs text-white/25 tracking-widest uppercase">
              {currentRound?.tossupOnPass ? 'Waiting for host to open toss-up...' : 'Question skipped'}
            </div>
          </motion.div>

        ) : (
          /* SPECTATING */
          <motion.div key="spectate"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center opacity-40 gap-5">
            <div className="w-12 h-12 border-t-2 border-neon-cyan rounded-full animate-spin" />
            <div className="font-display text-2xl text-white/20 tracking-[0.3em] uppercase italic">
              {lastResult ? 'Awaiting Next...' : 'Standby...'}
            </div>
            <AnimatePresence>
              {lastResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={`font-display text-3xl ${lastResult.correct ? 'neon-text-green' : 'neon-text-pink'}`}>
                    {lastResult.correct ? `✓ +${lastResult.pointsAwarded}` : `✗ ${lastResult.pointsAwarded}`}
                  </div>
                  <div className="font-body text-[9px] text-white/20 uppercase tracking-widest mt-1">
                    {lastResult.playerName}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
