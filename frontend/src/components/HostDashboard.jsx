import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import prashanbaanLogo from '../assets/prashanbaan-logo.png';
import uttaranchalLogo from '../assets/uttaranchal-logo.png';
import Leaderboard from './Leaderboard';
import TimerBar from './TimerBar';
import TypeWriter from './TypeWriter';
import { Sounds } from '../hooks/useSound';
import { useGameStore } from '../store/gameStore';

const LABELS = ['A', 'B', 'C', 'D'];

export default function HostDashboard({
  roomState, question, timerSeconds,
  onEnableTossup, onSkipTossup, onNextQuestion,
  lastResult, buzzWinner,
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [resultFlash, setResultFlash] = useState(false);
  const [questionReady, setQuestionReady] = useState(false);
  const isMuted = useGameStore(s => s.isMuted);
  const toggleMute = useGameStore(s => s.toggleMute);
  const prevResult = useRef(null);

  const state = roomState?.state;
  const currentRound = roomState?.rounds?.[roomState?.currentRoundIndex];
  const totalQ = currentRound?.questionCount || roomState?.totalQuestions || 0;
  const qNum = (roomState?.currentQuestionIndex || 0) + 1;
  const activePlayer = roomState?.players?.[roomState?.currentPlayerIndex];
  const isBlitz = currentRound?.type === 'BLITZ';
  const isSequential = currentRound?.type === 'SEQUENTIAL';
  const roundIdx = roomState?.currentRoundIndex ?? 0;
  const totalRounds = roomState?.rounds?.length || 1;
  const passedBy = roomState?.passedBy;

  // Reset answer reveal when question changes
  useEffect(() => {
    setShowAnswer(false);
    setQuestionReady(false);
  }, [qNum, roundIdx]);

  // Flash result panel when a result arrives
  useEffect(() => {
    if (lastResult && lastResult !== prevResult.current) {
      prevResult.current = lastResult;
      setResultFlash(true);
      setTimeout(() => setResultFlash(false), 600);
      if (!isMuted) {
        if (lastResult.correct) Sounds.correct();
        else Sounds.wrong();
      }
    }
  }, [lastResult]);

  const canEnableTossup = state === 'LOCKED' && isSequential && !lastResult?.correct;
  const canNext = state === 'LOCKED' || state === 'BUZZ_LOCKED';

  return (
    <div className="min-h-screen grid-bg p-3 flex flex-col overflow-hidden">

      {/* ── TOP HUD ── */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/8">
        {/* Dual logos */}
        <div className="flex items-center gap-3">
          <img src={uttaranchalLogo} alt="Uttaranchal University" className="h-10 object-contain opacity-80" />
          <img src={prashanbaanLogo} alt="PrashanBaan" className="h-12 object-contain" />
        </div>

        {/* Round + Question progress */}
        <div className="flex items-center gap-4">
          <div className={`px-4 py-1 font-display text-sm tracking-widest border ${
            isBlitz ? 'border-neon-pink/40 text-neon-pink' : 'border-neon-cyan/40 neon-text-cyan'
          }`} style={{ clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}>
            {isBlitz ? '⚡ BLITZ' : '◉ SEQ'} R{roundIdx + 1}/{totalRounds}
          </div>
          <div className="text-center">
            <div className="font-body text-[8px] text-white/20 tracking-widest uppercase">Question</div>
            <div className="font-display text-2xl text-white">{qNum}<span className="text-white/20 text-base"> / {totalQ}</span></div>
          </div>
          <div className="text-center">
            <div className="font-body text-[8px] text-white/20 tracking-widest uppercase">Room</div>
            <div className="font-display text-xl neon-text-cyan tracking-widest">{roomState?.code}</div>
          </div>
        </div>

        {/* Mute */}
        <button onClick={toggleMute}
          className="font-body text-[9px] text-white/20 hover:text-neon-cyan tracking-widest uppercase border border-white/8 hover:border-neon-cyan/30 px-3 py-2 transition-all">
          {isMuted ? '🔇 MUTED' : '🔊 SOUND'}
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* LEFT: Live leaderboard */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-3">
          <div className="neon-border-cyan p-3 bg-dark-800/80 flex-1 overflow-hidden flex flex-col">
            <div className="font-body text-[8px] text-white/20 uppercase tracking-widest mb-3 italic">&gt; Live Standings</div>
            <div className="flex-1 overflow-y-auto">
              <Leaderboard players={roomState?.players || []} compact />
            </div>
          </div>
          <div className="p-3 bg-dark-800/80 border border-white/5">
            <div className="font-body text-[8px] text-white/20 uppercase tracking-widest mb-2">Timer</div>
            <TimerBar seconds={timerSeconds} maxSeconds={currentRound?.timerSeconds || 30} size="normal" />
          </div>
        </div>

        {/* RIGHT: Question panel */}
        <div className="flex-1 flex flex-col min-w-0 gap-3">

          {/* Active player / state indicator */}
          <div className={`flex items-center gap-3 px-4 py-2 border ${
            state === 'TOSS_UP' || state === 'BUZZ_LOCKED'
              ? 'border-neon-pink/40 bg-neon-pink/5'
              : state === 'LOCKED' ? 'border-neon-yellow/30 bg-dark-800'
              : 'border-neon-cyan/30 bg-dark-800'
          }`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${
              state === 'TOSS_UP' ? 'bg-neon-pink' :
              state === 'LOCKED' || state === 'BUZZ_LOCKED' ? 'bg-neon-yellow' : 'bg-neon-cyan'
            }`} />
            <div className="font-display text-lg text-white tracking-wider flex-1">
              {state === 'TOSS_UP' ? '⚡ ALL PILOTS — BUZZER OPEN' :
               state === 'BUZZ_LOCKED' ? `⚡ ${buzzWinner || '?'} IS ANSWERING` :
               state === 'LOCKED' && passedBy ? `${passedBy} PASSED` :
               state === 'LOCKED' ? '🔒 QUESTION LOCKED' :
               activePlayer?.name ? `▶ ${activePlayer.name}` : 'WAITING'}
            </div>
            {state === 'ACTIVE' && isSequential && (
              <div className="font-body text-[9px] text-white/20 tracking-widest">
                {currentRound?.passAllowed ? 'Player can pass' : 'No pass'}
              </div>
            )}
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            {question ? (
              <motion.div key={`q-${qNum}-${roundIdx}`}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.3 }}
                className="neon-border-cyan p-5 bg-dark-800/80 flex-1 relative overflow-hidden">

                {/* Watermark */}
                <div className="absolute top-0 right-0 font-display text-white/3 pointer-events-none select-none"
                  style={{ fontSize: '9rem', lineHeight: 1 }}>Q{qNum}</div>

                <div className="font-body text-[8px] text-neon-cyan uppercase tracking-widest mb-3 italic">
                  &gt; Incoming Question Stream · {currentRound?.name}
                </div>

                <p className="font-body text-xl text-white leading-relaxed mb-5 border-l-4 border-neon-cyan/60 pl-4 relative z-10">
                  <TypeWriter text={question.question} speed={22} />
                </p>

                <div className="grid grid-cols-2 gap-2.5 mb-4 relative z-10">
                  {question.options?.map((opt, i) => {
                    const isCorrect = i === question.answer;
                    return (
                      <div key={i} className={`p-3 border transition-all duration-300 ${
                        showAnswer && isCorrect
                          ? 'border-neon-green bg-neon-green/10 shadow-neon-green'
                          : 'border-white/6 bg-dark-700/60'
                      }`}>
                        <div className="flex items-start gap-3">
                          <span className="font-display text-xl text-white/20 flex-shrink-0 italic">{LABELS[i]}</span>
                          <span className="font-body text-sm text-white/85 leading-snug">{opt}</span>
                          {showAnswer && isCorrect && (
                            <span className="ml-auto neon-text-green font-display text-xs flex-shrink-0 animate-pulse">✓</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => setShowAnswer(v => !v)}
                  className="font-body text-[9px] text-white/20 hover:text-neon-yellow uppercase tracking-widest transition-all">
                  {showAnswer ? '<< Conceal Answer >>' : '<< Reveal Correct Answer >>'}
                </button>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center opacity-20">
                <div className="w-10 h-10 border-2 border-t-neon-cyan rounded-full animate-spin" />
              </div>
            )}
          </AnimatePresence>

          {/* Result display */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                key={`result-${lastResult.playerName}-${lastResult.pointsAwarded}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`px-4 py-3 border-t-2 border-b-2 text-center ${
                  resultFlash ? 'opacity-100' : 'opacity-90'
                } ${lastResult.correct
                  ? 'border-neon-green bg-neon-green/5'
                  : 'border-neon-pink bg-neon-pink/5'
                }`}>
                <div className={`font-display text-3xl tracking-widest ${lastResult.correct ? 'neon-text-green' : 'neon-text-pink'}`}>
                  {lastResult.correct
                    ? `✓ CORRECT  +${lastResult.pointsAwarded}`
                    : `✗ WRONG  ${lastResult.pointsAwarded > 0 ? '+' : ''}${lastResult.pointsAwarded}`}
                </div>
                <div className="font-body text-[9px] text-white/30 uppercase tracking-widest mt-1">
                  {lastResult.playerName} · {lastResult.isTossUp ? 'toss-up answer' : 'direct answer'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buzz winner banner */}
          <AnimatePresence>
            {buzzWinner && state === 'BUZZ_LOCKED' && !lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="px-4 py-3 bg-neon-yellow/8 border border-neon-yellow/30 text-center">
                <div className="font-display text-2xl neon-text-yellow tracking-widest italic uppercase">
                  ⚡ {buzzWinner} BUZZED IN!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Control Panel */}
          <div className="flex gap-3 bg-dark-900/80 p-3 border-t border-white/5">
            {canEnableTossup && (
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="btn-neon-yellow flex-1 py-4 text-lg font-display tracking-widest italic"
                onClick={onEnableTossup}>
                ⚡ OPEN TOSS-UP
              </motion.button>
            )}
            {canEnableTossup && (
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="btn-neon-pink px-6 py-4 text-sm font-display tracking-widest"
                onClick={onSkipTossup}>
                SKIP →
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="btn-neon-cyan flex-1 py-4 text-lg font-display tracking-widest shadow-neon-cyan"
              onClick={onNextQuestion}
              disabled={!canNext && !lastResult}>
              {lastResult ? 'NEXT QUESTION →' : canNext ? 'PASS ↷' : 'WAITING...'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
