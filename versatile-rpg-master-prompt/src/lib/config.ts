/* ============================================================
   Núcleo de personalização — sliders, presets, módulos, snapshot
   ============================================================ */

export const SLIDERS = [
  { id: "objetividade", label: "Objetividade", hint: "prosa longa → direto ao ponto" },
  { id: "detalhamento", label: "Detalhamento", hint: "resumo → camadas de detalhe" },
  { id: "criatividade", label: "Criatividade", hint: "clássico → inesperado" },
  { id: "imersao", label: "Imersão", hint: "relatório → cena viva" },
  { id: "humor", label: "Humor", hint: "seco → debochado" },
  { id: "complexidade", label: "Complexidade", hint: "simples → interligado" },
  { id: "variedade", label: "Variedade", hint: "3 opções → 8 caminhos distintos" },
  { id: "realismo", label: "Realismo", hint: "heroico → custo realista" },
  { id: "dificuldade", label: "Dificuldade", hint: "acolhedor → implacável" },
  { id: "surpresa", label: "Surpresa", hint: "estável → viradas" },
  { id: "lore", label: "Densidade de lore", hint: "pouco → profunda" },
  { id: "caos", label: "Caos", hint: "previsível → eventos em cadeia" },
  { id: "agencia", label: "Agência", hint: "guiado → decisões abertas" },
] as const;

export type SliderId = (typeof SLIDERS)[number]["id"];
export type Config = Record<SliderId, number>;

export const MODULES = [
  { id: "narrativa", label: "Narrativa", hint: "cenas com peso e consequência" },
  { id: "worldbuilding", label: "Worldbuilding", hint: "sociedades, economia, geografia" },
  { id: "estrategia", label: "Estratégia", hint: "recursos, riscos e alternativas" },
  { id: "npcAutonomo", label: "NPC autônomo", hint: "o elenco age fora de cena" },
  { id: "memoria", label: "Memória", hint: "continuidade e anotações" },
  { id: "surpresa", label: "Surpresa", hint: "reviravoltas com causalidade" },
  { id: "lore", label: "Lore", hint: "conhecimento em camadas" },
  { id: "economia", label: "Economia", hint: "escassez, preço e reputação" },
  { id: "caos", label: "Caos", hint: "eventos em cadeia" },
  { id: "cinematografico", label: "Cinematográfico", hint: "corte, ritmo e imagem" },
] as const;

export type ModuleId = (typeof MODULES)[number]["id"];
export type Modules = Record<ModuleId, boolean>;

export const DEFAULT_CONFIG: Config = {
  objetividade: 62,
  detalhamento: 55,
  criatividade: 72,
  imersao: 78,
  humor: 28,
  complexidade: 58,
  variedade: 62,
  realismo: 52,
  dificuldade: 55,
  surpresa: 60,
  lore: 62,
  caos: 26,
  agencia: 88,
};

export const DEFAULT_MODULES: Modules = {
  narrativa: true,
  worldbuilding: true,
  estrategia: true,
  npcAutonomo: true,
  memoria: true,
  surpresa: true,
  lore: true,
  economia: false,
  caos: false,
  cinematografico: false,
};

export type Preset = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  values: Partial<Config>;
  modules?: Partial<Modules>;
};

export const PRESETS: Preset[] = [
  {
    id: "mestre-supremo",
    name: "Mestre Supremo",
    emoji: "👑",
    description: "Imersão máxima, lore profunda, estratégia e surpresa altas.",
    values: { imersao: 96, lore: 92, criatividade: 90, complexidade: 82, dificuldade: 82, variedade: 82, surpresa: 88, humor: 36, caos: 40 },
  },
  {
    id: "flash",
    name: "Flash",
    emoji: "⚡",
    description: "Resultado primeiro, zero introdução, núcleo da cena apenas.",
    values: { objetividade: 96, detalhamento: 24, imersao: 46, complexidade: 22, lore: 20, variedade: 44, humor: 18, caos: 14 },
  },
  {
    id: "hardcore",
    name: "Hardcore",
    emoji: "☠️",
    description: "Implacável: recursos curtos, custo realista, relógio correndo.",
    values: { dificuldade: 94, realismo: 88, imersao: 74, complexidade: 78, surpresa: 66, variedade: 58, humor: 12, caos: 44 },
    modules: { economia: true, npcAutonomo: true, caos: true },
  },
  {
    id: "sandbox",
    name: "Sandbox",
    emoji: "🌍",
    description: "Situações abertas, agência total, mundo que anda sozinho.",
    values: { agencia: 100, variedade: 92, complexidade: 74, imersao: 70, dificuldade: 58, lore: 74, surpresa: 72, caos: 38 },
    modules: { worldbuilding: true, npcAutonomo: true, economia: true },
  },
  {
    id: "cinema",
    name: "Cinema",
    emoji: "🎬",
    description: "Cena cortada no ritmo certo, imagem forte, diálogo afiado.",
    values: { imersao: 92, detalhamento: 70, objetividade: 42, criatividade: 84, variedade: 66, dificuldade: 58, lore: 48 },
    modules: { cinematografico: true, narrativa: true },
  },
  {
    id: "investigacao",
    name: "Investigação",
    emoji: "🕵️",
    description: "Camadas de pista, contradição e informação incompleta.",
    values: { complexidade: 86, lore: 84, imersao: 76, objetividade: 58, dificuldade: 72, variedade: 64, surpresa: 70, caos: 18 },
    modules: { estrategia: true, lore: true, memoria: true },
  },
  {
    id: "estudo",
    name: "Estudo",
    emoji: "📚",
    description: "Didático: clareza, exemplos e passo a passo.",
    values: { objetividade: 74, detalhamento: 78, imersao: 22, complexidade: 40, lore: 30, criatividade: 40, variedade: 36, humor: 34, dificuldade: 24, caos: 6 },
  },
  {
    id: "codigo",
    name: "Código",
    emoji: "💻",
    description: "Preciso, técnico, sem prosa e sem decoração.",
    values: { objetividade: 96, detalhamento: 72, imersao: 8, criatividade: 24, complexidade: 66, lore: 10, humor: 8, variedade: 30, caos: 4 },
  },
  {
    id: "caos",
    name: "Caos",
    emoji: "🎲",
    description: "Imprevisível com causalidade: nada é arbitrário, tudo se encadeia.",
    values: { caos: 92, surpresa: 94, criatividade: 92, variedade: 88, imersao: 74, dificuldade: 76, humor: 54, lore: 58 },
    modules: { caos: true, surpresa: true },
  },
  {
    id: "minimal",
    name: "Minimal",
    emoji: "▫️",
    description: "Só o essencial. Nada de enfeite, nada de menu.",
    values: { objetividade: 98, detalhamento: 16, imersao: 26, complexidade: 18, lore: 14, criatividade: 30, variedade: 28, humor: 10, caos: 8 },
  },
];

export function applyPreset(base: Config, preset: Preset): Config {
  return { ...base, ...preset.values };
}

export function applyModules(base: Modules, preset: Preset): Modules {
  return preset.modules ? { ...base, ...preset.modules } : base;
}

/* ------------------------- leitura de ajuste natural ------------------------- */

const ADJUST_MAP: { pattern: RegExp; slider: SliderId; delta: number }[] = [
  { pattern: /mais (engra[cç]ado|humor)/, slider: "humor", delta: 24 },
  { pattern: /menos (engra[cç]ado|humor)/, slider: "humor", delta: -24 },
  { pattern: /mais (r[aá]pido|direto|objetivo|curto|sem enrola)/, slider: "objetividade", delta: 22 },
  { pattern: /menos (r[aá]pido|direto|curto)/, slider: "objetividade", delta: -22 },
  { pattern: /menos texto|mais (resumido|enxuto)/, slider: "detalhamento", delta: -22 },
  { pattern: /mais (detalhado|profundo|completo|texto)/, slider: "detalhamento", delta: 22 },
  { pattern: /mais (criativ|original|inovador)/, slider: "criatividade", delta: 22 },
  { pattern: /mais (dificuldade|dif[ií]cil|hardcore|implac[aá]vel)/, slider: "dificuldade", delta: 24 },
  { pattern: /mais (f[aá]cil|acolhedor|leve)/, slider: "dificuldade", delta: -24 },
  { pattern: /mais (rpg|imers[aã]o|imersiv)/, slider: "imersao", delta: 22 },
  { pattern: /menos rpg/, slider: "imersao", delta: -26 },
  { pattern: /mais (op[cç][oõ]es|caminhos|variedade|alternativas)/, slider: "variedade", delta: 24 },
  { pattern: /menos (op[cç][oõ]es|caminhos|variedade)/, slider: "variedade", delta: -24 },
  { pattern: /mais (realista|realismo)/, slider: "realismo", delta: 24 },
  { pattern: /mais (complexo|interligado|camadas)/, slider: "complexidade", delta: 22 },
  { pattern: /mais (simples|did[aá]tico|claro)/, slider: "complexidade", delta: -22 },
  { pattern: /mais (lore|hist[oó]ria do mundo|mitologia)/, slider: "lore", delta: 24 },
  { pattern: /mais (ca[oó]s|imprevisi)/, slider: "caos", delta: 28 },
  { pattern: /menos ca[oó]s/, slider: "caos", delta: -28 },
  { pattern: /mais (surpresa|virada|twist)/, slider: "surpresa", delta: 24 },
];

export type Adjustment =
  | { kind: "slider"; slider: SliderId; delta: number; label: string }
  | { kind: "preset"; preset: Preset };

const PRESET_ALIASES: Record<string, string> = {
  flash: "flash",
  "modo flash": "flash",
  ultra: "mestre-supremo",
  elite: "mestre-supremo",
  "modo elite": "mestre-supremo",
  "mestre supremo": "mestre-supremo",
  hardcore: "hardcore",
  "modo dif[íi]cil": "hardcore",
  sandbox: "sandbox",
  cinema: "cinema",
  cinematografico: "cinema",
  "modo cinematogr[aá]fico": "cinema",
  "investigacao": "investigacao",
  "modo investigacao": "investigacao",
  estudo: "estudo",
  "modo estudo": "estudo",
  codigo: "codigo",
  "modo c[oó]digo": "codigo",
  caos: "caos",
  "modo caos": "caos",
  minimal: "minimal",
  "sem enrola[cç][aã]o": "minimal",
};

export function detectAdjustment(raw: string): Adjustment | null {
  const text = raw.trim().toLocaleLowerCase("pt-BR");

  const presetMatch = text.match(/^(?:\/)?(?:preset|preset:|ativar preset)\s+(.+)$/);
  if (presetMatch) {
    const found = PRESETS.find((preset) => preset.id === presetMatch[1].trim() || preset.name.toLocaleLowerCase("pt-BR") === presetMatch[1].trim());
    if (found) return { kind: "preset", preset: found };
  }

  for (const [alias, id] of Object.entries(PRESET_ALIASES)) {
    if (new RegExp(`^(?:\\/)?${alias}[!.]?$`).test(text)) {
      const preset = PRESETS.find((entry) => entry.id === id);
      if (preset) return { kind: "preset", preset };
    }
  }

  if (/^\/(config|configura[cç][aã]o|ajustes)\b/.test(text)) return null;

  for (const entry of ADJUST_MAP) {
    if (entry.pattern.test(text)) {
      return {
        kind: "slider",
        slider: entry.slider,
        delta: entry.delta,
        label: entry.slider,
      };
    }
  }

  return null;
}

/* ------------------------- gerador de opções distintas ------------------------- */

export type OptionPath = {
  tag: string;
  label: string;
  gain: string;
  cost: string;
};

export const OPTION_POOL: OptionPath[] = [
  { tag: "força", label: "Entrar pela frente, agora, sem anunciar", gain: "velocidade e controle do ritmo", cost: "ferimento provável e barulho que atrai atenção" },
  { tag: "estratégia", label: "Preparar terreno antes de agir", gain: "escolher onde e quando o confronto acontece", cost: "tempo que os relógios não vão devolver" },
  { tag: "investigação", label: "Descobrir quem manda antes de tocar em qualquer coisa", gain: "informação que transforma a negociação", cost: "quem investiga fica visível para quem vigia" },
  { tag: "diplomacia", label: "Negociar com quem tem interesse oposto ao seu", gain: "aliado temporário e acesso", cost: "uma dívida que vai ser cobrada em pior momento" },
  { tag: "recursos", label: "Comprar a solução: dinheiro, favor ou suborno", gain: "resultado rápido e discreto", cost: "escassez depois e reputação de quem paga" },
  { tag: "improviso", label: "Usar o ambiente de forma inesperada", gain: "efeito que ninguém previu, inclusive o mestre", cost: "difícil de repetir e de controlar" },
  { tag: "retirada", label: "Sair de cena e voltar por outro ângulo", gain: "informação sobre quem persegue", cost: "o problema cresce enquanto você observa" },
  { tag: "risco extremo", label: "Apostar tudo numa única jogada irreversível", gain: "pode encerrar a ameaça de vez", cost: "se falhar, não existe segunda tentativa" },
  { tag: "contato", label: "Chamar alguém que você deve um favor", gain: "capacidade que o grupo não tem", cost: "o favor vira obrigação futura" },
  { tag: "sabotagem", label: "Destruir o recurso do oponente em vez de enfrentá-lo", gain: "reduz o poder dele sem combate", cost: "consequência política e possíveis vítimas" },
];

export function chooseOptions(variety: number, seed = Math.random): OptionPath[] {
  const count = Math.min(8, Math.max(3, Math.round(3 + (variety / 100) * 5)));
  const pool = [...OPTION_POOL];
  const picked: OptionPath[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(seed() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

/* ------------------------- escada de resultados ------------------------- */

export function outcomeLadder(total: number, difficulty: number): { label: string; text: string } {
  const easy = difficulty <= 33;
  const hard = difficulty >= 70;

  if (easy) {
    if (total >= 18) return { label: "sucesso perfeito", text: "Sucesso perfeito: acontece do jeito que você queria, e ainda sobra uma vantagem." };
    if (total >= 12) return { label: "sucesso", text: "Sucesso limpo, sem custo adicional." };
    if (total >= 7) return { label: "sucesso com custo", text: "Consegue, mas paga em recurso, tempo ou atenção indesejada." };
    return { label: "falha parcial", text: "Não consegue tudo — mas fica com informação que antes não tinha." };
  }

  if (hard) {
    if (total >= 19) return { label: "sucesso", text: "Sucesso — e mesmo assim o mundo cobra algo por isso." };
    if (total >= 15) return { label: "sucesso com custo", text: "Consegue, com preço: recurso, ferimento ou prazo perdido." };
    if (total >= 11) return { label: "sucesso parcial", text: "Metade do objetivo. A outra metade virou problema novo." };
    if (total >= 6) return { label: "falha", text: "Não acontece — e a situação piora um degrau." };
    return { label: "falha grave", text: "Falha grave: perda concreta e uma ameaça que agora tem seu nome." };
  }

  if (total >= 17) return { label: "sucesso perfeito", text: "Sucesso perfeito: acontece como planejado, com algo a mais." };
  if (total >= 13) return { label: "sucesso", text: "Sucesso, sem custo além do esperado." };
  if (total >= 9) return { label: "sucesso com custo", text: "Sucesso com custo: tempo, recurso ou atenção." };
  if (total >= 5) return { label: "falha parcial", text: "Falha parcial: o objetivo resiste, mas uma porta se abre." };
  return { label: "falha", text: "Falha com consequência — o mundo avança contra você." };
}

export function describeConfig(config: Config): { k: string; v: string }[] {
  return SLIDERS.map((slider) => ({
    k: slider.label,
    v: `${config[slider.id]} — ${slider.hint}`,
  }));
}

export function activeModules(modules: Modules): string[] {
  return MODULES.filter((module) => modules[module.id]).map((module) => module.label);
}
