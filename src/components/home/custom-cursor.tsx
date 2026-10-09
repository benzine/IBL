"use client";

import { useEffect, useRef, useState } from "react";
import { cubicBezier } from "framer-motion";
import { useApp } from "@/store/app-store";
import { EASE } from "@/lib/brand";

/**
 * The signature IBL pointer. One fixed layer, two moving parts:
 * a dot that tracks the pointer exactly, and a ring that trails on
 * damped spring physics, frame rate independent through delta time.
 * Hover state lives in data attributes so the single rAF loop only
 * ever writes transform and opacity, never layout. The press
 * contract rides the house ease from @/lib/brand through
 * framer-motion's cubicBezier, the same curve the CSS uses.
 *
 * The component also owns the html data-cursor attribute, which is
 * what actually hides the OS cursor. The attribute is only set to
 * "custom" while the pointer is truly rendering: fine pointer,
 * profile not motor, preference not system, and the loading screen
 * finished. While the house is still waking the stage stays empty,
 * the OS pointer serves the skippable loader. Every other case
 * removes it and the native cursor comes back on its own.
 */

const SELECTOR =
  'a, button, [role="button"], input, select, textarea, summary, label, [data-cursor]';

/* inputs that are controls rather than text fields keep the round ring */
const CONTROL_INPUTS = new Set([
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "image",
  "button",
  "submit",
  "reset",
]);

const RING = 34;
const RING_HOVER = 52 / RING; /* expanded interactive outer size over base */
const IBEAM_X = 2 / RING; /* slim caret width */
const IBEAM_Y = 22 / RING; /* caret height */
const DOT_INTERACTIVE = 4 / 6; /* dot shrinks over interactive targets */

/* pointerdown contract, the house curve over a fixed clock */
const PRESS_DOWN = 0.78;
const PRESS_DOWN_MS = 120;
const PRESS_UP_MS = 180;
const [easeX1, easeY1, easeX2, easeY2] = EASE.luxe;
const pressEase = cubicBezier(easeX1, easeY1, easeX2, easeY2);

type CursorState = "default" | "interactive" | "label" | "ibeam";

interface Motion {
  px: number;
  py: number; /* pointer position, exact */
  lastPx: number;
  lastPy: number;
  rx: number;
  ry: number; /* ring position, trailing */
  speed: number; /* smoothed pointer speed, px per second */
  angle: number; /* movement direction, radians */
  stretch: number; /* velocity smear along the movement vector */
  press: number; /* down contract, eased along the house curve */
  pressFrom: number;
  pressTo: number;
  pressT: number; /* tween clock, ms */
  pressDur: number; /* 0 means settled */
  sx: number;
  sy: number; /* ring state scale, smoothed */
  ds: number; /* dot scale, smoothed */
  state: CursorState;
  down: boolean;
  hidden: boolean;
  seen: boolean;
}

const isTextField = (el: HTMLElement): boolean =>
  el.tagName === "TEXTAREA" ||
  (el.tagName === "INPUT" && !CONTROL_INPUTS.has((el as HTMLInputElement).type));

export function CustomCursor() {
  const cursor = useApp((s) => s.cursor);
  const a11y = useApp((s) => s.a11y);
  const reducedMotion = useApp((s) => s.reducedMotion);

  const layerRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);

  const [fine, setFine] = useState(false);
  const [booted, setBooted] = useState(false);

  const motionOff = reducedMotion || a11y === "epilepsy";
  const enabled = fine && booted && cursor === "custom" && a11y !== "motor";

  /* ---------- the loading screen keeps the stage to itself ---------- */
  useEffect(() => {
    const w = window as typeof window & { __iblBooted?: boolean };
    const onBooted = () => setBooted(true);
    const t = window.setTimeout(() => {
      /* a repeat visit skipped the loader, the flag is already up */
      if (w.__iblBooted) onBooted();
    }, 0);
    window.addEventListener("ibl:booted", onBooted);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("ibl:booted", onBooted);
    };
  }, []);

  /* ---------- own the html attribute that gates the OS cursor ---------- */
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(pointer: fine)");
    const apply = () => {
      setFine(mq.matches);
      if (mq.matches && booted && cursor === "custom" && a11y !== "motor") {
        root.dataset.cursor = "custom";
      } else {
        delete root.dataset.cursor;
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      delete root.dataset.cursor;
    };
  }, [cursor, a11y, booted]);

  /* ---------- the pointer itself ---------- */
  useEffect(() => {
    if (!enabled) return;
    const layer = layerRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    const trail = trailRef.current;
    if (!layer || !dot || !ring || !label || !trail) return;

    /* a clean session on every run, DOM attributes resynced with it */
    const m: Motion = {
      px: -300,
      py: -300,
      lastPx: -300,
      lastPy: -300,
      rx: -300,
      ry: -300,
      speed: 0,
      angle: 0,
      stretch: 1,
      press: 1,
      pressFrom: 1,
      pressTo: 1,
      pressT: 0,
      pressDur: 0,
      sx: 1,
      sy: 1,
      ds: 1,
      state: "default",
      down: false,
      hidden: true,
      seen: false,
    };
    ring.dataset.state = "default";
    dot.dataset.state = "default";
    label.dataset.state = "default";
    delete dot.dataset.down;
    layer.dataset.hidden = "true";

    const setState = (s: CursorState) => {
      if (m.state === s) return;
      m.state = s;
      ring.dataset.state = s;
      dot.dataset.state = s;
      label.dataset.state = s;
    };

    /*
     * While the custom pointer is live the html root itself carries
     * data-cursor="custom", which matches [data-cursor] in closest().
     * It is never a hover target, it is filtered out here.
     */
    const resolve = (e: PointerEvent): HTMLElement | null => {
      const t = e.target as Element | null;
      if (!t || typeof t.closest !== "function") return null;
      const el = t.closest(SELECTOR) as HTMLElement | null;
      if (!el || el === document.documentElement) return null;
      return el;
    };

    const show = (v: boolean) => {
      if (v === m.hidden) return;
      m.hidden = v;
      if (v) layer.dataset.hidden = "true";
      else delete layer.dataset.hidden;
    };

    const tweenPress = (to: number, dur: number) => {
      m.pressFrom = m.press;
      m.pressTo = to;
      m.pressT = 0;
      m.pressDur = dur;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        /* a finger or a stylus, the pointer stands down */
        show(true);
        return;
      }
      if (!m.seen) {
        /* first sighting, snap the ring so nothing sweeps in */
        m.seen = true;
        m.rx = e.clientX;
        m.ry = e.clientY;
        m.lastPx = e.clientX;
        m.lastPy = e.clientY;
      }
      m.px = e.clientX;
      m.py = e.clientY;
      show(false);
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = resolve(e);
      if (!el) {
        setState("default");
        return;
      }
      /* the micro label is cached here, never read per frame */
      const text = (el.getAttribute("data-cursor") ?? "").trim();
      if (text) {
        if (label.textContent !== text) label.textContent = text;
        setState("label");
      } else if (isTextField(el)) {
        setState("ibeam");
      } else {
        setState("interactive");
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      m.down = true;
      dot.dataset.down = "true";
      tweenPress(PRESS_DOWN, PRESS_DOWN_MS);
    };

    const onUp = () => {
      m.down = false;
      delete dot.dataset.down;
      tweenPress(1, PRESS_UP_MS);
    };

    const onLeave = (e: MouseEvent) => {
      /* relatedTarget stays null only when the pointer left the window */
      if (e.relatedTarget) return;
      show(true);
      m.seen = false;
      setState("default");
    };

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, Math.max(0.0005, (now - last) / 1000));
      last = now;

      /* pointer velocity, smoothed */
      const dx = m.px - m.lastPx;
      const dy = m.py - m.lastPy;
      m.lastPx = m.px;
      m.lastPy = m.py;
      const instant = Math.hypot(dx, dy) / dt;
      const kv = 1 - Math.pow(0.82, dt * 60);
      m.speed += (instant - m.speed) * kv;

      /* damped follow, frame rate independent, snap under reduced motion */
      const k = motionOff
        ? 1 - Math.pow(0.5, dt * 60)
        : 1 - Math.pow(0.84, dt * 60);
      m.rx += (m.px - m.rx) * k;
      m.ry += (m.py - m.ry) * k;

      /* state scale targets, the ring morphs by transform alone */
      let tsx = 1;
      let tsy = 1;
      let tds = 1;
      if (m.state === "interactive" || m.state === "label") {
        tsx = RING_HOVER;
        tsy = RING_HOVER;
        tds = m.state === "label" ? 0 : DOT_INTERACTIVE;
      } else if (m.state === "ibeam") {
        tsx = IBEAM_X;
        tsy = IBEAM_Y;
        tds = 0;
      }
      m.sx += (tsx - m.sx) * k;
      m.sy += (tsy - m.sy) * k;
      m.ds += (tds - m.ds) * k;

      /* press contract, the house ease over a fixed clock */
      if (m.pressDur > 0) {
        m.pressT += dt * 1000;
        const u = m.pressT >= m.pressDur ? 1 : m.pressT / m.pressDur;
        m.press = m.pressFrom + (m.pressTo - m.pressFrom) * pressEase(u);
        if (u >= 1) m.pressDur = 0;
      }

      /* velocity smear along the movement vector */
      if (!motionOff && m.speed > 140) {
        const target = Math.min(
          1.35,
          1 + 0.35 * Math.min(1, (m.speed - 140) / 1500)
        );
        m.stretch += (target - m.stretch) * k;
        if (instant > 140) {
          const a = Math.atan2(dy, dx);
          let d = a - m.angle;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          m.angle += d * Math.min(1, 7 * dt);
        }
      } else {
        m.stretch += (1 - m.stretch) * k;
      }

      /* the resting ring breathes, a 4s loop, default state only */
      const breathe =
        motionOff || m.state !== "default"
          ? 1
          : 1.02 + 0.02 * Math.sin((now / 4000) * Math.PI * 2);

      const rsx = m.sx * m.press * m.stretch * breathe;
      const rsy = (m.sy * m.press * breathe) / Math.sqrt(m.stretch);
      ring.style.transform = `translate3d(${m.rx.toFixed(2)}px,${m.ry.toFixed(2)}px,0) rotate(${m.angle.toFixed(3)}rad) scale(${rsx.toFixed(4)},${rsy.toFixed(4)})`;

      dot.style.transform = `translate3d(${m.px.toFixed(2)}px,${m.py.toFixed(2)}px,0) scale(${(m.ds * m.press).toFixed(4)})`;

      label.style.transform = `translate3d(${m.rx.toFixed(2)}px,${m.ry.toFixed(2)}px,0) translate(-50%,-50%)`;

      /* the comet trail, a short teal smear behind the dot */
      if (!motionOff) {
        const ux = Math.cos(m.angle);
        const uy = Math.sin(m.angle);
        const lag = 9 + Math.min(24, m.speed * 0.011);
        const op = Math.min(0.35, Math.max(0, (m.speed - 250) / 2250) * 0.35);
        trail.style.transform = `translate3d(${(m.px - ux * lag).toFixed(1)}px,${(m.py - uy * lag).toFixed(1)}px,0) rotate(${m.angle.toFixed(3)}rad) scale(${(1 + Math.min(1.6, m.speed / 1600)).toFixed(3)},0.75)`;
        trail.style.opacity = op.toFixed(3);
      } else {
        trail.style.opacity = "0";
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    /* capture phase, nothing downstream can starve the pointer */
    const moveOpts: AddEventListenerOptions = { capture: true, passive: true };
    document.addEventListener("pointermove", onMove, moveOpts);
    document.addEventListener("pointerover", onOver, moveOpts);
    document.addEventListener("pointerdown", onDown, moveOpts);
    document.addEventListener("mouseout", onLeave, moveOpts);
    window.addEventListener("pointerup", onUp, { capture: true, passive: true });
    window.addEventListener("pointercancel", onUp, {
      capture: true,
      passive: true,
    });
    window.addEventListener("blur", onUp);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove, { capture: true });
      document.removeEventListener("pointerover", onOver, { capture: true });
      document.removeEventListener("pointerdown", onDown, { capture: true });
      document.removeEventListener("mouseout", onLeave, { capture: true });
      window.removeEventListener("pointerup", onUp, { capture: true });
      window.removeEventListener("pointercancel", onUp, { capture: true });
      window.removeEventListener("blur", onUp);
    };
  }, [enabled, motionOff]);

  if (!enabled) return null;

  return (
    <div
      ref={layerRef}
      data-hidden="true"
      aria-hidden="true"
      className="ibl-cursor-layer pointer-events-none fixed inset-0 z-[500]"
    >
      <div ref={trailRef} className="ibl-cursor-trail" />
      <div ref={ringRef} data-state="default" className="ibl-cursor-ring" />
      {/* the label rides as the captain's chip, an ink pill with paper
          letters that stays legible over any surface it crosses */}
      <span ref={labelRef} data-state="default" className="ibl-cursor-label" />
      <div ref={dotRef} data-state="default" className="ibl-cursor-dot" />
    </div>
  );
}
