import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Typewriter from './Typewriter';

const LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionPanel({
  question,
  showAnswer = false,
  onToggleAnswer,
  selectedIndex = null,
  onSelect,
  submitted = false,
  lastResult = null,
  questionNum = 1,
  totalQuestions = 10,
  showPassButton = false,
  onPass,
  disabled = false,
}) {
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [textDone, setTextDone] = useState(false);

  useEffect(() => {
    setOptionsVisible(false);
    setTextDone(false);
  }, [question?.question]);

  const handleTextDone = () => {
    setTextDone(true);
    setTimeout(() => setOptionsVisible(true), 200);
  };

  if (!question) return null;

  const getOptionClass = (i) => {
    if (lastResult) {
      if (i === lastResult.correctIndex) return 'correct';
      if (i === lastResult.answerIndex && !lastResult.correct) return 'wrong';
      if (i !== lastResult.correctIndex) return 'dimmed';
    }
    if (showAnswer && i === question.answer) return 'correct';
    if (selectedIndex === i) return 'selected';
    return '';
  };

  return (
    <div className="neon-border-cyan bg-dark-800/90 relative overflow-hidden">
      <div className="absolute top-0 right-0 font-display text-[8rem] text-white/3 pointer-events-none select-none leading-none p-2">
        Q{questionNum}
      </div>

      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="font-body text-[9px] text-neon-cyan tracking-[0.35em] uppercase italic">
            &gt; Question Stream · Q{questionNum}/{totalQuestions}
          </div>
          <div className="flex items-center gap-2">
            {question.category && (
              <span className="font-body text-[8px] text-neon-yellow border border-neon-yellow/25 px-2 py-0.5 tracking-wider">
                {question.category}
              </span>
            )}
            <span className="font-body text-[8px] text-white/20 border border-white/10 px-2 py-0.5">
              +{question.points || 10} pts
            </span>
          </div>
        </div>

        <div className="h-0.5 w-full bg-dark-700 mb-5">
          <div className="h-full bg-neon-cyan/40 transition-all"
            style={{ width: `${(questionNum / totalQuestions) * 100}%` }} />
        </div>

        <div className="border-l-2 border-neon-cyan pl-5 mb-6 min-h-[3rem]">
          <p className="font-body text-lg text-white leading-relaxed">
            <Typewriter text={question.question} speed={22} onDone={handleTextDone} />
          </p>
        </div>

        <div className="space-y-2.5">
          {question.options.map((opt, i) => (
            <AnimatePresence key={i}>
              {(optionsVisible || lastResult) && (
                <motion.button
                  key={`opt-${questionNum}-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`option-btn py-3.5 px-5 ${getOptionClass(i)}`}
                  onClick={() => !disabled && !submitted && onSelect?.(i)}
                  disabled={disabled || submitted}
                >
                  <span className="font-display text-xl opacity-30 italic mr-3 flex-shrink-0">{LABELS[i]}</span>
                  <span className="text-sm flex-1 text-left">{opt}</span>
                  {lastResult && i === lastResult.correctIndex && (
                    <span className="neon-text-green font-display text-sm ml-auto flex-shrink-0">CORRECT</span>
                  )}
                  {lastResult && i === lastResult.answerIndex && !lastResult.correct && (
                    <span className="neon-text-pink font-display text-sm ml-auto flex-shrink-0">WRONG</span>
                  )}
                  {showAnswer && !lastResult && i === question.answer && (
                    <span className="neon-text-green font-body text-xs ml-auto flex-shrink-0">CORRECT</span>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          ))}
        </div>

        {onToggleAnswer && (
          <button
            className="mt-4 font-body text-[9px] text-white/20 hover:text-neon-yellow tracking-[0.4em] uppercase transition-colors"
            onClick={onToggleAnswer}
          >
            {showAnswer ? 'Hide Answer' : 'Reveal Correct Answer'}
          </button>
        )}

        {showPassButton && !submitted && !lastResult && (
          <button
            className="mt-3 w-full btn-neon-yellow py-2.5 text-sm tracking-widest"
            onClick={onPass}
          >
            PASS QUESTION
          </button>
        )}
      </div>
    </div>
  );
}
