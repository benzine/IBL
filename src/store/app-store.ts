"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LensId = "investor" | "talent" | "partner" | "press";
export type ThemeId = "abyss" | "light" | "oled" | "sepia" | "auto";
export type A11yProfile =
  | "none"
  | "low-vision"
  | "adhd"
  | "dyslexia"
  | "motor"
  | "epilepsy"
  | "colorblind";
export type LangId = "en" | "fr" | "cr";
export type CursorId = "custom" | "system";

interface AppState {
  lens: LensId;
  setLens: (l: LensId) => void;

  theme: ThemeId;
  setTheme: (t: ThemeId) => void;

  a11y: A11yProfile;
  setA11y: (a: A11yProfile) => void;

  lang: LangId;
  setLang: (l: LangId) => void;

  sound: boolean;
  setSound: (s: boolean) => void;

  curtain: boolean;
  setCurtain: (c: boolean) => void;

  metFaces: string[];
  metFace: (id: string) => void;

  reducedMotion: boolean;
  setReducedMotion: (r: boolean) => void;

  paletteOpen: boolean;
  setPaletteOpen: (o: boolean) => void;

  userAccent: string | null;
  setUserAccent: (hex: string | null) => void;

  askOpen: boolean;
  setAskOpen: (o: boolean) => void;

  wipeDone: boolean;
  setWipeDone: (w: boolean) => void;

  /* The signature pointer is the default, the OS cursor is the fallback */
  cursor: CursorId;
  setCursor: (c: CursorId) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      lens: "investor",
      setLens: (lens) => set({ lens }),

      /* Light is the heritage default, every IBL site before us was born on paper */
      theme: "light",
      setTheme: (theme) => set({ theme }),

      a11y: "none",
      setA11y: (a11y) => set({ a11y }),

      lang: "en",
      setLang: (lang) => set({ lang }),

      sound: false,
      setSound: (sound) => set({ sound }),

      curtain: false,
      setCurtain: (curtain) => set({ curtain }),

      metFaces: [],
      metFace: (id) =>
        set((s) => (s.metFaces.includes(id) ? s : { metFaces: [...s.metFaces, id] })),

      reducedMotion: false,
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),

      paletteOpen: false,
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

      userAccent: null,
      setUserAccent: (userAccent) => set({ userAccent }),

      askOpen: false,
      setAskOpen: (askOpen) => set({ askOpen }),

      wipeDone: false,
      setWipeDone: (wipeDone) => set({ wipeDone }),

      cursor: "custom",
      setCursor: (cursor) => set({ cursor }),
    }),
    {
      name: "ibl-experience-2",
      skipHydration: true,
      partialize: (s) => ({
        lens: s.lens,
        theme: s.theme,
        a11y: s.a11y,
        lang: s.lang,
        sound: s.sound,
        metFaces: s.metFaces,
        userAccent: s.userAccent,
        reducedMotion: s.reducedMotion,
        cursor: s.cursor,
      }),
    }
  )
);
