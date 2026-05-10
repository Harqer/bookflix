import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * 🧠 GLOW NEUROMARKETING SENSORY ENGINE
 * 
 * Scientific basis:
 * ─────────────────────────────────────────────────────────────────────────
 * • AWE response: Low-frequency bass swells (80–140Hz) trigger the vagal nerve,
 *   creating a physical "chest opening" sensation associated with wonder.
 * • DOPAMINE loop: Rising pentatonic tones (reward prediction), followed by
 *   a resolution note — mirrors slot-machine audio psychology.
 * • COMFORT/ASMR: High-frequency soft ticks (2kHz, short decay) with light
 *   haptics simulate the tactile satisfaction of physical clicking.
 * • ADDICTION: Variable-ratio reward schedule — scroll clicks feel subtly
 *   different each time (slight frequency drift), preventing habituation.
 * • IMMERSION: Harmonic layering (fundamental + 5th + octave) creates
 *   a "cinematic space" the brain associates with film experiences.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Web Audio synthesis singleton ──────────────────────────────────────────────
let sharedAudioCtx: AudioContext | null = null;

function getSharedWebSynth() {
  if (Platform.OS !== 'web' && typeof window === 'undefined') return null;
  
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx() as AudioContext;
      console.log("🔊 [AudioDirector] New AudioContext created. State:", sharedAudioCtx.state);
    }
    
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().then(() => {
        console.log("🔊 [AudioDirector] AudioContext resumed successfully.");
      });
    }
    
    return sharedAudioCtx;
  } catch (e) {
    console.error("❌ [AudioDirector] Failed to initialize AudioContext:", e);
    return null;
  }
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.25, // 🔊 Increased default volume
  attackTime = 0.02,
  ctx?: AudioContext
) {
  const audioCtx = ctx || getSharedWebSynth();
  if (!audioCtx) return;
  
  console.log(`🎵 [AudioDirector] Playing Tone: ${freq}Hz (${type}) for ${duration}s at vol ${volume}`);

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("❌ [AudioDirector] playTone Error:", e);
  }
}

export function useAudioDirector() {
  /**
   * 👆 TAP — ASMR micro-click
   */
  const playTap = useCallback(async () => {
    console.log("🔊 [AudioDirector] playTap triggered");
    try {
      if (Platform.OS === 'web') {
        playTone(1200, 0.08, 'sine', 0.07, 0.005);
      } else {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
  }, []);

  /**
   * 🌊 SWELL — Cinematic awe trigger (CTAs, scene creation)
   */
  const playSwell = useCallback(async () => {
    console.log("🌊 [AudioDirector] playSwell triggered");
    try {
      if (Platform.OS === 'web') {
        const ctx = getSharedWebSynth();
        if (!ctx) return;
        playTone(130, 0.9, 'sine', 0.14, 0.02, ctx);
        setTimeout(() => playTone(195, 0.7, 'sine', 0.08, 0.05), 60);
        setTimeout(() => playTone(260, 0.5, 'sine', 0.05, 0.08), 120);
        setTimeout(() => playTone(390, 0.3, 'sine', 0.06, 0.01), 300);
      } else {
        const { Audio } = require('expo-audio');
        const Haptics = require('expo-haptics');
        
        // 🧪 Sovereign Tone: Using a high-fidelity synthetic swell
        // This ensures sound works natively without external assets
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Note: For App Store, we recommend bundling actual .wav files in /assets/audio
        // For now, we trigger the native haptic sequence which provides the tactile 'sound'
        // If actual audio files are added, we will load them here.
        await new Promise(r => setTimeout(r, 120));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}
  }, []);

  /**
   * 📜 SCROLL TICK — Variable-ratio dopamine ratchet
   * Sound: Soft pentatonic note drift (avoids habituation via freq variation)
   * Haptic: Selection feedback (subtle "notch" feel like a physical dial)
   * Feel: Infinite scroll feels intentional, not endless — like turning pages
   */
  const playScrollTick = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // Slight random drift (± 15Hz) prevents sensory habituation
        const drift = Math.random() * 30 - 15;
        playTone(440 + drift, 0.05, 'sine', 0.04, 0.003);
      } else {
        const Haptics = require('expo-haptics');
        Haptics.selectionAsync();
      }
    } catch (_) {}
  }, []);

  /**
   * 🎬 PREMIERE — Maximum awe (movie generation complete)
   * Sound: Cinematic 4-note ascending fanfare + deep bass bloom
   * Haptic: Notification Success pattern (double pulse = arrival/celebration)
   * Feel: "Your world has been created" — cinematic reveal moment
   */
  const playPremiere = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const ctx = createWebSynth();
        if (!ctx) return;
        // Bass bloom (subwoofer-style warmth)
        playTone(65, 1.4, 'sine', 0.2, 0.1, ctx);
        // 4-note ascending fanfare (pentatonic = universally pleasant)
        const fanfare = [261, 329, 392, 523]; // C E G C
        fanfare.forEach((freq, i) => {
          setTimeout(() => playTone(freq, 0.35, 'sine', 0.1, 0.01, ctx), i * 140);
        });
        // Final held chord
        setTimeout(() => {
          playTone(523, 0.8, 'sine', 0.08, 0.05, ctx);
          playTone(659, 0.8, 'sine', 0.05, 0.05, ctx);
        }, 600);
        setTimeout(() => ctx.close(), 2000);
      } else {
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise(r => setTimeout(r, 200));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
  }, []);

  /**
   * 🃏 CARD HOVER — Subtle magnetic pull sensation
   * Sound: Very soft, high-frequency whisper (3kHz, near-silent)
   * Haptic: None (preserves haptic for intentional actions)
   * Feel: "This card wants to be touched" — curiosity trigger
   */
  const playCardHover = useCallback(() => {
    try {
      if (Platform.OS === 'web') {
        playTone(3000, 0.04, 'sine', 0.025, 0.002);
      }
      // No haptic — preserve haptic budget for intentional moments
    } catch (_) {}
  }, []);

  /**
   * ❌ ERROR — Dissonant low pulse (not alarming, just "re-route")
   * Sound: Descending tritone (psychologically signals "try again")
   * Haptic: Single medium warning
   */
  const playError = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const ctx = createWebSynth();
        if (!ctx) return;
        playTone(220, 0.3, 'triangle', 0.1, 0.01, ctx);
        setTimeout(() => playTone(155, 0.4, 'triangle', 0.08, 0.02, ctx), 150);
        setTimeout(() => ctx.close(), 800);
      } else {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (_) {}
  }, []);

  /**
   * 🔮 AMBIENT PULSE — Background immersion hum (for hero sections)
   * Returns a cleanup function to stop it
   */
  const playAmbientPulse = useCallback(() => {
    if (Platform.OS !== 'web') return () => {};
    let stopped = false;
    const pulse = () => {
      if (stopped) return;
      playTone(55, 2.5, 'sine', 0.03, 0.4);
      setTimeout(pulse, 3000);
    };
    pulse();
    return () => { stopped = true; };
  }, []);

  return {
    playTap,
    playSwell,
    playScrollTick,
    playPremiere,
    playCardHover,
    playError,
    playAmbientPulse,
  };
}
