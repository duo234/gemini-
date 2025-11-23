
let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
  
  // Envelope to prevent clicking and make it sound "plucky"
  gain.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime + startTime);
  osc.stop(audioCtx.currentTime + startTime + duration);
};

export const playCollectSound = () => {
  if (!audioCtx) return;
  // Cute "Bloop" / High pitch sine
  playTone(800, 'sine', 0.1, 0, 0.1);
  // Slight harmonic
  playTone(1600, 'sine', 0.1, 0, 0.05);
};

export const playGoldenSound = () => {
   if (!audioCtx) return;
   // Magical Major Arpeggio
   const now = 0;
   playTone(880, 'sine', 0.2, now, 0.1);      // A5
   playTone(1108, 'sine', 0.2, now + 0.1, 0.1); // C#6
   playTone(1318, 'sine', 0.4, now + 0.2, 0.1); // E6
};

export const playPoisonSound = () => {
  if (!audioCtx) return;
  // Unpleasant low buzz
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
};

export const playGameOverSound = () => {
    if (!audioCtx) return;
    // Simple finish jingle
    playTone(523.25, 'triangle', 0.2, 0, 0.1); // C
    playTone(659.25, 'triangle', 0.2, 0.2, 0.1); // E
    playTone(783.99, 'triangle', 0.6, 0.4, 0.1); // G
};
