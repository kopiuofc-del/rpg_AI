import { useState } from "react";
import { Icon } from "../components/Icon";
import { Chip, PanelHead, Reveal, RollCard } from "../components/ui";
import { rollDice, type DiceRoll } from "../lib/dice";
import type { TableApi } from "../lib/engine";
import { EVENTS_TABLE, ODDS, type Npc } from "../lib/state";

type Verdict = { text: string; tone: "yes" | "mixed" | "no" };

function verdictFor(roll: number, target: number): Verdict {
  if (roll <= Math.max(Math.floor(target / 2), 1)) {
    return { tone: "yes", text: "Sim, e… — acontece e ainda traz um gancho extra a seu favor." };
  }
  if (roll <= target) return { tone: "yes", text: "Sim — acontece exatamente como perguntado." };
  if (roll <= target + 15) {
    return { tone: "mixed", text: "Sim, mas… — acontece com um preço: tempo, recurso, atenção indesejada." };
  }
  if (roll <= target + 40) {
    return { tone: "mixed", text: "Não, porém… — não acontece, mas fica uma porta entreaberta ou uma pista no caminho." };
  }
  if (roll >= 96) return { tone: "no", text: "Não, e… — além de não acontecer, algo pior se move por causa da tentativa." };
  return { tone: "no", text: "Não — e o mundo segue sem você, provavelmente um passo mais perto do relógio." };
}

export function OraculoView({ api, npcs, onSend }: { api: TableApi; npcs: Npc[]; onSend: (text: string) => void }) {
  const [question, setQuestion] = useState("");
  const [oddsIndex, setOddsIndex] = useState(3);
  const [answer, setAnswer] = useState<{ roll: DiceRoll; verdict: Verdict; odds: string } | null>(null);
  const [event, setEvent] = useState<{ roll: DiceRoll; text: string } | null>(null);
  const [offscreen, setOffscreen] = useState<{ npc: Npc; text: string } | null>(null);

  const odds = ODDS[oddsIndex];

  function askOracle() {
    const roll = rollDice({ faces: 100, count: 1, modifier: 0, mode: "normal", label: question.trim() || "Pergunta ao oráculo" });
    api.patch({ op: "roll-log", roll });
    setAnswer({ roll, verdict: verdictFor(roll.total, odds.target), odds: odds.label });
  }

  function drawEvent() {
    const roll = rollDice({ faces: 10, count: 1, modifier: 0, mode: "normal", label: "Evento inesperado" });
    const index = Math.min(Math.max(roll.total - 1, 0), EVENTS_TABLE.length - 1);
    api.patch({ op: "roll-log", roll });
    setEvent({ roll, text: EVENTS_TABLE[index] });
  }

  function offscreenTurn() {
    if (npcs.length === 0) return;
    const npc = npcs[Math.floor(Math.random() * npcs.length)];
    const moves = [
      `${npc.name} age fora de cena. Objetivo em jogo: ${npc.goal}`,
      `${npc.name} muda de ideia sobre você — e já contou isso a alguém.`,
      `${npc.name} cobra algo que você nem sabia que devia.`,
      `${npc.name} se recusa a ajudar e ainda avisa quem pediu.`,
    ];
    const text = moves[Math.floor(Math.random() * moves.length)];
    setOffscreen({ npc, text });
  }

  function worldTurn() {
    if (api.sheet.clocks.length === 0) return;
    api.patch({ op: "clock-advance", by: 1 });
  }

  return (
    <div className="view view-oraculo">
      <header className="view-head">
        <div className="view-head-text">
          <span className="eyebrow">JOGO SOLO</span>
          <h1>Oráculo e mundo vivo</h1>
        </div>
        <p className="view-head-note">
          Ferramentas para jogar sem mestre: probabilidade, evento aleatório e o avanço do que você não está olhando.
        </p>
      </header>

      <div className="oracle-grid">
        <Reveal className="span-7">
          <section className="panel">
            <PanelHead eyebrow="PERGUNTA FECHADA" title="Acontece?" icon="oracle" />
            <div className="panel-body">
              <label className="field" htmlFor="oracle-question">
                <span className="field-label">Sua pergunta</span>
                <input
                  id="oracle-question"
                  className="field-input"
                  value={question}
                  placeholder="A tabeliã deixa o portão aberto?"
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") askOracle();
                  }}
                />
              </label>

              <span className="field-label">Chance</span>
              <div className="odds-row">
                {ODDS.map((entry, index) => (
                  <Chip key={entry.label} active={index === oddsIndex} onClick={() => setOddsIndex(index)}>
                    {entry.label} <em className="mono">{entry.target}%</em>
                  </Chip>
                ))}
              </div>

              <button type="button" className="roll-button" onClick={askOracle}>
                <span className="roll-button-die">
                  <Icon name="oracle" size={22} />
                </span>
                <span>Consultar o d100</span>
              </button>

              {answer && (
                <div className={`verdict verdict-${answer.verdict.tone}`}>
                  <RollCard roll={answer.roll} compact />
                  <p className="verdict-text">{answer.verdict.text}</p>
                  <span className="verdict-meta mono">
                    chance {answer.odds} ({odds.target}%) · rolagem {answer.roll.total}
                  </span>
                  <p className="panel-note">
                    Escada usada aqui é regra da casa: ≤ metade da chance = “sim, e…”; ≤ chance = “sim”; até +15 = “sim,
                    mas…”; até +40 = “não, porém…”; 96+ = “não, e…”.
                  </p>
                </div>
              )}
            </div>
          </section>
        </Reveal>

        <Reveal className="span-5" delay={70}>
          <section className="panel">
            <PanelHead eyebrow="INTERRUPÇÃO" title="Evento inesperado" icon="flame" />
            <div className="panel-body">
              <button type="button" className="roll-button alt" onClick={drawEvent}>
                <span className="roll-button-die">
                  <Icon name="flame" size={20} />
                </span>
                <span>Sortear d10</span>
              </button>
              {event ? (
                <div className="event-card">
                  <span className="event-index mono">{String(Math.max(event.roll.total, 1)).padStart(2, "0")}</span>
                  <p>{event.text}</p>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      api.patch({ op: "note-add", text: `Evento: ${event.text}` });
                      onSend("/status");
                    }}
                  >
                    <Icon name="scroll" size={13} />
                    <span>anotar e ver o estado</span>
                  </button>
                </div>
              ) : (
                <p className="panel-note">
                  Use quando a cena estiver confortável demais. O evento entra por cima do seu plano, não no lugar dele.
                </p>
              )}
            </div>
          </section>
        </Reveal>

        <Reveal className="span-5" delay={110}>
          <section className="panel">
            <PanelHead eyebrow="FORA DE CENA" title="O que os NPCs fazem" icon="cast" />
            <div className="panel-body">
              <button type="button" className="roll-button alt" onClick={offscreenTurn} disabled={npcs.length === 0}>
                <span className="roll-button-die">
                  <Icon name="cast" size={20} />
                </span>
                <span>{npcs.length === 0 ? "Elenco vazio" : "Girar um NPC"}</span>
              </button>
              {offscreen && (
                <div className="event-card">
                  <p>
                    <strong>{offscreen.npc.name}.</strong> {offscreen.text}
                  </p>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => api.patch({ op: "note-add", text: `Fora de cena: ${offscreen.text}` })}
                  >
                    <Icon name="scroll" size={13} />
                    <span>gravar na ficha</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        </Reveal>

        <Reveal className="span-7" delay={140}>
          <section className="panel">
            <PanelHead
              eyebrow="TEMPO PASSA"
              title="Giro do mundo"
              icon="clock"
              action={
                <button type="button" className="solid-button" onClick={worldTurn} disabled={api.sheet.clocks.length === 0}>
                  <Icon name="rotate" size={15} />
                  <span>Avançar todos em 1</span>
                </button>
              }
            />
            <div className="panel-body">
              {api.sheet.clocks.length > 0 ? (
                <ul className="turn-list">
                  {api.sheet.clocks.map((clock) => (
                    <li key={clock.id} className={clock.filled >= clock.size ? "is-full" : ""}>
                      <span className="turn-name">{clock.name}</span>
                      <span className="turn-track">
                        {Array.from({ length: clock.size }, (_, index) => (
                          <span key={index} className={index < clock.filled ? "seg seg-on" : "seg"} />
                        ))}
                      </span>
                      <em className="mono">
                        {clock.filled}/{clock.size}
                      </em>
                      <span className="turn-state">
                        {clock.filled >= clock.size ? "aconteceu" : `${clock.size - clock.filled} para acontecer`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="panel-note">
                  Nenhum relógio ativo: o mundo está parado. Crie um na aba Ficha ou com{" "}
                  <span className="mono">/relogio Rebelião 0/6</span>.
                </p>
              )}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
