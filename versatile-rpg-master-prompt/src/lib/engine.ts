import { criticalState, parseDiceFormula, rollDice, type DiceRoll } from "./dice";
import { EVENTS_TABLE, ODDS, type Block, type FaceId, type Message, type Npc, type Sheet } from "./state";
import { uid } from "./dice";
import {
  activeModules,
  chooseOptions,
  describeConfig,
  outcomeLadder,
  type Config,
  type Modules,
  type OptionPath,
} from "./config";
import { threatLabel, renownStars, type Faction, type Bestiary, type BoardQuest, type World } from "./world";

export type Patch =
  | { op: "sheet"; changes: Partial<Sheet> }
  | { op: "hp"; delta: number }
  | { op: "inventory-add"; item: string }
  | { op: "inventory-remove"; item: string }
  | { op: "clock-upsert"; name: string; filled?: number; size?: number }
  | { op: "clock-advance"; by: number; name?: string }
  | { op: "quest-add"; text: string }
  | { op: "note-add"; text: string }
  | { op: "npc-reveal"; id: string }
  | { op: "roll-log"; roll: DiceRoll };

export type EngineResult = {
  face: FaceId;
  blocks: Block[];
  patches: Patch[];
};

export type EngineContext = {
  sheet: Sheet;
  npcs: Npc[];
  history: Message[];
  config: Config;
  modules: Modules;
  world: World;
};

export type TableApi = {
  sheet: Sheet;
  npcs: Npc[];
  rollHistory: DiceRoll[];
  patch: (patches: Patch | Patch[]) => void;
  setSheet: (changes: Partial<Sheet>) => void;
};

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function hasScene(sheet: Sheet): boolean {
  return Boolean(sheet.location.trim() || sheet.clocks.length > 0 || sheet.quests.length > 0);
}

function npcByName(npcs: Npc[], name: string): Npc | undefined {
  const needle = name.trim().toLocaleLowerCase("pt-BR");
  if (!needle) return undefined;
  return npcs.find((npc) => npc.name.toLocaleLowerCase("pt-BR").includes(needle));
}

function npcBlock(npc: Npc): Block[] {
  const rows: { k: string; v: string }[] = [
    { k: "Papel", v: npc.role },
    { k: "Personalidade", v: npc.personality },
    { k: "Objetivo", v: npc.goal },
    { k: "Medo", v: npc.fear },
    { k: "Voz", v: npc.voice },
  ];
  if (npc.revealed) rows.push({ k: "Segredo", v: npc.secret });

  return [
    { kind: "heading", text: npc.name, tone: "brass" },
    { kind: "kv", rows },
    ...(npc.revealed
      ? []
      : ([
          {
            kind: "note",
            text: "Segredo ainda não revelado nesta mesa. Abra a aba Elenco para virar a carta — ou descubra em jogo.",
          },
        ] as Block[])),
  ];
}

function optionBlocks(paths: OptionPath[]): Block[] {
  return [
    { kind: "heading", text: "Caminhos possíveis", tone: "verd" },
    {
      kind: "kv",
      rows: paths.map((path) => ({
        k: path.tag,
        v: `${path.label} — ganha ${path.gain}; paga com ${path.cost}.`,
      })),
    },
    { kind: "note", text: "Nenhuma opção é “a certa”: cada uma muda o que o mundo cobra depois." },
  ];
}

function factionCard(faction: Faction): Block[] {
  const rows: { k: string; v: string }[] = [
    { k: "Ideologia", v: faction.ideology },
    { k: "Objetivo", v: faction.goal },
    { k: "Recursos", v: faction.resources },
    { k: "Aliados", v: faction.allies },
    { k: "Rivais", v: faction.rivals },
    { k: "Influência", v: `${faction.influence}/100` },
    { k: "Relação", v: faction.standing },
  ];
  if (faction.revealed) rows.push({ k: "Segredo", v: faction.secret });

  return [
    { kind: "heading", text: faction.name, tone: faction.standing === "inimiga" ? "coral" : "brass" },
    { kind: "kv", rows },
    { kind: "clock", name: faction.clock.name, filled: faction.clock.filled, size: faction.clock.size },
    ...(faction.revealed
      ? []
      : ([{ kind: "note", text: "Segredo ainda selado. Abra o Codex para virar a carta — ou descubra em jogo." }] as Block[])),
  ];
}

function beastCard(beast: Bestiary): Block[] {
  return [
    { kind: "heading", text: beast.name, tone: "coral" },
    {
      kind: "kv",
      rows: [
        { k: "Espécie", v: beast.species },
        { k: "Habitat", v: beast.habitat },
        { k: "Comportamento", v: beast.behavior },
        { k: "Inteligência", v: beast.intelligence },
        { k: "Habilidades", v: beast.abilities },
        { k: "Fraqueza", v: beast.weakness },
        { k: "Ameaça", v: `${beast.threat}/10` },
      ],
    },
    { kind: "note", text: "Fraqueza é ficcional e depende de descoberta em jogo — não de rolagem de conhecimento." },
  ];
}

function questBoard(quests: BoardQuest[]): Block[] {
  const blocks: Block[] = [{ kind: "heading", text: "Quest board", tone: "verd" }];
  for (const tier of ["principal", "secundaria", "oculta"] as const) {
    const list = quests.filter((quest) => quest.tier === tier);
    if (list.length === 0) continue;
    blocks.push({ kind: "heading", text: tier === "secundaria" ? "Secundárias" : tier === "oculta" ? "Ocultas" : "Principal" });
    blocks.push({
      kind: "list",
      items: list.map((quest) =>
        quest.discovered
          ? `${quest.objective} — recompensa: ${quest.reward} (contratante: ${quest.patron}, risco ${quest.risk}/5)`
          : "Requisito desconhecido — esta missão ainda não foi descoberta.",
      ),
    });
  }
  if (blocks.length === 1) blocks.push({ kind: "note", text: "Nenhuma missão no board." });
  return blocks;
}

function worldState(world: World, sheet: Sheet): Block[] {
  return [
    { kind: "heading", text: "World state", tone: "verd" },
    {
      kind: "kv",
      rows: [
        { k: "Mundo", v: world.name || "sem nome" },
        { k: "Era", v: world.era || "não definida" },
        { k: "Clima", v: world.climate || "não definido" },
        { k: "Local atual", v: sheet.location || "não estabelecido" },
        { k: "Ameaça", v: `${world.threat}/10 — ${threatLabel(world.threat)}` },
        { k: "Renome", v: `${world.renown} — ${renownStars(world.renown)}` },
        { k: "Facções", v: `${world.factions.length} registradas` },
        { k: "Segredos", v: `${world.factions.filter((f) => !f.revealed).length} ainda selados` },
      ],
    },
    ...(world.recent.length > 0
      ? ([{ kind: "heading", text: "Mudanças recentes" }, { kind: "list", items: world.recent.slice(0, 5) }] as Block[])
      : []),
  ];
}

function statusBlocks(sheet: Sheet): Block[] {
  const blocks: Block[] = [
    { kind: "heading", text: "Ficha de estado", tone: "verd" },
    {
      kind: "kv",
      rows: [
        { k: "Personagem", v: sheet.name || "ainda sem nome" },
        { k: "Conceito", v: sheet.concept || "—" },
        { k: "Sistema", v: sheet.system },
        { k: "PV", v: `${sheet.hp}/${sheet.hpMax}` },
        { k: "Defesa", v: String(sheet.defense) },
        { k: "Local", v: sheet.location || "não estabelecido" },
        { k: "Data / hora", v: sheet.time || "não estabelecida" },
        { k: "Reputação", v: sheet.reputation },
      ],
    },
  ];

  if (sheet.inventory.length > 0) {
    blocks.push({ kind: "heading", text: "Recursos e inventário" });
    blocks.push({ kind: "list", items: sheet.inventory });
  } else {
    blocks.push({ kind: "note", text: "Inventário vazio. Use /pegar <item> para registrar o que carrega." });
  }

  if (sheet.clocks.length > 0) {
    blocks.push({ kind: "heading", text: "Relógios" });
    for (const clock of sheet.clocks) {
      blocks.push({ kind: "clock", name: clock.name, filled: clock.filled, size: clock.size });
    }
  }

  if (sheet.quests.length > 0) {
    blocks.push({ kind: "heading", text: "Missões" });
    blocks.push({
      kind: "list",
      items: sheet.quests.map((quest) => `${quest.done ? "[concluída]" : "[aberta]"} ${quest.text}`),
    });
  }

  return blocks;
}

function summarize(history: Message[]): Block[] {
  const userLines = history
    .filter((message) => message.role === "user")
    .map((message) => message.blocks.filter((block) => block.kind === "text").map((block) => (block as { text: string }).text).join(" "))
    .filter(Boolean);

  if (userLines.length === 0) {
    return [
      { kind: "heading", text: "Resumo da sessão", tone: "verd" },
      { kind: "note", text: "Ainda não há decisões registradas. Comece com /mestre ou descreva o que seu personagem faz." },
    ];
  }

  const decisions = userLines.filter((line) => !line.startsWith("/"));
  const commands = userLines.filter((line) => line.startsWith("/"));

  return [
    { kind: "heading", text: "Resumo da sessão", tone: "verd" },
    {
      kind: "list",
      items: decisions.length > 0 ? decisions.slice(-8) : ["Nenhuma decisão narrativa registrada até aqui."],
    },
    {
      kind: "note",
      text:
        commands.length > 0
          ? `${commands.length} comando(s) usados nesta sessão: ${commands.slice(-5).join(", ")}.`
          : "Nenhum comando usado nesta sessão.",
    },
  ];
}

function oddsAnswer(question: string): EngineResult {
  const roll = rollDice({ faces: 100, count: 1, modifier: 0, mode: "normal", label: question || "Oráculo" });
  const odds = ODDS[3];
  const yes = roll.total >= 100 - odds.target + 1;
  const margin = Math.abs(roll.total - 50);
  const strong = margin >= 30;

  const verdict = yes
    ? strong
      ? "Sim, e… — o resultado vem melhor do que o esperado, com um gancho extra a favor."
      : "Sim — acontece como você perguntou, sem bônus adicional."
    : strong
      ? "Não, e… — além de não acontecer, algo pior se move por causa da tentativa."
      : "Não, porém… — não acontece, mas fica uma porta entreaberta ou uma pista no caminho.";

  return {
    face: "oraculo",
    blocks: [
      { kind: "heading", text: question ? `“${question}”` : "Pergunta ao oráculo", tone: "verd" },
      { kind: "roll", roll },
      { kind: "text", text: `${verdict} (chance usada: ${odds.label}, ${odds.target}%.)` },
      {
        kind: "note",
        text: "Para mudar a probabilidade, abra a aba Oráculo e escolha outra chance antes de rolar.",
      },
    ],
    patches: [{ op: "roll-log", roll }],
  };
}

function sceneBeat(context: EngineContext): EngineResult {
  const { sheet, npcs, config, modules } = context;
  const patches: Patch[] = [];

  if (config.caos >= 55 && sheet.clocks.length > 1) {
    patches.push({ op: "clock-advance", by: 1 });
  }

  if (!hasScene(sheet)) {
    return {
      face: "mestre",
      blocks: [
        { kind: "heading", text: "Antes da próxima cena", tone: "brass" },
        {
          kind: "text",
          text: "Não há cena aberta nesta mesa: sem local, sem relógios e sem missões registradas. Posso abrir uma agora ou você pode descrever onde seu personagem está.",
        },
        {
          kind: "choices",
          items: ["/aventura", "/mundo", "Quero começar uma aventura e ser surpreendido"],
        },
      ],
      patches,
    };
  }

  const npc = npcs.length > 0 ? pick(npcs) : undefined;
  const clock = sheet.clocks.length > 0 ? pick(sheet.clocks) : undefined;
  const place = sheet.location || "o lugar onde vocês estão";

  const beats = [
    `Em ${place}, o ritmo muda antes de qualquer aviso: duas pessoas param de conversar ao mesmo tempo e olham para o mesmo ponto fora do seu campo de visão.`,
    `O ar em ${place} fica mais denso. Alguém arrasta um móvel no andar de cima — ou embaixo — e o som para no meio, como se quem arrastou tivesse decidido não terminar.`,
    `Chega a ${place} um recado dobrado em quatro. O papel está seco, mas o mensageiro não: ele atravessou água há pouco tempo e não quer dizer onde.`,
    `Em ${place}, uma fila que não existia começa a se formar. Ninguém explica o que está sendo distribuído, e as pessoas não querem ser as últimas.`,
    `A luz de ${place} cai um degrau. Um objeto pequeno muda de lugar sem motivo — o suficiente para você ter certeza de que não foi você.`,
  ];

  const npcBeat = npc
    ? `${npc.name} aparece no vão da porta. ${npc.voice} O que ${npc.name.split(" ")[0]} quer aqui não é o que ${npc.name.split(" ")[0]} veio buscar.`
    : "Ninguém conhecido aparece — e essa ausência também é informação.";

  if (clock && clock.filled < clock.size) {
    patches.push({ op: "clock-advance", by: 1, name: clock.name });
  }

  const roll = rollDice({ faces: 20, count: 1, modifier: 0, mode: "normal", label: "Percepção do ambiente" });
  patches.push({ op: "roll-log", roll });
  const critical = criticalState(roll);

  return {
    face: "mestre",
    blocks: [
      { kind: "text", text: pick(beats) },
      { kind: "text", text: npcBeat },
      ...(clock && clock.filled < clock.size
        ? ([{ kind: "clock", name: clock.name, filled: clock.filled + 1, size: clock.size }] as Block[])
        : []),
      { kind: "roll", roll },
      { kind: "note", text: "Rolagem do ambiente: o que a cena entrega de graça antes da sua decisão." },
      {
        kind: "text",
        text:
          critical === "critico"
            ? "Natural 20: você percebe o detalhe que ninguém mais viu, e ele não pode ser desfeito."
            : critical === "desastre"
              ? "Natural 1: você percebe algo errado — e a sua reação deixa claro para os outros que percebeu."
              : roll.total >= 12
                ? "Resultado suficiente para notar uma inconsistência, mas não para entender de onde ela vem."
                : "Resultado curto: a cena continua sem te entregar nada de útil.",
      },
      ...(config.imersao >= 62 && modules.narrativa
        ? ([
            {
              kind: "text",
              text:
                config.humor >= 60
                  ? "Detalhe que ninguém pediu, mas que conta a história toda: alguém ali consertou a própria bota com arame e orgulho."
                  : "O cheiro é o detalhe que fica: óleo queimado, papel molhado e o adocicado de fruta que passou do ponto.",
            },
          ] as Block[])
        : []),
      ...(config.detalhamento >= 70
        ? ([
            {
              kind: "kv",
              rows: [
                { k: "Observável", v: "quem entra e quem sai, e com que pressa" },
                { k: "Audível", v: "a conversa que abaixa quando você passa" },
                { k: "Ausente", v: "algo que deveria estar aqui e não está" },
              ],
            },
          ] as Block[])
        : []),
      { kind: "heading", text: "Caminhos possíveis", tone: "verd" },
      {
        kind: "kv",
        rows: chooseOptions(config.variedade).map((path) => ({
          k: path.tag,
          v: `${path.label} — ganha ${path.gain}; paga com ${path.cost}.`,
        })),
      },
      {
        kind: "note",
        text:
          config.agencia >= 80
            ? "Nada aqui limita você: qualquer outra ação é válida e eu resolvo com coerência."
            : "O mundo avança sozinho entre suas decisões. Relógios cheios produzem consequências.",
      },
    ],
    patches,
  };
}

function openSurpriseAdventure(): EngineResult {
  return {
    face: "mestre",
    blocks: [
      { kind: "heading", text: "Porto Candeia — o pedágio das sombras", tone: "brass" },
      {
        kind: "kv",
        rows: [
          { k: "Sistema", v: "narrativo livre (adapte ao seu)" },
          { k: "Tom", v: "fantasia portuária, mistério, perigo moderado" },
          { k: "Local", v: "Cais de Porto Candeia, portão da alfândega" },
          { k: "Hora", v: "Entardecer, maré baixa, cheiro de sal e diesel" },
        ],
      },
      {
        kind: "text",
        text: "Aqui os barcos pagam pedágio ao farol entregando a própria sombra por uma noite. É um imposto antigo, aceito, quase burocrático: ninguém discute, todo mundo dorme mal uma vez por mês.",
      },
      {
        kind: "text",
        text: "Hoje a maré devolveu uma sombra sem dono. Ela veio dobrada dentro de um recibo de cobrança — e o nome no campo “devedor” é o seu. A tabeliã Auristela Prado está fechando o portão e insiste, sem levantar a voz, que ninguém deve tocar no papel.",
      },
      { kind: "clock", name: "Portão da alfândega fecha", filled: 1, size: 4 },
      {
        kind: "choices",
        items: [
          "Pego o recibo antes que o portão feche",
          "Falo com Auristela e deixo o papel onde está",
          "Procuro quem mais viu a maré devolver aquilo",
        ],
      },
      { kind: "note", text: "Seu personagem é seu. Eu controlo o cais, a tabeliã e o que a maré traz." },
    ],
    patches: [
      {
        op: "sheet",
        changes: {
          location: "Cais de Porto Candeia, portão da alfândega",
          time: "Entardecer, maré baixa",
          system: "Narrativo livre",
        },
      },
      { op: "clock-upsert", name: "Portão da alfândega fecha", filled: 1, size: 4 },
      { op: "quest-add", text: "Descobrir por que o recibo do pedágio traz o meu nome" },
      { op: "note-add", text: "Porto Candeia: sombras são cobradas como imposto pelo farol, uma noite por mês." },
    ],
  };
}

function sessionZero(context: EngineContext): EngineResult {
  return {
    face: "mestre",
    blocks: [
      { kind: "heading", text: "Sessão zero — cinco pontos", tone: "verd" },
      {
        kind: "list",
        ordered: true,
        items: [
          "Sistema: D&D 5e, Tormenta20, Ordem Paranormal, FATE, OSR, ou narrativo livre?",
          "Gênero e tom: investigação sombria, aventura heroica, horror, política, estrada?",
          "Dificuldade e letalidade: personagens podem morrer? Recursos são escassos?",
          "Quantos personagens jogam (um, alguns, grupo inteiro)?",
          "Limites de conteúdo: o que fica fora da mesa?",
          ...(context.config.dificuldade >= 70
            ? (["Mesa dura ativa: mesma dificuldade configurada no painel de ajustes."] as string[])
            : []),
        ],
      },
      {
        kind: "text",
        text: "Responda só o que quiser. O que faltar eu assumo e aviso a suposição — ou diga “surpreenda-me” e eu abro a mesa com os padrões: fantasia, tom equilibrado, dificuldade média.",
      },
      { kind: "choices", items: ["Surpreenda-me", "Narrativo livre, investigação sombria, um personagem", "Tormenta20, aventura heroica, grupo de 4"] },
    ],
    patches: [],
  };
}

function rulesReply(text: string): EngineResult {
  const asked = text.replace(/^\/regras\s*/i, "").trim();
  const knownSystem = /d&d|dungeons|pathfinder|tormenta|ordem paranormal|cthulhu|vampiro|gurps|fate|savage|old dragon|3d&t|pbta|dungeon world|knave|shadowdark/i.test(
    text,
  );

  return {
    face: "regras",
    blocks: [
      { kind: "heading", text: asked ? `Dúvida: ${asked}` : "Dúvida de regras", tone: "brass" },
      {
        kind: "text",
        text: knownSystem
          ? "Sistema identificado. Falta a edição — e é ela que muda a resposta. Me diga qual edição e, se possível, a situação da mesa que gerou a dúvida."
          : "Preciso do sistema e da edição antes de responder. Sem isso, qualquer resposta vira mistura de versões.",
      },
      {
        kind: "kv",
        rows: [
          { k: "RAW", v: "o que o texto da regra diz — exige o trecho ou a página; não invento citação." },
          { k: "RAI", v: "a intenção provável por trás da regra — interpretação minha, marcada como tal." },
          { k: "Homebrew", v: "regra da casa — sempre sinalizada, nunca apresentada como oficial." },
        ],
      },
      {
        kind: "note",
        text: "((Esta mesa roda localmente, com regras e tabelas fixas. Ela não consulta livros nem um modelo de linguagem. Se você colar o trecho da regra, eu trabalho a partir dele.))",
      },
      {
        kind: "choices",
        items: ["D&D 5e 2014, dúvida sobre cobertura", "Tormenta20, dúvida sobre ações de movimento", "Ordem Paranormal, dúvida sobre sanidade"],
      },
    ],
    patches: [],
  };
}

function helpBlocks(): Block[] {
  return [
    { kind: "heading", text: "Atalhos da mesa", tone: "verd" },
    {
      kind: "kv",
      rows: [
        { k: "/mestre", v: "abre a sessão zero ou começa a aventura" },
        { k: "/aventura, /mundo", v: "premissas prontas para usar" },
        { k: "/personagem, /npc", v: "conceito de PJ ou NPC completo" },
        { k: "/monstro, /item, /encontro", v: "material de jogo" },
        { k: "/regras <dúvida>", v: "estrutura RAW / RAI / homebrew" },
        { k: "/dado 2d6+3", v: "rola e registra no histórico" },
        { k: "/sim <pergunta>", v: "oráculo de probabilidade" },
        { k: "/giro", v: "o mundo avança sem você" },
        { k: "/status, /resumo", v: "estado atual e continuidade" },
        { k: "/pv -3, /pegar, /gastar", v: "recursos" },
        { k: "/relogio <nome> 2/6", v: "cria ou ajusta um relógio" },
        { k: "/local, /hora", v: "fixa onde e quando a cena acontece" },
        { k: "/missao, /nota", v: "registra objetivo ou pista" },
        { k: "/faccoes, /facao <nome>", v: "facções, ideologia e segredo" },
        { k: "/quests, /bestiario", v: "quest board e criaturas" },
        { k: "/config, /preset <nome>", v: "ajustes e perfis" },
        { k: "/pausa, /voltar", v: "congela e retoma a mesa" },
      ],
    },
    {
      kind: "note",
      text: "((As respostas vêm de regras, tabelas e estado salvos neste navegador — não de um modelo de linguagem. Serve para estruturar e registrar sua mesa; a criação de ficção aberta continua sendo sua, ou de uma IA conectada depois.))",
    },
  ];
}

function worldTurn(context: EngineContext): EngineResult {
  const { sheet, npcs, config, modules } = context;
  if (modules.economia) {
    /* economia ligada: escassez entra na leitura do giro */
  }
  if (sheet.clocks.length === 0) {
    return {
      face: "mestre",
      blocks: [
        { kind: "heading", text: "Giro do mundo", tone: "coral" },
        { kind: "note", text: "Nenhum relógio ativo. Crie um com /relogio <ameaça> 0/6 e o mundo passa a andar sozinho." },
      ],
      patches: [],
    };
  }

  const pending = sheet.clocks.filter((clock) => clock.filled < clock.size);
  const target = pending.length > 0 ? pick(pending) : sheet.clocks[0];
  const event = pick(EVENTS_TABLE);
  const npc = npcs.length > 0 ? pick(npcs) : undefined;
  const completed = target.filled + 1 >= target.size;

  return {
    face: "mestre",
    blocks: [
      { kind: "heading", text: "Giro do mundo", tone: "coral" },
      { kind: "text", text: `Enquanto você decidia outra coisa, ${event.toLocaleLowerCase("pt-BR")}` },
      {
        kind: "text",
        text: npc
          ? `${npc.name} age fora de cena: ${npc.goal.toLocaleLowerCase("pt-BR")}`
          : "Alguém age fora de cena, e você só vai saber quem quando o efeito chegar até você.",
      },
      { kind: "clock", name: target.name, filled: Math.min(target.filled + 1, target.size), size: target.size },
      {
        kind: "text",
        text: completed
          ? `Relógio cheio: ${target.name}. A consequência acontece agora, sem aviso — e o mundo passa a tratar você como parte dela.`
          : `Faltam ${target.size - target.filled - 1} segmento(s) para ${target.name} se concretizar.`,
      },
      ...(config.caos >= 55 && pending.length > 1
        ? ([
            {
              kind: "text",
              text: `Caos em cadeia: um segundo relógio também avançou, porque nada aqui espera a sua decisão.`,
            },
          ] as Block[])
        : []),
      ...(modules.economia
        ? ([{ kind: "note", text: "Economia ativa: escassez muda preço, e preço muda quem apoiaria você." }] as Block[])
        : []),
      { kind: "heading", text: "Caminhos possíveis", tone: "verd" },
      {
        kind: "kv",
        rows: chooseOptions(config.variedade)
          .slice(0, 5)
          .map((path) => ({ k: path.tag, v: `${path.label} — ganha ${path.gain}; paga com ${path.cost}.` })),
      },
    ],
    patches: [
      { op: "clock-advance", by: 1, name: target.name },
      ...(config.caos >= 55 && pending.length > 1 ? ([{ op: "clock-advance", by: 1 }] as Patch[]) : []),
    ],
  };
}

function characterConcept(): EngineResult {
  return {
    face: "criador",
    blocks: [
      { kind: "heading", text: "Conceito: a conferente de marés", tone: "brass" },
      {
        kind: "kv",
        rows: [
          { k: "Conceito", v: "confere cargas no cais e sabe, de cabeça, tudo que entrou e saiu da cidade em dez anos." },
          { k: "Objetivo", v: "provar que um carregamento que oficialmente nunca existiu passou pelas mãos dela." },
          { k: "Contradição", v: "meticulosa com papéis alheios, descuidada com a própria segurança." },
          { k: "Segredo", v: "assinou uma conferência em branco uma única vez, por favor — e ela foi usada." },
          { k: "Vínculo com o grupo", v: "guarda o nome de alguém do grupo numa lista que não deveria existir." },
          { k: "Defeito em jogo", v: "não consegue deixar um documento inconsistente sem verificar, mesmo sob pressão." },
        ],
      },
      {
        kind: "text",
        text: "Diga o sistema e a edição que eu monto a ficha em volta disso — ou peça outra direção: mais combatente, mais investigadora, mais velha, com outro tipo de dívida.",
      },
      { kind: "choices", items: ["Monta a ficha em Tormenta20", "Quero um conceito mais combativo", "Gera outro conceito"] },
    ],
    patches: [],
  };
}

function adventureSeed(): EngineResult {
  return {
    face: "criador",
    blocks: [
      { kind: "heading", text: "A taxa das embarcações vazias", tone: "brass" },
      {
        kind: "kv",
        rows: [
          { k: "Premissa", v: "barcos sem tripulação atracam em Borda d'Água carregados de cartas ainda molhadas; o cartório passa a cobrar imposto dos destinatários." },
          { k: "Gancho", v: "uma carta traz a assinatura de alguém vivo pedindo que o grupo impeça a própria chegada." },
          { k: "Conflito", v: "a escrivã quer ordem; os barqueiros temem que as cartas parem; uma cooperativa queima correspondência antes do registro." },
          { k: "Locais", v: "cartório do cais, ferro-velho de barcos, depósito de sal, farol desativado." },
          { k: "Relógio sugerido", v: "Cooperativa queima o lote inteiro — 0/6" },
          { k: "Se ignorarem", v: "os nomes dos destinatários começam a aparecer nas listas de passageiros dos barcos vazios." },
        ],
      },
      { kind: "clock", name: "Cooperativa queima o lote inteiro", filled: 0, size: 6 },
      { kind: "choices", items: ["Abre essa aventura na mesa", "Quero uma versão mais sombria", "Quero uma aventura no sertão"] },
    ],
    patches: [
      { op: "clock-upsert", name: "Cooperativa queima o lote inteiro", filled: 0, size: 6 },
      { op: "quest-add", text: "Impedir que a carta de Borda d'Água seja registrada" },
    ],
  };
}

function worldSeed(): EngineResult {
  return {
    face: "criador",
    blocks: [
      { kind: "heading", text: "As Ilhas de Dentro", tone: "verd" },
      {
        kind: "kv",
        rows: [
          { k: "Premissa", v: "o arquipélago cresce para dentro: cada ilha nova ocupa o lugar de uma lembrança compartilhada." },
          { k: "Conflito", v: "a companhia de navegação acelera travessias para chegar a uma ilha de minério; os mais antigos já esqueceram quem deu nome ao lugar." },
          { k: "Facções", v: "cartógrafos comunitários, Companhia das Rotas, conselho das marisqueiras (que registram história em cantigas)." },
          { k: "Segredo", v: "uma ilha não desapareceu: foi apagada dos mapas por acordo entre duas famílias que fingem não se conhecer." },
          { k: "Motor da campanha", v: "cada rota escolhida preserva uma memória e põe outra em risco." },
        ],
      },
      { kind: "choices", items: ["Abre essa campanha", "Quero o sertão: A Cobra de Lata", "Detalha as facções"] },
    ],
    patches: [{ op: "note-add", text: "As Ilhas de Dentro: território novo custa memória coletiva." }],
  };
}

function sertaoSeed(): EngineResult {
  return {
    face: "criador",
    blocks: [
      { kind: "heading", text: "A Cobra de Lata", tone: "brass" },
      {
        kind: "kv",
        rows: [
          { k: "Premissa", v: "uma ferrovia abandonada no sertão continua recebendo o trem das quintas — sem trilho suficiente para ele passar." },
          { k: "Gancho", v: "o chefe da estação registra passageiros que ninguém viu descer, e cobra passagem de quem não embarcou." },
          { k: "Conflito", v: "a companhia quer reabrir o ramal; os retirantes usam os dormentes como lenha; alguém está roubando trilho à noite." },
          { k: "Local jogável", v: "estação de Angico Torto: plataforma, telégrafo morto, armazém com malas etiquetadas." },
          { k: "Se ignorarem", v: "as malas do armazém começam a conter objetos do grupo." },
        ],
      },
      { kind: "clock", name: "Companhia reabre o ramal", filled: 0, size: 6 },
      { kind: "choices", items: ["Abre essa aventura", "Quero outra direção", "/status"] },
    ],
    patches: [
      { op: "clock-upsert", name: "Companhia reabre o ramal", filled: 0, size: 6 },
      { op: "quest-add", text: "Descobrir de onde vem o trem das quintas em Angico Torto" },
    ],
  };
}

function monsterSeed(): EngineResult {
  return {
    face: "criador",
    blocks: [
      { kind: "heading", text: "O Cobrador de Sal", tone: "coral" },
      {
        kind: "kv",
        rows: [
          { k: "Aparência", v: "figura alta envolta em recibos úmidos; onde deveria haver rosto, marcas de maré." },
          { k: "Comportamento", v: "não persegue quem foge — anota o nome de quem fica e cobra uma lembrança por vez." },
          { k: "Fraqueza ficcional", v: "um registro contestado por quem ainda lembra de uma dívida quitada o faz parar no meio do gesto." },
          { k: "Decisão que impõe", v: "pagar uma memória útil ou deixar que ele escolha qual levar." },
          { k: "Números", v: "dependem do sistema; diga qual e eu converto o conceito em ficha." },
        ],
      },
      {
        kind: "note",
        text: "O perigo aqui vem da escolha, não do total de dano. Se quiser, converto para D&D 5e, Tormenta20 ou Ordem Paranormal.",
      },
      { kind: "choices", items: ["Converte para Tormenta20", "Quero outro monstro", "Coloca ele na cena atual"] },
    ],
    patches: [],
  };
}

function itemSeed(): EngineResult {
  return {
    face: "criador",
    blocks: [
      { kind: "heading", text: "A Bússola de Segunda-Feira", tone: "brass" },
      {
        kind: "kv",
        rows: [
          { k: "Efeito", v: "aponta para o lugar onde alguém tomou uma decisão que ainda tenta desfazer." },
          { k: "Condição", v: "a agulha só se move quando uma pessoa conta a verdade sobre o próprio arrependimento." },
          { k: "Uso narrativo", v: "encontra ponto de virada, não endereço." },
          { k: "Custo", v: "o que ela revela também expõe algo que alguém preferia manter em silêncio." },
        ],
      },
      { kind: "choices", items: ["/pegar Bússola de Segunda-Feira", "Quero outro item", "Converte para o meu sistema"] },
    ],
    patches: [],
  };
}

function encounterSeed(context: EngineContext): EngineResult {
  const place = context.sheet.location || "um barco atracado";
  return {
    face: "criador",
    blocks: [
      { kind: "heading", text: "Encontro: o último barco", tone: "brass" },
      {
        kind: "kv",
        rows: [
          { k: "Onde", v: place },
          { k: "Objetivo", v: "convencer três passageiros a desembarcar antes da ponte baixa demais para todos." },
          { k: "Complicação", v: "um deles é quem o grupo veio buscar; outro esconde o motivo da viagem; a corrente acelera." },
          { k: "Pressão", v: "a cada troca de argumento, o barco avança um trecho." },
          { k: "Resoluções possíveis", v: "conversa, negociação, exploração do casco, força — todas com custo diferente." },
        ],
      },
      { kind: "clock", name: "Barco chega à ponte", filled: 2, size: 6 },
      { kind: "choices", items: ["Falo com o passageiro que esconde algo", "Verifico o casco", "Uso a força"] },
    ],
    patches: [{ op: "clock-upsert", name: "Barco chega à ponte", filled: 2, size: 6 }],
  };
}

function adjustHp(raw: string, sheet: Sheet): EngineResult {
  const match = raw.match(/^([+-]?)\s*(\d{1,4})$/);
  if (!match) {
    return {
      face: "geral",
      blocks: [
        { kind: "note", text: "Formato: /pv 12 (define), /pv -3 (perde), /pv +2 (recupera)." },
      ],
      patches: [],
    };
  }

  const delta = match[1] === "" ? Number(match[2]) - sheet.hp : Number(`${match[1]}${match[2]}`);
  const next = Math.min(Math.max(sheet.hp + delta, 0), sheet.hpMax);

  return {
    face: "geral",
    blocks: [
      {
        kind: "kv",
        rows: [
          { k: "PV", v: `${sheet.hp} → ${next} de ${sheet.hpMax}` },
          ...(next === 0 ? [{ k: "Estado", v: "0 PV: caído. Decida o que o mundo faz com isso." }] : []),
        ],
      },
    ],
    patches: [{ op: "hp", delta }],
  };
}

function restReply(sheet: Sheet): EngineResult {
  const missing = sheet.hpMax - sheet.hp;
  return {
    face: "mestre",
    blocks: [
      { kind: "heading", text: "Descanso", tone: "verd" },
      {
        kind: "text",
        text:
          missing > 0
            ? `Você recupera ${missing} PV e volta a ${sheet.hpMax}/${sheet.hpMax}. O descanso custa tempo — e tempo move os relógios.`
            : "Você já está inteiro. O descanso custa tempo mesmo assim.",
      },
      ...(sheet.clocks.length > 0
        ? ([{ kind: "note", text: "Relógios ativos continuam correndo enquanto você dorme. Use /giro para ver o que avançou." }] as Block[])
        : []),
    ],
    patches: [{ op: "hp", delta: missing }, ...(sheet.clocks.length > 0 ? ([{ op: "clock-advance", by: 1 }] as Patch[]) : [])],
  };
}

function clockCommand(raw: string, sheet: Sheet): EngineResult {
  const plus = /^\+\s*(\d{1,2})?$/.test(raw.trim());
  if (plus || raw.trim() === "") {
    if (sheet.clocks.length === 0) {
      return {
        face: "geral",
        blocks: [{ kind: "note", text: "Nenhum relógio ativo. Crie um: /relogio Rebelião 0/6" }],
        patches: [],
      };
    }
    const by = Number(raw.trim().replace("+", "")) || 1;
    return {
      face: "geral",
      blocks: [
        { kind: "text", text: `Todos os relógios avançam ${by} segmento(s).` },
        ...sheet.clocks.map((clock) => ({
          kind: "clock" as const,
          name: clock.name,
          filled: Math.min(clock.filled + by, clock.size),
          size: clock.size,
        })),
      ],
      patches: [{ op: "clock-advance", by }],
    };
  }

  const match = raw.match(/^(.*?)\s*(\d{1,2})\s*\/\s*(\d{1,2})$/);
  if (!match) {
    return {
      face: "geral",
      blocks: [
        { kind: "note", text: "Formato: /relogio <nome da ameaça> 2/6 ou /relogio + para avançar todos em 1." },
      ],
      patches: [],
    };
  }

  const name = match[1].trim();
  const filled = Math.min(Number(match[2]), Number(match[3]));
  return {
    face: "geral",
    blocks: [
      { kind: "text", text: name ? `Relógio registrado.` : "Relógio atualizado." },
      { kind: "clock", name: name || "Ameaça sem nome", filled, size: Number(match[3]) },
    ],
    patches: [{ op: "clock-upsert", name: name || "Ameaça sem nome", filled, size: Number(match[3]) }],
  };
}

function inventoryCommand(kind: "add" | "remove", raw: string, sheet: Sheet): EngineResult {
  const item = raw.trim();
  if (!item) {
    return {
      face: "geral",
      blocks: [{ kind: "note", text: kind === "add" ? "Formato: /pegar <item>" : "Formato: /gastar <item>" }],
      patches: [],
    };
  }

  if (kind === "remove") {
    const found = sheet.inventory.find((entry) => entry.toLocaleLowerCase("pt-BR").includes(item.toLocaleLowerCase("pt-BR")));
    if (!found) {
      return {
        face: "geral",
        blocks: [{ kind: "note", text: `“${item}” não está no inventário. Estado atual: ${sheet.inventory.join(", ") || "vazio"}.` }],
        patches: [],
      };
    }
    return {
      face: "geral",
      blocks: [{ kind: "text", text: `Removido do inventário: ${found}.` }],
      patches: [{ op: "inventory-remove", item: found }],
    };
  }

  return {
    face: "geral",
    blocks: [{ kind: "text", text: `Registrado no inventário: ${item}.` }],
    patches: [{ op: "inventory-add", item }],
  };
}

export function respond(input: string, context: EngineContext): EngineResult {
  const text = input.trim();
  const lower = text.toLocaleLowerCase("pt-BR");
  const { sheet, npcs, history, config, modules, world } = context;

  if (!text) {
    return { face: "geral", blocks: [{ kind: "note", text: "Escreva algo — ou use /ajuda para ver os atalhos." }], patches: [] };
  }

  const commandMatch = lower.match(/^\/([a-zçãõé]+)\b\s*([\s\S]*)$/);
  const command = commandMatch?.[1];
  const rest = commandMatch?.[2]?.trim() ?? "";
  const restOriginal = text.replace(/^\/[a-zçãõé]+\b\s*/i, "").trim();

  if (command === "ajuda" || command === "help" || command === "comandos") {
    return { face: "geral", blocks: helpBlocks(), patches: [] };
  }

  if (command === "dado" || command === "rolar" || command === "rolagem" || /^(rola|role|rolar)\b/.test(lower)) {
    const request = parseDiceFormula(restOriginal || text) ?? { faces: 20 as const, count: 1, modifier: 0, mode: "normal" as const };
    const roll = rollDice({ ...request, label: request.label || restOriginal || "Teste" });
    const critical = criticalState(roll);
    const ladder = outcomeLadder(roll.total, config.dificuldade);
    return {
      face: "dados",
      blocks: [
        { kind: "roll", roll },
        ...(critical === "critico"
          ? ([{ kind: "text", text: "Natural 20: sucesso além do esperado — e algo a mais acontece a seu favor." }] as Block[])
          : critical === "desastre"
            ? ([{ kind: "text", text: "Natural 1: falha com consequência. O mundo cobra algo por isso." }] as Block[])
            : []),
        { kind: "heading", text: `Resultado: ${ladder.label}`, tone: ladder.label.startsWith("sucesso") ? "verd" : "coral" },
        { kind: "text", text: ladder.text },
        ...(config.dificuldade >= 70
          ? ([{ kind: "note", text: "Mesa dura: mesmo o sucesso tem preço aqui. Isso é configuração, não punição arbitrária." }] as Block[])
          : config.dificuldade <= 33
            ? ([{ kind: "note", text: "Mesa acolhedora: a falha abre caminho em vez de fechar a história." }] as Block[])
            : []),
      ],
      patches: [{ op: "roll-log", roll }],
    };
  }

  if (command === "status" || command === "ficha") {
    return { face: "geral", blocks: statusBlocks(sheet), patches: [] };
  }

  if (command === "resumo") {
    return { face: "geral", blocks: summarize(history), patches: [] };
  }

  if (command === "pausa") {
    return {
      face: "mestre",
      blocks: [
        { kind: "heading", text: "Mesa em pausa", tone: "verd" },
        { kind: "text", text: "Nada avança: relógios congelados, NPCs em suspenso. Use /voltar para retomar do mesmo ponto." },
        { kind: "choices", items: ["/voltar", "/status"] },
      ],
      patches: [],
    };
  }

  if (command === "voltar") {
    return {
      face: "mestre",
      blocks: [
        { kind: "heading", text: "De volta à mesa", tone: "brass" },
        ...statusBlocks(sheet).slice(1, 2),
        { kind: "choices", items: ["O que acontece agora?", "/giro", "/resumo"] },
      ],
      patches: [],
    };
  }

  if (command === "pv" || command === "vida") {
    return adjustHp(rest, sheet);
  }

  if (command === "cura" || command === "descanso" || command === "descansar") {
    return restReply(sheet);
  }

  if (command === "pegar") {
    return inventoryCommand("add", restOriginal, sheet);
  }

  if (command === "gastar" || command === "usar") {
    return inventoryCommand("remove", restOriginal, sheet);
  }

  if (command === "relogio") {
    return clockCommand(restOriginal, sheet);
  }

  if (command === "local") {
    return {
      face: "geral",
      blocks: [
        { kind: "text", text: restOriginal ? `Local fixado: ${restOriginal}.` : "Formato: /local <onde vocês estão>" },
      ],
      patches: restOriginal ? [{ op: "sheet", changes: { location: restOriginal } }] : [],
    };
  }

  if (command === "hora" || command === "data") {
    return {
      face: "geral",
      blocks: [
        { kind: "text", text: restOriginal ? `Data/hora fixada: ${restOriginal}.` : "Formato: /hora <quando acontece>" },
      ],
      patches: restOriginal ? [{ op: "sheet", changes: { time: restOriginal } }] : [],
    };
  }

  if (command === "missao" || command === "objetivo") {
    return {
      face: "geral",
      blocks: [{ kind: "text", text: restOriginal ? `Missão registrada: ${restOriginal}` : "Formato: /missao <objetivo>"}],
      patches: restOriginal ? [{ op: "quest-add", text: restOriginal }] : [],
    };
  }

  if (command === "nota" || command === "pista") {
    return {
      face: "geral",
      blocks: [{ kind: "text", text: restOriginal ? `Anotado: ${restOriginal}` : "Formato: /nota <pista ou fato>" }],
      patches: restOriginal ? [{ op: "note-add", text: restOriginal }] : [],
    };
  }

  if (command === "opcoes" || command === "opção" || command === "opcao") {
    return {
      face: "estrategista" as FaceId,
      blocks: optionBlocks(chooseOptions(config.variedade)),
      patches: [],
    };
  }

  if (command === "config" || command === "configuracao" || command === "configuração" || command === "preset") {
    return {
      face: "geral" as FaceId,
      blocks: [
        { kind: "heading", text: "Configuração ativa", tone: "verd" },
        { kind: "kv", rows: describeConfig(config) },
        { kind: "note", text: `Módulos ligados: ${activeModules(modules).join(", ") || "nenhum"}.` },
        {
          kind: "choices",
          items: ["mestre supremo", "hardcore", "cinema", "investigação", "minimal"],
        },
      ],
      patches: [],
    };
  }

  if (command === "giro" || command === "mundo") {
    if (command === "mundo" && !rest) return worldSeed();
    return worldTurn(context);
  }

  if (command === "sim") {
    return oddsAnswer(restOriginal);
  }

  if (command === "mestre") {
    return sessionZero(context);
  }

  if (command === "regras") {
    return rulesReply(restOriginal || text);
  }

  if (command === "aventura") {
    if (/sertão|sertao|angico|cobra de lata/i.test(restOriginal)) return sertaoSeed();
    return adventureSeed();
  }

  if (command === "personagem") {
    return characterConcept();
  }

  if (command === "faccoes" || command === "facao" || command === "facções" || command === "facção") {
    if (!restOriginal) {
      return {
        face: "arquivista" as FaceId,
        blocks: [
          { kind: "heading", text: "Facções em jogo", tone: "verd" },
          { kind: "kv", rows: world.factions.map((f) => ({ k: f.name, v: `${f.standing} · influência ${f.influence} · objetivo: ${f.goal}` })) },
          { kind: "choices", items: world.factions.slice(0, 3).map((f) => `/facao ${f.name}`) },
        ],
        patches: [],
      };
    }
    const needle = restOriginal.toLocaleLowerCase("pt-BR");
    const faction = world.factions.find((f) => f.name.toLocaleLowerCase("pt-BR").includes(needle));
    if (!faction && world.factions.length === 0) {
      return {
        face: "arquivista" as FaceId,
        blocks: [{ kind: "note", text: "Nenhuma facção registrada no Codex. Crie uma na aba Codex." }],
        patches: [],
      };
    }
    return faction
      ? { face: "arquivista" as FaceId, blocks: factionCard(faction), patches: [] }
      : {
          face: "arquivista" as FaceId,
          blocks: [
            { kind: "note", text: `Nenhuma facção com “${restOriginal}”. Registradas:` },
            { kind: "list", items: world.factions.map((f) => f.name) },
          ],
          patches: [],
        };
  }

  if (command === "bestiario" || command === "bestiário" || command === "monstros" || command === "criaturas") {
    if (!restOriginal) {
      return {
        face: "arquivista" as FaceId,
        blocks: [
          { kind: "heading", text: "Bestiário", tone: "coral" },
          { kind: "kv", rows: world.bestiary.map((b) => ({ k: b.name, v: `${b.species} · ameaça ${b.threat}/10` })) },
          { kind: "choices", items: world.bestiary.slice(0, 3).map((b) => `/bestiario ${b.name}`) },
        ],
        patches: [],
      };
    }
    const needle = restOriginal.toLocaleLowerCase("pt-BR");
    const beast = world.bestiary.find((b) => b.name.toLocaleLowerCase("pt-BR").includes(needle));
    if (!beast && world.bestiary.length === 0) {
      return {
        face: "arquivista" as FaceId,
        blocks: [{ kind: "note", text: "Bestiário vazio. Registre criaturas na aba Codex." }],
        patches: [],
      };
    }
    return beast
      ? { face: "arquivista" as FaceId, blocks: beastCard(beast), patches: [] }
      : {
          face: "arquivista" as FaceId,
          blocks: [{ kind: "note", text: `Criatura “${restOriginal}” não está no bestiário.` }],
          patches: [],
        };
  }

  if (command === "quests" || command === "board") {
    return { face: "arquivista" as FaceId, blocks: questBoard(world.quests), patches: [] };
  }

  if (command === "mundostate" || command === "world" && /^state/i.test(restOriginal)) {
    return { face: "arquivista" as FaceId, blocks: worldState(world, sheet), patches: [] };
  }

  if (command === "npc") {
    const target = restOriginal ? npcByName(npcs, restOriginal) : undefined;
    if (target) {
      return { face: "criador", blocks: npcBlock(target), patches: [] };
    }
    if (restOriginal && npcs.length > 0) {
      return {
        face: "criador",
        blocks: [
          { kind: "note", text: `Nenhum NPC chamado “${restOriginal}” nesta mesa. Elenco atual:` },
          { kind: "list", items: npcs.map((npc) => `${npc.name} — ${npc.role}`) },
        ],
        patches: [],
      };
    }
    const npc = npcs.length > 0 ? pick(npcs) : undefined;
    return npc
      ? { face: "criador", blocks: npcBlock(npc), patches: [] }
      : { face: "criador", blocks: [{ kind: "note", text: "Elenco vazio. Adicione um NPC na aba Elenco." }], patches: [] };
  }

  if (command === "monstro") return monsterSeed();
  if (command === "item") return itemSeed();
  if (command === "encontro") return encounterSeed(context);

  if (command === "papo") {
    return {
      face: "geral",
      blocks: [
        { kind: "heading", text: "Papo de mesa", tone: "verd" },
        {
          kind: "text",
          text: "Aqui eu converso sobre o que está salvo nesta mesa: estado, NPCs, relógios, rolagens. Interpretação livre de texto não acontece — esta versão roda localmente, sem modelo de linguagem conectado.",
        },
        { kind: "choices", items: ["/status", "/resumo", "/giro", "/ajuda"] },
      ],
      patches: [],
    };
  }

  if (command) {
    return {
      face: "geral",
      blocks: [
        { kind: "note", text: `Não conheço o atalho /${command}. Veja a lista com /ajuda.` },
      ],
      patches: [],
    };
  }

  /* ---------- linguagem natural ---------- */

  const rollRequest = parseDiceFormula(text);
  if (rollRequest && /\b(rola|rolar|role|rolagem|teste|dados?)\b/i.test(lower)) {
    const roll = rollDice({ ...rollRequest, label: rollRequest.label || "Teste" });
    return {
      face: "dados",
      blocks: [{ kind: "roll", roll }, { kind: "text", text: "Interprete o resultado como a sua mesa fizer: sucesso, sucesso com custo ou falha com consequência." }],
      patches: [{ op: "roll-log", roll }],
    };
  }

  if (/^surpreenda(?:-me)?[!.]*$/.test(lower) || /(escolha|decida|pode escolher) (por|para) mim/.test(lower)) {
    return openSurpriseAdventure();
  }

  if (/\b(surpreenda|surpreende)\b/.test(lower)) {
    return openSurpriseAdventure();
  }

  if (/(começar|comecar|iniciar|abrir|quero jogar)\b/.test(lower) && /\b(aventura|mesa|campanha|jogo|sessão|sessao)\b/.test(lower)) {
    return sessionZero(context);
  }

  if (/(cura|descanso|descansar|dormi|acampamento|descanso longo)/.test(lower)) {
    return restReply(sheet);
  }

  if (/^quem é|^quem e|^o que (a|o) |^me fala (d[aeo]|sobre)/.test(lower)) {
    const name = text.replace(/^(quem é|quem e|me fala d[aeo]|me fala sobre|o que a|o que o)\s*/i, "").replace(/\?$/, "");
    const target = npcByName(npcs, name);
    if (target) return { face: "criador", blocks: npcBlock(target), patches: [] };
  }

  if (/\b(regra|edição|edicao|raw|rai|homebrew|como funciona)\b/.test(lower)) {
    return rulesReply(text);
  }

  if (/\b(cria|crie|gera|gere|monta|monte)\b/.test(lower)) {
    if (/\b(npc|personagem do mestre)\b/.test(lower)) {
      const npc = npcs.length > 0 ? pick(npcs) : undefined;
      return npc ? { face: "criador", blocks: npcBlock(npc), patches: [] } : characterConcept();
    }
    if (/\b(personagem|pj|ficha)\b/.test(lower)) return characterConcept();
    if (/\b(monstro|criatura|vilão|vilao)\b/.test(lower)) return monsterSeed();
    if (/\b(item|objeto|arma|relíquia|reliquia)\b/.test(lower)) return itemSeed();
    if (/\b(mundo|cenário|cenario|facção|faccao)\b/.test(lower)) return worldSeed();
    if (/\b(aventura|one-?shot|campanha|encontro)\b/.test(lower)) {
      return /sertão|sertao/.test(lower) ? sertaoSeed() : adventureSeed();
    }
  }

  if (/\b(fac[cç][aã]o|fac[cç][oõ]es|cooperativa|capitania|companhia das rotas|ordem do farol)\b/.test(lower) && world.factions.length > 0) {
    const faction = world.factions.find((f) => lower.includes(f.name.toLocaleLowerCase("pt-BR").split(" ")[0])) ?? world.factions[0];
    return { face: "arquivista" as FaceId, blocks: factionCard(faction), patches: [] };
  }

  if (/\b(cobrador de sal|maré de olhos|saveiro nove|criatura que vi|monstro do cais)\b/.test(lower)) {
    const beast = world.bestiary.length > 0 ? world.bestiary.find((b) => lower.includes(b.name.toLocaleLowerCase("pt-BR").split(" ")[0])) ?? world.bestiary[0] : undefined;
    return beast ? { face: "arquivista" as FaceId, blocks: beastCard(beast), patches: [] } : monsterSeed();
  }

  if (/\b(sertão|sertao|angico|cobra de lata)\b/.test(lower)) return sertaoSeed();
  if (/\b(ilhas de dentro|arquipélago|arquipelago)\b/.test(lower)) return worldSeed();

  if (/(o que acontece|continua|continue|e agora|próxima cena|proxima cena|sigo em frente)/.test(lower)) {
    return sceneBeat(context);
  }

  /* ---------- padrão: devolve estrutura em vez de fingir interpretação ---------- */

  return {
    face: "mestre",
    blocks: [
      { kind: "note", text: "((Anotei como intenção da mesa, mas esta versão não interpreta texto livre — ela roda com atalhos, tabelas e o estado salvo aqui.))" },
      { kind: "heading", text: "Caminhos possíveis", tone: "verd" },
      {
        kind: "kv",
        rows: chooseOptions(config.variedade)
          .slice(0, 4)
          .map((path) => ({ k: path.tag, v: `${path.label} — ganha ${path.gain}; paga com ${path.cost}.` })),
      },
      {
        kind: "choices",
        items: ["/status", "/giro", "/dado 1d20", "/aventura", "/npc", "/sim isso dá certo?", "/ajuda"],
      },
    ],
    patches: [{ op: "note-add", text: `Intenção registrada pelo jogador: “${text.slice(0, 90)}”` }],
  };
}

export function applyPatches(state: { sheet: Sheet; npcs: Npc[]; rollHistory: DiceRoll[] }, patches: Patch[]) {
  let sheet = state.sheet;
  let npcs = state.npcs;
  let rollHistory = state.rollHistory;

  for (const patch of patches) {
    switch (patch.op) {
      case "sheet":
        sheet = { ...sheet, ...patch.changes };
        break;
      case "hp":
        sheet = { ...sheet, hp: Math.min(Math.max(sheet.hp + patch.delta, 0), sheet.hpMax) };
        break;
      case "inventory-add":
        sheet = sheet.inventory.includes(patch.item)
          ? sheet
          : { ...sheet, inventory: [...sheet.inventory, patch.item] };
        break;
      case "inventory-remove":
        sheet = { ...sheet, inventory: sheet.inventory.filter((item) => item !== patch.item) };
        break;
      case "clock-upsert": {
        const existing = sheet.clocks.find((clock) => clock.name === patch.name);
        const size = Math.min(Math.max(patch.size ?? existing?.size ?? 6, 2), 12);
        const filled = Math.min(Math.max(patch.filled ?? existing?.filled ?? 0, 0), size);
        sheet = existing
          ? {
              ...sheet,
              clocks: sheet.clocks.map((clock) => (clock.id === existing.id ? { ...clock, size, filled } : clock)),
            }
          : { ...sheet, clocks: [...sheet.clocks, { id: uid("clock"), name: patch.name, size, filled }] };
        break;
      }
      case "clock-advance":
        sheet = {
          ...sheet,
          clocks: sheet.clocks.map((clock) =>
            patch.name && clock.name !== patch.name
              ? clock
              : { ...clock, filled: Math.min(clock.filled + patch.by, clock.size) },
          ),
        };
        break;
      case "quest-add":
        sheet = sheet.quests.some((quest) => quest.text === patch.text)
          ? sheet
          : { ...sheet, quests: [...sheet.quests, { id: uid("quest"), text: patch.text, done: false }] };
        break;
      case "note-add":
        sheet = sheet.notes.includes(patch.text) ? sheet : { ...sheet, notes: [patch.text, ...sheet.notes].slice(0, 30) };
        break;
      case "npc-reveal":
        npcs = npcs.map((npc) => (npc.id === patch.id ? { ...npc, revealed: !npc.revealed } : npc));
        break;
      case "roll-log":
        rollHistory = [patch.roll, ...rollHistory].slice(0, 40);
        break;
    }
  }

  return { sheet, npcs, rollHistory };
}

