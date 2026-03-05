import { useEffect, useRef } from 'react';
import { useAudio } from '../hooks/useSound';

export default function TimerBar({ seconds, maxSeconds = 30, showNumber = true, size = 'normal' }) {
  const { play } = useAudio();
  const lastSec = useRef(seconds);
  const percent = Math.max(0, (seconds / maxSeconds) * 100);
  const color = seconds > 10 ? '#00f5ff' : seconds > 5 ? '#ffbe00' : '#ff006e';
  const isPanic = seconds <= 5 && seconds > 0;

  useEffect(() => {
    if (seconds !== lastSec.current && seconds > 0) {
      if (seconds <= 5) play('tickFast');
      else if (seconds <= 10) play('tick');
      lastSec.current = seconds;
    }
  }, [seconds]);

  const heights = { small: 'h-1.5', normal: 'h-2.5', large: 'h-4' };

  return (
    <div className="w-full">
      <div
        className={`relative w-full bg-dark-700 overflow-hidden ${heights[size] || heights.normal}`}
        style={{ clipPath: 'polygon(0% 0%, 97% 0%, 100% 50%, 97% 100%, 0% 100%)' }}
      >
        <div
          className="h-full transition-all duration-1000"
          style={{
            width: `${percent}%`,
            background: color,
            boxShadow: `0 0 ${isPanic ? '16px' : '8px'} ${color}`,
          }}
        />
        {isPanic && (
          <div
            className="absolute inset-0 animate-pulse opacity-30"
            style={{ background: color }}
          />
        )}
      </div>
      {showNumber && (
        <div
          className="text-right font-display mt-1"
          style={{
            color,
            fontSize: size === 'large' ? '2rem' : '1.25rem',
            textShadow: `0 0 12px ${color}`,
          }}
        >
          {seconds}s
        </div>
      )}
    </div>
  );
}
