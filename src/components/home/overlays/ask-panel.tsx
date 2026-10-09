"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-store";
import { T } from "../t";
import { BRAND, EASE } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Sparkles, BadgeCheck, ExternalLink } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  handoff?: boolean;
}

export function AskPanel() {
  const open = useApp((s) => s.askOpen);
  const setOpen = useApp((s) => s.setAskOpen);
  const reduced = useApp((s) => s.reducedMotion);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Ask me about the clusters, the history since 1830, results, dividends, verified contacts. I answer from group documents and always show my sources.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  /* The desk says hello once: the panel opens for two seconds after the
     experience boots, then folds back to the pill. Any interaction keeps
     it open, and it never intrudes on a repeat visit or under reduced
     motion. */
  const teaserTouched = useRef(false);
  useEffect(() => {
    if (reduced) return;
    if (sessionStorage.getItem("ibl-ask-teased") === "1") return;
    const startTeaser = () => {
      sessionStorage.setItem("ibl-ask-teased", "1");
      setOpen(true);
      window.setTimeout(() => {
        if (!teaserTouched.current && useApp.getState().askOpen) setOpen(false);
      }, 2000);
    };
    const onBooted = () => window.setTimeout(startTeaser, 500);
    const booted = (window as unknown as { __iblBooted?: boolean }).__iblBooted;
    if (booted) {
      onBooted();
    } else {
      window.addEventListener("ibl:booted", onBooted, { once: true });
    }
    return () => window.removeEventListener("ibl:booted", onBooted);
  }, [reduced, setOpen]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  const ask = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { answer: string; sources: string[]; handoff: boolean };
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer, sources: data.sources, handoff: data.handoff },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "The desk went quiet. Continue on WhatsApp and a colleague will pick it up.",
          handoff: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const handoffHref = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
    `Hello IBL, I was reading the group site and wanted to ask: ${lastAssistant ? "my question was not fully answered." : ""}`
  )}`;

  return (
    <>
      {/* The dock entry. Explicit action only, it never pops uninvited. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="ask-dock"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.7, ease: EASE.luxe, delay: 0.4 }}
            onClick={() => setOpen(true)}
            aria-label="Ask IBL, opens the knowledge desk"
            className="btn-magnetic fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 items-center gap-2.5 rounded-full bg-teal px-5 text-sm font-semibold text-white shadow-teal hover:brightness-110 md:bottom-6 md:right-6"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">
              <T k="ask.title" />
            </span>
            <span className="sm:hidden">Ask</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="ask-panel"
            role="dialog"
            aria-label="Ask IBL knowledge desk"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.55, ease: EASE.luxe }}
            className="glass-strong fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 left-3 z-[80] flex max-h-[min(72svh,640px)] flex-col overflow-hidden rounded-3xl border border-border/70 shadow-teal-lg md:bottom-6 md:right-6 md:left-auto md:w-[430px]"
            onPointerDown={() => {
              teaserTouched.current = true;
            }}
            onKeyDown={() => {
              teaserTouched.current = true;
            }}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <p className="flex items-center gap-2 font-semibold tracking-tight">
                  <T k="ask.title" />
                  <span className="live-dot inline-flex" aria-hidden />
                </p>
                <p className="caption text-[10px]">Answers from group documents, with sources</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close Ask IBL"
                className="h-11 w-11 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div ref={listRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-teal/15 text-foreground"
                        : "bg-foreground/[0.05] text-foreground/90"
                    }`}
                  >
                    {m.content}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.sources.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 rounded-full border border-teal/30 bg-teal/10 px-2.5 py-1 text-[10px] text-teal"
                          >
                            <BadgeCheck className="h-3 w-3" />
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-1.5 px-2 text-teal" aria-live="polite">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-teal"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
                    />
                  ))}
                  <span className="caption ml-1">reading the documents</span>
                </div>
              )}
            </div>

            {lastAssistant?.handoff && (
              <a
                href={handoffHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-5 mb-3 flex items-center justify-between rounded-2xl border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-3 text-sm hover:bg-[#25D366]/20"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  <T k="ask.handoff" />
                </span>
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </a>
            )}

            <form
              className="flex items-center gap-2 border-t border-border/60 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                ask();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about the group…"
                aria-label="Your question for IBL"
                className="h-12 flex-1 rounded-full bg-foreground/5 px-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || input.trim().length === 0}
                aria-label="Send question"
                className="h-12 w-12 rounded-full bg-teal text-[#06131A] hover:bg-teal/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
