import { useEffect, useState } from 'react';

export default function ScoreFloat({ points, x, y, onDone }) {
  const isPositive = points > 0;
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="score-float" style={{
      left: x || '50%', top: y || '40%',
      color: isPositive ? '#39ff14' : '#ff006e',
      textShadow: `0 0 20px ${isPositive ? '#39ff14' : '#ff006e'}`,
      transform: 'translateX(-50%)',
    }}>
      {isPositive ? '+' : ''}{points}
    </div>
  );
}
