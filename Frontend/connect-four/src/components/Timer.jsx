import React, { useEffect, useState, useRef } from 'react';

const Timer = ({ duration, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration, isActive]);

  useEffect(() => {
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
  }, [isActive]);

  const isWarning = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  return (
    <div className="flex items-center space-x-2">
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
