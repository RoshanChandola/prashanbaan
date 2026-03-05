import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_ROUND = (num) => ({
  roundNumber: num,
  name: `Round ${num}`,
  type: 'SEQUENTIAL',
  timerSeconds: 30,
  passAllowed: true,
  tossupOnPass: true,
  correctPoints: 10,
  penaltyPoints: -5,
  questions: [],
});

const EMPTY_Q = () => ({ question: '', options: ['', '', '', ''], answer: 0, points: 10, category: 'General' });

function QuestionEditor({ questions, onChange }) {
  const add = () => onChange([...questions, EMPTY_Q()]);
  const remove = (i) => onChange(questions.filter((_, idx) => idx !== i));
  const updateQ = (i, field, val) => {
    const q = [...questions];
    q[i] = { ...q[i], [field]: val };
    onChange(q);
  };
  const updateOpt = (qi, oi, val) => {
    const q = [...questions];
    q[qi].options[oi] = val;
    onChange(q);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="bg-dark-700 border border-white/8 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-2xl neon-text-cyan opacity-30">#{qi + 1}</span>
            <div className="flex items-center gap-3">
              <div>
                <label className="font-body text-[8px] text-white/25 uppercase tracking-widest block">Pts</label>
                <input type="number" value={q.points} min="1" max="100"
                  onChange={e => updateQ(qi, 'points', parseInt(e.target.value) || 10)}
                  className="w-16 bg-dark-900 border border-white/10 text-neon-yellow font-display text-lg text-center px-2 py-1 focus:outline-none focus:border-neon-yellow/50" />
              </div>
              <div>
                <label className="font-body text-[8px] text-white/25 uppercase tracking-widest block">Category</label>
                <input type="text" value={q.category || ''} placeholder="e.g. IT"
                  onChange={e => updateQ(qi, 'category', e.target.value)}
                  className="w-20 bg-dark-900 border border-white/10 text-white/60 font-body text-xs px-2 py-1 focus:outline-none focus:border-neon-cyan/30" />
              </div>
              <button onClick={() => remove(qi)} disabled={questions.length <= 1}
                className="text-white/20 hover:text-neon-pink transition-colors text-xl disabled:opacity-10 mt-3">✕</button>
            </div>
          </div>
          <textarea
            className="w-full bg-dark-900 border border-white/8 p-3 font-body text-sm text-white resize-none min-h-[56px] focus:outline-none focus:border-neon-cyan/40 transition-colors mb-3"
            placeholder="Type question here..."
            value={q.question}
            onChange={e => updateQ(qi, 'question', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className={`flex items-center gap-2 border p-2 transition-all ${q.answer === oi ? 'border-neon-green bg-neon-green/5' : 'border-white/5'}`}>
                <button onClick={() => updateQ(qi, 'answer', oi)}
                  className={`w-7 h-7 font-display text-sm flex items-center justify-center flex-shrink-0 transition-all ${q.answer === oi ? 'bg-neon-green text-dark-900' : 'bg-dark-900 text-white/20 border border-white/10 hover:border-neon-green/50'}`}>
                  {String.fromCharCode(65 + oi)}
                </button>
                <input
                  className="flex-1 bg-transparent text-sm text-white/80 focus:outline-none placeholder-white/10 font-body"
                  value={opt} placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  onChange={e => updateOpt(qi, oi, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={add}
        className="w-full py-3 border border-dashed border-neon-cyan/25 text-neon-cyan/50 hover:border-neon-cyan/60 hover:text-neon-cyan font-body text-xs tracking-widest uppercase transition-all">
        + ADD QUESTION
      </button>
    </div>
  );
}

export default function QuizBuilder({ onSave, onCancel }) {
  const [rounds, setRounds] = useState([DEFAULT_ROUND(1), DEFAULT_ROUND(2)]);
  const [activeRound, setActiveRound] = useState(0);
  const [step, setStep] = useState('rounds'); // rounds | questions | review

  const addRound = () => {
    if (rounds.length >= 6) return;
    setRounds(r => [...r, DEFAULT_ROUND(r.length + 1)]);
  };
  const removeRound = (i) => {
    if (rounds.length <= 1) return;
    const updated = rounds.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, roundNumber: idx + 1, name: r.name }));
    setRounds(updated);
    setActiveRound(Math.min(activeRound, updated.length - 1));
  };
  const updateRound = (i, field, val) => {
    setRounds(r => r.map((rnd, idx) => idx === i ? { ...rnd, [field]: val } : rnd));
  };
  const updateQuestions = (i, qs) => {
    setRounds(r => r.map((rnd, idx) => idx === i ? { ...rnd, questions: qs } : rnd));
  };

  const handleSave = () => {
    const valid = rounds.every(r => r.questions.length > 0 && r.questions.every(q => q.question.trim() && q.options.every(o => o.trim())));
    if (!valid) { alert('Each round needs at least 1 question with all options filled.'); return; }
    onSave(rounds);
  };

  const totalQ = rounds.reduce((sum, r) => sum + r.questions.length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-dark-900/98 overflow-y-auto p-4 grid-bg">
      <div className="max-w-3xl mx-auto pb-32">

        {/* Header */}
        <div className="sticky top-0 z-20 bg-dark-900/96 border-b border-neon-cyan/20 py-4 mb-8 backdrop-blur-sm flex justify-between items-center">
          <div>
            <h2 className="font-display text-3xl neon-text-cyan tracking-widest">QUIZ BUILDER</h2>
            <p className="font-body text-[9px] text-white/25 tracking-widest uppercase mt-1">
              PrashanBaan · IT UTSAV 4.0 · {rounds.length} ROUNDS · {totalQ} TOTAL QUESTIONS
            </p>
          </div>
          <button onClick={onCancel}
            className="font-body text-xs text-neon-pink border border-neon-pink/30 px-4 py-2 hover:bg-neon-pink/10 transition-all">
            ✕ CANCEL
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex gap-2 mb-8">
          {['rounds', 'questions', 'review'].map((s, i) => (
            <button key={s} onClick={() => setStep(s)}
              className={`flex-1 py-2 font-display text-sm tracking-widest transition-all ${step === s ? 'neon-text-cyan border-b-2 border-neon-cyan' : 'text-white/20 border-b border-white/10 hover:text-white/50'}`}>
              {i + 1}. {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* STEP: ROUNDS CONFIG */}
        {step === 'rounds' && (
          <div className="space-y-4">
            {rounds.map((round, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`bg-dark-800 border p-6 transition-all ${activeRound === i ? 'border-neon-cyan/50' : 'border-white/8'}`}
                onClick={() => setActiveRound(i)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-4xl text-white/10">R{i + 1}</span>
                    <div>
                      <input type="text" value={round.name}
                        onChange={e => updateRound(i, 'name', e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="bg-transparent font-display text-xl text-white focus:outline-none border-b border-white/10 focus:border-neon-cyan/50 w-56 pb-0.5"
                        placeholder={`Round ${i + 1}`} />
                      <div className="font-body text-[9px] text-white/20 mt-1">{round.questions.length} questions configured</div>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeRound(i); }}
                    disabled={rounds.length <= 1}
                    className="text-white/15 hover:text-neon-pink text-lg disabled:opacity-10 transition-colors">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-2">
                  {/* Round type */}
                  <div>
                    <label className="font-body text-[9px] text-white/25 uppercase tracking-widest block mb-2">Round Type</label>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 py-2.5 font-display text-sm tracking-widest transition-all ${round.type === 'SEQUENTIAL' ? 'border border-neon-cyan neon-text-cyan bg-neon-cyan/8' : 'border border-white/10 text-white/30 hover:border-white/30'}`}
                        onClick={e => { e.stopPropagation(); updateRound(i, 'type', 'SEQUENTIAL'); updateRound(i, 'passAllowed', true); updateRound(i, 'tossupOnPass', true); }}>
                        ◉ SEQUENTIAL
                      </button>
                      <button
                        className={`flex-1 py-2.5 font-display text-sm tracking-widest transition-all ${round.type === 'BLITZ' ? 'border border-neon-pink neon-text-pink bg-neon-pink/8' : 'border border-white/10 text-white/30 hover:border-white/30'}`}
                        onClick={e => { e.stopPropagation(); updateRound(i, 'type', 'BLITZ'); updateRound(i, 'passAllowed', false); updateRound(i, 'tossupOnPass', false); }}>
                        ⚡ BLITZ
                      </button>
                    </div>
                    <div className="font-body text-[8px] text-white/15 mt-1.5">
                      {round.type === 'BLITZ' ? 'All players buzz in simultaneously. ±pts.' : 'Active player answers or passes. Toss-up available.'}
                    </div>
                  </div>

                  {/* Timer */}
                  <div>
                    <label className="font-body text-[9px] text-white/25 uppercase tracking-widest block mb-2">
                      Time Per Question: <span className="neon-text-yellow font-display text-base">{round.timerSeconds}s</span>
                    </label>
                    <input type="range" min="5" max="120" step="5" value={round.timerSeconds}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateRound(i, 'timerSeconds', parseInt(e.target.value))}
                      className="w-full accent-neon-yellow cursor-pointer" />
                    <div className="flex justify-between font-body text-[8px] text-white/15 mt-1">
                      <span>5s</span><span>120s</span>
                    </div>
                  </div>

                  {/* Sequential options */}
                  {round.type === 'SEQUENTIAL' && (
                    <>
                      <div className="flex items-center gap-3 col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={round.passAllowed}
                            onChange={e => updateRound(i, 'passAllowed', e.target.checked)}
                            className="accent-neon-cyan w-4 h-4" />
                          <span className="font-body text-xs text-white/50">Allow player to pass question</span>
                        </label>
                        {round.passAllowed && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={round.tossupOnPass}
                              onChange={e => updateRound(i, 'tossupOnPass', e.target.checked)}
                              className="accent-neon-pink w-4 h-4" />
                            <span className="font-body text-xs text-white/50">Open passed questions to all</span>
                          </label>
                        )}
                      </div>
                    </>
                  )}

                  {/* Points */}
                  <div>
                    <label className="font-body text-[9px] text-white/25 uppercase tracking-widest block mb-1">Correct Points</label>
                    <input type="number" value={round.correctPoints} min="1" max="100"
                      onChange={e => updateRound(i, 'correctPoints', parseInt(e.target.value) || 10)}
                      onClick={e => e.stopPropagation()}
                      className="w-full bg-dark-700 border border-white/10 text-neon-green font-display text-2xl text-center py-2 focus:outline-none focus:border-neon-green/40" />
                  </div>
                  {(round.type === 'BLITZ' || round.tossupOnPass) && (
                    <div>
                      <label className="font-body text-[9px] text-white/25 uppercase tracking-widest block mb-1">Wrong Penalty</label>
                      <input type="number" value={round.penaltyPoints} max="0" min="-50"
                        onChange={e => updateRound(i, 'penaltyPoints', parseInt(e.target.value) || -5)}
                        onClick={e => e.stopPropagation()}
                        className="w-full bg-dark-700 border border-white/10 text-neon-pink font-display text-2xl text-center py-2 focus:outline-none focus:border-neon-pink/40" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {rounds.length < 6 && (
              <button onClick={addRound}
                className="w-full py-4 border border-dashed border-neon-cyan/20 text-neon-cyan/40 hover:border-neon-cyan/50 hover:text-neon-cyan font-display text-xl tracking-widest transition-all">
                + ADD ROUND
              </button>
            )}

            <button onClick={() => setStep('questions')}
              className="w-full btn-neon-cyan py-5 text-xl mt-4">
              CONFIGURE QUESTIONS →
            </button>
          </div>
        )}

        {/* STEP: QUESTIONS */}
        {step === 'questions' && (
          <div>
            {/* Round selector */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {rounds.map((r, i) => (
                <button key={i} onClick={() => setActiveRound(i)}
                  className={`px-5 py-2.5 font-display text-sm tracking-widest transition-all ${activeRound === i
                    ? (r.type === 'BLITZ' ? 'border border-neon-pink neon-text-pink' : 'border border-neon-cyan neon-text-cyan')
                    : 'border border-white/10 text-white/30 hover:border-white/30'}`}>
                  R{i + 1}: {r.name.split('—')[0].trim()} ({r.questions.length}Q)
                </button>
              ))}
            </div>

            <div className="neon-border-cyan p-1 mb-4">
              <div className="p-4 bg-dark-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-display text-sm tracking-widest ${rounds[activeRound]?.type === 'BLITZ' ? 'neon-text-pink' : 'neon-text-cyan'}`}>
                    {rounds[activeRound]?.type === 'BLITZ' ? '⚡ BLITZ' : '◉ SEQUENTIAL'}
                  </span>
                  <span className="font-body text-[9px] text-white/20">· {rounds[activeRound]?.timerSeconds}s per question</span>
                </div>
                <div className="font-display text-xl text-white">{rounds[activeRound]?.name}</div>
              </div>
            </div>

            <QuestionEditor
              questions={rounds[activeRound]?.questions || []}
              onChange={(qs) => updateQuestions(activeRound, qs)}
            />

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('rounds')} className="btn-neon-cyan flex-1 py-4">← BACK</button>
              <button onClick={() => setStep('review')} className="btn-neon-yellow flex-1 py-4 text-xl">REVIEW →</button>
            </div>
          </div>
        )}

        {/* STEP: REVIEW */}
        {step === 'review' && (
          <div>
            <div className="space-y-4 mb-8">
              {rounds.map((r, i) => (
                <div key={i} className={`p-5 bg-dark-800 border ${r.type === 'BLITZ' ? 'border-neon-pink/30' : 'border-neon-cyan/30'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-display text-2xl ${r.type === 'BLITZ' ? 'neon-text-pink' : 'neon-text-cyan'}`}>
                        {r.name}
                      </span>
                      <div className="font-body text-[9px] text-white/25 mt-1 tracking-widest">
                        {r.type} · {r.timerSeconds}s · {r.questions.length} questions · +{r.correctPoints} / {r.penaltyPoints}pts
                        {r.passAllowed ? ' · pass allowed' : ''}
                      </div>
                    </div>
                    <button onClick={() => { setActiveRound(i); setStep('questions'); }}
                      className="font-body text-[9px] text-neon-cyan/50 hover:text-neon-cyan tracking-widest uppercase">
                      EDIT
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mb-4">
              <div className="font-body text-xs text-white/25 tracking-widest">
                {rounds.length} rounds · {totalQ} total questions
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('questions')} className="btn-neon-cyan flex-1 py-4">← BACK</button>
              <button onClick={handleSave} className="btn-neon-yellow flex-1 py-5 text-2xl italic">
                ⚡ DEPLOY QUIZ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
