
let audioCtx: AudioContext | null = null;
let bgmInterval: number | null = null;
let stepIndex = 0; // 16 steps per bar

// C Minor Pentatonic Scale frequencies for Arpeggios
// C4, Eb4, F4, G4, Bb4, C5
const SCALE = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25];
// Bass progression (C -> Ab -> F -> G)
const BASS_ROOTS = [65.41, 51.91, 43.65, 49.00]; 

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

// A "Fat" Sawtooth synth (Dual oscillators with detune) for that Cyberpunk bass
const playSuperSaw = (freq: number, duration: number, time: number) => {
  if (!audioCtx) return;
  const gain = audioCtx.createGain();
  gain.connect(audioCtx.destination);
  
  // Envelope
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.3, time + 0.05); // Attack
  gain.gain.exponentialRampToValueAtTime(0.01, time + duration); // Release

  // Osc 1
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.value = freq;
  osc1.detune.value = -10; // Slightly flat
  osc1.connect(gain);

  // Osc 2
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.value = freq;
  osc2.detune.value = 10; // Slightly sharp
  osc2.connect(gain);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration + 0.1);
  osc2.stop(time + duration + 0.1);
};

const playKick = (time: number) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
  
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(time);
  osc.stop(time + 0.5);
};

const playSnare = (time: number) => {
    if (!audioCtx) return;
    // Noise burst
    const bufferSize = audioCtx.sampleRate * 0.2; // 200ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2); // Decay volume
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // Filter to make it sound less like static
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.4;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(time);
};

const playArp = (freq: number, time: number) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square'; // Chiptune-ish
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    // Slight delay effect simulation (echo)
    const delay = audioCtx.createDelay();
    delay.delayTime.value = 0.15;
    const delayGain = audioCtx.createGain();
    delayGain.gain.value = 0.4;

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.2);
};

export const startMusic = () => {
  if (!audioCtx) initAudio();
  if (bgmInterval) clearInterval(bgmInterval);
  
  stepIndex = 0;
  const bpm = 125;
  const sixteenthTime = (60 / bpm) / 4; // Time for one 16th note

  // We schedule ahead slightly to avoid lag
  bgmInterval = window.setInterval(() => {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Loop length: 32 steps (2 bars)
    const patternPos = stepIndex % 32; 
    const barPos = Math.floor(stepIndex / 16) % BASS_ROOTS.length;
    const beatPos = stepIndex % 4; // 0, 1, 2, 3 (16th notes inside a beat)

    // 1. Bass (Driving 8th notes)
    if (beatPos === 0 || beatPos === 2) {
        // Change root note every 16 steps (1 bar)
        const rootIdx = Math.floor(stepIndex / 32) % BASS_ROOTS.length;
        playSuperSaw(BASS_ROOTS[rootIdx], 0.2, now);
    }

    // 2. Drums
    if (patternPos % 4 === 0) playKick(now); // Kick on 1, 2, 3, 4
    if (patternPos % 8 === 4) playSnare(now); // Snare on 2 and 4

    // 3. Arpeggiator (Random techy blips on 16th notes)
    if (Math.random() > 0.4) {
        const note = SCALE[Math.floor(Math.random() * SCALE.length)];
        // Play higher octave for sparkle
        playArp(note * 2, now);
    }

    stepIndex++;
  }, sixteenthTime * 1000); 
};

export const stopMusic = () => {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
};

// --- SFX ---

export const playCollectSound = () => {
  if (!audioCtx) return;
  // High melodic chime
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
};

export const playGoldenSound = () => {
   if (!audioCtx) return;
   // Major Chord Powerup
   [440, 554.37, 659.25].forEach((freq, i) => {
       const osc = audioCtx!.createOscillator();
       const gain = audioCtx!.createGain();
       osc.type = 'triangle';
       osc.frequency.value = freq;
       gain.gain.setValueAtTime(0.05, audioCtx!.currentTime);
       gain.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 0.4);
       osc.connect(gain);
       gain.connect(audioCtx!.destination);
       osc.start(audioCtx!.currentTime + i * 0.05);
       osc.stop(audioCtx!.currentTime + 0.5);
   });
};

export const playPoisonSound = () => {
  if (!audioCtx) return;
  // Downward glitch
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
  gain.gain.value = 0.2;
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
};

export const playGameOverSound = () => {
    stopMusic();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 1.5);
    gain.gain.value = 0.3;
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.5);
};
