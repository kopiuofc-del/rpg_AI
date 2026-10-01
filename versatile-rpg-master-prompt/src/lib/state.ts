import type { DiceRoll } from "./dice";
import { uid } from "./dice";
import { blankWorld, seedWorld, type World } from "./world";

export type { World, Faction, Bestiary, BoardQuest, QuestTier, FactionStanding } from "./world";

export type FaceId = "mestre" | "criador" | "regras" | "oraculo" | "dados" | "estrategista" | "arquivista" | "geral";

export type ViewId = "mesa" | "ficha" | "dados" | "elenco" | "oraculo" | "codex" | "config";

export type Block =
  | { kind: "heading"; text: string; tone?: "brass" | "verd" | "coral" }
  | { kind: "text"; text: string }
  | { kind: "note"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "kv"; rows: { k: string; v: string }[] }
  | { kind: "roll"; roll: DiceRoll }
  | { kind: "clock"; name: string; filled: number; size: number }
  | { kind: "choices"; items: string[] };

export type Message = {
  id: string;
  role: "user" | "assistant";
  face?: FaceId;
  blocks: Block[];
  createdAt: number;
};

export type Session = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

export type Clock = { id: string; name: string; filled: number; size: number };

export type Quest = { id: string; text: string; done: boolean };

export type Sheet = {
  name: string;
  concept: string;
  system: string;
  hp: number;
  hpMax: number;
  defense: number;
  reputation: string;
  location: string;
  time: string;
  inventory: string[];
  notes: string[];
  quests: Quest[];
  clocks: Clock[];
};

export type Npc = {
  id: string;
  name: string;
  role: string;
  personality: string;
  goal: string;
  fear: string;
  secret: string;
  voice: string;
  relation: "aliado" | "neutro" | "hostil";
  revealed: boolean;
};

export type AppState = {
  sessions: Session[];
  activeSessionId: string | null;
  sheet: Sheet;
  npcs: Npc[];
  rollHistory: DiceRoll[];
  view: ViewId;
  world: World;
};

export const SYSTEMS = [
  "D&D 5e (2014)",
  "D&D 5e (2024)",
  "Tormenta20",
  "Pathfinder 2e",
  "Ordem Paranormal",
  "Call of Cthulhu 7e",
  "Vampiro: A Máscara 5e",
  "GURPS 4e",
  "FATE Acelerado",
  "Savage Worlds",
  "Old Dragon 2e",
  "3D&T Alpha",
  "PbtA (Dungeon World)",
  "OSR (Knave / Shadowdark)",
  "Sistema próprio",
  "Narrativo livre",
];

export const FACES: Record<FaceId, string> = {
  mestre: "Mestre",
  criador: "Criador",
  regras: "Consultor de regras",
  oraculo: "Oráculo",
  dados: "Bandeja de dados",
  estrategista: "Estrategista",
  arquivista: "Arquivista",
  geral: "Assistente",
};

export function blankSheet(): Sheet {
  return {
    name: "",
    concept: "",
    system: "Narrativo livre",
    hp: 12,
    hpMax: 12,
    defense: 0,
    reputation: "Desconhecido",
    location: "",
    time: "",
    inventory: [],
    notes: [],
    quests: [],
    clocks: [],
  };
}

export const SEED_WORLD = seedWorld;

export function seedNpcs(): Npc[] {
  return [
    {
      id: uid("npc"),
      name: "Zaida “Meia-Lua” Bittar",
      role: "Dona do ferro-velho de barcos",
      personality:
        "Ri antes de responder qualquer pergunta, mesmo as ruins. Guarda ferramenta no lugar de enfeite.",
      goal: "Descobrir quem vendeu o motor do irmão enquanto ele estava internado.",
      fear: "Que revirem o pátio e achem o cofre enterrado sob a quilha do Saveiro 9.",
      secret: "Foi ela quem assinou a venda — com a letra do irmão.",
      voice: "Frases curtas, sempre termina com um “né?” desconfiado.",
      relation: "neutro",
      revealed: false,
    },
    {
      id: uid("npc"),
      name: "Inspetor Clóvis Negrão",
      role: "Capitania dos Portos",
      personality:
        "Cordial até a página dois. Cita artigos de regulamento como quem cita poesia.",
      goal: "Encerrar o inquérito do cais sem abrir nenhuma caixa.",
      fear: "Uma manchete com seu sobrenome antes da aposentadoria.",
      secret: "Recebe da Cooperativa das Marés em cestas de pescado, não em dinheiro.",
      voice: "Trata todos por “doutor”, inclusive crianças.",
      relation: "hostil",
      revealed: false,
    },
    {
      id: uid("npc"),
      name: "Tiê",
      role: "Menino das marés, 13 anos",
      personality:
        "Fala em superlativos e corrige os outros com números exatos de hora e maré.",
      goal: "Ser aceito como tripulante no barco grande da Cooperativa.",
      fear: "Voltar a dormir no depósito de sal.",
      secret: "Viu quem assinou o recibo na noite do pedágio — e guardou o caneco de prova.",
      voice: "Começa toda frase com “olha só”.",
      relation: "aliado",
      revealed: false,
    },
    {
      id: uid("npc"),
      name: "Auristela Prado",
      role: "Tabeliã do cais",
      personality:
        "Formalidade de cartório, humor de seca. Nunca responde uma pergunta direta na primeira vez.",
      goal: "Manter o cartório aberto até conseguir a aposentadoria integral.",
      fear: "Perder o livro de registros original e, com ele, o único registro do que fez.",
      secret: "Arranca folhas do livro quando ninguém olha; conta as páginas em voz baixa.",
      voice: "Diz “consta aqui” antes de qualquer mentira.",
      relation: "neutro",
      revealed: false,
    },
  ];
}

export const EVENTS_TABLE = [
  "Uma testemunha muda a versão dos fatos no meio da frase.",
  "Um relógio avança fora de cena: alguém agiu sem você ver.",
  "Uma dívida antiga é cobrada, e o cobrador conhece seu nome errado.",
  "O tempo fecha e a rota planejada deixa de existir por hoje.",
  "Um objeto some do inventário — e reaparece com outra pessoa.",
  "Um aliado chega exatamente na hora errada.",
  "Uma pista boa demais é entregue de graça.",
  "Um NPC mente sobre algo pequeno, sem motivo aparente.",
  "A autoridade local interfere e pede documentos que ninguém tem.",
  "Um barulho interrompe a conversa; quando acaba, faltam duas pessoas.",
];

export const ODDS = [
  { label: "Impossível", target: 5 },
  { label: "Muito improvável", target: 15 },
  { label: "Improvável", target: 35 },
  { label: "Incerto", target: 50 },
  { label: "Provável", target: 65 },
  { label: "Muito provável", target: 85 },
  { label: "Quase certo", target: 95 },
];

const STORAGE_KEY = "mdmf.v2";

type Persisted = {
  sessions: Session[];
  activeSessionId: string | null;
  sheet: Sheet;
  npcs: Npc[];
  rollHistory: DiceRoll[];
  view: ViewId;
  world: World;
};

function normalizeWorld(value: unknown): World {
  const seed = seedWorld();
  if (!isRecord(value)) return seed;
  const factions = Array.isArray(value.factions)
    ? value.factions.filter(isRecord).map((item) => {
        const standing = STANDING_SET.includes(item.standing as string) ? (item.standing as World["factions"][number]["standing"]) : "neutra";
        const clock = isRecord(item.clock) ? item.clock : {};
        return {
          id: typeof item.id === "string" ? item.id : uid("facao"),
          name: typeof item.name === "string" ? item.name : "Facção sem nome",
          ideology: typeof item.ideology === "string" ? item.ideology : "—",
          goal: typeof item.goal === "string" ? item.goal : "—",
          resources: typeof item.resources === "string" ? item.resources : "—",
          influence: Math.min(Math.max(Number(item.influence) || 0, 0), 100),
          allies: typeof item.allies === "string" ? item.allies : "—",
          rivals: typeof item.rivals === "string" ? item.rivals : "—",
          secret: typeof item.secret === "string" ? item.secret : "—",
          standing,
          revealed: Boolean(item.revealed),
          clock: {
            name: typeof clock.name === "string" ? clock.name : "Plano da facção",
            filled: Math.min(Math.max(Number(clock.filled) || 0, 0), 12),
            size: Math.min(Math.max(Number(clock.size) || 6, 2), 12),
          },
        };
      })
    : seed.factions;

  const bestiary = Array.isArray(value.bestiary)
    ? value.bestiary.filter(isRecord).map((item) => ({
        id: typeof item.id === "string" ? item.id : uid("besta"),
        name: typeof item.name === "string" ? item.name : "Criatura sem nome",
        species: typeof item.species === "string" ? item.species : "—",
        habitat: typeof item.habitat === "string" ? item.habitat : "—",
        behavior: typeof item.behavior === "string" ? item.behavior : "—",
        intelligence: (["instinto", "astuta", "racional"] as const).includes(item.intelligence as never)
          ? (item.intelligence as "instinto" | "astuta" | "racional")
          : ("instinto" as const),
        abilities: typeof item.abilities === "string" ? item.abilities : "—",
        weakness: typeof item.weakness === "string" ? item.weakness : "—",
        threat: Math.min(Math.max(Number(item.threat) || 1, 1), 10),
      }))
    : seed.bestiary;

  const quests = Array.isArray(value.quests)
    ? value.quests.filter(isRecord).map((item) => ({
        id: typeof item.id === "string" ? item.id : uid("quest"),
        tier: (["principal", "secundaria", "oculta"] as const).includes(item.tier as never)
          ? (item.tier as World["quests"][number]["tier"])
          : ("secundaria" as const),
        objective: typeof item.objective === "string" ? item.objective : "—",
        reward: typeof item.reward === "string" ? item.reward : "—",
        patron: typeof item.patron === "string" ? item.patron : "—",
        risk: Math.min(Math.max(Number(item.risk) || 1, 1), 5),
        discovered: Boolean(item.discovered),
      }))
    : seed.quests;

  const recent = Array.isArray(value.recent)
    ? value.recent.filter((item): item is string => typeof item === "string").slice(0, 8)
    : seed.recent;

  return {
    name: typeof value.name === "string" ? value.name : seed.name,
    era: typeof value.era === "string" ? value.era : seed.era,
    climate: typeof value.climate === "string" ? value.climate : seed.climate,
    threat: Math.min(Math.max(Number(value.threat) || 0, 0), 10),
    renown: Math.min(Math.max(Number(value.renown) || 0, 0), 100),
    factions: factions.length > 0 ? factions : seed.factions,
    bestiary,
    quests: quests.length > 0 ? quests : seed.quests,
    recent,
  };
}

const STANDING_SET = ["aliada", "neutra", "rival", "inimiga"];

export function initialState(): AppState {
  return {
    sessions: [],
    activeSessionId: null,
    sheet: blankSheet(),
    npcs: seedNpcs(),
    rollHistory: [],
    view: "mesa",
    world: blankWorld(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeSheet(value: unknown): Sheet {
  const base = blankSheet();
  if (!isRecord(value)) return base;
  const inventory = Array.isArray(value.inventory)
    ? value.inventory.filter((item): item is string => typeof item === "string")
    : base.inventory;
  const notes = Array.isArray(value.notes)
    ? value.notes.filter((item): item is string => typeof item === "string")
    : base.notes;
  const quests = Array.isArray(value.quests)
    ? value.quests
        .filter(isRecord)
        .filter((item) => typeof item.text === "string")
        .map((item) => ({
          id: typeof item.id === "string" ? item.id : uid("quest"),
          text: String(item.text),
          done: Boolean(item.done),
        }))
    : base.quests;
  const clocks = Array.isArray(value.clocks)
    ? value.clocks
        .filter(isRecord)
        .filter((item) => typeof item.name === "string")
        .map((item) => {
          const size = Math.min(Math.max(Number(item.size) || 6, 2), 12);
          return {
            id: typeof item.id === "string" ? item.id : uid("clock"),
            name: String(item.name),
            size,
            filled: Math.min(Math.max(Number(item.filled) || 0, 0), size),
          };
        })
    : base.clocks;

  return {
    name: typeof value.name === "string" ? value.name : base.name,
    concept: typeof value.concept === "string" ? value.concept : base.concept,
    system: typeof value.system === "string" ? value.system : base.system,
    hp: Number.isFinite(Number(value.hp)) ? Number(value.hp) : base.hp,
    hpMax: Number.isFinite(Number(value.hpMax)) ? Math.max(1, Number(value.hpMax)) : base.hpMax,
    defense: Number.isFinite(Number(value.defense)) ? Number(value.defense) : base.defense,
    reputation: typeof value.reputation === "string" ? value.reputation : base.reputation,
    location: typeof value.location === "string" ? value.location : base.location,
    time: typeof value.time === "string" ? value.time : base.time,
    inventory,
    notes,
    quests,
    clocks,
  };
}

function normalizeNpc(value: Record<string, unknown>, fallback: Npc): Npc {
  const relation = value.relation === "aliado" || value.relation === "hostil" ? value.relation : "neutro";
  return {
    id: typeof value.id === "string" ? value.id : uid("npc"),
    name: typeof value.name === "string" && value.name ? value.name : fallback.name,
    role: typeof value.role === "string" ? value.role : fallback.role,
    personality: typeof value.personality === "string" ? value.personality : fallback.personality,
    goal: typeof value.goal === "string" ? value.goal : fallback.goal,
    fear: typeof value.fear === "string" ? value.fear : fallback.fear,
    secret: typeof value.secret === "string" ? value.secret : fallback.secret,
    voice: typeof value.voice === "string" ? value.voice : fallback.voice,
    relation,
    revealed: Boolean(value.revealed),
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return initialState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...initialState(), world: seedWorld() };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return initialState();

    const fallbackNpcs = seedNpcs();
    const npcs = Array.isArray(parsed.npcs)
      ? parsed.npcs.filter(isRecord).map((item, index) => normalizeNpc(item, fallbackNpcs[index % fallbackNpcs.length]))
      : fallbackNpcs;

    const sessions: Session[] = Array.isArray(parsed.sessions)
      ? parsed.sessions
          .filter(isRecord)
          .filter((item) => typeof item.id === "string" && Array.isArray(item.messages))
          .map((item) => ({
            id: String(item.id),
            title: typeof item.title === "string" && item.title ? item.title : "Sessão sem nome",
            updatedAt: Number(item.updatedAt) || Date.now(),
            messages: (item.messages as unknown[])
              .filter(isRecord)
              .filter((message) => Array.isArray(message.blocks))
              .map((message) => ({
                id: typeof message.id === "string" ? message.id : uid("msg"),
                role: message.role === "user" ? ("user" as const) : ("assistant" as const),
                face: typeof message.face === "string" ? (message.face as FaceId) : undefined,
                createdAt: Number(message.createdAt) || Date.now(),
                blocks: message.blocks as Block[],
              })),
          }))
      : [];

    const activeSessionId =
      typeof parsed.activeSessionId === "string" && sessions.some((item) => item.id === parsed.activeSessionId)
        ? parsed.activeSessionId
        : null;

    const rollHistory = Array.isArray(parsed.rollHistory)
      ? (parsed.rollHistory.filter(isRecord) as unknown as DiceRoll[]).slice(0, 40)
      : [];

    const view = (["mesa", "ficha", "dados", "elenco", "oraculo"] as ViewId[]).includes(parsed.view as ViewId)
      ? (parsed.view as ViewId)
      : "mesa";

    return {
      sessions,
      activeSessionId,
      sheet: normalizeSheet(parsed.sheet),
      npcs: npcs.length > 0 ? npcs : fallbackNpcs,
      rollHistory,
      view,
      world: normalizeWorld(parsed.world),
    };
  } catch {
    return initialState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  const payload: Persisted = {
    sessions: state.sessions.slice(0, 40),
    activeSessionId: state.activeSessionId,
    sheet: state.sheet,
    npcs: state.npcs,
    rollHistory: state.rollHistory.slice(0, 40),
    view: state.view,
    world: state.world,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* armazenamento indisponível: a sessão continua em memória */
  }
}

export function sessionTitle(text: string): string {
  const clean = text.replace(/^\//, "").trim();
  if (!clean) return "Sessão sem nome";
  return clean.length > 40 ? `${clean.slice(0, 40).trimEnd()}…` : clean;
}
