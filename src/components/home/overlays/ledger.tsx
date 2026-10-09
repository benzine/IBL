"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LEDGER_ENTRIES } from "@/lib/data/eras";
import { EASE } from "@/lib/brand";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A hidden keyboard combination reveals the 1830 original trading ledger.
 * Type 1 8 3 0 anywhere. A parchment overlay rises.
 */
export function LedgerOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        buffer = (buffer + e.key).slice(-4);
        if (buffer === "1830") {
          setOpen(true);
          buffer = "";
        }
      } else {
        buffer = "";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="The 1830 trading ledger, a hidden keepsake"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[280] flex items-center justify-center bg-[#120d06]/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ rotateX: 18, y: 60, opacity: 0 }}
            animate={{ rotateX: 0, y: 0, opacity: 1 }}
            exit={{ rotateX: 10, y: 40, opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE.luxe }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[86svh] w-full max-w-2xl overflow-y-auto rounded-lg p-8 md:p-12 shadow-[0_50px_140px_-30px_rgba(0,0,0,0.9)]"
            style={{
              background:
                "radial-gradient(120% 100% at 30% 0%, #f4e8cf 0%, #e8d9b5 55%, #d9c69a 100%)",
              color: "#3b2f20",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent 0 26px, rgba(59,47,32,0.08) 26px 27px), radial-gradient(80% 60% at 70% 20%, rgba(59,47,32,0.12), transparent)",
              }}
            />
            <p className="text-[10px] uppercase tracking-[0.5em] opacity-60">
              Port Louis · second account current
            </p>
            <h2 className="font-display mt-3 text-4xl italic md:text-5xl" style={{ color: "#3b2f20" }}>
              The ledger, 1830
            </h2>
            <p className="font-display mt-2 text-sm italic opacity-75">
              Kept by the clerks of Blyth Brothers. Shown here as a keepsake of the first year.
            </p>

            <div className="mt-8 space-y-5">
              {LEDGER_ENTRIES.map((e) => (
                <div
                  key={e.date}
                  className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-b border-[#3b2f20]/15 pb-4"
                >
                  <span className="text-[11px] uppercase tracking-[0.14em] opacity-70">{e.date}</span>
                  <span className="font-display text-[15px] leading-snug">{e.entry}</span>
                  <span className="tabular text-sm font-semibold">{e.amount}</span>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-[10px] uppercase tracking-[0.4em] opacity-50">
              Carry forward · £748 19s 3d · into 196 years and counting
            </p>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close the ledger"
              className="absolute right-3 top-3 h-11 w-11 rounded-full text-[#3b2f20] hover:bg-[#3b2f20]/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
