"use client";

import { useEffect } from "react";

/**
 * The deployed experience keeps its craft to itself. Every guard here
 * is inert while developing, the preview needs full freedom, and wakes
 * only inside a production build (the bundler inlines NODE_ENV, so the
 * check costs nothing and cannot be toggled from the console):
 *
 * - no context menu, no selection, no copy or cut, no image dragging
 * - the save, print, view-source and devtools shortcuts are answered
 * - printing anything other than the annual report returns a notice
 *   (the report flow arms html[data-print="report"] and is exempt)
 * - a copy saved to disk and reopened from file:// refuses to run
 *
 * What it deliberately is not: an obfuscation trick. The real encoding
 * happens at build time, minified bundles with no browser source maps,
 * so the pages that do get saved open broken and the work stays unread.
 */
export function CopyProtection() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const editable = (t: EventTarget | null): boolean =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable);

    /* a copy saved to the local disk is not the living site */
    if (location.protocol === "file:") {
      document.title = "IBL Ltd";
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;position:fixed;inset:0;background:#f8f6f1;color:#212979;font:500 14px/1.8 Elza Text,ui-sans-serif,system-ui,sans-serif;text-align:center;padding:48px;letter-spacing:0.05em">&copy; IBL Ltd &middot; This experience only lives at its official address.</div>';
      return;
    }

    const onContext = (e: MouseEvent) => {
      if (!editable(e.target)) e.preventDefault();
    };
    const onDrag = (e: DragEvent) => e.preventDefault();
    const onClipboard = (e: ClipboardEvent) => {
      if (!editable(e.target)) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      /* the annual report flow arms the document for its own print */
      if (document.documentElement.dataset.print === "report") return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      if (mod && !e.shiftKey && (k === "s" || k === "p" || k === "u")) {
        e.preventDefault();
        return;
      }
      if (mod && e.shiftKey && (k === "i" || k === "j" || k === "c")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("dragstart", onDrag);
    document.addEventListener("copy", onClipboard);
    document.addEventListener("cut", onClipboard);
    document.addEventListener("keydown", onKey, true);

    const style = document.createElement("style");
    style.textContent = [
      "*,*::before,*::after{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}",
      'input,textarea,[contenteditable="true"],[contenteditable=""]{-webkit-user-select:text!important;user-select:text!important}',
      "img{-webkit-user-drag:none!important}",
      '@media print{html:not([data-print="report"]) body>*:not(#ibl-print-guard){display:none!important}html:not([data-print="report"]) #ibl-print-guard{display:flex!important}}',
    ].join("");
    document.head.appendChild(style);

    /* the sheet a casual print earns: a single quiet line */
    const guard = document.createElement("div");
    guard.id = "ibl-print-guard";
    guard.setAttribute("aria-hidden", "true");
    guard.textContent =
      "© IBL Ltd · This document is not available for print. Official figures live at iblgroup.com.";
    guard.style.cssText =
      "display:none;position:fixed;inset:0;background:#f8f6f1;color:#212979;font:500 13px/1.8 Elza Text,ui-sans-serif,system-ui,sans-serif;align-items:center;justify-content:center;text-align:center;padding:40px;letter-spacing:0.06em;z-index:2147483647";
    document.body.appendChild(guard);

    /* a quiet signature for anyone reading the console */
    try {
      console.log(
        "%cIBL Ltd%c Shaping better lives since 1830. This experience, its code and its figures are protected work.",
        "font:600 13px Elza Text,sans-serif;color:#212979;padding:2px 8px;border:1px solid #212979;border-radius:4px",
        "color:#4BBDC8;font:500 12px Elza Text,sans-serif"
      );
    } catch {
      /* consoles that reject styled logs */
    }

    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("dragstart", onDrag);
      document.removeEventListener("copy", onClipboard);
      document.removeEventListener("cut", onClipboard);
      document.removeEventListener("keydown", onKey, true);
      style.remove();
      guard.remove();
    };
  }, []);

  return null;
}
