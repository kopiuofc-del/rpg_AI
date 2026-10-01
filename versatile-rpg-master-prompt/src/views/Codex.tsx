import { useState } from "react";
import { Icon } from "../components/Icon";
import { Clock, PanelHead, Reveal, Stepper } from "../components/ui";
import type { TableApi } from "../lib/engine";
import { renownStars, threatLabel, STANDINGS, type FactionStanding, type QuestTier } from "../lib/world";

type Props = {
  api: TableApi;
  world: ReturnType<typeof import("../lib/world").blankWorld>;
  onWorld: (changes: Partial<import("../lib/world").World>) => void;
  onRevealFaction: (id: string) => void;
  onAddFaction: () => void;
  onRemoveFaction: (id: string) => void;
  onAddQuest: (tier: QuestTier) => void;
  onRemoveQuest: (id: string) => void;
  onRevealQuest: (id: string) => void;
  onRemoveBeast: (id: string) => void;
  onAddBeast: () => void;
  onSend: (text: string) => void;
};

const TIER_META: Record<QuestTier, { label: string; mark: string; tone: string }> = {
  principal: { label: "Principal", mark: "◉", tone: "tier-principal" },
  secundaria: { label: "Secundária", mark: "◇", tone: "tier-secundaria" },
  oculta: { label: "Oculta", mark: "?", tone: "tier-oculta" },
};

export function CodexView({
  api,
  world,
  onWorld,
  onRevealFaction,
  onAddFaction,
  onRemoveFaction,
  onAddQuest,
  onRemoveQuest,
  onRevealQuest,
  onRemoveBeast,
  onAddBeast,
  onSend,
}: Props) {
  const [filter, setFilter] = useState<"todos" | FactionStanding>("todos");
  const sheet = api.sheet;

  const factions = world.factions.filter((faction) => filter === "todos" || faction.standing === filter);
  const secrets = world.factions.filter((faction) => !faction.revealed).length + sheet.notes.length;
  const activeClocks = sheet.clocks.filter((clock) => clock.filled < clock.size).length + world.factions.filter((f) => f.clock.filled < f.clock.size).length;

  return (
    <div className="view view-codex">
      <header className="view-head">
        <div className="view-head-text">
          <span className="eyebrow">CODEX VIVO</span>
          <h1>{world.name || "Mundo sem nome"}</h1>
        </div>
        <div className="view-head-actions">
          <span className="world-threat">
            ameaça <em className="mono">{threatLabel(world.threat)}</em> · renome{" "}
            <em className="mono">{renownStars(world.renown)}</em>
          </span>
        </div>
      </header>

      <div className="codex-grid">
        <Reveal className="span-5">
          <section className="panel">
            <PanelHead eyebrow="WORLD STATE" title="Onde a história acontece" icon="compass" />
            <div className="panel-body">
              <label className="field">
                <span className="field-label">Mundo</span>
                <input className="field-input" value={world.name} onChange={(event) => onWorld({ name: event.target.value })} placeholder="Arquipélago de Candeia" />
              </label>
              <label className="field">
                <span className="field-label">Era / época</span>
                <input className="field-input" value={world.era} onChange={(event) => onWorld({ era: event.target.value })} placeholder="Ano 4 da Maré Fechada" />
              </label>
              <label className="field">
                <span className="field-label">Clima / hora</span>
                <input className="field-input" value={world.climate} onChange={(event) => onWorld({ climate: event.target.value })} placeholder="Entardecer úmido, vento sul" />
              </label>

              <div className="stepper-row">
                <Stepper label="nível de ameaça" value={world.threat} onChange={(threat) => onWorld({ threat })} min={0} max={10} />
                <Stepper label="renome (0–100)" value={world.renown} onChange={(renown) => onWorld({ renown })} min={0} max={100} step={5} />
              </div>
              <p className="panel-note">
                Ameaça atual: <strong>{threatLabel(world.threat)}</strong>. Ela alimenta as cenas em{" "}
                <span className="mono">/giro</span> e a leitura de risco do oráculo.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal className="span-3" delay={60}>
          <section className="panel">
            <PanelHead eyebrow="GM CORE" title="Contagem viva" icon="table" />
            <div className="panel-body core-body">
              {[
                { icon: "cast" as const, label: "NPCs", value: api.npcs.length },
                { icon: "shield" as const, label: "Facções", value: world.factions.length },
                { icon: "clock" as const, label: "Relógios ativos", value: activeClocks },
                { icon: "target" as const, label: "Missões", value: world.quests.filter((quest) => quest.discovered).length },
                { icon: "eyeOff" as const, label: "Segredos", value: secrets },
                { icon: "flame" as const, label: "Bestiário", value: world.bestiary.length },
                { icon: "dice" as const, label: "Rolagens", value: api.rollHistory.length },
              ].map((row) => (
                <div className="core-row" key={row.label}>
                  <Icon name={row.icon} size={14} />
                  <span>{row.label}</span>
                  <em className="mono">{row.value}</em>
                </div>
              ))}
              <button type="button" className="link-button" onClick={() => onSend("/giro")}>
                <Icon name="rotate" size={13} />
                <span>avançar o mundo</span>
              </button>
            </div>
          </section>
        </Reveal>

        <Reveal className="span-4" delay={90}>
          <section className="panel">
            <PanelHead eyebrow="MUDANÇAS RECENTES" title="O que aconteceu sem você" icon="scroll" />
            <div className="panel-body">
              {world.recent.length > 0 ? (
                <ul className="recent-list">
                  {world.recent.map((entry, index) => (
                    <li key={`${entry}-${index}`}>
                      <span className="recent-mark" />
                      <span>{entry}</span>
                      <button
                        type="button"
                        className="danger-ghost"
                        aria-label="Remover registro"
                        onClick={() => onWorld({ recent: world.recent.filter((_, i) => i !== index) })}
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="panel-note">Nada registrado. O que o mundo fizer fora de cena pode entrar aqui.</p>
              )}
              <form
                className="inline-add"
                onSubmit={(event) => {
                  event.preventDefault();
                  const value = new FormData(event.currentTarget).get("recent");
                  if (typeof value === "string" && value.trim()) {
                    onWorld({ recent: [value.trim(), ...world.recent].slice(0, 8) });
                    event.currentTarget.reset();
                  }
                }}
              >
                <input className="field-input" name="recent" placeholder="Registrar acontecimento fora de cena" aria-label="Novo acontecimento" />
                <button type="submit" className="solid-button">
                  <Icon name="plus" size={15} />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </section>
        </Reveal>

        <Reveal className="span-12" delay={40}>
          <section className="panel">
            <PanelHead
              eyebrow="QUEST BOARD"
              title="Missões no mundo"
              icon="target"
              action={
                <div className="quest-adder">
                  <button type="button" className="ghost-button" onClick={() => onAddQuest("principal")}>
                    <Icon name="plus" size={13} /> <span>principal</span>
                  </button>
                  <button type="button" className="ghost-button" onClick={() => onAddQuest("secundaria")}>
                    <Icon name="plus" size={13} /> <span>secundária</span>
                  </button>
                  <button type="button" className="ghost-button" onClick={() => onAddQuest("oculta")}>
                    <Icon name="eyeOff" size={13} /> <span>oculta</span>
                  </button>
                </div>
              }
            />
            <div className="panel-body">
              <div className="quest-board">
                {(["principal", "secundaria", "oculta"] as QuestTier[]).map((tier) => {
                  const list = world.quests.filter((quest) => quest.tier === tier);
                  const meta = TIER_META[tier];
                  return (
                    <div className={`quest-column ${meta.tone}`} key={tier}>
                      <span className="quest-column-head">
                        <em>{meta.mark}</em>
                        {meta.label}
                        <small className="mono">{list.length}</small>
                      </span>
                      {list.length > 0 ? (
                        list.map((quest) => (
                          <article className={`board-card ${quest.discovered ? "" : "board-hidden"}`} key={quest.id}>
                            <p className="board-objective">
                              {quest.discovered ? quest.objective : "Requisito desconhecido"}
                            </p>
                            <dl>
                              <div>
                                <dt>Recompensa</dt>
                                <dd>{quest.discovered ? quest.reward : "?"}</dd>
                              </div>
                              <div>
                                <dt>Contratante</dt>
                                <dd>{quest.discovered ? quest.patron : "?"}</dd>
                              </div>
                            </dl>
                            <div className="board-foot">
                              <span className="risk mono" title="nível de risco">
                                risco {quest.risk}/5
                              </span>
                              {tier === "oculta" && (
                                <button type="button" className="link-button" onClick={() => onRevealQuest(quest.id)}>
                                  <Icon name={quest.discovered ? "eyeOff" : "eye"} size={12} />
                                  <span>{quest.discovered ? "ocultar" : "revelar"}</span>
                                </button>
                              )}
                              <button type="button" className="danger-ghost" aria-label="Excluir missão" onClick={() => onRemoveQuest(quest.id)}>
                                <Icon name="trash" size={13} />
                              </button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="quest-empty">Nenhuma missão {meta.label.toLowerCase()}.</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="panel-note">
                Missões ocultas não são reveladas sem justificativa. Use{" "}
                <span className="mono">/missao</span> na mesa para objetivos pessoais do personagem.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal className="span-8" delay={70}>
          <section className="panel">
            <PanelHead
              eyebrow="FACTION ENGINE"
              title="Quem tem interesse nisso"
              icon="shield"
              action={
                <div className="head-tools">
                  <div className="filter-row">
                    <button type="button" className={`chip ${filter === "todos" ? "chip-active" : ""}`} onClick={() => setFilter("todos")}>
                      todos <em className="mono">{world.factions.length}</em>
                    </button>
                    {STANDINGS.map((standing) => (
                      <button key={standing} type="button" className={`chip ${filter === standing ? "chip-active" : ""}`} onClick={() => setFilter(standing)}>
                        {standing} <em className="mono">{world.factions.filter((f) => f.standing === standing).length}</em>
                      </button>
                    ))}
                  </div>
                  <button type="button" className="solid-button" onClick={onAddFaction}>
                    <Icon name="plus" size={14} />
                    <span>Nova</span>
                  </button>
                </div>
              }
            />
            <div className="panel-body faction-body">
              <div className="faction-grid">
                {factions.map((faction) => (
                  <article className={`faction-card standing-${faction.standing}`} key={faction.id}>
                    <header className="faction-head">
                      <h3>{faction.name}</h3>
                      <button
                        type="button"
                        className="standing-select"
                        onClick={() => onRevealFaction(faction.id)}
                        aria-label="Alternar revelação do segredo"
                      >
                        <Icon name={faction.revealed ? "eyeOff" : "eye"} size={13} />
                      </button>
                    </header>
                    <p className="faction-ideology">{faction.ideology}</p>
                    <dl className="faction-facts">
                      <div>
                        <dt>Objetivo</dt>
                        <dd>{faction.goal}</dd>
                      </div>
                      <div>
                        <dt>Recursos</dt>
                        <dd>{faction.resources}</dd>
                      </div>
                      <div>
                        <dt>Aliados</dt>
                        <dd>{faction.allies}</dd>
                      </div>
                      <div>
                        <dt>Rivais</dt>
                        <dd>{faction.rivals}</dd>
                      </div>
                    </dl>
                    <div className="faction-secret">
                      <span>{faction.revealed ? faction.secret : "•••••• ••••••• •••• •••••••••"}</span>
                    </div>
                    <div className="faction-influence">
                      <span className="field-label">influência</span>
                      <span className="influence-track">
                        <span style={{ width: `${faction.influence}%` }} />
                      </span>
                      <em className="mono">{faction.influence}</em>
                    </div>
                    {faction.clock && <Clock name={faction.clock.name} filled={faction.clock.filled} size={faction.clock.size} compact />}
                    <footer className="faction-foot">
                      <select
                        className="field-input standing"
                        value={faction.standing}
                        onChange={(event) =>
                          onWorld({
                            factions: world.factions.map((entry) =>
                              entry.id === faction.id ? { ...entry, standing: event.target.value as FactionStanding } : entry,
                            ),
                          })
                        }
                        aria-label={`Relação de ${faction.name}`}
                      >
                        {STANDINGS.map((standing) => (
                          <option key={standing} value={standing}>
                            {standing}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="danger-ghost" aria-label={`Remover ${faction.name}`} onClick={() => onRemoveFaction(faction.id)}>
                        <Icon name="trash" size={13} />
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal className="span-4" delay={100}>
          <section className="panel">
            <PanelHead
              eyebrow="BESTIÁRIO"
              title="Criaturas do mundo"
              icon="flame"
              action={
                <button type="button" className="solid-button" onClick={onAddBeast}>
                  <Icon name="plus" size={14} />
                  <span>Nova</span>
                </button>
              }
            />
            <div className="panel-body beast-body">
              {world.bestiary.map((beast) => (
                <article className="beast-card" key={beast.id}>
                  <header>
                    <h3>{beast.name}</h3>
                    <span className={`threat threat-${beast.threat >= 5 ? "high" : beast.threat >= 3 ? "mid" : "low"}`}>
                      ameaça {beast.threat}
                    </span>
                  </header>
                  <dl>
                    <div>
                      <dt>Espécie</dt>
                      <dd>{beast.species}</dd>
                    </div>
                    <div>
                      <dt>Habitat</dt>
                      <dd>{beast.habitat}</dd>
                    </div>
                    <div>
                      <dt>Comportamento</dt>
                      <dd>{beast.behavior}</dd>
                    </div>
                    <div>
                      <dt>Inteligência</dt>
                      <dd>{beast.intelligence}</dd>
                    </div>
                    <div>
                      <dt>Habilidades</dt>
                      <dd>{beast.abilities}</dd>
                    </div>
                    <div>
                      <dt>Fraqueza</dt>
                      <dd>{beast.weakness}</dd>
                    </div>
                  </dl>
                  <button type="button" className="danger-ghost" aria-label={`Remover ${beast.name}`} onClick={() => onRemoveBeast(beast.id)}>
                    <Icon name="trash" size={13} />
                  </button>
                </article>
              ))}
              {world.bestiary.length === 0 && <p className="panel-note">Bestiário vazio.</p>}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
