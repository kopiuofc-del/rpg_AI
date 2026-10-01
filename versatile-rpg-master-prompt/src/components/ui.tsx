import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { criticalState, describeRoll, type DiceRoll } from "../lib/dice";
import type { Block } from "../lib/state";

/* ------------------------------ hooks ------------------------------ */

export function useCountUp(target: number, duration = 480, start?: number): number {
  const initial = start ?? target;
  const [value, setValue] = useState(initial);
  const frame = useRef<number | null>(null);
  const from = useRef(initial);

  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    const delta = target - initial;

    if (delta === 0) return;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(initial + delta * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        from.current = target;
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      from.current = target;
    };
  }, [target, duration]);

  return value;
}

export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ------------------------------ atoms ------------------------------ */

export function PanelHead({
  eyebrow,
  title,
  icon,
  action,
}: {
  eyebrow?: string;
  title: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <header className="panel-head">
      <div className="panel-head-text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>
          {icon && <Icon name={icon} size={17} />}
          {title}
        </h2>
      </div>
      {action}
    </header>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
  as,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  as?: "input" | "textarea";
}) {
  const id = `field-${label.replace(/\s+/g, "-").toLocaleLowerCase("pt-BR")}`;
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      {as === "textarea" ? (
        <textarea
          id={id}
          rows={2}
          className={mono ? "field-input mono" : "field-input"}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          className={mono ? "field-input mono" : "field-input"}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const clamp = (next: number) => Math.min(Math.max(next, min), max);
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button type="button" onClick={() => onChange(clamp(value - step))} aria-label={`Diminuir ${label}`}>
          <Icon name="close" size={12} />
        </button>
        <output className="stepper-value mono">{value}</output>
        <button type="button" onClick={() => onChange(clamp(value + step))} aria-label={`Aumentar ${label}`}>
          <Icon name="plus" size={12} />
        </button>
      </div>
    </div>
  );
}

export function Chip({
  children,
  onClick,
  active,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button type="button" className={`chip ${active ? "chip-active" : ""}`} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

/* ------------------------------ mesa ------------------------------ */

function polar(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, radius: number, start: number, end: number) {
  const from = polar(cx, cy, radius, start);
  const to = polar(cx, cy, radius, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

export function Clock({
  name,
  filled,
  size,
  onChange,
  compact,
}: {
  name: string;
  filled: number;
  size: number;
  onChange?: (filled: number) => void;
  compact?: boolean;
}) {
  const segments = Math.min(Math.max(size, 2), 12);
  const step = 360 / segments;
  const done = filled >= segments;

  return (
    <div className={`clock ${compact ? "clock-compact" : ""} ${done ? "clock-done" : ""}`}>
      <svg viewBox="0 0 80 80" className="clock-dial" role="img" aria-label={`Relógio ${name}: ${filled} de ${segments}`}>
        <circle cx="40" cy="40" r="30" className="clock-well" />
        {Array.from({ length: segments }, (_, index) => {
          const start = index * step + 3;
          const end = start + step - 6;
          const isFilled = index < filled;
          return (
            <path
              key={index}
              d={arcPath(40, 40, 30, start, end)}
              className={`clock-segment ${isFilled ? "clock-segment-on" : ""}`}
              onClick={onChange ? () => onChange(index === filled - 1 ? index : index + 1) : undefined}
              role={onChange ? "button" : undefined}
              tabIndex={onChange ? 0 : undefined}
              onKeyDown={
                onChange
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onChange(index === filled - 1 ? index : index + 1);
                      }
                    }
                  : undefined
              }
            />
          );
        })}
        <text x="40" y="38" className="clock-count mono">
          {filled}
        </text>
        <text x="40" y="50" className="clock-total mono">
          /{segments}
        </text>
      </svg>
      <div className="clock-meta">
        <strong>{name}</strong>
        <span>{done ? "cheio — a consequência acontece" : `${segments - filled} segmento(s) restantes`}</span>
      </div>
    </div>
  );
}

export function HpBar({ hp, hpMax, onChange }: { hp: number; hpMax: number; onChange?: (hp: number) => void }) {
  const ratio = hpMax > 0 ? hp / hpMax : 0;
  const animated = useCountUp(hp);
  const tone = ratio <= 0.25 ? "hp-critical" : ratio <= 0.6 ? "hp-warn" : "hp-ok";

  return (
    <div className={`hp ${tone}`} key={`hp-${hp}`}>
      <div className="hp-head">
        <Icon name="heart" size={14} />
        <span className="hp-label">Pontos de vida</span>
        <span className="hp-value mono">
          {animated}
          <em>/{hpMax}</em>
        </span>
      </div>
      <div className="hp-track">
        <span className="hp-fill" style={{ width: `${Math.max(ratio, 0.02) * 100}%` }} />
        <span className="hp-ghost" />
      </div>
      {onChange && (
        <div className="hp-quick">
          <button type="button" onClick={() => onChange(Math.max(hp - 1, 0))}>
            −1
          </button>
          <button type="button" onClick={() => onChange(Math.max(hp - 5, 0))}>
            −5
          </button>
          <button type="button" onClick={() => onChange(Math.min(hp + 1, hpMax))}>
            +1
          </button>
          <button type="button" onClick={() => onChange(hpMax)}>
            completo
          </button>
        </div>
      )}
    </div>
  );
}

export function RollCard({ roll, compact }: { roll: DiceRoll; compact?: boolean }) {
  const critical = criticalState(roll);
  const shown = useCountUp(roll.total, 620, 0);

  return (
    <div className={`roll-card ${critical ?? ""} ${compact ? "roll-compact" : ""}`}>
      <div className="roll-top">
        <span className="roll-label-text">{roll.label}</span>
        <span className="roll-formula mono">{roll.formula}</span>
      </div>
      <div className="roll-body">
        <span className="roll-total mono">{shown}</span>
        <div className="roll-dice">
          {roll.rolls.map((value, index) => {
            const best = Math.max(...roll.rolls);
            const worst = Math.min(...roll.rolls);
            return (
              <span
                key={`${roll.id}-${index}`}
                className={`die mono ${value === best && roll.rolls.length > 1 ? "die-best" : ""} ${
                  value === worst && roll.rolls.length > 1 ? "die-worst" : ""
                }`}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                {value}
              </span>
            );
          })}
          {roll.dropped.map((value, index) => (
            <span key={`drop-${index}`} className="die die-dropped mono">
              {value}
            </span>
          ))}
          {roll.modifier !== 0 && (
            <span className="die die-modifier mono">
              {roll.modifier > 0 ? "+" : "−"}
              {Math.abs(roll.modifier)}
            </span>
          )}
        </div>
      </div>
      {critical && (
        <p className="roll-flag">{critical === "critico" ? "Natural 20 — sucesso com algo a mais" : "Natural 1 — falha com consequência"}</p>
      )}
    </div>
  );
}

export function BlockView({ blocks, onChoice }: { blocks: Block[]; onChoice?: (text: string) => void }) {
  return (
    <div className="blocks">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "heading":
            return (
              <h3 key={index} className={`block-heading tone-${block.tone ?? "brass"}`}>
                {block.text}
              </h3>
            );
          case "text":
            return (
              <p key={index} className="block-text">
                {block.text}
              </p>
            );
          case "note":
            return (
              <p key={index} className="block-note">
                {block.text}
              </p>
            );
          case "list":
            return block.ordered ? (
              <ol key={index} className="block-list">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <span className="list-index mono">{String(itemIndex + 1).padStart(2, "0")}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={index} className="block-list">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <span className="list-bullet" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "kv":
            return (
              <dl key={index} className="block-kv">
                {block.rows.map((row, rowIndex) => (
                  <div key={rowIndex}>
                    <dt>{row.k}</dt>
                    <dd>{row.v}</dd>
                  </div>
                ))}
              </dl>
            );
          case "roll":
            return <RollCard key={index} roll={block.roll} />;
          case "clock":
            return <Clock key={index} name={block.name} filled={block.filled} size={block.size} compact />;
          case "choices":
            return (
              <div key={index} className="block-choices">
                {block.items.map((item, itemIndex) => (
                  <button key={itemIndex} type="button" className="choice" onClick={() => onChoice?.(item)}>
                    <span className="choice-index mono">{itemIndex + 1}</span>
                    <span>{item}</span>
                    <Icon name="arrow" size={14} />
                  </button>
                ))}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case "heading":
          return `# ${block.text}`;
        case "text":
        case "note":
          return block.text;
        case "list":
          return block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : "-"} ${item}`).join("\n");
        case "kv":
          return block.rows.map((row) => `${row.k}: ${row.v}`).join("\n");
        case "roll":
          return describeRoll(block.roll);
        case "clock":
          return `Relógio: ${block.name} — ${block.filled}/${block.size}`;
        case "choices":
          return block.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}
