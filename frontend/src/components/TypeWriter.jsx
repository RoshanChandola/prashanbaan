import { useState, useEffect, useRef } from 'react';

export default function TypeWriter({ text = '', speed = 28, className = '', onDone }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    idx.current = 0;
    clearInterval(timer.current);

    if (!text) return;

    timer.current = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(timer.current);
        setDone(true);
        onDone?.();
      }
    }, speed);

    return () => clearInterval(timer.current);
  }, [text]);

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle animate-pulse" />
      )}
    </span>
  );
}
