export type DieFace = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export type RollMode = "normal" | "vantagem" | "desvantagem";

export type DiceRoll = {
  id: string;
  formula: string;
  label: string;
  faces: DieFace;
  count: number;
  modifier: number;
  mode: RollMode;
  rolls: number[];
  dropped: number[];
  total: number;
  createdAt: number;
};

export type RollRequest = {
  faces: DieFace;
  count: number;
  modifier: number;
  mode: RollMode;
  label?: string;
};

export const DIE_FACES: DieFace[] = [4, 6, 8, 10, 12, 20, 100];

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function singleDie(faces: number): number {
  return Math.floor(Math.random() * faces) + 1;
}

export function rollDice(request: RollRequest): DiceRoll {
  const faces = request.faces;
  const count = Math.min(Math.max(Math.round(request.count) || 1, 1), 20);
  const modifier = Math.round(request.modifier) || 0;
  const useEdge = request.mode !== "normal" && count === 1 && faces === 20;

  const pool = useEdge ? [singleDie(faces), singleDie(faces)] : Array.from({ length: count }, () => singleDie(faces));
  const sorted = [...pool].sort((a, b) => b - a);
  const kept = useEdge ? [request.mode === "vantagem" ? sorted[0] : sorted[sorted.length - 1]] : pool;
  const dropped = useEdge ? pool.filter((_, index) => index !== pool.indexOf(kept[0])) : [];

  const total = kept.reduce((sum, value) => sum + value, modifier);
  const modifierText = modifier === 0 ? "" : ` ${modifier > 0 ? "+" : "-"} ${Math.abs(modifier)}`;
  const modeText = useEdge ? ` (${request.mode})` : "";

  return {
    id: uid("roll"),
    formula: `${count}d${faces}${modifierText}${modeText}`,
    label: request.label?.trim() || "Rolagem livre",
    faces,
    count,
    modifier,
    mode: useEdge ? request.mode : "normal",
    rolls: kept,
    dropped,
    total,
    createdAt: Date.now(),
  };
}

export function criticalState(roll: DiceRoll): "critico" | "desastre" | null {
  if (roll.count !== 1 || roll.faces !== 20 || roll.rolls.length !== 1) return null;
  if (roll.rolls[0] === 20) return "critico";
  if (roll.rolls[0] === 1) return "desastre";
  return null;
}

const FORMULA_PATTERN = /(\d{0,2})\s*d\s*(\d{1,3})\s*(?:([+-])\s*(\d{1,3}))?/i;

export function parseDiceFormula(text: string): RollRequest | null {
  const match = text.match(FORMULA_PATTERN);
  if (!match) return null;

  const faces = Number(match[2]);
  if (!DIE_FACES.includes(faces as DieFace)) return null;

  const rawCount = Number(match[1] || 1);
  const sign = match[3];
  const magnitude = Number(match[4] || 0);
  const lower = text.toLocaleLowerCase("pt-BR");
  const mode: RollMode = /vantagem|\badv\b/.test(lower)
    ? "vantagem"
    : /desvantagem|\bdes\b/.test(lower)
      ? "desvantagem"
      : "normal";

  const labelMatch = text.match(/(?:^|\s)(?:para|por|teste de|rolagem de)\s+([^,\n]{3,40})/i);

  return {
    faces: faces as DieFace,
    count: Math.min(Math.max(rawCount || 1, 1), 20),
    modifier: sign === "-" ? -magnitude : magnitude,
    mode,
    label: labelMatch?.[1]?.trim(),
  };
}

export function describeRoll(roll: DiceRoll): string {
  const detail = roll.rolls.join(" + ");
  const modifier =
    roll.modifier === 0 ? "" : ` ${roll.modifier > 0 ? "+" : "-"} ${Math.abs(roll.modifier)}`;
  const dropped = roll.dropped.length > 0 ? ` (descartado: ${roll.dropped.join(", ")})` : "";
  return `${roll.label} — ${roll.formula}: ${detail}${modifier}${dropped} = ${roll.total}`;
}
