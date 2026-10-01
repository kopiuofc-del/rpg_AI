import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon, type IconName } from "./components/Icon";
import { StatePanel } from "./components/StatePanel";
import { MesaView } from "./views/Mesa";
import { FichaView } from "./views/Ficha";
import { DadosView } from "./views/Dados";
import { ElencoView } from "./views/Elenco";
import { OraculoView } from "./views/Oraculo";
import { ConfigView, type Snapshot } from "./views/Config";
import { CodexView } from "./views/Codex";
import { applyPatches, respond, type Patch, type TableApi } from "./lib/engine";
import { uid, type DiceRoll } from "./lib/dice";
import {
  FACES,
  blankSheet,
  loadState,
  saveState,
  sessionTitle,
  type AppState,
  type FaceId,
  type Message,
  type Npc,
  type ViewId,
} from "./lib/state";
import {
  DEFAULT_CONFIG,
  DEFAULT_MODULES,
  PRESETS,
  SLIDERS,
  detectAdjustment,
  type Config,
  type Modules,
  type Preset,
  type SliderId,
} from "./lib/config";
import { uid as configUid } from "./lib/dice";
import {
  THEMES,
  applyTheme,
  getTheme,
  loadThemeId,
  saveThemeId,
  type ThemeId,
} from "./lib/theme";
import { seedWorld, type FactionStanding, type QuestTier, type World } from "./lib/world";

const NAV: { id: ViewId; label: string; short: string; icon: IconName }[] = [
  { id: "mesa", label: "Mesa", short: "Mesa", icon: "table" },
  { id: "ficha", label: "Ficha", short: "Ficha", icon: "sheet" },
  { id: "dados", label: "Dados", short: "Dados", icon: "dice" },
  { id: "elenco", label: "Elenco", short: "NPCs", icon: "cast" },
  { id: "oraculo", label: "Oráculo", short: "Solo", icon: "oracle" },
  { id: "codex", label: "Codex", short: "Codex", icon: "compass" },
  { id: "config", label: "Ajustes", short: "Ajustes", icon: "target" },
];

type SnapshotEntry = Snapshot & { state: Pick<AppState, "sheet" | "npcs" | "sessions"> };

type TuningState = {
  config: Config;
  modules: Modules;
  presetId: string | null;
  profiles: { id: string; name: string; values: Config; modules: Modules }[];
  snapshots: SnapshotEntry[];
};

const TUNING_KEY = "mdmf.tuning.v1";

function loadTuning(): TuningState {
  const fallback: TuningState = {
    config: { ...DEFAULT_CONFIG },
    modules: { ...DEFAULT_MODULES },
    presetId: null,
    profiles: [],
    snapshots: [],
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(TUNING_KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return fallback;
    const data = parsed as Partial<TuningState>;
    const config = { ...DEFAULT_CONFIG };
    if (data.config) {
      for (const slider of SLIDERS) {
        const value = data.config[slider.id as SliderId];
        if (typeof value === "number") config[slider.id] = Math.min(100, Math.max(0, Math.round(value)));
      }
    }
    const modules = { ...DEFAULT_MODULES };
    if (data.modules) {
      for (const module of Object.keys(DEFAULT_MODULES) as (keyof Modules)[]) {
        if (typeof data.modules[module] === "boolean") modules[module] = Boolean(data.modules[module]);
      }
    }
    return {
      config,
      modules,
      presetId: typeof data.presetId === "string" ? data.presetId : null,
      profiles: Array.isArray(data.profiles) ? data.profiles.slice(0, 12) : [],
      snapshots: Array.isArray(data.snapshots) ? data.snapshots.slice(0, 6) : [],
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    return { ...loaded, world: loaded.world ?? seedWorld() };
  });
  const [tuning, setTuning] = useState<TuningState>(() => loadTuning());
  const [themeId, setThemeId] = useState<ThemeId>(() => (loadThemeId() as ThemeId) ?? "mesa");
  const [themeOpen, setThemeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    saveState(state);
    setSavedAt(Date.now());
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 700);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    applyTheme(getTheme(themeId));
    saveThemeId(themeId);
  }, [themeId]);

  useEffect(() => {
    try {
      const { snapshots, ...rest } = tuning;
      window.localStorage.setItem(
        TUNING_KEY,
        JSON.stringify({ ...rest, snapshots: snapshots.map(({ state: snapState, ...snap }) => ({ ...snap, state: snapState })) }),
      );
    } catch {
      /* armazenamento indisponível */
    }
  }, [tuning]);

  const activeSession = useMemo(
    () => state.sessions.find((session) => session.id === state.activeSessionId) ?? null,
    [state.activeSessionId, state.sessions],
  );
  const messages = activeSession?.messages ?? [];
  const lastRoll: DiceRoll | undefined = state.rollHistory[0];
  const lastFace: FaceId = [...messages].reverse().find((message) => message.face)?.face ?? "mestre";

  const patch = useCallback((patches: Patch | Patch[]) => {
    const list = Array.isArray(patches) ? patches : [patches];
    setState((prev) => {
      const next = applyPatches(prev, list);
      return { ...prev, sheet: next.sheet, npcs: next.npcs, rollHistory: next.rollHistory };
    });
  }, []);

  const setSheet = useCallback((changes: Partial<AppState["sheet"]>) => {
    setState((prev) => ({ ...prev, sheet: { ...prev.sheet, ...changes } }));
  }, []);

  const api: TableApi = useMemo(
    () => ({ sheet: state.sheet, npcs: state.npcs, rollHistory: state.rollHistory, patch, setSheet }),
    [state.sheet, state.npcs, state.rollHistory, patch, setSheet],
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;

      /* ---- comandos de mesa que mexem em configuração/checkpoint ---- */

      if (/^\/(snapshot|checkpoint)\b/i.test(text)) {
        createSnapshot();
        return;
      }

      const adjustment = detectAdjustment(text);
      if (adjustment) {
        if (adjustment.kind === "preset") {
          applyPreset(adjustment.preset);
        } else {
          const current = tuning.config[adjustment.slider];
          setConfig({ [adjustment.slider]: Math.min(100, Math.max(0, current + adjustment.delta)) } as Partial<Config>);
        }

        const label =
          adjustment.kind === "preset"
            ? `${adjustment.preset.emoji} ${adjustment.preset.name}`
            : `${SLIDERS.find((slider) => slider.id === adjustment.slider)?.label}: ${tuning.config[adjustment.slider]} → ${Math.min(
                100,
                Math.max(0, tuning.config[adjustment.slider] + adjustment.delta),
              )}`;

        const sessionId = state.activeSessionId ?? uid("session");
        const userMessage: Message = {
          id: uid("msg"),
          role: "user",
          blocks: [{ kind: "text", text }],
          createdAt: Date.now(),
        };
        const reply: Message = {
          id: uid("msg"),
          role: "assistant",
          face: "arquivista",
          blocks: [
            { kind: "heading", text: "Configuração ajustada", tone: "verd" },
            { kind: "text", text: label },
            {
              kind: "note",
              text:
                adjustment.kind === "preset"
                  ? "Preset aplicado por cima dos sliders atuais. Nada mais foi alterado."
                  : "Apenas este parâmetro mudou — o resto da mesa segue intacto.",
            },
            { kind: "choices", items: ["/config", "mais difícil", "mais rápido", "preset hardcore", "preset mestre-supremo"] },
          ],
          createdAt: Date.now(),
        };

        setState((prev) => {
          const exists = prev.sessions.some((session) => session.id === sessionId);
          return {
            ...prev,
            view: "mesa",
            activeSessionId: sessionId,
            sessions: exists
              ? prev.sessions.map((session) =>
                  session.id === sessionId
                    ? { ...session, messages: [...session.messages, userMessage, reply], updatedAt: Date.now() }
                    : session,
                )
              : [
                  { id: sessionId, title: sessionTitle(text), messages: [userMessage, reply], updatedAt: Date.now() },
                  ...prev.sessions,
                ],
          };
        });
        return;
      }

      const sessionId = state.activeSessionId ?? uid("session");
      const userMessage: Message = {
        id: uid("msg"),
        role: "user",
        blocks: [{ kind: "text", text }],
        createdAt: Date.now(),
      };
      const result = respond(text, {
        sheet: state.sheet,
        npcs: state.npcs,
        history: activeSession?.messages ?? [],
        config: tuning.config,
        modules: tuning.modules,
        world: state.world,
      });

      setBusy(true);
      setState((prev) => {
        const exists = prev.sessions.some((session) => session.id === sessionId);
        return {
          ...prev,
          view: "mesa",
          activeSessionId: sessionId,
          sessions: exists
            ? prev.sessions.map((session) =>
                session.id === sessionId
                  ? { ...session, messages: [...session.messages, userMessage], updatedAt: Date.now() }
                  : session,
              )
            : [
                { id: sessionId, title: sessionTitle(text), messages: [userMessage], updatedAt: Date.now() },
                ...prev.sessions,
              ],
        };
      });

      window.setTimeout(() => {
        const assistantMessage: Message = {
          id: uid("msg"),
          role: "assistant",
          face: result.face,
          blocks: result.blocks,
          createdAt: Date.now(),
        };
        setState((prev) => {
          const next = applyPatches(prev, result.patches);
          return {
            ...prev,
            sheet: next.sheet,
            npcs: next.npcs,
            rollHistory: next.rollHistory,
            sessions: prev.sessions.map((session) =>
              session.id === sessionId
                ? { ...session, messages: [...session.messages, assistantMessage], updatedAt: Date.now() }
                : session,
            ),
          };
        });
        setBusy(false);
      }, 420);
    },
    [activeSession?.messages, busy, state.activeSessionId, state.npcs, state.sheet],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!event.altKey) return;
      const index = Number(event.key) - 1;
      const target = NAV[index];
      if (target) {
        event.preventDefault();
        setState((prev) => ({ ...prev, view: target.id }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function setConfig(changes: Partial<Config>) {
    setTuning((prev) => ({ ...prev, config: { ...prev.config, ...changes }, presetId: null }));
  }

  function setModules(changes: Partial<Modules>) {
    setTuning((prev) => ({ ...prev, modules: { ...prev.modules, ...changes } }));
  }

  function applyPreset(preset: Preset) {
    setTuning((prev) => ({
      ...prev,
      config: { ...prev.config, ...preset.values },
      modules: preset.modules ? { ...prev.modules, ...preset.modules } : prev.modules,
      presetId: preset.id,
    }));
  }

  function saveProfile(name: string) {
    setTuning((prev) => ({
      ...prev,
      presetId: null,
      profiles: [{ id: configUid("profile"), name, values: prev.config, modules: prev.modules }, ...prev.profiles].slice(0, 12),
    }));
  }

  function activateProfile(id: string) {
    setTuning((prev) => {
      const profile = prev.profiles.find((entry) => entry.id === id);
      if (!profile) return prev;
      return { ...prev, config: { ...profile.values }, modules: { ...profile.modules }, presetId: null };
    });
  }

  function deleteProfile(id: string) {
    setTuning((prev) => ({ ...prev, profiles: prev.profiles.filter((profile) => profile.id !== id) }));
  }

  function createSnapshot() {
    setTuning((prev) => ({
      ...prev,
      snapshots: [
        {
          id: configUid("snap"),
          label: `Checkpoint ${prev.snapshots.length + 1}`,
          createdAt: Date.now(),
          payload: `${state.sheet.name || "sem nome"} · ${state.sheet.clocks.length} relógio(s) · ${state.sessions.length} sessão(ões)`,
          state: { sheet: state.sheet, npcs: state.npcs, sessions: state.sessions },
        },
        ...prev.snapshots,
      ].slice(0, 6),
    }));
  }

  function restoreSnapshot(id: string) {
    const snapshot = tuning.snapshots.find((entry) => entry.id === id);
    if (!snapshot) return;
    setState((prev) => ({
      ...prev,
      sheet: snapshot.state.sheet,
      npcs: snapshot.state.npcs,
      sessions: snapshot.state.sessions,
      activeSessionId: snapshot.state.sessions[0]?.id ?? null,
      view: "mesa",
    }));
  }

  function deleteSnapshot(id: string) {
    setTuning((prev) => ({ ...prev, snapshots: prev.snapshots.filter((entry) => entry.id !== id) }));
  }

  function newSession() {
    setState((prev) => ({ ...prev, view: "mesa", activeSessionId: null }));
  }

  function selectSession(id: string) {
    setState((prev) => ({ ...prev, view: "mesa", activeSessionId: id }));
  }

  function deleteSession(id: string) {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((session) => session.id !== id),
      activeSessionId: prev.activeSessionId === id ? null : prev.activeSessionId,
    }));
  }

  function resetTable() {
    setState((prev) => ({ ...prev, sheet: blankSheet(), activeSessionId: null, view: "ficha" }));
  }

  function addNpc(draft: Omit<Npc, "id" | "revealed">) {
    setState((prev) => ({ ...prev, npcs: [...prev.npcs, { ...draft, id: uid("npc"), revealed: false }] }));
  }

  function removeNpc(id: string) {
    setState((prev) => ({ ...prev, npcs: prev.npcs.filter((npc) => npc.id !== id) }));
  }

  function setClock(name: string, filled: number) {
    patch({ op: "clock-upsert", name, filled });
  }

  function setWorld(changes: Partial<World>) {
    setState((prev) => ({ ...prev, world: { ...prev.world, ...changes } }));
  }

  function revealFaction(id: string) {
    setState((prev) => ({
      ...prev,
      world: { ...prev.world, factions: prev.world.factions.map((f) => (f.id === id ? { ...f, revealed: !f.revealed } : f)) },
    }));
  }

  function addFaction() {
    setState((prev) => ({
      ...prev,
      world: {
        ...prev.world,
        factions: [
          ...prev.world.factions,
          {
            id: configUid("facao"),
            name: "Facção sem nome",
            ideology: "O que ela acredita que justifica suas ações.",
            goal: "O que quer conquistar antes que a mesa acabe.",
            resources: "Homens, dinheiro, informação ou território.",
            influence: 40,
            allies: "—",
            rivals: "—",
            secret: "Aquilo que ninguém deveria saber ainda.",
            standing: "neutra" as FactionStanding,
            revealed: false,
            clock: { name: "Plano da facção avança", filled: 0, size: 6 },
          },
        ],
      },
    }));
  }

  function removeFaction(id: string) {
    setState((prev) => ({ ...prev, world: { ...prev.world, factions: prev.world.factions.filter((f) => f.id !== id) } }));
  }

  function addQuest(tier: QuestTier) {
    setState((prev) => ({
      ...prev,
      world: {
        ...prev.world,
        quests: [
          ...prev.world.quests,
          {
            id: configUid("quest"),
            tier,
            objective: tier === "oculta" ? "Requisito ainda desconhecido" : "Objetivo da missão",
            reward: tier === "oculta" ? "?" : "O que o mundo oferece em troca",
            patron: tier === "oculta" ? "?" : "Quem paga por isso",
            risk: 3,
            discovered: tier !== "oculta",
          },
        ],
      },
    }));
  }

  function removeQuest(id: string) {
    setState((prev) => ({ ...prev, world: { ...prev.world, quests: prev.world.quests.filter((q) => q.id !== id) } }));
  }

  function revealQuest(id: string) {
    setState((prev) => ({
      ...prev,
      world: { ...prev.world, quests: prev.world.quests.map((q) => (q.id === id ? { ...q, discovered: !q.discovered } : q)) },
    }));
  }

  function addBeast() {
    setState((prev) => ({
      ...prev,
      world: {
        ...prev.world,
        bestiary: [
          ...prev.world.bestiary,
          {
            id: configUid("besta"),
            name: "Criatura sem nome",
            species: "—",
            habitat: "—",
            behavior: "—",
            intelligence: "instinto" as const,
            abilities: "—",
            weakness: "—",
            threat: 3,
          },
        ],
      },
    }));
  }

  function removeBeast(id: string) {
    setState((prev) => ({ ...prev, world: { ...prev.world, bestiary: prev.world.bestiary.filter((b) => b.id !== id) } }));
  }

  return (
    <div className="app">
      <div className="ambient" aria-hidden="true">
        <span className="ambient-lamp" />
        <span className="ambient-grid" />
        <span className="ambient-grain" />
        <span className="ambient-vignette" />
      </div>

      <nav className="rail" aria-label="Áreas da mesa">
        <div className="rail-brand">
          <span className="rail-seal">
            <Icon name="dice" size={20} />
          </span>
          <span className="rail-brand-text">
            <strong>Mestre das</strong>
            <em>Mil Faces</em>
          </span>
        </div>

        <ul className="rail-nav">
          {NAV.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={`rail-item ${state.view === item.id ? "rail-active" : ""}`}
                onClick={() => setState((prev) => ({ ...prev, view: item.id }))}
                aria-current={state.view === item.id}
                title={`${item.label} (Alt+${index + 1})`}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
                <em className="mono">{index + 1}</em>
              </button>
            </li>
          ))}
        </ul>

        <div className="theme-block">
          <span className="eyebrow">TEMA DA MESA</span>
          <button type="button" className="theme-trigger" onClick={() => setThemeOpen((open) => !open)} aria-expanded={themeOpen}>
            <span className="theme-emoji">{getTheme(themeId).emoji}</span>
            <span>{getTheme(themeId).name}</span>
            <Icon name="chevron" size={14} />
          </button>
          {themeOpen && (
            <div className="theme-menu">
              {THEMES.map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  className={`theme-option ${theme.id === themeId ? "theme-active" : ""}`}
                  onClick={() => {
                    setThemeId(theme.id);
                    setThemeOpen(false);
                  }}
                >
                  <span className="theme-emoji">{theme.emoji}</span>
                  <span>
                    <strong>{theme.name}</strong>
                    <small>{theme.tagline}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rail-foot">
          <span className={`save-dot ${flash ? "save-flash" : ""}`} />
          <p>
            <strong>Salvo neste navegador</strong>
            {savedAt ? <span className="mono">{new Date(savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span> : <span>—</span>}
          </p>
        </div>
      </nav>

      <main className="stage">
        <header className="stage-top">
          <div className="face-now">
            <span className="face-mask">
              <Icon name="spark" size={15} />
            </span>
            <span className="face-copy">
              <em>face em uso</em>
              <strong>{FACES[lastFace]}</strong>
            </span>
          </div>
          <div className="stage-top-right">
            <label className="theme-quick" aria-label="Tema da mesa">
              <span className="theme-emoji">{getTheme(themeId).emoji}</span>
              <select value={themeId} onChange={(event) => setThemeId(event.target.value as ThemeId)}>
                {THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.emoji} {theme.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="preset-now mono" title="Preset ativo">
              {tuning.presetId ? PRESETS.find((preset) => preset.id === tuning.presetId)?.emoji ?? "◈" : "◈"}{" "}
              {tuning.presetId ? PRESETS.find((preset) => preset.id === tuning.presetId)?.name : "ajuste fino"}
            </span>
            <button type="button" className="ghost-button" onClick={() => send("/ajuda")}>
              <Icon name="list" size={15} />
              <span>Atalhos</span>
            </button>
            <button type="button" className="ghost-button" onClick={() => send("/status")}>
              <Icon name="sheet" size={15} />
              <span>Estado</span>
            </button>
            <button type="button" className="brass-button" onClick={() => send("/giro")}>
              <Icon name="rotate" size={15} />
              <span>Giro do mundo</span>
            </button>
          </div>
        </header>

        <div className="stage-body">
          <div className="stage-main">
            {state.view === "mesa" && (
              <MesaView
                sheet={state.sheet}
                sessions={state.sessions}
                activeSessionId={state.activeSessionId}
                messages={messages}
                busy={busy}
                onSend={send}
                onNewSession={newSession}
                onSelectSession={selectSession}
                onDeleteSession={deleteSession}
                onClock={setClock}
                onOpenSheet={() => setState((prev) => ({ ...prev, view: "ficha" }))}
              />
            )}
            {state.view === "ficha" && <FichaView api={api} onReset={resetTable} />}
            {state.view === "dados" && <DadosView api={api} />}
            {state.view === "elenco" && (
              <ElencoView
                npcs={state.npcs}
                onReveal={(id) => patch({ op: "npc-reveal", id })}
                onAdd={addNpc}
                onRemove={removeNpc}
                onAsk={(name) => send(`/npc ${name}`)}
              />
            )}
            {state.view === "oraculo" && <OraculoView api={api} npcs={state.npcs} onSend={send} />}
            {state.view === "codex" && (
              <CodexView
                api={api}
                world={state.world}
                onWorld={setWorld}
                onRevealFaction={revealFaction}
                onAddFaction={addFaction}
                onRemoveFaction={removeFaction}
                onAddQuest={addQuest}
                onRemoveQuest={removeQuest}
                onRevealQuest={revealQuest}
                onAddBeast={addBeast}
                onRemoveBeast={removeBeast}
                onSend={send}
              />
            )}
            {state.view === "config" && (
              <ConfigView
                config={tuning.config}
                modules={tuning.modules}
                presetId={tuning.presetId}
                profiles={tuning.profiles}
                snapshots={tuning.snapshots}
                onConfig={setConfig}
                onModules={setModules}
                onPreset={applyPreset}
                onSaveProfile={saveProfile}
                onDeleteProfile={deleteProfile}
                onActivateProfile={activateProfile}
                onSnapshot={createSnapshot}
                onRestore={restoreSnapshot}
                onDeleteSnapshot={deleteSnapshot}
                onCommand={send}
              />
            )}
          </div>

          <StatePanel sheet={state.sheet} lastRoll={lastRoll} onClock={setClock} onNavigate={(view) => setState((prev) => ({ ...prev, view }))} />
        </div>
      </main>

      <nav className="tabbar" aria-label="Áreas da mesa">
        {NAV.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`tab ${state.view === item.id ? "tab-active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, view: item.id }))}
            aria-current={state.view === item.id}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
