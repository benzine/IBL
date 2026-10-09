export type LangId = "en" | "fr" | "cr";

/**
 * Layout preserving live translation dictionary.
 * t(key) returns the string for the active language.
 * show original on hover is handled by the <T /> component.
 */
export const STRINGS: Record<string, Record<LangId, string>> = {
  "nav.about": {
    en: "About",
    fr: "À propos",
    cr: "Kont nu",
  },
  "nav.clusters": {
    en: "Clusters",
    fr: "Pôles",
    cr: "Groupp",
  },
  "nav.pulse": {
    en: "Live pulse",
    fr: "Pulsation",
    cr: "Lavi group",
  },
  "nav.history": {
    en: "Since 1830",
    fr: "Depuis 1830",
    cr: "Depi 1830",
  },
  "nav.people": {
    en: "People",
    fr: "Nos gens",
    cr: "Dimunn",
  },
  "nav.newsroom": {
    en: "Newsroom",
    fr: "Actualités",
    cr: "Nouvel",
  },
  "nav.contact": {
    en: "Contact",
    fr: "Contact",
    cr: "Kontakt",
  },
  "hero.kicker": {
    en: "Mauritius · est. 1830 · 20 countries",
    fr: "Maurice · dep. 1830 · 20 pays",
    cr: "Moris · depi 1830 · 20 pei",
  },
  "hero.line1": {
    en: "A Mauritian heart.",
    fr: "Un cœur mauricien.",
    cr: "Enn leker morisien.",
  },
  "hero.line2": {
    en: "A regional force.",
    fr: "Une force régionale.",
    cr: "Enn fors rezional.",
  },
  "hero.line3": {
    en: "Global expertise.",
    fr: "Une expertise mondiale.",
    cr: "Lekspertiz mondyal.",
  },
  "hero.scroll": {
    en: "Scroll, the ocean is moving",
    fr: "Défilez, l’océan bouge",
    cr: "Roul, losyan ap rod",
  },
  "pulse.title": {
    en: "The group, right now",
    fr: "Le groupe, en ce moment",
    cr: "Le group, aster la",
  },
  "pulse.blurb": {
    en: "Figures modelled from FY disclosures and today’s clock. Hover any number for the cluster and country split.",
    fr: "Chiffres modélisés depuis les résultats annuels et l’heure du jour. Survolez un nombre pour le détail par pôle et par pays.",
    cr: "Chif ki vini depi rezilta lanne ek ler ozordi. Met laluz pur wer detay par groupp ek par pei.",
  },
  "timemachine.title": {
    en: "Two centuries, one scroll",
    fr: "Deux siècles, un défilement",
    cr: "De siek, enn roulman",
  },
  "constellation.title": {
    en: "The constellation",
    fr: "La constellation",
    cr: "La konstelasion",
  },
  "constellation.blurb": {
    en: "Every subsidiary is a star. Filter by cluster, country, sector or year. Lines are live collaborations.",
    fr: "Chaque filiale est une étoile. Filtrez par pôle, pays, secteur ou année. Les traits sont des collaborations réelles.",
    cr: "Cak filiyer enn zetwal. Filter par groupp, pei, sekter oub lane. Liy inn les kolaborasion.",
  },
  "clusters.title": {
    en: "Four clusters, one mission",
    fr: "Quatre pôles, une mission",
    cr: "Kat groupp, enn misyon",
  },
  "movements.title": {
    en: "The movements board",
    fr: "Le tableau des mouvements",
    cr: "Tablo muvman",
  },
  "movements.blurb": {
    en: "Air, sea and land, one day of the group's logistics rendered as a living departures board.",
    fr: "Air, mer et terre : une journée de la logistique du groupe, comme un tableau de départs vivant.",
    cr: "Ler, lanmer ek later : enn zour lojistik group, annan tablo depa ki viv.",
  },
  "basket.title": {
    en: "Already in your basket",
    fr: "Déjà dans votre panier",
    cr: "Za dans ou panier",
  },
  "basket.blurb": {
    en: "Twelve everyday things. Every one of them already runs through IBL. Tap the shelf and see.",
    fr: "Douze choses du quotidien. Toutes passent déjà par IBL. Touchez l'étagère et voyez.",
    cr: "Douz lekoz toulezour. Tou depi IBL za. Touch lerak ek wer.",
  },
  "map.title": {
    en: "Where we stand",
    fr: "Là où nous sommes",
    cr: "Kot nu ete",
  },
  "map.blurb": {
    en: "Hover a shore. Local brands light up, one human story surfaces.",
    fr: "Survolez un rivage. Les marques locales s’allument, une histoire humaine remonte.",
    cr: "Met laluz lor lakot. Mark lokal alume, enn listwar dimunn svmont.",
  },
  "mosaic.title": {
    en: "Forty thousand faces",
    fr: "Quarante mille visages",
    cr: "Karant mil vizaz",
  },
  "mosaic.blurb": {
    en: "Faces and roles from the group's published leadership. Click a face for thirty seconds on their beat.",
    fr: "Visages et rôles issus de la direction publiée du groupe. Cliquez un visage pour trente secondes de leur quotidien.",
    cr: "Vizaz ek rol dibann dirzeksyon lo group. Klik enn vizaz pur trant segonn zot travay.",
  },
  "mosaic.met": {
    en: "You have met",
    fr: "Vous avez rencontré",
    cr: "Ou inn rankont",
  },
  "mosaic.of": {
    en: "of the forty thousand",
    fr: "des quarante mille",
    cr: "arman karant mil",
  },
  "planet.title": {
    en: "The ocean gives back",
    fr: "L’océan restitue",
    cr: "Losyan donn arier",
  },
  "investors.title": {
    en: "Investor room",
    fr: "Espace investisseurs",
    cr: "Laranzinvestiser",
  },
  "newsroom.title": {
    en: "Newsroom",
    fr: "Salle de rédaction",
    cr: "Sall nouvel",
  },
  "trust.title": {
    en: "Trust center",
    fr: "Centre de confiance",
    cr: "Santr konfyans",
  },
  "trust.blurb": {
    en: "Every official handle, in one visible place. If it is not listed here, it is not us.",
    fr: "Tous les canaux officiels, au même endroit visible. Ce qui n’est pas listé ici n’est pas nous.",
    cr: "Tou kanal ofisiel, enn samlie. Si pa list isi, sa pa nu.",
  },
  "trust.report": {
    en: "Report an impersonation",
    fr: "Signaler une usurpation",
    cr: "Raporte enn falso",
  },
  "footer.directory": {
    en: "The full directory",
    fr: "L’annuaire complet",
    cr: "Lanrwel komplet",
  },
  "footer.rights": {
    en: "All rights reserved.",
    fr: "Tous droits réservés.",
    cr: "Tou dwa rezerve.",
  },
  "ask.title": {
    en: "Ask IBL",
    fr: "Demandez à IBL",
    cr: "Demann IBL",
  },
  "ask.placeholder": {
    en: "Ask anything about the group…",
    fr: "Posez votre question sur le groupe…",
    cr: "Demann nimporki kiksoz lor group…",
  },
  "ask.handoff": {
    en: "Continue on WhatsApp",
    fr: "Continuer sur WhatsApp",
    cr: "Kontinie lor WhatsApp",
  },
  "palette.hint": {
    en: "Command palette",
    fr: "Palette de commandes",
    cr: "Palet komand",
  },
  "curtain.title": {
    en: "Behind the curtain",
    fr: "Derrière le rideau",
    cr: "Deryer ridro",
  },
  "sound.enable": {
    en: "Ambient sound",
    fr: "Son ambiant",
    cr: "Sonbyan",
  },
  "theme.label": {
    en: "Theme",
    fr: "Thème",
    cr: "Tem",
  },
  "lang.label": {
    en: "Language",
    fr: "Langue",
    cr: "Lang",
  },
  "a11y.label": {
    en: "Accessibility",
    fr: "Accessibilité",
    cr: "Aksesibilite",
  },
};

export function translate(key: string, lang: LangId): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}
