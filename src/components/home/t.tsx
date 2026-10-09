"use client";

import { useApp, type LangId } from "@/store/app-store";
import { translate } from "@/lib/i18n";

interface TProps {
  k: string;
  /** optional explicit english fallback */
  en?: string;
  className?: string;
}

/**
 * Layout preserving live translation. Renders the active language.
 * Hovering shows the original string in a soft tooltip.
 */
export function T({ k, en, className }: TProps) {
  const lang = useApp((s) => s.lang);
  const original = en ?? translate(k, "en");
  const text = en
    ? lang === "en"
      ? en
      : translate(k, lang)
    : translate(k, lang);

  const isTranslated = lang !== "en" && text !== original;

  return (
    <span
      className={className}
      data-original={isTranslated ? original : undefined}
      title={isTranslated ? `Original · ${original}` : undefined}
    >
      {text ?? original}
    </span>
  );
}

export function useLang(): LangId {
  return useApp((s) => s.lang);
}
