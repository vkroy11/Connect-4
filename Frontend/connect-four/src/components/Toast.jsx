import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'error', onDismiss, duration = 4000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const bgColor = type === 'error'
    ? 'bg-red-500'
    : type === 'success'
    ? 'bg-green-500'
    : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm`}>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => { setVisible(false); setTimeout(() => onDismiss?.(), 300); }}
          className="text-white/80 hover:text-white font-bold text-lg leading-none"
        >
          x
        </button>
      </div>
    </div>
  );
};

export default Toast;
