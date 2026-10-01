import { useState } from "react";
import { Icon } from "../components/Icon";
import { Chip, PanelHead, Reveal } from "../components/ui";
import type { Npc } from "../lib/state";

const RELATIONS: Npc["relation"][] = ["aliado", "neutro", "hostil"];

type Draft = {
  name: string;
  role: string;
  personality: string;
  goal: string;
  fear: string;
  secret: string;
  voice: string;
  relation: Npc["relation"];
};

const EMPTY: Draft = {
  name: "",
  role: "",
  personality: "",
  goal: "",
  fear: "",
  secret: "",
  voice: "",
  relation: "neutro",
};

export function ElencoView({
  npcs,
  onReveal,
  onAdd,
  onRemove,
  onAsk,
}: {
  npcs: Npc[];
  onReveal: (id: string) => void;
  onAdd: (npc: Draft) => void;
  onRemove: (id: string) => void;
  onAsk: (name: string) => void;
}) {
  const [filter, setFilter] = useState<"todos" | Npc["relation"]>("todos");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [formOpen, setFormOpen] = useState(false);

  const visible = npcs.filter((npc) => filter === "todos" || npc.relation === filter);

  return (
    <div className="view view-elenco">
      <header className="view-head">
        <div className="view-head-text">
          <span className="eyebrow">ELENCO</span>
          <h1>Quem tem vida própria</h1>
        </div>
        <div className="view-head-actions">
          <div className="filter-row">
            <Chip active={filter === "todos"} onClick={() => setFilter("todos")}>
              todos <em className="mono">{npcs.length}</em>
            </Chip>
            {RELATIONS.map((relation) => (
              <Chip key={relation} active={filter === relation} onClick={() => setFilter(relation)}>
                {relation} <em className="mono">{npcs.filter((npc) => npc.relation === relation).length}</em>
              </Chip>
            ))}
          </div>
          <button type="button" className="solid-button" onClick={() => setFormOpen((open) => !open)}>
            <Icon name={formOpen ? "close" : "plus"} size={15} />
            <span>{formOpen ? "Fechar" : "Novo NPC"}</span>
          </button>
        </div>
      </header>

      {formOpen && (
        <Reveal>
          <section className="panel npc-form">
            <PanelHead eyebrow="FICHA DE NPC" title="Criar alguém com interesses próprios" icon="cast" />
            <form
              className="panel-body grid-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.name.trim()) return;
                onAdd({
                  ...draft,
                  name: draft.name.trim(),
                  role: draft.role.trim() || "papel não definido",
                  personality: draft.personality.trim() || "—",
                  goal: draft.goal.trim() || "—",
                  fear: draft.fear.trim() || "—",
                  secret: draft.secret.trim() || "—",
                  voice: draft.voice.trim() || "—",
                });
                setDraft(EMPTY);
                setFormOpen(false);
              }}
            >
              <label className="field">
                <span className="field-label">Nome</span>
                <input className="field-input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Evite o nome óbvio" />
              </label>
              <label className="field">
                <span className="field-label">Papel</span>
                <input className="field-input" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} placeholder="O que faz na cidade" />
              </label>
              <label className="field">
                <span className="field-label">Personalidade</span>
                <input className="field-input" value={draft.personality} onChange={(event) => setDraft({ ...draft, personality: event.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Objetivo</span>
                <input className="field-input" value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Medo</span>
                <input className="field-input" value={draft.fear} onChange={(event) => setDraft({ ...draft, fear: event.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Segredo</span>
                <input className="field-input" value={draft.secret} onChange={(event) => setDraft({ ...draft, secret: event.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Voz / jeito de falar</span>
                <input className="field-input" value={draft.voice} onChange={(event) => setDraft({ ...draft, voice: event.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Relação com o grupo</span>
                <select className="field-input" value={draft.relation} onChange={(event) => setDraft({ ...draft, relation: event.target.value as Npc["relation"] })}>
                  {RELATIONS.map((relation) => (
                    <option key={relation} value={relation}>
                      {relation}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-actions field-wide">
                <button type="submit" className="brass-button" disabled={!draft.name.trim()}>
                  <Icon name="check" size={15} />
                  <span>Entrar no elenco</span>
                </button>
                <button type="button" className="ghost-button" onClick={() => setDraft(EMPTY)}>
                  <span>limpar</span>
                </button>
              </div>
            </form>
          </section>
        </Reveal>
      )}

      <div className="cast-grid">
        {visible.map((npc, index) => (
          <Reveal key={npc.id} delay={index * 55}>
            <article className={`npc-card relation-${npc.relation} ${npc.revealed ? "npc-revealed" : ""}`}>
              <div className="npc-top">
                <span className="npc-seal mono">{npc.name.slice(0, 1)}</span>
                <div className="npc-id">
                  <h3>{npc.name}</h3>
                  <span>{npc.role}</span>
                </div>
                <em className={`relation-tag relation-tag-${npc.relation}`}>{npc.relation}</em>
              </div>

              <dl className="npc-facts">
                <div>
                  <dt>Personalidade</dt>
                  <dd>{npc.personality}</dd>
                </div>
                <div>
                  <dt>Objetivo</dt>
                  <dd>{npc.goal}</dd>
                </div>
                <div>
                  <dt>Medo</dt>
                  <dd>{npc.fear}</dd>
                </div>
                <div>
                  <dt>Voz</dt>
                  <dd>{npc.voice}</dd>
                </div>
              </dl>

              <div className={`npc-secret ${npc.revealed ? "open" : ""}`}>
                <button type="button" className="secret-toggle" onClick={() => onReveal(npc.id)}>
                  <Icon name={npc.revealed ? "eyeOff" : "eye"} size={14} />
                  <span>{npc.revealed ? "esconder segredo" : "virar a carta"}</span>
                </button>
                <p>{npc.revealed ? npc.secret : "•••••••• •••••• •••••••••• ••••• ••••••••"}</p>
              </div>

              <div className="npc-actions">
                <button type="button" className="link-button" onClick={() => onAsk(npc.name)}>
                  <Icon name="table" size={13} />
                  <span>trazer para a mesa</span>
                </button>
                <button type="button" className="danger-ghost" aria-label={`Remover ${npc.name}`} onClick={() => onRemove(npc.id)}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </article>
          </Reveal>
        ))}

        {visible.length === 0 && (
          <p className="empty-note">Nenhum NPC com essa relação. Crie um novo ou mude o filtro.</p>
        )}
      </div>
    </div>
  );
}
