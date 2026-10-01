import { useState } from "react";
import { Icon } from "../components/Icon";
import { Chip, PanelHead, Reveal, RollCard, Stepper } from "../components/ui";
import { DIE_FACES, criticalState, describeRoll, rollDice, type DieFace, type DiceRoll, type RollMode } from "../lib/dice";
import type { TableApi } from "../lib/engine";

const PRESETS: { label: string; faces: DieFace; count: number; modifier: number; mode: RollMode }[] = [
  { label: "Teste padrão", faces: 20, count: 1, modifier: 5, mode: "normal" },
  { label: "Com vantagem", faces: 20, count: 1, modifier: 0, mode: "vantagem" },
  { label: "Com desvantagem", faces: 20, count: 1, modifier: 0, mode: "desvantagem" },
  { label: "2d6 (PbtA)", faces: 6, count: 2, modifier: 0, mode: "normal" },
  { label: "Dano 3d8", faces: 8, count: 3, modifier: 0, mode: "normal" },
  { label: "Oráculo d100", faces: 100, count: 1, modifier: 0, mode: "normal" },
];

export function DadosView({ api }: { api: TableApi }) {
  const [faces, setFaces] = useState<DieFace>(20);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [mode, setMode] = useState<RollMode>("normal");
  const [label, setLabel] = useState("Teste");
  const [last, setLast] = useState<DiceRoll | null>(api.rollHistory[0] ?? null);
  const [rolling, setRolling] = useState(false);

  function roll(preset?: (typeof PRESETS)[number]) {
    const request = preset ?? { faces, count, modifier, mode };
    const result = rollDice({ ...request, label: preset ? preset.label : label });
    setRolling(true);
    api.patch({ op: "roll-log", roll: result });
    window.setTimeout(() => {
      setLast(result);
      setRolling(false);
    }, 420);
  }

  const history = api.rollHistory;
  const critical = last ? criticalState(last) : null;

  return (
    <div className="view view-dados">
      <header className="view-head">
        <div className="view-head-text">
          <span className="eyebrow">BANDEJA</span>
          <h1>Dados à vista</h1>
        </div>
        <p className="view-head-note">
          Resultado mostrado não é alterado depois. Se preferir dados físicos, role aí e registre com{" "}
          <span className="mono">/dado</span>.
        </p>
      </header>

      <div className="dice-grid">
        <Reveal className="span-5">
          <section className="panel tray">
            <PanelHead eyebrow="CONFIGURAR" title="O que vai rolar" icon="dice" />
            <div className="panel-body">
              <div className="face-picker">
                {DIE_FACES.map((face) => (
                  <button
                    type="button"
                    key={face}
                    className={`face ${face === faces ? "face-active" : ""}`}
                    onClick={() => setFaces(face)}
                    aria-pressed={face === faces}
                  >
                    <span className="mono">d{face}</span>
                  </button>
                ))}
              </div>

              <div className="stepper-row">
                <Stepper label="quantidade" value={count} onChange={setCount} min={1} max={20} />
                <Stepper label="modificador" value={modifier} onChange={setModifier} min={-20} max={20} />
              </div>

              <div className="mode-picker">
                {(["normal", "vantagem", "desvantagem"] as RollMode[]).map((option) => (
                  <Chip key={option} active={mode === option} onClick={() => setMode(option)}>
                    {option}
                  </Chip>
                ))}
              </div>
              <p className="panel-note">
                Vantagem e desvantagem valem apenas para <span className="mono">1d20</span>; nos outros casos o seletor é
                ignorado.
              </p>

              <label className="field" htmlFor="roll-label">
                <span className="field-label">Nome do teste</span>
                <input
                  id="roll-label"
                  className="field-input"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Percepção, Persuasão, dano da espada…"
                />
              </label>

              <button type="button" className={`roll-button ${rolling ? "is-rolling" : ""}`} onClick={() => roll()}>
                <span className="roll-button-die">
                  <Icon name="dice" size={22} />
                </span>
                <span>
                  Rolar {count}d{faces}
                  {modifier !== 0 ? ` ${modifier > 0 ? "+" : "−"} ${Math.abs(modifier)}` : ""}
                </span>
              </button>

              <div className="preset-row">
                {PRESETS.map((preset) => (
                  <Chip key={preset.label} onClick={() => roll(preset)}>
                    {preset.label}
                  </Chip>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal className="span-7" delay={70}>
          <section className="panel result-panel">
            <PanelHead
              eyebrow="ÚLTIMA ROLAGEM"
              title={last ? last.label : "A bandeja está vazia"}
              icon="target"
              action={critical ? <em className={`flag flag-${critical}`}>{critical === "critico" ? "crítico" : "desastre"}</em> : undefined}
            />
            <div className="panel-body">
              {last ? (
                <RollCard roll={last} />
              ) : (
                <p className="panel-note">
                  Configure ao lado ou use um atalho. Cada rolagem entra no histórico e pode ser copiada para a sua mesa
                  física.
                </p>
              )}

              {history.length > 0 && (
                <div className="history">
                  <div className="history-head">
                    <span className="eyebrow">HISTÓRICO ({history.length})</span>
                    <button type="button" className="link-button" onClick={() => setLast(history[0])}>
                      mostrar última
                    </button>
                  </div>
                  <ul className="history-list">
                    {history.map((entry) => {
                      const state = criticalState(entry);
                      return (
                        <li key={entry.id} className={state ?? ""}>
                          <span className="history-total mono">{entry.total}</span>
                          <span className="history-body">
                            <strong>{entry.label}</strong>
                            <small className="mono">{entry.formula}</small>
                          </span>
                          <span className="history-detail">{describeRoll(entry).split(":")[1]?.trim() ?? ""}</span>
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => {
                              void navigator.clipboard?.writeText(describeRoll(entry));
                              setLast(entry);
                            }}
                          >
                            <Icon name="copy" size={13} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
