/* ============================================================
   World Engine — facções, quest board, bestiário, world state
   ============================================================ */

import { uid } from "./dice";

export type FactionStanding = "aliada" | "neutra" | "rival" | "inimiga";

export type Faction = {
  id: string;
  name: string;
  ideology: string;
  goal: string;
  resources: string;
  influence: number;
  allies: string;
  rivals: string;
  secret: string;
  standing: FactionStanding;
  revealed: boolean;
  clock: { name: string; filled: number; size: number };
};

export type Bestiary = {
  id: string;
  name: string;
  species: string;
  habitat: string;
  behavior: string;
  intelligence: "instinto" | "astuta" | "racional";
  abilities: string;
  weakness: string;
  threat: number;
};

export type QuestTier = "principal" | "secundaria" | "oculta";

export type BoardQuest = {
  id: string;
  tier: QuestTier;
  objective: string;
  reward: string;
  patron: string;
  risk: number;
  discovered: boolean;
};

export type World = {
  name: string;
  era: string;
  climate: string;
  threat: number;
  renown: number;
  factions: Faction[];
  bestiary: Bestiary[];
  quests: BoardQuest[];
  recent: string[];
};

export const STANDINGS: FactionStanding[] = ["aliada", "neutra", "rival", "inimiga"];

export function blankWorld(): World {
  return {
    name: "",
    era: "",
    climate: "",
    threat: 3,
    renown: 0,
    factions: [],
    bestiary: [],
    quests: [],
    recent: [],
  };
}

export function seedWorld(): World {
  return {
    name: "Arquipélago de Candeia",
    era: "Ano 4 da Maré Fechada",
    climate: "Entardecer úmido, vento sul, maresia forte",
    threat: 4,
    renown: 12,
    recent: [
      "A Capitania suspendeu registros de carga por dez dias, sem aviso público.",
      "Três barcos vazios atracaram na mesma noite, com as sombras apagadas.",
      "O preço do sal dobro em uma semana no mercado do cais.",
    ],
    factions: [
      {
        id: uid("facao"),
        name: "Cooperativa das Marés",
        ideology: "Trabalho organizado vale mais que patente de capitania.",
        goal: "Controlar o registro das cargas e, com ele, quem entra e quem sai do porto.",
        resources: "Onze barcos, cento e quarenta pares de mãos, apoio do mercado do cais.",
        influence: 68,
        allies: "Mercado do cais; os marisqueiros da ponta norte.",
        rivals: "Capitania dos Portos; Companhia das Rotas.",
        secret: "Estão queimando correspondência não registrada para não pagar a nova taxa.",
        standing: "neutra",
        revealed: false,
        clock: { name: "Cooperativa queima o lote inteiro", filled: 2, size: 6 },
      },
      {
        id: uid("facao"),
        name: "Capitania dos Portos",
        ideology: "Ordem documentada é a única forma de ordem.",
        goal: "Encerrar o inquérito do cais sem abrir nenhuma caixa.",
        resources: "Selos, guarnição de doze homens, acesso ao arquivo de embarcações.",
        influence: 74,
        allies: "Tabelião do cartório do cais.",
        rivals: "Cooperativa das Marés.",
        secret: "O inspetor Clóvis recebe da Cooperativa em cestas de pescado, não em dinheiro.",
        standing: "inimiga",
        revealed: false,
        clock: { name: "Capitania fecha o porto por decreto", filled: 3, size: 6 },
      },
      {
        id: uid("facao"),
        name: "Companhia das Rotas",
        ideology: "Rota nova vale mais que porto antigo.",
        goal: "Acelerar as travessias até a ilha de minério, custe o custo humano.",
        resources: "Dois vaporões, capital de três famílias, contratos com a alfândega.",
        influence: 81,
        allies: "Alfândega; dois vereadores da câmara.",
        rivals: "Cooperativa das Marés; ferro-velho de Zaida.",
        secret: "A ilha de minério já estava demarcada antes do último naufrágio que a revelou.",
        standing: "rival",
        revealed: false,
        clock: { name: "Companhia domina a travessia", filled: 1, size: 8 },
      },
      {
        id: uid("facao"),
        name: "Ordem do Farol Apagado",
        ideology: "A sombra é propriedade de quem a perdeu.",
        goal: "Devolver a cada morador a sombra cobrada como imposto — e punir quem lucrou com isso.",
        resources: "Conhecimento dos túneis de drenagem, chaves antigas, silêncio da vizinhança.",
        influence: 39,
        allies: "Nenhum declarado; todos devem favors a alguém da Ordem.",
        rivals: "Alfândega; faroleiros pagos pela Capitania.",
        secret: "O fundador da Ordem é quem escreveu a lei do pedágio, há trinta e um anos.",
        standing: "neutra",
        revealed: false,
        clock: { name: "Ordem expõe a lei do pedágio", filled: 0, size: 5 },
      },
    ],
    bestiary: [
      {
        id: uid("besta"),
        name: "Cobrador de Sal",
        species: "Entidade de cobrança litorânea",
        habitat: "Cais, escuros de armazém, maré baixa",
        behavior: "Não persegue quem foge; anota o nome de quem fica.",
        intelligence: "astuta",
        abilities: "Cobra uma lembrança por vez; nunca esquece uma dívida registrada.",
        weakness: "Registro contestado por quem lembra de dívida quitada o faz parar no gesto.",
        threat: 5,
      },
      {
        id: uid("besta"),
        name: "Maré de Olhos",
        species: "Fenômeno aquático coletivo",
        habitat: "Águas rasas e turvas após meia-noite",
        behavior: "Observa, não ataca; segue quem carrega papel molhado.",
        intelligence: "instinto",
        abilities: "Faz quem entra nela esquecer o caminho de volta por uma maré inteira.",
        weakness: "Não tolera sal grosso jogado na superfície; recua em silêncio.",
        threat: 3,
      },
      {
        id: uid("besta"),
        name: "Saveiro Nove",
        species: "Embarcação que voltou sem tripulação",
        habitat: "Docas fundas, sempre atraca no mesmo lugar",
        behavior: "Aceita passageiro; devolve em outro porto, em outra semana.",
        intelligence: "astuta",
        abilities: "Cobra passagem em nome, não em moeda.",
        weakness: "Uma dívida quitada em voz alta na coberta o impede de zarpar.",
        threat: 4,
      },
    ],
    quests: [
      {
        id: uid("quest"),
        tier: "principal",
        objective: "Descobrir por que o recibo do pedágio traz o seu nome",
        reward: "Acesso ao arquivo do farol e a verdade sobre a sombra devolvida",
        patron: "Ordem do Farol Apagado",
        risk: 4,
        discovered: true,
      },
      {
        id: uid("quest"),
        tier: "secundaria",
        objective: "Impedir que a Cooperativa queime o lote de cartas",
        reward: "Aliança com a Cooperativa e informação sobre quem assinou a venda",
        patron: "Zaida Bittar",
        risk: 3,
        discovered: true,
      },
      {
        id: uid("quest"),
        tier: "oculta",
        objective: "Requisito ainda desconhecido",
        reward: "?",
        patron: "?",
        risk: 5,
        discovered: false,
      },
    ],
  };
}

export function threatLabel(threat: number): string {
  if (threat >= 9) return "extremo";
  if (threat >= 7) return "alto";
  if (threat >= 5) return "moderado";
  if (threat >= 3) return "contido";
  return "baixo";
}

export function renownStars(renown: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(renown / 20)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}
