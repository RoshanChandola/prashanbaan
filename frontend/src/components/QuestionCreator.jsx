import { useState } from 'react';

export default function QuestionCreator({ onSave, onCancel }) {
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], answer: 0, points: 10 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], answer: 0, points: 10 }]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQ = (index, field, value) => {
    const q = [...questions];
    q[index][field] = value;
    setQuestions(q);
  };

  const updateOpt = (qIdx, oIdx, value) => {
    const q = [...questions];
    q[qIdx].options[oIdx] = value;
    setQuestions(q);
  };

  const handleSave = () => {
    const isValid = questions.every(q => q.question.trim() && q.options.every(o => o.trim()));
    if (!isValid) { alert('Please fill in all questions and all 4 options before saving.'); return; }
    onSave(questions);
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-900/98 overflow-y-auto p-4 md:p-8 grid-bg">
      <div className="max-w-3xl mx-auto pb-24">

        {/* Header */}
        <div className="flex justify-between items-center mb-10 sticky top-0 bg-dark-900/95 py-4 z-10 border-b border-neon-cyan/20 backdrop-blur-sm">
          <div>
            <h2 className="font-display text-3xl neon-text-cyan tracking-widest animate-flicker">
              QUESTION BUILDER
            </h2>
            <p className="font-body text-[9px] text-white/30 tracking-widest uppercase mt-1">
              PrashanBaan · IT UTSAV 4.0 · Custom Arsenal
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-body text-[9px] text-white/20 tracking-widest">{questions.length} QUESTION{questions.length !== 1 ? 'S' : ''}</span>
            <button onClick={onCancel}
              className="font-body text-xs text-neon-pink border border-neon-pink/30 px-4 py-2 hover:bg-neon-pink/10 transition-all">
              ✕ CANCEL
            </button>
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qIdx) => (
          <div key={qIdx}
            className="neon-border-cyan bg-dark-800 p-6 mb-6 animate-slide-up relative"
            style={{ animationDelay: `${qIdx * 0.06}s` }}>

            {/* Question header */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl neon-text-cyan opacity-40">#{qIdx + 1}</span>
                <div className="h-px w-10 bg-neon-cyan/20" />
              </div>
              <div className="flex items-center gap-5">
                <div>
                  <label className="font-body text-[9px] text-white/25 uppercase tracking-widest block mb-1">Points</label>
                  <input type="number" value={q.points}
                    onChange={e => updateQ(qIdx, 'points', e.target.value)}
                    className="bg-dark-700 text-neon-yellow w-20 px-3 py-1 text-center font-display text-xl
                      border border-white/10 focus:border-neon-yellow outline-none" />
                </div>
                <button onClick={() => removeQuestion(qIdx)}
                  disabled={questions.length === 1}
                  className="text-white/20 hover:text-neon-pink transition-colors text-xl p-2 disabled:opacity-20">
                  ✕
                </button>
              </div>
            </div>

            {/* Question text */}
            <div className="mb-5">
              <label className="font-body text-[9px] text-white/30 uppercase tracking-widest block mb-2">Question Text</label>
              <textarea
                className="w-full bg-dark-700 border border-white/10 p-4 font-body text-sm text-white
                  focus:border-neon-cyan outline-none transition-all min-h-[70px] resize-none"
                placeholder="Type your question here..."
                value={q.question}
                onChange={e => updateQ(qIdx, 'question', e.target.value)}
              />
            </div>

            {/* Options */}
            <div>
              <label className="font-body text-[9px] text-white/30 uppercase tracking-widest block mb-3">
                Options · Click letter to mark as correct answer
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx}
                    className={`flex items-center gap-3 p-2 border transition-all ${
                      q.answer === oIdx ? 'border-neon-green bg-neon-green/5' : 'border-white/5 bg-dark-700'
                    }`}>
                    <button onClick={() => updateQ(qIdx, 'answer', oIdx)}
                      className={`w-9 h-9 font-display text-lg flex items-center justify-center transition-all flex-shrink-0 ${
                        q.answer === oIdx
                          ? 'bg-neon-green text-dark-900 shadow-neon-green'
                          : 'bg-dark-900 text-white/25 border border-white/10 hover:border-neon-green hover:text-neon-green'
                      }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </button>
                    <input
                      className="flex-1 bg-transparent border-none p-2 text-sm text-white focus:outline-none placeholder-white/10"
                      value={opt}
                      onChange={e => updateOpt(qIdx, oIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}...`}
                    />
                    {q.answer === oIdx && (
                      <span className="text-neon-green text-[8px] font-body tracking-tight pr-2 flex-shrink-0">✓ CORRECT</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Footer actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/95 border-t border-white/10 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto flex gap-4">
            <button onClick={addQuestion}
              className="btn-neon-cyan flex-1 py-4 flex items-center justify-center gap-2 group text-lg">
              <span className="text-2xl transition-transform group-hover:rotate-90">+</span>
              ADD QUESTION
            </button>
            <button onClick={handleSave}
              className="btn-neon-yellow flex-1 py-4 font-display text-xl tracking-[0.2em]">
              ⚡ DEPLOY QUIZ ({questions.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
