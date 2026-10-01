import { useState } from "react";
import { Icon } from "../components/Icon";
import { PanelHead, Reveal } from "../components/ui";
import {
  DEFAULT_CONFIG,
  DEFAULT_MODULES,
  MODULES,
  PRESETS,
  SLIDERS,
  applyModules,
  applyPreset,
  describeConfig,
  type Config,
  type Modules,
  type Preset,
  type SliderId,
} from "../lib/config";

export type Snapshot = {
  id: string;
  label: string;
  createdAt: number;
  payload: string;
};

type Props = {
  config: Config;
  modules: Modules;
  presetId: string | null;
  profiles: { id: string; name: string; values: Config; modules: Modules }[];
  snapshots: Snapshot[];
  onConfig: (changes: Partial<Config>) => void;
  onModules: (changes: Partial<Modules>) => void;
  onPreset: (preset: Preset) => void;
  onSaveProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
  onActivateProfile: (id: string) => void;
  onSnapshot: () => void;
  onRestore: (id: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onCommand: (text: string) => void;
};

function Slider({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: SliderId;
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const tone = value >= 70 ? "high" : value <= 32 ? "low" : "mid";
  return (
    <div className={`slider slider-${tone}`}>
      <div className="slider-head">
        <label htmlFor={`slider-${id}`}>{label}</label>
        <output className="mono">{value}</output>
      </div>
      <input
        id={`slider-${id}`}
        type="range"
        min={0}
        max={100}
        step={2}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ ["--fill" as string]: `${value}%` }}
      />
      <span className="slider-hint">{hint}</span>
    </div>
  );
}

export function ConfigView({
  config,
  modules,
  presetId,
  profiles,
  snapshots,
  onConfig,
  onModules,
  onPreset,
  onSaveProfile,
  onDeleteProfile,
  onActivateProfile,
  onSnapshot,
  onRestore,
  onDeleteSnapshot,
  onCommand,
}: Props) {
  const [profileName, setProfileName] = useState("");
  const [resetAsk, setResetAsk] = useState(false);

  return (
    <div className="view view-config">
      <header className="view-head">
        <div className="view-head-text">
          <span className="eyebrow">PERSONALIZAÇÃO</span>
          <h1>Ajustar a mesa</h1>
        </div>
        <p className="view-head-note">
          Nada aqui reescreve o pedido: muda só o parâmetro necessário. Configuração vale para esta mesa e fica salva
          no navegador.
        </p>
      </header>

      <div className="config-grid">
        <Reveal className="span-7">
          <section className="panel">
            <PanelHead
              eyebrow="SLIDERS"
              title="Treze escalas"
              icon="target"
              action={
                resetAsk ? (
                  <span className="confirm-row">
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => {
                        onConfig(DEFAULT_CONFIG);
                        onModules(DEFAULT_MODULES);
                        setResetAsk(false);
                      }}
                    >
                      confirmar
                    </button>
                    <button type="button" className="ghost-button" onClick={() => setResetAsk(false)}>
                      não
                    </button>
                  </span>
                ) : (
                  <button type="button" className="ghost-button" onClick={() => setResetAsk(true)}>
                    <Icon name="rotate" size={14} />
                    <span>padrão</span>
                  </button>
                )
              }
            />
            <div className="panel-body slider-body">
              {SLIDERS.map((slider) => (
                <Slider
                  key={slider.id}
                  id={slider.id}
                  label={slider.label}
                  hint={slider.hint}
                  value={config[slider.id]}
                  onChange={(value) => onConfig({ [slider.id]: value } as Partial<Config>)}
                />
              ))}
            </div>
          </section>
        </Reveal>

        <div className="span-5 stack">
          <Reveal>
            <section className="panel">
              <PanelHead
                eyebrow="PRESETS"
                title="Perfis prontos"
                icon="spark"
                action={<em className="count mono">{PRESETS.length}</em>}
              />
              <div className="panel-body preset-body">
                {PRESETS.map((preset) => {
                  const active = preset.id === presetId;
                  return (
                    <div className={`preset ${active ? "preset-active" : ""}`} key={preset.id}>
                      <button
                        type="button"
                        className="preset-apply"
                        onClick={() => {
                          onPreset(preset);
                          onCommand(`preset ${preset.id}`);
                        }}
                      >
                        <span className="preset-emoji">{preset.emoji}</span>
                        <span className="preset-copy">
                          <strong>{preset.name}</strong>
                          <small>{preset.description}</small>
                        </span>
                        {active && <Icon name="check" size={15} />}
                      </button>
                      <div className="preset-bars">
                        {Object.entries(preset.values)
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <span className="preset-bar" key={key} title={key}>
                              <span style={{ width: `${value}%` }} />
                            </span>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </Reveal>

          <Reveal delay={70}>
            <section className="panel">
              <PanelHead eyebrow="MÓDULOS" title="Arsenal" icon="shield" />
              <div className="panel-body module-body">
                {MODULES.map((module) => (
                  <button
                    type="button"
                    key={module.id}
                    className={`module ${modules[module.id] ? "module-on" : ""}`}
                    onClick={() => onModules({ [module.id]: !modules[module.id] } as Partial<Modules>)}
                    aria-pressed={modules[module.id]}
                  >
                    <span className="module-dot" />
                    <span className="module-copy">
                      <strong>{module.label}</strong>
                      <small>{module.hint}</small>
                    </span>
                    <em className="mono">{modules[module.id] ? "on" : "off"}</em>
                  </button>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={110}>
            <section className="panel">
              <PanelHead eyebrow="PERFIL PRÓPRIO" title="Salvar combinação" icon="sheet" />
              <div className="panel-body">
                <form
                  className="inline-add"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!profileName.trim()) return;
                    onSaveProfile(profileName.trim());
                    setProfileName("");
                  }}
                >
                  <input
                    className="field-input"
                    value={profileName}
                    placeholder="Nome do seu preset"
                    onChange={(event) => setProfileName(event.target.value)}
                    aria-label="Nome do preset"
                  />
                  <button type="submit" className="solid-button" disabled={!profileName.trim()}>
                    <Icon name="plus" size={15} />
                    <span>Salvar</span>
                  </button>
                </form>

                {profiles.length > 0 ? (
                  <ul className="profile-list">
                    {profiles.map((profile) => (
                      <li key={profile.id}>
                        <button type="button" className="profile-use" onClick={() => onActivateProfile(profile.id)}>
                          <strong>{profile.name}</strong>
                          <small className="mono">
                            imer {profile.values.imersao} · dif {profile.values.dificuldade} · var {profile.values.variedade}
                          </small>
                        </button>
                        <button
                          type="button"
                          className="danger-ghost"
                          aria-label={`Excluir ${profile.name}`}
                          onClick={() => onDeleteProfile(profile.id)}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="panel-note">
                    Ajuste os sliders, dê um nome e salve. Depois é um clique — sem reescrever nada.
                  </p>
                )}
              </div>
            </section>
          </Reveal>
        </div>

        <Reveal className="span-6" delay={60}>
          <section className="panel">
            <PanelHead
              eyebrow="CHECKPOINT"
              title="Estado da mesa"
              icon="scroll"
              action={
                <button type="button" className="solid-button" onClick={onSnapshot}>
                  <Icon name="plus" size={14} />
                  <span>Criar checkpoint</span>
                </button>
              }
            />
            <div className="panel-body">
              {snapshots.length > 0 ? (
                <ul className="snapshot-list">
                  {snapshots.map((snapshot) => (
                    <li key={snapshot.id}>
                      <span className="snapshot-copy">
                        <strong>{snapshot.label}</strong>
                        <small className="mono">
                          {new Date(snapshot.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </span>
                      <button type="button" className="ghost-button" onClick={() => onRestore(snapshot.id)}>
                        <Icon name="rotate" size={14} />
                        <span>Restaurar</span>
                      </button>
                      <button type="button" className="danger-ghost" aria-label="Excluir checkpoint" onClick={() => onDeleteSnapshot(snapshot.id)}>
                        <Icon name="trash" size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="panel-note">
                  Checkpoint guarda ficha, elenco, sessões e configuração deste instante. Restaurar volta exatamente para
                  o que foi gravado — nada além disso.
                </p>
              )}
            </div>
          </section>
        </Reveal>

        <Reveal className="span-6" delay={100}>
          <section className="panel">
            <PanelHead eyebrow="LEITURA ATUAL" title="O que o motor recebe" icon="eye" />
            <div className="panel-body">
              <dl className="block-kv config-readout">
                {describeConfig(config).map((row) => (
                  <div key={row.k}>
                    <dt>{row.k}</dt>
                    <dd>{row.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="panel-note">
                Módulos ligados: <strong>{MODULES.filter((module) => modules[module.id]).map((m) => m.label).join(", ")}</strong>.
                Desligado, o módulo não é introduzido.
              </p>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}

export function presetValues(preset: Preset, base: Config): Config {
  return applyPreset(base, preset);
}

export function presetModules(preset: Preset, base: Modules): Modules {
  return applyModules(base, preset);
}
