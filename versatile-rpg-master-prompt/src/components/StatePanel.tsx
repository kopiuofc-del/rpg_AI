import { Icon } from "./Icon";
import { Clock, HpBar, RollCard } from "./ui";
import type { DiceRoll } from "../lib/dice";
import type { Sheet, ViewId } from "../lib/state";

export function StatePanel({
  sheet,
  lastRoll,
  onClock,
  onNavigate,
}: {
  sheet: Sheet;
  lastRoll?: DiceRoll;
  onClock: (name: string, filled: number) => void;
  onNavigate: (view: ViewId) => void;
}) {
  const openQuests = sheet.quests.filter((quest) => !quest.done);
  const runningClocks = sheet.clocks.filter((clock) => clock.filled < clock.size);

  return (
    <aside className="state-rail">
      <div className="rail-block">
        <span className="eyebrow">CENA</span>
        <p className="rail-place">
          <Icon name="pin" size={14} />
          {sheet.location || "lugar não estabelecido"}
        </p>
        <p className="rail-time">
          <Icon name="clock" size={14} />
          {sheet.time || "hora não estabelecida"}
        </p>
        <button type="button" className="link-button" onClick={() => onNavigate("ficha")}>
          <Icon name="sheet" size={13} />
          <span>editar ficha</span>
        </button>
      </div>

      <div className="rail-block">
        <HpBar hp={sheet.hp} hpMax={sheet.hpMax} />
        <div className="rail-mini">
          <span>
            <Icon name="shield" size={13} />
            defesa <em className="mono">{sheet.defense}</em>
          </span>
          <span>
            <Icon name="pack" size={13} />
            itens <em className="mono">{sheet.inventory.length}</em>
          </span>
        </div>
      </div>

      <div className="rail-block">
        <span className="eyebrow">RELÓGIOS · {runningClocks.length} ativo(s)</span>
        {sheet.clocks.length > 0 ? (
          <div className="rail-clocks">
            {sheet.clocks.slice(0, 3).map((clock) => (
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
        ) : (
          <p className="rail-empty">Nada correndo contra você. Ainda.</p>
        )}
      </div>

      <div className="rail-block">
        <span className="eyebrow">MISSÕES · {openQuests.length}</span>
        {openQuests.length > 0 ? (
          <ul className="rail-quests">
            {openQuests.slice(0, 4).map((quest) => (
              <li key={quest.id}>
                <span className="quest-mark" />
                {quest.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rail-empty">Nenhum objetivo aberto.</p>
        )}
      </div>

      {lastRoll && (
        <div className="rail-block">
          <span className="eyebrow">ÚLTIMA ROLAGEM</span>
          <RollCard roll={lastRoll} compact />
          <button type="button" className="link-button" onClick={() => onNavigate("dados")}>
            <Icon name="dice" size={13} />
            <span>abrir bandeja</span>
          </button>
        </div>
      )}
    </aside>
  );
}
