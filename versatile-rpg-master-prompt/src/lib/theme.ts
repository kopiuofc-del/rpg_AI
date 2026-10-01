/* ============================================================
   Temas visuais — §XLIX: a interface muda conforme o mundo
   ============================================================ */

export type ThemeId =
  | "mesa"
  | "fantasy"
  | "darkfantasy"
  | "arcane"
  | "magitech"
  | "scifi"
  | "dragonic"
  | "shinobi"
  | "pirate"
  | "cosmic";

export type ThemeVars = {
  "--felt-950": string;
  "--felt-900": string;
  "--felt-850": string;
  "--felt-800": string;
  "--felt-700": string;
  "--felt-600": string;
  "--felt-500": string;
  "--edge": string;
  "--edge-strong": string;
  "--edge-warm": string;
  "--paper": string;
  "--paper-dim": string;
  "--muted": string;
  "--dim": string;
  "--brass": string;
  "--brass-soft": string;
  "--brass-deep": string;
  "--verd": string;
  "--verd-deep": string;
  "--coral": string;
  "--wine": string;
  "--lamp-a": string;
  "--lamp-b": string;
  "--lamp-c": string;
  "--grain-opacity": string;
  "--display": string;
};

export type Theme = {
  id: ThemeId;
  name: string;
  emoji: string;
  tagline: string;
  vars: ThemeVars;
};

export const THEMES: Theme[] = [
  {
    id: "mesa",
    name: "Mesa",
    emoji: "◈",
    tagline: "A mesa noturna original: latão, verdete e papel",
    vars: {
      "--felt-950": "#0a1013",
      "--felt-900": "#0d1417",
      "--felt-850": "#101a1e",
      "--felt-800": "#142126",
      "--felt-700": "#1a2b31",
      "--felt-600": "#21363d",
      "--felt-500": "#2b454d",
      "--edge": "rgb(190 226 220 / 10%)",
      "--edge-strong": "rgb(190 226 220 / 20%)",
      "--edge-warm": "rgb(227 171 79 / 28%)",
      "--paper": "#e8efec",
      "--paper-dim": "#c3d2ce",
      "--muted": "#9bb1ac",
      "--dim": "#71878a",
      "--brass": "#e3ab4f",
      "--brass-soft": "#f2cd8b",
      "--brass-deep": "#a9762a",
      "--verd": "#55bda6",
      "--verd-deep": "#2b7a6b",
      "--coral": "#e2705c",
      "--wine": "#c25a6c",
      "--lamp-a": "rgb(227 171 79 / 13%)",
      "--lamp-b": "rgb(85 189 166 / 11%)",
      "--lamp-c": "rgb(194 90 108 / 7%)",
      "--grain-opacity": "0.32",
      "--display": '"Fraunces", "Iowan Old Style", Georgia, serif',
    },
  },
  {
    id: "fantasy",
    name: "Fantasia",
    emoji: "🏰",
    tagline: "Pergaminho, brasões e tinta de ferro-galha",
    vars: {
      "--felt-950": "#1a130a",
      "--felt-900": "#241a0e",
      "--felt-850": "#2c2013",
      "--felt-800": "#332518",
      "--felt-700": "#3d2c1d",
      "--felt-600": "#4a3524",
      "--felt-500": "#5a412d",
      "--edge": "rgb(233 205 152 / 12%)",
      "--edge-strong": "rgb(233 205 152 / 24%)",
      "--edge-warm": "rgb(233 205 152 / 38%)",
      "--paper": "#f2e6cf",
      "--paper-dim": "#dcc8a6",
      "--muted": "#bda582",
      "--dim": "#9a8264",
      "--brass": "#d9a83f",
      "--brass-soft": "#f0d489",
      "--brass-deep": "#96701f",
      "--verd": "#8aa55f",
      "--verd-deep": "#4d5c2c",
      "--coral": "#b8532f",
      "--wine": "#943f4c",
      "--lamp-a": "rgb(217 168 63 / 14%)",
      "--lamp-b": "rgb(138 165 74 / 9%)",
      "--lamp-c": "rgb(184 83 47 / 8%)",
      "--grain-opacity": "0.44",
      "--display": '"Fraunces", "Iowan Old Style", Georgia, serif',
    },
  },
  {
    id: "darkfantasy",
    name: "Dark Fantasy",
    emoji: "🌑",
    tagline: "Códice gótico, cera e cinza",
    vars: {
      "--felt-950": "#07080b",
      "--felt-900": "#0b0d12",
      "--felt-850": "#10121a",
      "--felt-800": "#151823",
      "--felt-700": "#1c2030",
      "--felt-600": "#242a3d",
      "--felt-500": "#2f364d",
      "--edge": "rgb(158 168 200 / 9%)",
      "--edge-strong": "rgb(158 168 200 / 18%)",
      "--edge-warm": "rgb(178 148 110 / 30%)",
      "--paper": "#d9dae0",
      "--paper-dim": "#b4b7c2",
      "--muted": "#8b8fa2",
      "--dim": "#6a6e80",
      "--brass": "#c8a06a",
      "--brass-soft": "#e3c79a",
      "--brass-deep": "#8a6a3f",
      "--verd": "#7f9c8a",
      "--verd-deep": "#3f5347",
      "--coral": "#a8473f",
      "--wine": "#7e3548",
      "--lamp-a": "rgb(200 160 106 / 9%)",
      "--lamp-b": "rgb(127 156 138 / 8%)",
      "--lamp-c": "rgb(168 71 63 / 8%)",
      "--grain-opacity": "0.4",
      "--display": '"Fraunces", "Iowan Old Style", Georgia, serif',
    },
  },
  {
    id: "arcane",
    name: "Arcano",
    emoji: "🔮",
    tagline: "Runas, círculos e energia violeta",
    vars: {
      "--felt-950": "#0b0714",
      "--felt-900": "#100a1d",
      "--felt-850": "#150e26",
      "--felt-800": "#1b1330",
      "--felt-700": "#241a3f",
      "--felt-600": "#2f2350",
      "--felt-500": "#3d2e66",
      "--edge": "rgb(186 150 255 / 11%)",
      "--edge-strong": "rgb(186 150 255 / 22%)",
      "--edge-warm": "rgb(214 173 255 / 32%)",
      "--paper": "#ece4fb",
      "--paper-dim": "#c9bce6",
      "--muted": "#a894cc",
      "--dim": "#8472a8",
      "--brass": "#c99cff",
      "--brass-soft": "#e4ccff",
      "--brass-deep": "#8452c9",
      "--verd": "#63d9c9",
      "--verd-deep": "#2b7d78",
      "--coral": "#f0708f",
      "--wine": "#c04a80",
      "--lamp-a": "rgb(201 156 255 / 14%)",
      "--lamp-b": "rgb(99 217 201 / 10%)",
      "--lamp-c": "rgb(240 112 143 / 8%)",
      "--grain-opacity": "0.28",
      "--display": '"Fraunces", "Iowan Old Style", Georgia, serif',
    },
  },
  {
    id: "magitech",
    name: "Magitech",
    emoji: "⚙️",
    tagline: "Cobre, aço e vapor com circuitos rúnicos",
    vars: {
      "--felt-950": "#0d1010",
      "--felt-900": "#121716",
      "--felt-850": "#171d1c",
      "--felt-800": "#1d2523",
      "--felt-700": "#26302d",
      "--felt-600": "#303d39",
      "--felt-500": "#3d4d48",
      "--edge": "rgb(180 214 205 / 10%)",
      "--edge-strong": "rgb(180 214 205 / 20%)",
      "--edge-warm": "rgb(226 152 84 / 32%)",
      "--paper": "#e2ece8",
      "--paper-dim": "#bccdc7",
      "--muted": "#94aaa3",
      "--dim": "#6f827c",
      "--brass": "#e29854",
      "--brass-soft": "#f4c391",
      "--brass-deep": "#9c6227",
      "--verd": "#5fc7b2",
      "--verd-deep": "#2a6d60",
      "--coral": "#e26a55",
      "--wine": "#b8505f",
      "--lamp-a": "rgb(226 152 84 / 13%)",
      "--lamp-b": "rgb(95 199 178 / 11%)",
      "--lamp-c": "rgb(120 160 190 / 8%)",
      "--grain-opacity": "0.34",
      "--display": '"IBM Plex Mono", ui-monospace, monospace',
    },
  },
  {
    id: "scifi",
    name: "Sci-Fi",
    emoji: "🚀",
    tagline: "HUD ciano, telemetria e vidro frio",
    vars: {
      "--felt-950": "#04080e",
      "--felt-900": "#060d16",
      "--felt-850": "#08121e",
      "--felt-800": "#0a1826",
      "--felt-700": "#0e2233",
      "--felt-600": "#122d42",
      "--felt-500": "#183a54",
      "--edge": "rgb(120 220 255 / 11%)",
      "--edge-strong": "rgb(120 220 255 / 24%)",
      "--edge-warm": "rgb(120 220 255 / 34%)",
      "--paper": "#dceffb",
      "--paper-dim": "#b0cfe0",
      "--muted": "#82a8bc",
      "--dim": "#5f8296",
      "--brass": "#4fd8ff",
      "--brass-soft": "#a8ecff",
      "--brass-deep": "#1f8fb8",
      "--verd": "#5ef0b0",
      "--verd-deep": "#1d7d5c",
      "--coral": "#ff7a6b",
      "--wine": "#d4526e",
      "--lamp-a": "rgb(79 216 255 / 14%)",
      "--lamp-b": "rgb(94 240 176 / 9%)",
      "--lamp-c": "rgb(212 82 110 / 7%)",
      "--grain-opacity": "0.2",
      "--display": '"IBM Plex Mono", ui-monospace, monospace',
    },
  },
  {
    id: "dragonic",
    name: "Dracônico",
    emoji: "🐉",
    tagline: "Escamas, brasa e ouro velho",
    vars: {
      "--felt-950": "#120605",
      "--felt-900": "#1a0807",
      "--felt-850": "#210b09",
      "--felt-800": "#2a100d",
      "--felt-700": "#37160f",
      "--felt-600": "#441d13",
      "--felt-500": "#552618",
      "--edge": "rgb(255 170 120 / 11%)",
      "--edge-strong": "rgb(255 170 120 / 22%)",
      "--edge-warm": "rgb(255 190 120 / 34%)",
      "--paper": "#f6e3d6",
      "--paper-dim": "#ddbaa5",
      "--muted": "#bb8f77",
      "--dim": "#956b55",
      "--brass": "#f0a53c",
      "--brass-soft": "#ffc877",
      "--brass-deep": "#a5650f",
      "--verd": "#c9b05a",
      "--verd-deep": "#7d6a24",
      "--coral": "#ff6a45",
      "--wine": "#b8352f",
      "--lamp-a": "rgb(240 165 60 / 15%)",
      "--lamp-b": "rgb(201 176 90 / 9%)",
      "--lamp-c": "rgb(255 106 69 / 10%)",
      "--grain-opacity": "0.38",
      "--display": '"Fraunces", "Iowan Old Style", Georgia, serif',
    },
  },
  {
    id: "shinobi",
    name: "Shinobi",
    emoji: "🏯",
    tagline: "Papel de arroz, tinta sumi e selos",
    vars: {
      "--felt-950": "#0b0d10",
      "--felt-900": "#101318",
      "--felt-850": "#151920",
      "--felt-800": "#1b2029",
      "--felt-700": "#242b36",
      "--felt-600": "#2e3743",
      "--felt-500": "#3b4553",
      "--edge": "rgb(220 200 160 / 10%)",
      "--edge-strong": "rgb(220 200 160 / 20%)",
      "--edge-warm": "rgb(220 120 100 / 30%)",
      "--paper": "#e9e3d6",
      "--paper-dim": "#c8c0af",
      "--muted": "#9d9c8d",
      "--dim": "#787769",
      "--brass": "#d8553f",
      "--brass-soft": "#ef8f77",
      "--brass-deep": "#8f2f1d",
      "--verd": "#7ba88f",
      "--verd-deep": "#3d5f4c",
      "--coral": "#e0785f",
      "--wine": "#a8455f",
      "--lamp-a": "rgb(216 85 63 / 11%)",
      "--lamp-b": "rgb(123 168 143 / 9%)",
      "--lamp-c": "rgb(120 140 180 / 7%)",
      "--grain-opacity": "0.42",
      "--display": '"Fraunces", "Iowan Old Style", Georgia, serif',
    },
  },
  {
    id: "pirate",
    name: "Pirata",
    emoji: "☠️",
    tagline: "Mapa salgado, osso e latão de canhão",
    vars: {
      "--felt-950": "#06100f",
      "--felt-900": "#081716",
      "--felt-850": "#0a1e1c",
      "--felt-800": "#0e2624",
      "--felt-700": "#133230",
      "--felt-600": "#193f3c",
      "--felt-500": "#1f4e4a",
      "--edge": "rgb(214 232 208 / 10%)",
      "--edge-strong": "rgb(214 232 208 / 20%)",
      "--edge-warm": "rgb(230 190 120 / 32%)",
      "--paper": "#e6efe4",
      "--paper-dim": "#c1d3bd",
      "--muted": "#96adauh".replace("auh", "95"),
      "--dim": "#71857c",
      "--brass": "#e6be6a",
      "--brass-soft": "#f6dda0",
      "--brass-deep": "#9b7a2c",
      "--verd": "#67c9a5",
      "--verd-deep": "#2a6f5a",
      "--coral": "#e2704f",
      "--wine": "#b04a5f",
      "--lamp-a": "rgb(230 190 106 / 13%)",
      "--lamp-b": "rgb(103 201 165 / 10%)",
      "--lamp-c": "rgb(176 74 95 / 8%)",
      "--grain-opacity": "0.36",
      "--display": '"Fraunces", "Iowan Old Style", Georgia, serif',
    },
  },
  {
    id: "cosmic",
    name: "Cósmico",
    emoji: "🌌",
    tagline: "Constelações, portal e vazio entre dimensões",
    vars: {
      "--felt-950": "#05040f",
      "--felt-900": "#090718",
      "--felt-850": "#0d0b20",
      "--felt-800": "#121029",
      "--felt-700": "#191636",
      "--felt-600": "#221e46",
      "--felt-500": "#2c2759",
      "--edge": "rgb(180 190 255 / 11%)",
      "--edge-strong": "rgb(180 190 255 / 22%)",
      "--edge-warm": "rgb(210 200 255 / 32%)",
      "--paper": "#e8e7fb",
      "--paper-dim": "#c3c2e6",
      "--muted": "#9a97c9",
      "--dim": "#7572a5",
      "--brass": "#b98cff",
      "--brass-soft": "#dcc2ff",
      "--brass-deep": "#7350c4",
      "--verd": "#66e0d4",
      "--verd-deep": "#2a7c7a",
      "--coral": "#ff77a8",
      "--wine": "#c44f8f",
      "--lamp-a": "rgb(185 140 255 / 14%)",
      "--lamp-b": "rgb(102 224 212 / 10%)",
      "--lamp-c": "rgb(255 119 168 / 8%)",
      "--grain-opacity": "0.24",
      "--display": '"Fraunces", "Iowan Old Style", Georgia, serif',
    },
  },
];

export const THEME_KEY = "mdmf.theme.v1";

export function getTheme(id: string | null): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.dataset.theme = theme.id;
}

export function loadThemeId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(THEME_KEY);
}

export function saveThemeId(id: string): void {
  try {
    window.localStorage.setItem(THEME_KEY, id);
  } catch {
    /* armazenamento indisponível */
  }
}
