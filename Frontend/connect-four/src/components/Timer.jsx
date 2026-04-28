import React, { useEffect, useState, useRef } from 'react';

/**
 * Timer supports two modes:
 *
 *  1. Local countdown (single-player / fallback) — pass `duration` and
 *     `isActive`. The component decrements internally and fires `onTimeUp`.
 *
 *  2. Server-driven (multiplayer) — pass `deadline` (epoch ms). The component
 *     simply renders the remaining seconds derived from the wall clock, so
 *     both players see the same value regardless of whose turn it is. The
 *     server is authoritative for the auto-move at expiry, so `onTimeUp` is
 *     intentionally not fired in this mode.
 */
const Timer = ({ duration = 30, deadline = null, onTimeUp, isActive = true }) => {
  const isServerDriven = deadline !== null && deadline !== undefined;

  const computeRemaining = () => {
    if (isServerDriven) {
      return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    }
    return duration;
  };

  const [timeLeft, setTimeLeft] = useState(computeRemaining);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  // Server-driven: sample the wall clock 4x/sec so the displayed second
  // updates promptly when the deadline rolls over.
  useEffect(() => {
    if (!isServerDriven) return;

    setTimeLeft(computeRemaining());
    const id = setInterval(() => {
      setTimeLeft(computeRemaining());
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  // Local countdown mode (kept for the single-player board).
  useEffect(() => {
    if (isServerDriven) return;
    setTimeLeft(duration);
  }, [duration, isActive, isServerDriven]);

  useEffect(() => {
    if (isServerDriven) return;
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTimeUpRef.current) onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isServerDriven]);

  const isWarning = timeLeft <= 10;
  const isCritical = timeLeft <= 5;
  const dimmed = isServerDriven && !isActive;

  return (
    <div className={`flex items-center space-x-2 ${dimmed ? 'opacity-60' : ''}`}>
      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-colors ${
        isCritical ? 'border-red-500 bg-red-50' :
        isWarning ? 'border-yellow-500 bg-yellow-50' :
        'border-blue-500'
      }`}>
        <span className={`text-xl font-bold ${
          isCritical ? 'text-red-600' :
          isWarning ? 'text-yellow-600' :
          ''
        }`}>{timeLeft}</span>
      </div>
      <span className="text-sm">seconds left</span>
    </div>
  );
};

export default Timer;
