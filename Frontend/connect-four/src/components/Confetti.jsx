import React, { useMemo } from 'react';

const COLORS = [
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#facc15', // yellow-400
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
];

/**
 * Lightweight CSS-only confetti overlay. Renders ~80 absolutely-positioned
 * pieces that fall from the top with randomised horizontal positions, delays,
 * durations, colours, and shapes. Self-contained so it doesn't add a dep.
 */
const Confetti = ({ pieceCount = 80, durationSeconds = 4 }) => {
  const pieces = useMemo(() => {
    return Array.from({ length: pieceCount }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.6;
      const dur = durationSeconds * (0.7 + Math.random() * 0.6);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = 6 + Math.random() * 8;
      const isCircle = Math.random() < 0.4;
      const rotate = Math.floor(Math.random() * 360);
      return { i, left, delay, dur, color, size, isCircle, rotate };
    });
  }, [pieceCount, durationSeconds]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * (p.isCircle ? 1 : 1.6)}px`,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
