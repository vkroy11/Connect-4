let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playDropSound() {
  playTone(300, 0.15, 'sine', 0.1);
  setTimeout(() => playTone(200, 0.1, 'sine', 0.08), 100);
}

export function playWinSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.12), i * 150);
  });
}

export function playLoseSound() {
  playTone(300, 0.3, 'sawtooth', 0.08);
  setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.06), 200);
}

export function playDrawSound() {
  playTone(440, 0.2, 'triangle', 0.1);
  setTimeout(() => playTone(440, 0.2, 'triangle', 0.1), 300);
}

export function playTurnSound() {
  playTone(600, 0.08, 'sine', 0.05);
}
