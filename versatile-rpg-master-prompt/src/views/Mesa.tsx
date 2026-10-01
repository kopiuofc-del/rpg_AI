import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { BlockView, blocksToPlainText, Clock, HpBar } from "../components/ui";
import { FACES, type Message, type Session, type Sheet } from "../lib/state";

const QUICK_CHIPS = ["/dado 1d20", "/status", "/giro", "/sim isso dá certo?", "/pv -1", "/pegar lanterna", "/resumo"];

type Props = {
  sheet: Sheet;
  sessions: Session[];
  activeSessionId: string | null;
  messages: Message[];
  busy: boolean;
  onSend: (text: string) => void;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClock: (name: string, filled: number) => void;
  onOpenSheet: () => void;
};

export function MesaView({
  sheet,
  sessions,
  activeSessionId,
  messages,
  busy,
  onSend,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onClock,
  onOpenSheet,
}: Props) {
  const [composer, setComposer] = useState("");
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, busy]);

  useEffect(() => {
    if (!sessionsOpen) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setSessionsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [sessionsOpen]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [composer]);

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setComposer("");
  }

  async function copy(message: Message) {
    try {
      await navigator.clipboard.writeText(blocksToPlainText(message.blocks));
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setCopiedId(null);
    }
  }

  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="view view-mesa">
      <header className="view-head">
        <div className="view-head-text">
          <span className="eyebrow">MESA ABERTA</span>
          <h1>
            {sorted.find((session) => session.id === activeSessionId)?.title ?? "Nenhuma cena em andamento"}
          </h1>
        </div>
        <div className="view-head-actions">
          <button type="button" className="mini-state" onClick={onOpenSheet} title="Abrir ficha de estado">
            <span className="mini-hp mono">
              {sheet.hp}/{sheet.hpMax} PV
            </span>
            <span className="mini-sep" />
            <span className="mini-place">{sheet.location || "sem local definido"}</span>
            <span className="mini-sep" />
            <span className="mini-clocks mono">{sheet.clocks.length} relógio(s)</span>
            <Icon name="arrow" size={13} />
          </button>
          <div className="sessions" ref={menuRef}>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setSessionsOpen((open) => !open)}
              aria-expanded={sessionsOpen}
              aria-haspopup="menu"
            >
              <Icon name="scroll" size={15} />
              <span>Sessões</span>
              <em className="mono">{sessions.length}</em>
              <Icon name="chevron" size={14} />
            </button>
            {sessionsOpen && (
              <div className="sessions-menu" role="menu">
                {sorted.length === 0 ? (
                  <p className="sessions-empty">Nada gravado ainda. Cada mensagem cria uma sessão.</p>
                ) : (
                  sorted.map((session) => (
                    <div className={`session-row ${session.id === activeSessionId ? "session-active" : ""}`} key={session.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onSelectSession(session.id);
                          setSessionsOpen(false);
                        }}
                      >
                        <span>{session.title}</span>
                        <small>
                          {session.messages.length} fala(s) ·{" "}
                          {new Date(session.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </button>
                      <button
                        type="button"
                        className="session-delete"
                        aria-label={`Excluir ${session.title}`}
                        onClick={() => onDeleteSession(session.id)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button type="button" className="solid-button" onClick={onNewSession}>
            <Icon name="plus" size={15} />
            <span>Nova sessão</span>
          </button>
        </div>
      </header>

      {messages.length === 0 ? (
        <div className="open-table">
          <div className="open-main">
            <span className="open-kicker">SESSÃO ZERO</span>
            <h2>
              Cinco perguntas
              <em>abrem qualquer mesa.</em>
            </h2>
            <ol className="open-list">
              {[
                "Sistema — ou narrativo livre",
                "Gênero e tom",
                "Dificuldade e letalidade",
                "Quantos personagens jogam",
                "Limites de conteúdo",
              ].map((item, index) => (
                <li key={item}>
                  <span className="open-index mono">{String(index + 1).padStart(2, "0")}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <div className="open-actions">
              <button type="button" className="solid-button big" onClick={() => send("/mestre")}>
                <Icon name="table" size={16} />
                <span>Responder as cinco</span>
              </button>
              <button type="button" className="brass-button big" onClick={() => send("Surpreenda-me")}>
                <Icon name="spark" size={16} />
                <span>Surpreenda-me</span>
              </button>
            </div>
            <p className="open-foot">
              “Surpreenda-me” abre <em>Porto Candeia</em>: fantasia portuária, mistério, perigo moderado — e já grava
              local, hora, relógio e missão na ficha.
            </p>
          </div>

          <aside className="open-side">
            <div className="side-card">
              <span className="eyebrow">AGORA NA MESA</span>
              <dl className="side-facts">
                <div>
                  <dt>
                    <Icon name="pin" size={13} /> Local
                  </dt>
                  <dd>{sheet.location || "—"}</dd>
                </div>
                <div>
                  <dt>
                    <Icon name="clock" size={13} /> Quando
                  </dt>
                  <dd>{sheet.time || "—"}</dd>
                </div>
                <div>
                  <dt>
                    <Icon name="sheet" size={13} /> Sistema
                  </dt>
                  <dd>{sheet.system}</dd>
                </div>
              </dl>
              <HpBar hp={sheet.hp} hpMax={sheet.hpMax} />
            </div>

            <div className="side-card">
              <span className="eyebrow">ATALHOS QUE JÁ FUNCIONAM</span>
              <div className="side-chips">
                {["/aventura", "/mundo", "/npc", "/monstro", "/item", "/encontro", "/regras", "/oraculo"].map((chip) => (
                  <button type="button" key={chip} className="chip mono" onClick={() => send(chip === "/oraculo" ? "/sim isso dá certo?" : chip)}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {sheet.clocks.length > 0 && (
              <div className="side-card">
                <span className="eyebrow">RELÓGIOS CORRENDO</span>
                <div className="side-clocks">
                  {sheet.clocks.map((clock) => (
                    <Clock
                      key={clock.id}
                      name={clock.name}
                      filled={clock.filled}
                      size={clock.size}
                      compact
                      onChange={(filled) => onClock(clock.name, filled)}
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="thread">
          {messages.map((message, index) => (
            <article
              className={`turn turn-${message.role}`}
              key={message.id}
              style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
            >
              {message.role === "assistant" ? (
                <>
                  <div className="turn-face">
                    <span className="face-seal">
                      <Icon name="spark" size={15} />
                    </span>
                    <span className="face-name">{message.face ? FACES[message.face] : "Mestre"}</span>
                    <time className="mono">
                      {new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </div>
                  <div className="turn-paper">
                    <BlockView blocks={message.blocks} onChoice={send} />
                    <button type="button" className="turn-copy" onClick={() => void copy(message)}>
                      <Icon name={copiedId === message.id ? "check" : "copy"} size={13} />
                      <span>{copiedId === message.id ? "copiado" : "copiar"}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="turn-slip">
                  <BlockView blocks={message.blocks} />
                </div>
              )}
            </article>
          ))}

          {busy && (
            <div className="turn turn-assistant" aria-live="polite">
              <div className="turn-face">
                <span className="face-seal">
                  <Icon name="spark" size={15} />
                </span>
                <span className="face-name">pensando</span>
              </div>
              <div className="turn-paper thinking">
                <span className="pip" />
                <span className="pip" />
                <span className="pip" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          send(composer);
        }}
      >
        <div className="composer-chips">
          {QUICK_CHIPS.map((chip) => (
            <button type="button" key={chip} className="chip mono" onClick={() => send(chip)}>
              {chip}
            </button>
          ))}
        </div>
        <div className="composer-box">
          <textarea
            ref={inputRef}
            rows={1}
            value={composer}
            placeholder="Descreva a ação do seu personagem ou use um atalho…"
            aria-label="Mensagem para a mesa"
            onChange={(event) => setComposer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send(composer);
              }
            }}
          />
          <div className="composer-row">
            <span className="composer-hint">
              <kbd>Enter</kbd> envia · <kbd>Shift</kbd>+<kbd>Enter</kbd> quebra linha
            </span>
            <button type="submit" className="send" disabled={!composer.trim() || busy} aria-label="Enviar">
              <Icon name="send" size={17} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
