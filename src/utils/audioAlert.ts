// Web Audio API Emergency Siren and Sonar Sound Generator

let audioCtx: AudioContext | null = null;
let sirenOsc1: OscillatorNode | null = null;
let sirenOsc2: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let sirenInterval: number | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const audioAlert = {
  // Plays a repeating dual-frequency clinical emergency siren
  startEmergencySiren: (): void => {
    try {
      if (sirenOsc1 || sirenOsc2) return; // Already running

      const ctx = getAudioContext();
      sirenGain = ctx.createGain();
      sirenGain.gain.setValueAtTime(0.0, ctx.currentTime);
      
      // Gentle fade-in to prevent click popping
      sirenGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1); 
      sirenGain.connect(ctx.destination);

      // Create two oscillators for a rich, dissonant dual-tone siren
      sirenOsc1 = ctx.createOscillator();
      sirenOsc2 = ctx.createOscillator();

      sirenOsc1.type = 'sine';
      sirenOsc2.type = 'triangle';

      sirenOsc1.connect(sirenGain);
      sirenOsc2.connect(sirenGain);

      sirenOsc1.start();
      sirenOsc2.start();

      let toggle = false;
      const sirenTick = () => {
        if (!sirenOsc1 || !sirenOsc2 || !sirenGain || !ctx) return;
        const now = ctx.currentTime;
        
        if (toggle) {
          // Tone 1: High warning pitch
          sirenOsc1.frequency.exponentialRampToValueAtTime(960, now + 0.3);
          sirenOsc2.frequency.exponentialRampToValueAtTime(770, now + 0.3);
        } else {
          // Tone 2: Low warning pitch
          sirenOsc1.frequency.exponentialRampToValueAtTime(600, now + 0.3);
          sirenOsc2.frequency.exponentialRampToValueAtTime(480, now + 0.3);
        }
        toggle = !toggle;
      };

      // Set up the siren cadence (swaps tones every 400ms)
      sirenTick();
      sirenInterval = window.setInterval(sirenTick, 400);
    } catch (err) {
      console.error('Failed to start audio siren:', err);
    }
  },

  // Stops the repeating siren
  stopEmergencySiren: (): void => {
    try {
      if (sirenInterval) {
        clearInterval(sirenInterval);
        sirenInterval = null;
      }

      const ctx = audioCtx;
      if (ctx) {
        const now = ctx.currentTime;
        if (sirenGain) {
          // Fade out quickly to avoid clicking
          sirenGain.gain.cancelScheduledValues(now);
          sirenGain.gain.setValueAtTime(sirenGain.gain.value, now);
          sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        }

        setTimeout(() => {
          if (sirenOsc1) {
            sirenOsc1.stop();
            sirenOsc1.disconnect();
            sirenOsc1 = null;
          }
          if (sirenOsc2) {
            sirenOsc2.stop();
            sirenOsc2.disconnect();
            sirenOsc2 = null;
          }
          if (sirenGain) {
            sirenGain.disconnect();
            sirenGain = null;
          }
        }, 200);
      }
    } catch (err) {
      console.error('Failed to stop audio siren:', err);
    }
  },

  // Plays a single "sonar ping" sound when a doctor broadcasts an emergency request
  playSonarPing: (): void => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // High pitch (A5)
      osc.frequency.exponentialRampToValueAtTime(220, now + 1.2); // Sweeps down

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Fades out

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 1.6);
    } catch (err) {
      console.error('Failed to play sonar ping:', err);
    }
  },
};
