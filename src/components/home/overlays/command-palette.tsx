"use client";

import { useEffect } from "react";
import { useApp, type LensId, type ThemeId } from "@/store/app-store";
import { LENS_LIST } from "@/lib/lens";
import { CLUSTERS, BRAND } from "@/lib/brand";
import { SUBSIDIARIES } from "@/lib/data/subsidiaries";
import { PEOPLE } from "@/lib/data/people";
import { NEWS } from "@/lib/data/dividends";
import { COUNTRIES } from "@/lib/data/countries";
import { TRUSTED_CHANNELS } from "@/lib/data/trust";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ArrowDown,
  Building2,
  Compass,
  Download,
  FileText,
  Languages,
  Newspaper,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  Volume2,
  MessageCircle,
  Flag,
} from "lucide-react";

export function CommandPalette() {
  const open = useApp((s) => s.paletteOpen);
  const setOpen = useApp((s) => s.setPaletteOpen);
  const setLens = useApp((s) => s.setLens);
  const setLang = useApp((s) => s.setLang);
  const setTheme = useApp((s) => s.setTheme);
  const setSound = useApp((s) => s.setSound);
  const setAskOpen = useApp((s) => s.setAskOpen);
  const lang = useApp((s) => s.lang);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const go = (id: string) => {
    setOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={lang === "fr" ? "Rechercher ou exécuter…" : lang === "cr" ? "Serch oub le fair…" : "Search or run a command…"} />
      <CommandList className="max-h-[70vh]">
        <CommandEmpty>
          {lang === "fr" ? "Rien trouvé. Essayez un cluster, un pays, un nom." : "Nothing found. Try a cluster, a country, a name."}
        </CommandEmpty>

        <CommandGroup heading="Go to">
          <Item icon={<Compass />} label="The group, right now (live pulse)" onSelect={() => go("pulse")} />
          <Item icon={<Flag />} label="Two centuries, one scroll (time machine)" onSelect={() => go("timemachine")} />
          <Item icon={<Sparkles />} label="The constellation of subsidiaries" onSelect={() => go("constellation")} />
          <Item icon={<Building2 />} label="The four cluster floods" onSelect={() => go("clusters")} />
          <Item icon={<Compass />} label="Where we stand (ocean map)" onSelect={() => go("map")} />
          <Item icon={<Users />} label="Forty thousand faces" onSelect={() => go("mosaic")} />
          <Item icon={<Newspaper />} label="Newsroom" onSelect={() => go("newsroom")} />
          <Item icon={<ShieldCheck />} label="Trust center, verified channels" onSelect={() => go("trust")} />
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Actions">
          <Item
            icon={<FileText />}
            label="Download the annual report"
            hint="One tap"
            onSelect={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("ibl:open-builder", { detail: { kind: "report" } }));
            }}
          />
          <Item
            icon={<Download />}
            label="Show careers in Kenya"
            hint="Naivas, retail"
            onSelect={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("ibl:open-builder", { detail: { kind: "jobs", country: "Kenya" } }));
            }}
          />
          <Item
            icon={<MessageCircle />}
            label="Ask IBL anything"
            hint="Answers with sources"
            onSelect={() => {
              setOpen(false);
              setAskOpen(true);
            }}
          />
          <Item
            icon={<ShieldCheck />}
            label="Report an impersonation"
            onSelect={() => {
              setOpen(false);
              requestAnimationFrame(() => document.getElementById("trust")?.scrollIntoView({ behavior: "smooth" }));
            }}
          />
          <Item
            icon={<Download />}
            label="Press kit in one tap"
            onSelect={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("ibl:open-builder", { detail: { kind: "presskit" } }));
            }}
          />
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Lens">
          {LENS_LIST.map((l) => (
            <Item
              key={l.id}
              icon={<Palette />}
              label={`See the group as ${l.label.toLowerCase()}`}
              dot={l.temperature}
              onSelect={() => {
                setLens(l.id as LensId);
                setOpen(false);
              }}
            />
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Settings">
          <Item icon={<Languages />} label="Language, English" onSelect={() => setLang("en")} />
          <Item icon={<Languages />} label="Langue, français" onSelect={() => setLang("fr")} />
          <Item icon={<Languages />} label="Lang, kreol morisien" onSelect={() => setLang("cr")} />
          <Item icon={<Palette />} label="Theme, light" onSelect={() => setTheme("light" as ThemeId)} />
          <Item icon={<Palette />} label="Theme, OLED pure black" onSelect={() => setTheme("oled" as ThemeId)} />
          <Item icon={<Palette />} label="Theme, sepia archive" onSelect={() => setTheme("sepia" as ThemeId)} />
          <Item icon={<Volume2 />} label="Ambient sound on" onSelect={() => setSound(true)} />
          <Item icon={<ArrowDown />} label="Behind the curtain" onSelect={() => {
            setOpen(false);
            window.dispatchEvent(new CustomEvent("ibl:open-curtain"));
          }} />
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Clusters">
          {CLUSTERS.map((c) => (
            <Item
              key={c.id}
              icon={<Building2 />}
              label={`${c.name} · ${c.revenue}`}
              dot={c.color}
              onSelect={() => go("clusters")}
            />
          ))}
        </CommandGroup>

        <CommandGroup heading="Subsidiaries">
          {SUBSIDIARIES.slice(0, 12).map((s) => (
            <Item
              key={s.id}
              icon={<Sparkles />}
              label={`${s.name} · ${s.country}`}
              onSelect={() => go("constellation")}
            />
          ))}
        </CommandGroup>

        <CommandGroup heading="People">
          {PEOPLE.map((p) => (
            <Item
              key={p.id}
              icon={<Users />}
              label={`${p.name}, ${p.role}`}
              onSelect={() => go("mosaic")}
            />
          ))}
        </CommandGroup>

        <CommandGroup heading="Countries">
          {COUNTRIES.map((c) => (
            <Item key={c.code} icon={<Compass />} label={c.name} onSelect={() => go("map")} />
          ))}
        </CommandGroup>

        <CommandGroup heading="News">
          {NEWS.map((n) => (
            <Item key={n.id} icon={<Newspaper />} label={n.title.slice(0, 64)} onSelect={() => go("newsroom")} />
          ))}
        </CommandGroup>

        <CommandGroup heading="Verified contacts">
          {TRUSTED_CHANNELS.filter((t) => t.href).map((t) => (
            <Item
              key={t.label}
              icon={<ShieldCheck />}
              label={`${t.label} · ${t.value}`}
              onSelect={() => {
                setOpen(false);
                window.open(t.href, "_blank", "noopener,noreferrer");
              }}
            />
          ))}
        </CommandGroup>
      </CommandList>
      <p className="caption border-t border-border/60 px-4 py-2 text-[10px]">
        {BRAND.phone} · {BRAND.hq}
      </p>
    </CommandDialog>
  );
}

function Item({
  icon,
  label,
  hint,
  dot,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  dot?: string;
  onSelect: () => void;
}) {
  return (
    <CommandItem onSelect={onSelect} className="min-h-11">
      <span className="mr-2 opacity-70">{icon}</span>
      <span className="truncate">{label}</span>
      {dot && <span className="ml-2 h-2 w-2 rounded-full" style={{ background: dot }} />}
      {hint && <CommandShortcut>{hint}</CommandShortcut>}
    </CommandItem>
  );
}
