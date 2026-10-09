"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/store/app-store";

/**
 * Optional ambient soundscape, default off. One tap enables.
 * A procedural ocean (filtered noise with slow swell) under a tonal pad
 * that shifts its chord as the visitor crosses sections.
 */
type SectionMood =
  | "hero" | "pulse" | "timemachine" | "constellation" | "clusters"
  | "map" | "mosaic" | "planet" | "investors" | "newsroom" | "trust";

const MOODS: Record<string, { root: number; chord: number[]; filter: number }> = {
  hero: { root: 220, chord: [1, 1.5, 2.0], filter: 900 },
  pulse: { root: 196, chord: [1, 1.25, 1.5], filter: 800 },
  timemachine: { root: 174.6, chord: [1, 1.2, 1.8], filter: 700 },
  constellation: { root: 233, chord: [1, 1.5, 1.875], filter: 1000 },
  clusters: { root: 207.6, chord: [1, 1.26, 1.5], filter: 900 },
  map: { root: 184.9, chord: [1, 1.335, 2.0], filter: 800 },
  mosaic: { root: 207.6, chord: [1, 1.5, 2.4], filter: 1100 },
  planet: { root: 164.8, chord: [1, 1.2, 1.5], filter: 700 },
  investors: { root: 220, chord: [1, 1.25, 1.5], filter: 950 },
  newsroom: { root: 196, chord: [1, 1.19, 1.5], filter: 900 },
  trust: { root: 174.6, chord: [1, 1.5, 2.25], filter: 800 },
};

export function SoundEngine() {
  const sound = useApp((s) => s.sound);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const oscRef = useRef<OscillatorNode[]>([]);
  const moodRef = useRef<string>("hero");

  useEffect(() => {
    if (!sound) {
      // gentle shutdown
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (ctx && master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
        setTimeout(() => {
          oscRef.current.forEach((o) => {
            try { o.stop(); } catch { /* already stopped */ }
          });
          oscRef.current = [];
          ctx.close().catch(() => {});
          ctxRef.current = null;
          masterRef.current = null;
        }, 900);
      }
      return;
    }

    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    // Ocean: brown-ish noise through a lowpass with slow swell
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 420;
    const swell = ctx.createGain();
    swell.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.22;
    lfo.connect(lfoGain).connect(swell.gain);
    noise.connect(noiseFilter).connect(swell).connect(master);
    noise.start();
    lfo.start();

    // Tonal pad
    const padGain = ctx.createGain();
    padGain.gain.value = 0.16;
    padGain.connect(master);
    const playMood = (moodKey: string) => {
      const mood = MOODS[moodKey] ?? MOODS.hero;
      oscRef.current.forEach((o) => {
        try { o.stop(); } catch { /* noop */ }
      });
      oscRef.current = [];
      mood.chord.forEach((ratio, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.value = mood.root * ratio;
        const g = ctx.createGain();
        g.gain.value = idx === 0 ? 0.5 : 0.22;
        osc.connect(g).connect(padGain);
        osc.start();
        oscRef.current.push(osc);
      });
    };
    playMood(moodRef.current);

    master.gain.setTargetAtTime(0.5, ctx.currentTime, 1.2);

    // Shift the pad as sections cross the middle of the viewport
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let found = "hero";
      document.querySelectorAll("section[id]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) found = el.id;
      });
      if (found !== moodRef.current) {
        moodRef.current = found;
        playMood(found);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      try {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
        setTimeout(() => ctx.close().catch(() => {}), 500);
      } catch {
        /* noop */
      }
    };
  }, [sound]);

  return null;
}
