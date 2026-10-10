"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from "react";
import { Radar } from "lucide-react";
import { pulseMetrics, usePulse } from "@/hooks/use-pulse";
import { useCountUp, useLiveCounter } from "@/hooks/use-count-up";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReveal } from "@/hooks/use-reveal";
import { useTilt } from "@/hooks/use-tilt";
import { CLUSTERS, CLUSTER_MAP, GROUP } from "@/lib/brand";
import { SUBSIDIARIES } from "@/lib/data/subsidiaries";
import { PULSE_ANCHORS } from "@/lib/data/trust";
import { cn } from "@/lib/utils";
import { T } from "./t";
import { BreakdownPopover, type BreakdownRow } from "./pulse-hud";

/* Paper-grade rules, scoped to this section only (dark grades stay untouched).
   On paper the bento sits on flat ivory so a card needs a pressed ink shadow to
   lift, and the outline marquee needs a heavier printed stroke to stay crisp. */
const PAPER_GRADE_CSS = `
html[data-theme="light"] .pulse-lift,
html[data-theme="sepia"] .pulse-lift {
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--foreground) 10%, transparent),
    0 22px 55px -30px color-mix(in srgb, var(--foreground) 26%, transparent);
  /* carries .lift's transform leg too: without it the shorthand would replace
     the base rule and the hover lift would snap instead of glide */
  transition: transform 0.6s var(--ease-luxe), box-shadow 0.7s var(--ease-luxe);
}
html[data-theme="light"] .pulse-marquee-name {
  -webkit-text-stroke: 2px color-mix(in srgb, var(--foreground) 88%, transparent) !important;
}
html[data-theme="sepia"] .pulse-marquee-name {
  -webkit-text-stroke: 2px color-mix(in srgb, var(--foreground) 86%, transparent) !important;
}
html[data-theme="light"] .pulse-cap,
html[data-theme="sepia"] .pulse-cap {
  color: color-mix(in srgb, var(--muted-foreground) 40%, var(--foreground));
}
/* Paper grade: the live dot trades its luminous halo for a pressed teal ring */
html[data-theme="light"] .live-dot.hud-dot::after,
html[data-theme="sepia"] .live-dot.hud-dot::after {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ibl-teal) 22%, transparent);
}
/* Card captions lean toward ink on paper, printed footnotes not disabled text */
html[data-theme="light"] .pulse-card-cap,
html[data-theme="sepia"] .pulse-card-cap {
  color: color-mix(in srgb, var(--muted-foreground) 40%, var(--foreground));
}
/* The ocean plate reads as a precision chart pressed into the sheet:
   same language as the bento's pulse-lift, one degree lighter so the big
   numbers below stay the heroes of the section. */
html[data-theme="light"] .sea-frame,
html[data-theme="sepia"] .sea-frame {
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--foreground) 9%, transparent),
    0 16px 44px -28px color-mix(in srgb, var(--foreground) 24%, transparent);
  transition: box-shadow 0.7s var(--ease-luxe);
}
`;

/* ==================================================================
   THE INDIAN OCEAN · RIGHT NOW — the lead instrument of the live pulse.
   The vessel of the fleet portrayed as premium photography, graded into
   the brand plate, with the harbour almanac printed over it the way a
   bridge terminal reads: live wind, the modelled M2 tide gauge on the
   right margin, chart coordinates bottom left, and a slow radar sweep
   crossing the sheet. Hover the water (or tap, or focus the fleet chip)
   and the plate goes bridge-mode: contacts lock onto the traffic with
   AIS-style tags, a chart-table crosshair rides the cursor with a live
   position readout, and the run breakdown unfolds beside the almanac —
   the same instrument language as the Revenue Today breakdown. Paper
   grades print it as a duotone plate pressed into the sheet; the abyss
   renders it as night-teal telemetry.
   ================================================================== */

const VESSEL_CSS = `
.vessel-scene { position: relative; isolation: isolate; }
.vessel-water {
  position: relative; overflow: hidden; isolation: isolate; height: 208px;
  user-select: none; -webkit-user-select: none;
}
@media (min-width: 768px) { .vessel-water { height: 268px; } }
@media (hover: hover) and (pointer: fine) { .vessel-water { cursor: crosshair; } }
.vessel-photo {
  /* The plate is pinned exactly to the scene and every bleed — all four
     edges — is supplied by the drift scale below. A width larger than 100%
     would be clamped by the preflight img{max-width:100%} rule and leave
     the right edge of the band uncovered; this construction cannot. */
  position: absolute; left: 0; top: 0; width: 100%; height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.08) brightness(calc(1 - 0.12 * var(--vessel-cloud, 0)));
  transform-origin: 62% 46%;
  animation: vessel-drift 46s var(--ease-luxe) infinite alternate;
  transition: filter 0.7s var(--ease-luxe);
}
/* The scale floor of 1.04 is the bleed: at the tightest phase every edge
   still overshoots the scene by 1.5–2.5% (never a sliver of paper), while
   the slow push to 1.10 keeps the drift cinematic. */
@keyframes vessel-drift {
  from { transform: scale(1.04) translate3d(-0.3%, 0.2%, 0); }
  to { transform: scale(1.1) translate3d(0.3%, -0.2%, 0); }
}
/* bridge mode: the plate deepens a stop so the instruments read over any water */
.vessel-scene[data-fleet="on"] .vessel-photo {
  filter: grayscale(1) contrast(1.1) brightness(calc(0.92 - 0.1 * var(--vessel-cloud, 0)));
}
html[data-theme="sepia"] .vessel-scene[data-fleet="on"] .vessel-photo {
  filter: sepia(.42) grayscale(.55) contrast(1.06) brightness(calc(0.92 - 0.1 * var(--vessel-cloud, 0)));
}
html[data-theme="sepia"] .vessel-photo {
  filter: sepia(.42) grayscale(.55) contrast(1.06) brightness(calc(1 - 0.12 * var(--vessel-cloud, 0)));
}
/* duotone grade: the photograph carries the brand ink */
.vessel-grade {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(134deg, rgb(33 41 121 / .9), rgb(75 189 200 / .52) 68%, rgb(75 189 200 / .22));
  mix-blend-mode: screen;
}
html[data-theme="sepia"] .vessel-grade { opacity: .82; }
/* bottom anchor so the margin instruments print legibly over any water */
.vessel-shade {
  position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: linear-gradient(to top, rgb(10 14 36 / .62), rgb(10 14 36 / 0) 46%);
  transition: background 0.6s var(--ease-luxe);
}
/* bridge mode: the bottom anchor presses deeper for the margin instruments */
.vessel-scene[data-fleet="on"] .vessel-shade {
  background: linear-gradient(to top, rgb(10 14 36 / .74), rgb(10 14 36 / 0) 54%);
}
/* the radar sweep crossing the plate */
.vessel-sweep {
  position: absolute; inset: -2% -32%; z-index: 3; pointer-events: none;
  background: linear-gradient(104deg, transparent 44%, rgb(75 189 200 / .13) 50%, transparent 56%);
  animation: vessel-sweep 13s cubic-bezier(.4, 0, .6, 1) infinite;
}
/* bridge mode: the sweep quickens while the contacts are being read */
.vessel-scene[data-fleet="on"] .vessel-sweep { animation-duration: 5.5s; }
@keyframes vessel-sweep {
  0% { transform: translateX(-52%); opacity: 0; }
  8% { opacity: 1; }
  46% { transform: translateX(52%); opacity: 1; }
  54% { transform: translateX(52%); opacity: 0; }
  100% { transform: translateX(52%); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .vessel-photo, .vessel-sweep { animation: none; }
}
html[data-motion="reduced"] .vessel-photo,
html[data-motion="reduced"] .vessel-sweep,
html[data-a11y="epilepsy"] .vessel-photo,
html[data-a11y="epilepsy"] .vessel-sweep { animation: none; }
@media (prefers-reduced-motion: reduce) {
  .contact, .fleet-panel, .fleet-readout, .fleet-cross-x, .fleet-cross-y { transition-duration: .01ms; }
  .contact-ping, .fleet-chip-icon { animation: none; }
}
html[data-motion="reduced"] .contact,
html[data-motion="reduced"] .fleet-panel,
html[data-motion="reduced"] .fleet-readout,
html[data-motion="reduced"] .fleet-cross-x,
html[data-motion="reduced"] .fleet-cross-y,
html[data-a11y="epilepsy"] .contact,
html[data-a11y="epilepsy"] .fleet-panel,
html[data-a11y="epilepsy"] .fleet-readout,
html[data-a11y="epilepsy"] .fleet-cross-x,
html[data-a11y="epilepsy"] .fleet-cross-y { transition-duration: .01ms; }
html[data-motion="reduced"] .contact-ping,
html[data-motion="reduced"] .fleet-chip-icon,
html[data-a11y="epilepsy"] .contact-ping,
html[data-a11y="epilepsy"] .fleet-chip-icon { animation: none; }
/* margin instruments */
.vessel-hud { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.vessel-chip {
  position: absolute;
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .36rem .72rem;
  border-radius: 999px;
  font-size: .635rem; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
  color: #eef6f7;
  background: rgb(10 14 35 / .34);
  border: 1px solid rgb(205 238 241 / .22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
html[data-theme="light"] .vessel-chip,
html[data-theme="sepia"] .vessel-chip {
  background: color-mix(in srgb, var(--background) 58%, rgb(16 22 58 / .18));
  color: var(--foreground);
  border-color: color-mix(in srgb, var(--foreground) 16%, transparent);
}
/* the printed title yields the top-left slot when the bridge takes over */
.chip-title { transition: opacity .35s var(--ease-luxe), translate .35s var(--ease-luxe); }
.vessel-scene[data-fleet="on"] .chip-title { opacity: 0; translate: -8px 0; pointer-events: none; }
.vessel-coords {
  position: absolute; right: 80px; bottom: 12px;
  display: inline-flex; align-items: center; gap: .45rem;
  padding: .32rem .66rem;
  border-radius: 999px;
  font-size: .6rem; font-weight: 500; letter-spacing: .18em; text-transform: uppercase;
  color: rgb(238 246 247 / .92);
  background: rgb(10 14 35 / .34);
  border: 1px solid rgb(205 238 241 / .2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-variant-numeric: tabular-nums;
}
html[data-theme="light"] .vessel-coords,
html[data-theme="sepia"] .vessel-coords {
  background: color-mix(in srgb, var(--background) 58%, rgb(16 22 58 / .18));
  color: var(--foreground);
  border-color: color-mix(in srgb, var(--foreground) 16%, transparent);
}
.vessel-gauge-wrap {
  position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; align-items: flex-end; gap: 5px;
  color: rgb(238 246 247 / .95);
}
html[data-theme="light"] .vessel-gauge-wrap,
html[data-theme="sepia"] .vessel-gauge-wrap { color: color-mix(in srgb, var(--foreground) 85%, white); }
.vessel-gauge-label {
  padding: .3rem .58rem;
  border-radius: 999px;
  font-size: .6rem; font-weight: 500; letter-spacing: .16em;
  background: rgb(10 14 35 / .34);
  border: 1px solid rgb(205 238 241 / .2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-variant-numeric: tabular-nums;
}
html[data-theme="light"] .vessel-gauge-label,
html[data-theme="sepia"] .vessel-gauge-label {
  background: color-mix(in srgb, var(--background) 58%, rgb(16 22 58 / .18));
  color: var(--foreground);
  border-color: color-mix(in srgb, var(--foreground) 16%, transparent);
}
.vessel-coords { transition: opacity .3s var(--ease-luxe); }
/* the fixed chart datum yields to the cursor's live position */
.vessel-water[data-cross="1"] .vessel-coords { opacity: 0; }

/* ---- fleet telemetry --------------------------------------------------
   Hover the water and the plate goes bridge-mode: contacts lock onto the
   traffic with AIS-style tags, a chart-table crosshair rides the cursor
   with a live position readout, and the run breakdown unfolds beside the
   almanac — the same instrument language as the Revenue Today popover.
   The fleet chip is the plate's one control: keyboard focus opens the
   view, a click pins it, a tap toggles it on touch. */
.fleet-layer { position: absolute; inset: 0; z-index: 5; pointer-events: none; }
.fleet-cross-x, .fleet-cross-y {
  position: absolute; background: rgb(75 189 200 / .48);
  opacity: 0; transition: opacity .3s var(--ease-luxe);
}
.fleet-cross-x { left: 0; right: 0; top: var(--cy, 50%); height: 1px; }
.fleet-cross-y { top: 0; bottom: 0; left: var(--cx, 50%); width: 1px; }
.vessel-water[data-cross="1"] .fleet-cross-x,
.vessel-water[data-cross="1"] .fleet-cross-y { opacity: 1; }
.fleet-readout {
  position: absolute; left: var(--cx, 50%); top: var(--cy, 50%);
  transform: translate(-50%, calc(-100% - 14px));
  max-width: max-content; white-space: nowrap;
  padding: .26rem .6rem; border-radius: 999px;
  font-size: .58rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: rgb(238 246 247 / .95); background: rgb(10 14 35 / .58);
  border: 1px solid rgb(205 238 241 / .28);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  opacity: 0; transition: opacity .3s var(--ease-luxe); pointer-events: none;
}
.vessel-water[data-cross="1"] .fleet-readout { opacity: 1; }
html[data-theme="light"] .fleet-readout,
html[data-theme="sepia"] .fleet-readout {
  background: color-mix(in srgb, var(--background) 68%, rgb(16 22 58 / .2));
  color: var(--foreground);
  border-color: color-mix(in srgb, var(--foreground) 18%, transparent);
}
/* contacts: rings with a heading vector, revealed in a staggered lock-on */
.contact {
  position: absolute; left: var(--x, 50%); top: var(--y, 50%);
  translate: -50% -50%;
  opacity: 0; scale: .5;
  pointer-events: auto;
  transition: opacity .5s var(--ease-luxe), scale .5s var(--ease-luxe);
}
.vessel-scene[data-fleet="on"] .contact {
  opacity: 1; scale: 1;
  transition-delay: calc(var(--i, 0) * 90ms);
}
.contact-ring {
  position: relative; display: grid; place-items: center;
  width: 26px; height: 26px; border-radius: 999px;
  border: 1.5px solid rgb(75 189 200 / .85);
  transition: scale .35s var(--ease-luxe), border-color .35s var(--ease-luxe);
}
.contact-ring::after {
  content: ""; width: 5px; height: 5px; border-radius: 999px;
  background: var(--ibl-teal);
}
.contact:hover .contact-ring { scale: 1.22; border-color: rgb(75 189 200); }
html[data-theme="light"] .contact-ring,
html[data-theme="sepia"] .contact-ring {
  border-color: color-mix(in srgb, var(--ibl-teal) 72%, var(--foreground));
}
/* the heading tick: a short vector from the ring toward the bearing */
.contact-vec { position: absolute; inset: 0; }
.contact-vec::before {
  content: ""; position: absolute; left: 50%; top: 50%;
  width: 2px; height: 13px; border-radius: 2px;
  background: rgb(75 189 200 / .9);
  translate: -50% calc(-100% - 6px);
}
/* the flagship under way: target-lock brackets and a slow sonar ping */
.contact--primary .contact-ring { border-color: transparent; }
.contact--primary .contact-ring::after { width: 6px; height: 6px; }
.contact-brackets {
  position: absolute; inset: -7px;
  --b: rgb(75 189 200 / .95);
  background:
    linear-gradient(var(--b), var(--b)) left top / 10px 1.5px no-repeat,
    linear-gradient(var(--b), var(--b)) left top / 1.5px 10px no-repeat,
    linear-gradient(var(--b), var(--b)) right top / 10px 1.5px no-repeat,
    linear-gradient(var(--b), var(--b)) right top / 1.5px 10px no-repeat,
    linear-gradient(var(--b), var(--b)) left bottom / 10px 1.5px no-repeat,
    linear-gradient(var(--b), var(--b)) left bottom / 1.5px 10px no-repeat,
    linear-gradient(var(--b), var(--b)) right bottom / 10px 1.5px no-repeat,
    linear-gradient(var(--b), var(--b)) right bottom / 1.5px 10px no-repeat;
}
html[data-theme="light"] .contact-brackets,
html[data-theme="sepia"] .contact-brackets {
  --b: color-mix(in srgb, var(--ibl-teal) 78%, var(--foreground));
}
.contact-ping {
  position: absolute; inset: -4px; border-radius: 999px;
  border: 1px solid rgb(75 189 200 / .65);
  animation: contact-ping 2.8s var(--ease-luxe) infinite;
}
@keyframes contact-ping {
  0% { scale: .55; opacity: 0; }
  18% { opacity: .85; }
  100% { scale: 2.3; opacity: 0; }
}
/* AIS-style tag: the name always, the full contact card on hover */
.contact-tag {
  position: absolute; bottom: calc(100% + 9px); left: 50%;
  translate: -50% 0;
  min-width: max-content; max-width: max-content; text-align: left;
  padding: .28rem .58rem .3rem; border-radius: .55rem;
  background: rgb(10 14 35 / .6); border: 1px solid rgb(205 238 241 / .2);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  color: #eef6f7; pointer-events: none;
  transition: background .3s var(--ease-luxe);
}
html[data-theme="light"] .contact-tag,
html[data-theme="sepia"] .contact-tag {
  background: color-mix(in srgb, var(--background) 66%, rgb(16 22 58 / .18));
  color: var(--foreground);
  border-color: color-mix(in srgb, var(--foreground) 16%, transparent);
}
.contact-name {
  display: block; font-size: .585rem; font-weight: 600;
  letter-spacing: .12em; text-transform: uppercase; white-space: nowrap;
}
.contact-detail {
  display: block; font-size: .555rem; font-weight: 500;
  letter-spacing: .08em; text-transform: uppercase; white-space: nowrap;
  color: rgb(205 238 241 / .72);
  max-height: 0; opacity: 0; overflow: hidden;
  transition: max-height .4s var(--ease-luxe), opacity .4s var(--ease-luxe), margin .4s var(--ease-luxe);
}
html[data-theme="light"] .contact-detail,
html[data-theme="sepia"] .contact-detail {
  color: color-mix(in srgb, var(--muted-foreground) 55%, var(--foreground));
}
.contact:hover .contact-detail { max-height: 1.5em; opacity: 1; margin-top: .16rem; }
.contact:hover .contact-tag { background: rgb(10 14 36 / .82); }
html[data-theme="light"] .contact:hover .contact-tag,
html[data-theme="sepia"] .contact:hover .contact-tag {
  background: color-mix(in srgb, var(--popover) 92%, rgb(16 22 58 / .1));
}
/* edge-anchored tags so nothing spills past the plate */
.contact--w .contact-tag { left: auto; right: -6px; translate: 0 0; }
.contact--e .contact-tag { left: -6px; translate: 0 0; }
/* contact positions on the water */
.contact--corail { --x: 62%; --y: 42%; }
.contact--trochetia { --x: 26%; --y: 30%; }
.contact--longue { --x: 80%; --y: 58%; }
.contact--belombre { --x: 40%; --y: 72%; }
.contact--etoile { --x: 56%; --y: 84%; }
@media (max-width: 767px) {
  .contact--etoile { display: none; }
  /* the narrow sheet prints the contacts as a clean ladder: each tag
     clears the next by a hand's breadth of water */
  .contact--trochetia { --y: 26%; }
  .contact--corail { --y: 40%; }
  .contact--longue { --y: 57%; }
  .contact--belombre { --y: 72%; }
  /* the narrow sheet declutters: the fleet chip owns the bottom-left slot,
     the fixed datum yields to the caption's printed coordinates */
  .vessel-coords { display: none; }
}
/* the fleet chip: the plate's one control */
.fleet-chip {
  position: absolute; left: 14px; bottom: 12px; z-index: 7;
  cursor: pointer; font-family: inherit; line-height: 1.2;
}
.fleet-chip-icon { color: var(--ibl-teal); }
.vessel-scene[data-fleet="on"] .fleet-chip-icon { animation: fleet-spin 3.6s linear infinite; }
@keyframes fleet-spin { to { rotate: 360deg; } }
.fleet-chip:focus-visible { outline: 2px solid var(--ibl-teal); outline-offset: 2px; }
/* the run breakdown: the Revenue-Today instrument applied to the plate.
   Desktop: a glass leaf over the water; mobile: it prints beneath the
   plate, in flow, never covering the contacts. */
.fleet-panel {
  position: absolute; left: 14px; bottom: 44px; z-index: 6;
  width: min(17rem, calc(100% - 28px));
  display: grid; grid-template-rows: 0fr;
  opacity: 0; translate: 0 10px; pointer-events: none;
  transition:
    opacity .45s var(--ease-luxe),
    translate .45s var(--ease-luxe),
    grid-template-rows .5s var(--ease-luxe),
    margin .5s var(--ease-luxe);
}
.vessel-scene[data-fleet="on"] .fleet-panel {
  opacity: 1; translate: 0 0; grid-template-rows: 1fr;
}
.fleet-panel-clip { overflow: hidden; min-height: 0; }
.fleet-panel-inner {
  padding: .72rem .85rem .62rem; border-radius: .85rem;
  background: rgb(10 14 36 / .58); border: 1px solid rgb(205 238 241 / .22);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  color: #eef6f7;
}
html[data-theme="light"] .fleet-panel-inner,
html[data-theme="sepia"] .fleet-panel-inner {
  background: color-mix(in srgb, var(--popover) 78%, rgb(16 22 58 / .14));
  border-color: color-mix(in srgb, var(--foreground) 14%, transparent);
  color: var(--foreground);
}
.fleet-head {
  display: flex; align-items: center; gap: .5rem;
  font-size: .6rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
  margin-bottom: .5rem; color: rgb(238 246 247 / .92);
}
html[data-theme="light"] .fleet-head,
html[data-theme="sepia"] .fleet-head { color: color-mix(in srgb, var(--foreground) 92%, transparent); }
.fleet-count { margin-left: auto; font-weight: 500; font-variant-numeric: tabular-nums; color: rgb(205 238 241 / .75); }
html[data-theme="light"] .fleet-count,
html[data-theme="sepia"] .fleet-count { color: color-mix(in srgb, var(--muted-foreground) 55%, var(--foreground)); }
.fleet-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .18rem 0; }
.fleet-row-label { display: flex; align-items: center; gap: .5rem; font-size: .68rem; color: rgb(238 246 247 / .85); }
html[data-theme="light"] .fleet-row-label,
html[data-theme="sepia"] .fleet-row-label { color: color-mix(in srgb, var(--foreground) 88%, transparent); }
.fleet-row-value { font-size: .68rem; font-weight: 500; font-variant-numeric: tabular-nums; }
.fleet-foot {
  margin-top: .5rem; padding-top: .45rem;
  border-top: 1px solid rgb(205 238 241 / .16);
  font-size: .56rem; font-weight: 500; letter-spacing: .1em; text-transform: uppercase;
  color: rgb(205 238 241 / .62); font-variant-numeric: tabular-nums;
}
html[data-theme="light"] .fleet-foot,
html[data-theme="sepia"] .fleet-foot {
  border-top-color: color-mix(in srgb, var(--foreground) 12%, transparent);
  color: color-mix(in srgb, var(--muted-foreground) 60%, var(--foreground));
}
.vessel-gauge { display: block; height: 84px; width: 22px; }
@media (max-width: 767px) {
  .fleet-panel { position: static; width: auto; margin: 0 10px; }
  .vessel-scene[data-fleet="on"] .fleet-panel { margin: 0 10px 10px; }
}
`;

/* ---- fleet contacts: the traffic tracked on the water ----------------
   A modelled sample of the fleet under way, the flagship riding where
   the photograph placed her. Names in the Mascarene register, runs the
   trades the group actually sails: Mombasa, Toamasina, Mahé, Réunion. */

interface FleetContact {
  id: string;
  name: string;
  route: string;
  speed: number;
  head: string;
  headDeg: number;
  primary?: boolean;
  /** tag anchored for the near-edge contacts so nothing spills */
  tag?: "left" | "right";
}

const CONTACTS: FleetContact[] = [
  {
    id: "corail",
    name: "MV Corail Cardinal",
    route: "Port Louis → Mombasa",
    speed: 14.2,
    head: "ENE",
    headDeg: 67.5,
    primary: true,
  },
  { id: "trochetia", name: "MV Trochetia", route: "Diego Suarez → Port Louis", speed: 11.8, head: "S", headDeg: 180, tag: "left" },
  { id: "longue", name: "MV Longue Vue", route: "Port Louis → Toamasina", speed: 12.6, head: "W", headDeg: 270, tag: "right" },
  { id: "belombre", name: "MV Bel Ombre", route: "Mahé → Port Louis", speed: 10.4, head: "SSE", headDeg: 157.5 },
  { id: "etoile", name: "MV Étoile du Sud", route: "Réunion → Port Louis", speed: 9.8, head: "NE", headDeg: 45 },
];

/** Degrees and minutes with hemisphere, the chart-table format. */
function fmtDM(value: number, pos: string, neg: string): string {
  const hemi = value >= 0 ? pos : neg;
  const a = Math.abs(value);
  let d = Math.floor(a);
  let m = Math.round((a - d) * 60);
  if (m === 60) {
    m = 0;
    d += 1;
  }
  return `${d}°${String(m).padStart(2, "0")}′${hemi}`;
}

/** A plausible chart square around Mauritius for the cursor readout:
    the plate spans roughly 18°S–22°S and 55°E–60°E. */
function fmtPosition(xn: number, yn: number): string {
  const lat = -20.15 - 4.6 * (yn - 0.55);
  const lon = 57.5 + 5.6 * (xn - 0.5);
  return `${fmtDM(lat, "N", "S")} ${fmtDM(lon, "E", "W")}`;
}

/* ---- harbour almanac: Port Louis mean time, modelled M2 tide ------- */

const MUT_OFFSET_MS = 4 * 3_600_000; // Mauritius, UTC+4, no DST
const TIDE_T_MS = 12.4206 * 3_600_000; // M2 semidiurnal period
const TIDE_ANCHOR = Date.UTC(2025, 0, 1, 4, 0, 0); // fixed epoch, modelled

/** HH:MM in Port Louis mean time for an absolute epoch. */
function mutHM(ms: number): string {
  const d = new Date(ms + MUT_OFFSET_MS);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function tidePhase(nowMs: number): number {
  return (((nowMs - TIDE_ANCHOR) / TIDE_T_MS) % 1 + 1) % 1;
}

/** Modelled M2 height, normalised to -1 (low) .. +1 (high). */
function tideNorm(nowMs: number): number {
  return Math.cos(2 * Math.PI * tidePhase(nowMs));
}

/** True while the modelled tide is making (rising). */
function tideRising(nowMs: number): boolean {
  return Math.sin(2 * Math.PI * tidePhase(nowMs)) < 0;
}

function tideNextHigh(nowMs: number): number {
  const k = Math.ceil((nowMs - TIDE_ANCHOR) / TIDE_T_MS);
  return TIDE_ANCHOR + k * TIDE_T_MS;
}

function tideNextLow(nowMs: number): number {
  const k = Math.floor((nowMs - TIDE_ANCHOR) / TIDE_T_MS);
  return TIDE_ANCHOR + (tidePhase(nowMs) < 0.5 ? k + 0.5 : k + 1.5) * TIDE_T_MS;
}

/** 16-point compass reading for a wind bearing. */
const COMPASS_16 = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
function compass16(deg: number): string {
  return COMPASS_16[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

/** Caption almanac: the ticking Port Louis clock plus the modelled tide,
    state-set only when a printed value actually changes. */
function useHarbourCaption() {
  const [cap, setCap] = useState({ clock: "--:--", high: "--:--", low: "--:--", rising: true, norm: 0 });
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const next = {
        clock: mutHM(now),
        high: mutHM(tideNextHigh(now)),
        low: mutHM(tideNextLow(now)),
        rising: tideRising(now),
        norm: Math.round(tideNorm(now) * 200) / 200,
      };
      setCap((prev) =>
        prev.clock === next.clock && prev.high === next.high && prev.low === next.low && prev.rising === next.rising && prev.norm === next.norm
          ? prev
          : next
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return cap;
}

function TheOceanNow({
  windKph,
  windDir,
  cloud,
  atSea,
  arrivalsToday,
}: {
  windKph: number;
  windDir: number;
  cloud: number;
  atSea: number;
  arrivalsToday: number;
}) {
  const cap = useHarbourCaption();
  const isMobile = useIsMobile();
  const vessels = Math.max(0, Math.min(24, Math.round(atSea)));
  const arrivals = Math.max(0, Math.min(12, Math.round(arrivalsToday)));
  const cloudCss = (Math.max(0, Math.min(100, cloud)) / 100).toFixed(2);
  /* gauge geometry: marker travels the 120-tall track, high at the top */
  const markY = 60 - cap.norm * 50;

  /* bridge mode: hovering the water, focusing the chip, or pinning it */
  const waterRef = useRef<HTMLDivElement | null>(null);
  const readoutRef = useRef<HTMLSpanElement | null>(null);
  const coarseRef = useRef(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const active = hovered || focused || pinned;

  useEffect(() => {
    coarseRef.current = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  }, []);

  /* the crosshair rides the cursor: hairlines plus a live position readout,
     updated imperatively so the plate never re-renders on the move */
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (coarseRef.current) return;
    const el = waterRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const y = Math.min(Math.max(e.clientY - r.top, 0), r.height);
    el.style.setProperty("--cx", `${x.toFixed(1)}px`);
    el.style.setProperty("--cy", `${y.toFixed(1)}px`);
    el.dataset.cross = "1";
    const readout = readoutRef.current;
    if (readout) {
      readout.textContent = fmtPosition(x / r.width, y / r.height);
      const tx = x > r.width - 132 ? "-100%" : "-50%";
      const ty = y < 72 ? "16px" : "calc(-100% - 14px)";
      readout.style.transform = `translate(${tx}, ${ty})`;
    }
  };

  const onWaterLeave = () => {
    setHovered(false);
    const el = waterRef.current;
    if (el) delete el.dataset.cross;
  };

  /* the fleet split across the runs, anchored to the live count at sea */
  const mombasa = Math.max(1, Math.round(vessels * 0.44));
  const toamasina = Math.max(1, Math.round(vessels * 0.33));
  const maherun = Math.max(0, vessels - mombasa - toamasina);
  const fleetRows: BreakdownRow[] = [
    { label: "Mombasa run", value: `${mombasa} vessels`, color: "var(--cluster-retail)" },
    { label: "Toamasina run", value: `${toamasina} vessels`, color: "var(--cluster-industrials)" },
    { label: "Mahé–Réunion run", value: `${maherun} vessels`, color: "var(--cluster-services)" },
  ];
  const shown = isMobile ? 4 : 5;

  return (
    <figure
      aria-label="Live view of the Indian Ocean off Port Louis with a vessel of the fleet under way, and live fleet telemetry"
      className="sea-frame glass relative overflow-hidden rounded-2xl"
    >
      <style>{VESSEL_CSS}</style>
      <div
        className="vessel-scene"
        data-fleet={active ? "on" : "off"}
        style={{ "--vessel-cloud": cloudCss } as CSSProperties}
      >
        <div
          ref={waterRef}
          className="vessel-water"
          onPointerMove={onPointerMove}
          onMouseEnter={() => {
            if (!coarseRef.current) setHovered(true);
          }}
          onMouseLeave={onWaterLeave}
          onClick={() => {
            if (coarseRef.current) setPinned((v) => !v);
          }}
        >
          <img
            src="/images/vessel.jpg"
            alt="A cargo vessel of the fleet under way in the open Indian Ocean off Mauritius"
            className="vessel-photo"
            loading="lazy"
            draggable={false}
          />
          <div className="vessel-grade" aria-hidden="true" />
          <div className="vessel-shade" aria-hidden="true" />
          <div className="vessel-sweep" aria-hidden="true" />

          {/* bridge mode: contacts locked onto the traffic, the chart
              crosshair riding the cursor with a live position readout */}
          <div className="fleet-layer" aria-hidden="true">
            <span className="fleet-cross-x" />
            <span className="fleet-cross-y" />
            {CONTACTS.map((c, i) => (
              <div
                key={c.id}
                className={cn(
                  "contact",
                  `contact--${c.id}`,
                  c.tag === "right" && "contact--w",
                  c.tag === "left" && "contact--e",
                  c.primary && "contact--primary"
                )}
                style={{ "--i": i } as CSSProperties}
              >
                <span className="contact-ring">
                  <span className="contact-vec" style={{ rotate: `${c.headDeg}deg` }} />
                </span>
                {c.primary && <span className="contact-brackets" />}
                {c.primary && <span className="contact-ping" />}
                <span className="contact-tag">
                  <span className="contact-name">{c.name}</span>
                  <span className="contact-detail">
                    {c.route} · {c.speed.toFixed(1)} kn · {c.head}
                  </span>
                </span>
              </div>
            ))}
            <span className="fleet-readout" ref={readoutRef} />
          </div>

          {/* margin instruments */}
          <div className="vessel-hud">
            <p className="vessel-chip chip-title" style={{ left: 14, top: 12 }}>
              <span className="live-dot" aria-hidden="true" />
              <span>The Indian Ocean · Right now</span>
            </p>
            <p className="vessel-chip tabular" style={{ right: 14, top: 12 }} title="Wind reading for Port Louis roadstead">
              Wind {Math.round(windKph)} km/h {compass16(windDir)}
            </p>
            <p className="vessel-coords">20°09′S 57°30′E · Port Louis</p>
            <div className="vessel-gauge-wrap" aria-hidden="true" title="Modelled M2 tide for Port Louis">
              <span className="vessel-gauge-label">HW {cap.high}</span>
              <svg className="vessel-gauge" viewBox="0 0 22 120">
                <line x1="17" y1="10" x2="17" y2="110" stroke="currentColor" strokeOpacity="0.75" strokeWidth="1.2" />
                {[10, 35, 60, 85, 110].map((yy) => (
                  <line key={yy} x1="12.5" y1={yy} x2="17" y2={yy} stroke="currentColor" strokeOpacity="0.62" strokeWidth="1" />
                ))}
                <path d={`M11.5 ${markY - 4} L4.5 ${markY} L11.5 ${markY + 4} Z`} fill="var(--ibl-teal)" />
              </svg>
              <span className="vessel-gauge-label">LW {cap.low}</span>
            </div>
          </div>

          {/* the fleet chip — the plate's one control: keyboard focus opens
              the bridge view, a click pins it, a tap toggles it on touch */}
          <button
            type="button"
            className="vessel-chip fleet-chip"
            aria-pressed={active}
            aria-label={`Fleet at sea: ${vessels} vessels. ${active ? "Hide" : "Show"} live fleet telemetry`}
            onClick={(e) => {
              e.stopPropagation();
              setPinned((v) => !v);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            <Radar className="fleet-chip-icon size-3 shrink-0" aria-hidden />
            <span className="tabular">{vessels} vessels at sea</span>
          </button>
        </div>

        {/* the run breakdown: the Revenue-Today instrument applied to the
            plate. Desktop: a glass leaf over the water; mobile: it prints
            beneath the plate, in flow, never covering the contacts. */}
        <div className="fleet-panel" role="group" aria-label="Fleet at sea, breakdown by run">
          <div className="fleet-panel-clip">
            <div className="fleet-panel-inner">
              <p className="fleet-head">
                <span className="live-dot" aria-hidden="true" />
                <span>Fleet · right now</span>
                <span className="fleet-count">{vessels} at sea</span>
              </p>
              {fleetRows.map((row) => (
                <p key={row.label} className="fleet-row">
                  <span className="fleet-row-label">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: row.color }} aria-hidden="true" />
                    {row.label}
                  </span>
                  <span className="fleet-row-value">{row.value}</span>
                </p>
              ))}
              <p className="fleet-foot">
                {arrivals} arrivals due today · {shown} of {vessels} contacts tracked
              </p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="border-t border-foreground/10 px-4 py-3 sm:px-5 md:px-6">
        <span className="sr-only">
          A live view of the Indian Ocean off Port Louis: a cargo vessel of the fleet under way, the tide{" "}
          {cap.rising ? "rising" : "falling"} on the modelled M2 semidiurnal harmonic, wind at {Math.round(windKph)}{" "}
          kilometres per hour from the {compass16(windDir)}, {vessels} vessels of the fleet at sea with {arrivals}{" "}
          arrivals due today, and the local time {cap.clock} in Port Louis. Hovering, tapping, or focusing the plate
          tracks the fleet: the contacts under way and the breakdown of the fleet by run.
        </span>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2.5">
          <p className="flex items-center gap-2.5 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="live-dot hud-dot shrink-0" aria-hidden="true" />
            <span>The Indian Ocean · Right now</span>
          </p>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Harbour conditions right now">
            <li
              className="tabular text-[0.66rem] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              title="Tide modelled on the M2 semidiurnal harmonic for Port Louis"
            >
              Tide {cap.rising ? "↑ rising" : "↓ falling"} · next high {cap.high}*
            </li>
            <li
              className="tabular text-[0.66rem] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              title="Expected vessel arrivals at Port Louis today"
            >
              {arrivals} arrivals due today
            </li>
          </ul>
          <p className="ml-auto tabular text-[0.66rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Port Louis {cap.clock} MUT
          </p>
        </div>
      </figcaption>
    </figure>
  );
}


const REVENUE_ROWS: BreakdownRow[] = [
  { label: "Retail", value: "47% · MU KE RE", color: "var(--cluster-retail)" },
  { label: "CBD", value: "25% · MU MG", color: "var(--cluster-cbd)" },
  { label: "Industrials", value: "16% · MU MG", color: "var(--cluster-industrials)" },
  { label: "Services", value: "12% · MU RE", color: "var(--cluster-services)" },
];

const TRANSACTION_ROWS: BreakdownRow[] = [
  { label: "Retail", value: "71%", color: "var(--cluster-retail)" },
  { label: "CBD", value: "18%", color: "var(--cluster-cbd)" },
  { label: "Services", value: "11%", color: "var(--cluster-services)" },
];

const CARGO_ROWS: BreakdownRow[] = [
  { label: "Industrials", value: "62% · MU MG", color: "var(--cluster-industrials)" },
  { label: "Retail", value: "22% · KE", color: "var(--cluster-retail)" },
  { label: "Services", value: "16% · MU", color: "var(--cluster-services)" },
];

const MEAL_ROWS: BreakdownRow[] = [
  { label: "Services", value: "52% · resorts", color: "var(--cluster-services)" },
  { label: "Retail", value: "48%", color: "var(--cluster-retail)" },
];

const ENERGY_ROWS: BreakdownRow[] = [
  { label: "Bagasse", value: "58%", color: "var(--cluster-industrials)" },
  { label: "Solar", value: "31%", color: "var(--ibl-teal)" },
  { label: "Wind and storage", value: "11%", color: "var(--cluster-cbd)" },
];

const PEOPLE_ROWS: BreakdownRow[] = [
  { label: "Retail", value: "40.6%", color: "var(--cluster-retail)" },
  { label: "Industrials", value: "33.9%", color: "var(--cluster-industrials)" },
  { label: "Services", value: "15.8%", color: "var(--cluster-services)" },
  { label: "CBD", value: "9.7%", color: "var(--cluster-cbd)" },
];

interface CardDef {
  id: string;
  label: string;
  value: string;
  caption: string;
  span: string;
  rule: string;
  rows: BreakdownRow[];
  tilt?: boolean;
  wide?: boolean;
}

function StatCard({ card, valueRef }: { card: CardDef; valueRef?: RefObject<HTMLSpanElement | null> }) {
  const tiltRef = useTilt(6);
  const cardStyle = { "--active-cluster": card.rule } as CSSProperties;

  return (
    <article
      ref={card.tilt ? tiltRef : undefined}
      className={cn(
        "pulse-lift glass relative rounded-2xl p-5 md:p-6",
        card.tilt ? "tilt-card" : "lift",
        card.span
      )}
      style={cardStyle}
    >
      <span
        aria-hidden
        className="rule-cluster absolute top-5 bottom-5 left-0 w-[3px]"
        style={{ background: "linear-gradient(180deg, var(--active-cluster), transparent 85%)", height: "auto" }}
      />
      <BreakdownPopover title={`${card.label} breakdown`} rows={card.rows} align="start" className="block">
        {card.wide ? (
          <span className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span ref={valueRef} className="h-sub tabular">
              {card.value}
            </span>
            <span className="caption pulse-card-cap">{card.caption}</span>
          </span>
        ) : (
          <span className="block">
            <span ref={valueRef} className="h-sub tabular block">
              {card.value}
            </span>
            <span className="caption pulse-card-cap mt-2 block">{card.caption}</span>
          </span>
        )}
      </BreakdownPopover>
    </article>
  );
}

export function PulseSection() {
  const pulse = usePulse();
  const m = pulseMetrics(pulse);
  const ready = pulse !== null;

  const revenue = useLiveCounter(PULSE_ANCHORS.revenuePerSecond, m.revenueToday);
  const transactions = useLiveCounter(PULSE_ANCHORS.transactionsPerSecond, m.transactionsToday);
  const cargo = useLiveCounter(PULSE_ANCHORS.cargoPerSecond, m.cargoToday);
  const meals = useLiveCounter(PULSE_ANCHORS.mealsPerSecond, m.mealsToday);
  const energy = useLiveCounter(PULSE_ANCHORS.energyPerSecond, m.energyToday);
  const { ref: peopleRef, value: peopleValue } = useCountUp(GROUP.team, 2200);

  const { ref: titleRef, style: titleStyle } = useReveal<HTMLDivElement>("w");
  const { ref: blurbRef, style: blurbStyle } = useReveal<HTMLDivElement>("e");
  const { ref: seaRef, style: seaStyle } = useReveal<HTMLDivElement>("w");

  const teamSplit = useMemo(
    () => CLUSTERS.map((c) => `${c.short} ${c.team.toLocaleString("en-US").replace(/,/g, " ")}`).join(" · "),
    []
  );

  const cards: CardDef[] = [
    {
      id: "revenue",
      label: "Revenue today",
      value: ready ? `Rs ${(revenue.value / 1e6).toFixed(1)} M` : "Rs …",
      caption: "modelled from FY revenue, Rs 124.3 Bn",
      span: "sm:col-span-2 md:col-span-5",
      rule: "var(--cluster-retail)",
      rows: REVENUE_ROWS,
      tilt: true,
    },
    {
      id: "transactions",
      label: "Transactions today",
      value: ready ? Math.floor(transactions.value).toLocaleString("en-US") : "…",
      caption: "across 130+ stores",
      span: "md:col-span-4",
      rule: "var(--cluster-cbd)",
      rows: TRANSACTION_ROWS,
    },
    {
      id: "cargo",
      label: "Cargo moved today",
      value: ready
        ? `${cargo.value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
        : "…",
      caption: "cold chain and seafood",
      span: "md:col-span-3",
      rule: "var(--cluster-industrials)",
      rows: CARGO_ROWS,
    },
    {
      id: "meals",
      label: "Meals served today",
      value: ready ? Math.floor(meals.value).toLocaleString("en-US") : "…",
      caption: "resorts, canteens, fresh counters",
      span: "sm:col-span-2 md:col-span-7",
      rule: "var(--cluster-services)",
      rows: MEAL_ROWS,
      tilt: true,
    },
    {
      id: "energy",
      label: "Energy generated today",
      value: ready
        ? `${energy.value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MWh`
        : "…",
      caption: "bagasse and solar",
      span: "md:col-span-5",
      rule: "var(--cluster-industrials)",
      rows: ENERGY_ROWS,
    },
    {
      id: "people",
      label: "People",
      value: `${Math.round(peopleValue).toLocaleString("en-US").replace(/,/g, " ")}`,
      caption: "across 20 countries",
      span: "sm:col-span-2 md:col-span-12",
      rule: "var(--ibl-teal)",
      rows: PEOPLE_ROWS,
      wide: true,
    },
  ];

  return (
    <section id="pulse" className="relative py-28 md:py-40" aria-label="Live group pulse">
      <style>{PAPER_GRADE_CSS}</style>
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div ref={titleRef} style={titleStyle}>
            <p className="eyebrow flex items-center gap-3">
              <span className="live-dot hud-dot" aria-hidden />
              Live pulse
            </p>
            <h2 className="h-display h-section mt-4 max-w-xl">
              <T k="pulse.title" />
            </h2>
          </div>
          <div ref={blurbRef} style={blurbStyle} className="max-w-sm md:ml-auto">
            <p className="pulse-cap caption">
              <T k="pulse.blurb" />
            </p>
          </div>
        </header>

        {/* The Indian Ocean · Right now — the lead instrument between the
            title and the numbers: the harbour as a living engraving, the
            swell scaled to the live trades, the fleet at sea riding the
            bands, the modelled tide on the chart margin, all ticking in
            Port Louis time. */}
        <div ref={seaRef} style={seaStyle} className="mt-10 md:mt-14">
          <TheOceanNow
            windKph={m.weather.windKph}
            windDir={m.weather.windDir}
            cloud={m.weather.cloud}
            atSea={m.shipments.atSea}
            arrivalsToday={m.shipments.arrivalsToday}
          />
        </div>

        {/* big number bento */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-14 md:grid-cols-12 md:gap-5">
          {cards.map((card) => (
            <StatCard key={card.id} card={card} valueRef={card.id === "people" ? peopleRef : undefined} />
          ))}
        </div>

        {/* people cluster split line */}
        <p className="pulse-cap caption mt-4 md:pl-1">{teamSplit}</p>
      </div>

      {/* subsidiary marquee */}
      <div
        aria-hidden
        className="relative mt-16 overflow-hidden md:mt-24 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
      >
        <div className="marquee-track items-center py-6 hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {SUBSIDIARIES.map((s) => (
                <span key={`${copy}-${s.id}`} className="flex shrink-0 items-center">
                  {/* Outline display type. The inline stroke sits slightly above the
                      .text-outline default so the names stay crisp over bright paper
                      without going heavy on the dark grades. Paper grades get a second
                      pass from the section style block above, a true printed weight. */}
                  <span
                    className="pulse-marquee-name h-display text-outline text-4xl whitespace-nowrap md:text-6xl"
                    style={{
                      WebkitTextStroke:
                        "1.5px color-mix(in srgb, var(--foreground) 74%, transparent)",
                    }}
                  >
                    {s.name}
                  </span>
                  <span
                    aria-hidden
                    className="mx-5 size-2 shrink-0 rounded-full md:mx-8 md:size-2.5"
                    style={{ background: CLUSTER_MAP[s.cluster].color }}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">{SUBSIDIARIES.map((s) => s.name).join(", ")}</p>
    </section>
  );
}
