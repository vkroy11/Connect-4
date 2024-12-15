import React, { useEffect, useState } from 'react';

const Timer = ({ duration, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration, onTimeUp, isActive]);

  return (
    <div className="flex items-center space-x-2">
      <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center">
        <span className="text-xl font-bold">{timeLeft}</span>
      </div>
      <span className="text-sm">seconds left</span>
    </div>
  );
};

export default Timer;
