import { useState } from "react";
import { Icon } from "../components/Icon";
import { Clock, Field, HpBar, PanelHead, Reveal, Stepper } from "../components/ui";
import type { TableApi } from "../lib/engine";
import { SYSTEMS } from "../lib/state";
import { uid } from "../lib/dice";

export function FichaView({ api, onReset }: { api: TableApi; onReset: () => void }) {
  const { sheet } = api;
  const [itemDraft, setItemDraft] = useState("");
  const [questDraft, setQuestDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [clockName, setClockName] = useState("");
  const [clockSize, setClockSize] = useState(6);
  const [confirmReset, setConfirmReset] = useState(false);

  const set = api.setSheet;

  return (
    <div className="view view-ficha">
      <header className="view-head">
        <div className="view-head-text">
          <span className="eyebrow">CONTINUIDADE</span>
          <h1>Ficha de estado</h1>
        </div>
        <div className="view-head-actions">
          {confirmReset ? (
            <>
              <button type="button" className="danger-button" onClick={onReset}>
                <Icon name="rotate" size={15} />
                <span>Confirmar reinício</span>
              </button>
              <button type="button" className="ghost-button" onClick={() => setConfirmReset(false)}>
                <span>cancelar</span>
              </button>
            </>
          ) : (
            <button type="button" className="ghost-button" onClick={() => setConfirmReset(true)}>
              <Icon name="rotate" size={15} />
              <span>Reiniciar mesa</span>
            </button>
          )}
        </div>
      </header>

      <div className="sheet-grid">
        <Reveal className="span-6">
          <section className="panel">
            <PanelHead eyebrow="QUEM JOGA" title="Identidade" icon="sheet" />
            <div className="panel-body grid-2">
              <Field label="Nome" value={sheet.name} onChange={(name) => set({ name })} placeholder="Como a mesa te chama" />
              <Field
                label="Sistema"
                value={sheet.system}
                onChange={(system) => set({ system })}
                placeholder="Escolha ou escreva o seu"
              />
              <label className="field field-wide">
                <span className="field-label">Sistema (lista)</span>
                <select className="field-input" value={sheet.system} onChange={(event) => set({ system: event.target.value })}>
                  {SYSTEMS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Conceito"
                value={sheet.concept}
                onChange={(concept) => set({ concept })}
                placeholder="Uma frase que resume quem é"
                as="textarea"
              />
              <Field label="Reputação" value={sheet.reputation} onChange={(reputation) => set({ reputation })} />
            </div>
          </section>
        </Reveal>

        <Reveal className="span-6" delay={60}>
          <section className="panel">
            <PanelHead eyebrow="CORPO E NÚMEROS" title="Recursos vitais" icon="heart" />
            <div className="panel-body">
              <HpBar hp={sheet.hp} hpMax={sheet.hpMax} onChange={(hp) => set({ hp })} />
              <div className="stepper-row">
                <Stepper label="PV atual" value={sheet.hp} onChange={(hp) => set({ hp })} max={sheet.hpMax} />
                <Stepper label="PV máximo" value={sheet.hpMax} onChange={(hpMax) => set({ hpMax, hp: Math.min(sheet.hp, hpMax) })} min={1} />
                <Stepper label="Defesa / CA" value={sheet.defense} onChange={(defense) => set({ defense })} />
              </div>
              <p className="panel-note">
                Números ficam salvos junto com a sessão. O motor usa estes valores em <span className="mono">/status</span>,{" "}
                <span className="mono">/pv</span> e <span className="mono">/descanso</span>.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal className="span-4" delay={90}>
          <section className="panel">
            <PanelHead eyebrow="ONDE E QUANDO" title="Cena atual" icon="pin" />
            <div className="panel-body">
              <Field label="Local" value={sheet.location} onChange={(location) => set({ location })} placeholder="Cais de Porto Candeia" />
              <Field label="Data / hora" value={sheet.time} onChange={(time) => set({ time })} placeholder="Entardecer, maré baixa" />
            </div>
          </section>
        </Reveal>

        <Reveal className="span-8" delay={120}>
          <section className="panel">
            <PanelHead eyebrow="O QUE CARREGA" title="Inventário" icon="pack" action={<em className="count mono">{sheet.inventory.length}</em>} />
            <div className="panel-body">
              <form
                className="inline-add"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!itemDraft.trim()) return;
                  api.patch({ op: "inventory-add", item: itemDraft.trim() });
                  setItemDraft("");
                }}
              >
                <input
                  className="field-input"
                  value={itemDraft}
                  placeholder="Adicionar item, recurso ou dívida"
                  onChange={(event) => setItemDraft(event.target.value)}
                  aria-label="Novo item"
                />
                <button type="submit" className="solid-button" disabled={!itemDraft.trim()}>
                  <Icon name="plus" size={15} />
                  <span>Add</span>
                </button>
              </form>
              {sheet.inventory.length > 0 ? (
                <ul className="token-list">
                  {sheet.inventory.map((item) => (
                    <li key={item} className="token">
                      <Icon name="pack" size={13} />
                      <span>{item}</span>
                      <button type="button" aria-label={`Remover ${item}`} onClick={() => api.patch({ op: "inventory-remove", item })}>
                        <Icon name="close" size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="panel-note">Vazio. Itens entram aqui por <span className="mono">/pegar</span> ou pelo campo acima.</p>
              )}
            </div>
          </section>
        </Reveal>

        <Reveal className="span-6" delay={60}>
          <section className="panel">
            <PanelHead eyebrow="O MUNDO ANDA" title="Relógios" icon="clock" action={<em className="count mono">{sheet.clocks.length}</em>} />
            <div className="panel-body">
              <form
                className="inline-add"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!clockName.trim()) return;
                  api.patch({ op: "clock-upsert", name: clockName.trim(), filled: 0, size: clockSize });
                  setClockName("");
                }}
              >
                <input
                  className="field-input"
                  value={clockName}
                  placeholder="Nova ameaça ou prazo"
                  onChange={(event) => setClockName(event.target.value)}
                  aria-label="Nome do relógio"
                />
                <Stepper label="segmentos" value={clockSize} onChange={setClockSize} min={2} max={12} />
                <button type="submit" className="solid-button" disabled={!clockName.trim()}>
                  <Icon name="plus" size={15} />
                  <span>Add</span>
                </button>
              </form>

              {sheet.clocks.length > 0 ? (
                <div className="clock-grid">
                  {sheet.clocks.map((clock) => (
                    <div className="clock-slot" key={clock.id}>
                      <Clock
                        name={clock.name}
                        filled={clock.filled}
                        size={clock.size}
                        onChange={(filled) => api.patch({ op: "clock-upsert", name: clock.name, filled, size: clock.size })}
                      />
                      <div className="clock-actions">
                        <button type="button" onClick={() => api.patch({ op: "clock-upsert", name: clock.name, filled: Math.min(clock.filled + 1, clock.size), size: clock.size })}>
                          <Icon name="plus" size={13} />
                        </button>
                        <button type="button" onClick={() => api.patch({ op: "clock-upsert", name: clock.name, filled: Math.max(clock.filled - 1, 0), size: clock.size })}>
                          <Icon name="close" size={13} />
                        </button>
                        <button
                          type="button"
                          className="danger-ghost"
                          aria-label={`Excluir relógio ${clock.name}`}
                          onClick={() => set({ clocks: sheet.clocks.filter((entry) => entry.id !== clock.id) })}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="panel-note">
                  Sem relógio, nada acontece fora de cena. Crie um e use <span className="mono">/giro</span> para o mundo avançar
                  sozinho.
                </p>
              )}
            </div>
          </section>
        </Reveal>

        <Reveal className="span-6" delay={90}>
          <section className="panel">
            <PanelHead eyebrow="PARA ONDE VAI" title="Missões" icon="target" action={<em className="count mono">{sheet.quests.filter((q) => !q.done).length}</em>} />
            <div className="panel-body">
              <form
                className="inline-add"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!questDraft.trim()) return;
                  api.patch({ op: "quest-add", text: questDraft.trim() });
                  setQuestDraft("");
                }}
              >
                <input
                  className="field-input"
                  value={questDraft}
                  placeholder="Novo objetivo"
                  onChange={(event) => setQuestDraft(event.target.value)}
                  aria-label="Nova missão"
                />
                <button type="submit" className="solid-button" disabled={!questDraft.trim()}>
                  <Icon name="plus" size={15} />
                  <span>Add</span>
                </button>
              </form>
              {sheet.quests.length > 0 ? (
                <ul className="quest-list">
                  {sheet.quests.map((quest) => (
                    <li key={quest.id} className={quest.done ? "quest-done" : ""}>
                      <button
                        type="button"
                        className="quest-toggle"
                        aria-label={quest.done ? "Reabrir missão" : "Concluir missão"}
                        onClick={() =>
                          set({
                            quests: sheet.quests.map((entry) =>
                              entry.id === quest.id ? { ...entry, done: !entry.done } : entry,
                            ),
                          })
                        }
                      >
                        <Icon name="check" size={12} />
                      </button>
                      <span>{quest.text}</span>
                      <button
                        type="button"
                        className="danger-ghost"
                        aria-label="Excluir missão"
                        onClick={() => set({ quests: sheet.quests.filter((entry) => entry.id !== quest.id) })}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="panel-note">Nenhuma missão. Aventuras abertas pelo chat registram os objetivos aqui.</p>
              )}
            </div>
          </section>
        </Reveal>

        <Reveal className="span-12" delay={60}>
          <section className="panel">
            <PanelHead eyebrow="MEMÓRIA DA MESA" title="Anotações e pistas" icon="scroll" action={<em className="count mono">{sheet.notes.length}</em>} />
            <div className="panel-body">
              <form
                className="inline-add"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!noteDraft.trim()) return;
                  api.patch({ op: "note-add", text: noteDraft.trim() });
                  setNoteDraft("");
                }}
              >
                <input
                  className="field-input"
                  value={noteDraft}
                  placeholder="Fato estabelecido, pista, promessa feita a um NPC"
                  onChange={(event) => setNoteDraft(event.target.value)}
                  aria-label="Nova anotação"
                />
                <button type="submit" className="solid-button" disabled={!noteDraft.trim()}>
                  <Icon name="plus" size={15} />
                  <span>Add</span>
                </button>
              </form>
              {sheet.notes.length > 0 ? (
                <ul className="note-list">
                  {sheet.notes.map((note) => (
                    <li key={`${note}-${uid("n")}`}>
                      <span>{note}</span>
                      <button
                        type="button"
                        className="danger-ghost"
                        aria-label="Excluir anotação"
                        onClick={() => set({ notes: sheet.notes.filter((entry) => entry !== note) })}
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="panel-note">
                  Nada anotado. Fatos estabelecidos em jogo viram memória — e o motor usa isso para não se contradizer.
                </p>
              )}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
