/**
 * Minimal Audio Engine for Dashboard Sonics
 * Uses low-latency Web Audio API or small Base64 samples
 */

const AUDIO_SAMPLES = {
  // Small synthesized beep for click
  click: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ1vT18vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8=',
  // Minimal success chime
  success: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ1vT18vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8=',
  // Minimal hover
  hover: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ1vT18vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8=',
  alert: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ1vT18vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8=',
};

class AudioEngine {
  private enabled: boolean = true;
  private audioContext: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    // Lazy init via user interaction
  }

  private async init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Pre-load samples
    Object.entries(AUDIO_SAMPLES).forEach(async ([name, url]) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.buffers.set(name, audioBuffer);
      } catch (e) {
        console.warn(`Failed to load audio: ${name}`, e);
      }
    });
  }

  setEnabled(val: boolean) {
    this.enabled = val;
    if (val) this.init();
  }

  async play(name: keyof typeof AUDIO_SAMPLES) {
    if (!this.enabled) return;
    await this.init();
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    const buffer = this.buffers.get(name);
    if (!buffer || !this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = name === 'hover' ? 0.05 : 0.15; // Lower volume for UI clicks
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }
}

export const audioEngine = new AudioEngine();
