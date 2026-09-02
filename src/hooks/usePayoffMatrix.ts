import { useState } from "react";

export interface Payoff {
  defender: number;
  attacker: number;
}

export interface ClickedCell {
  row: number;
  col: number;
}

export interface ClickedElement {
  row: number;
  col: number;
  player: "defender" | "attacker";
}

export interface HighlightedServer {
  player: "defender" | "attacker";
  server: 1 | 2;
}

const randomProDefender = (): Payoff => {
  let defender = Math.floor(Math.random() * 6);
  while (defender === 0) {
    defender = Math.floor(Math.random() * 6);
  }
  return { defender, attacker: -defender };
};

const randomProAttacker = (): Payoff => {
  let attacker = Math.floor(Math.random() * 6);
  while (attacker === 0) {
    attacker = Math.floor(Math.random() * 6);
  }
  return { defender: -attacker, attacker };
};

const generateMatrix = (): Payoff[][] => [
  [randomProDefender(), randomProAttacker()],
  [randomProAttacker(), randomProDefender()],
];

export const calculateDefenderMaxmin = (matrix: Payoff[][]): number => {
  const a = matrix[0][0].defender; // Defend S1, Attack S1
  const b = matrix[0][1].defender; // Defend S1, Attack S2
  const c = matrix[1][0].defender; // Defend S2, Attack S1
  const d = matrix[1][1].defender; // Defend S2, Attack S2
  return Math.max(Math.min(a, b), Math.min(c, d));
};

export const calculateAttackerMaxmin = (matrix: Payoff[][]): number => {
  const e = matrix[0][0].attacker; // Defend S1, Attack S1
  const f = matrix[1][0].attacker; // Defend S2, Attack S1
  const g = matrix[0][1].attacker; // Defend S1, Attack S2
  const h = matrix[1][1].attacker; // Defend S2, Attack S2
  return Math.max(Math.min(e, f), Math.min(g, h));
};

export const calculateDefenderMinmax = (matrix: Payoff[][]): number => {
  const row1AttackerMax = Math.max(
    matrix[0][0].attacker,
    matrix[0][1].attacker,
  );
  const row2AttackerMax = Math.max(
    matrix[1][0].attacker,
    matrix[1][1].attacker,
  );
  return Math.min(row1AttackerMax, row2AttackerMax);
};

export const calculateAttackerMinmax = (matrix: Payoff[][]): number => {
  const col1DefenderMax = Math.max(
    matrix[0][0].defender,
    matrix[1][0].defender,
  );
  const col2DefenderMax = Math.max(
    matrix[0][1].defender,
    matrix[1][1].defender,
  );
  return Math.min(col1DefenderMax, col2DefenderMax);
};

export const computeAttackerQ = (matrix: Payoff[][]): number => {
  const a = matrix[0][0].defender; // Defend S1, Attack S1
  const b = matrix[0][1].defender; // Defend S1, Attack S2
  const c = matrix[1][0].defender; // Defend S2, Attack S1
  const d = matrix[1][1].defender; // Defend S2, Attack S2
  return (d - b) / (a - b - c + d);
};

export const computeDefenderP = (matrix: Payoff[][]): number => {
  const e = matrix[0][0].attacker; // Defend S1, Attack S1
  const f = matrix[1][0].attacker; // Defend S2, Attack S1
  const g = matrix[0][1].attacker; // Defend S1, Attack S2
  const h = matrix[1][1].attacker; // Defend S2, Attack S2
  return (h - f) / (e - f - g + h);
};

export const asPercent = (value: number): string =>
  `${(value * 100).toFixed(1)}%`;

export function usePayoffMatrix() {
  const [matrix] = useState<Payoff[][]>(generateMatrix);
  const [isDisabled, setDisabled] = useState(true);
  const [clickedCell, setClickedCell] = useState<ClickedCell | null>(null);
  const [clickedElement, setClickedElement] = useState<ClickedElement | null>(
    null,
  );
  const [highlightedServer, setHighlightedServer] =
    useState<HighlightedServer | null>(null);

  const isCellSelected = (row: number, col: number) =>
    clickedCell?.row === row && clickedCell?.col === col;

  const isServerHighlighted = (
    player: "defender" | "attacker",
    server: 1 | 2,
  ) =>
    highlightedServer?.player === player &&
    highlightedServer?.server === server;

  const highlightServer = (player: "defender" | "attacker", server: 1 | 2) => {
    setHighlightedServer({ player, server });
  };

  const isElementSelected = (
    row: number,
    col: number,
    player: "defender" | "attacker",
  ) =>
    clickedElement?.row === row &&
    clickedElement?.col === col &&
    clickedElement?.player === player;

  const handleCellClick = (row: number, col: number) => {
    setClickedCell({ row, col });
  };

  const clearSelection = () => {
    setClickedCell(null);
    setClickedElement(null);
    setHighlightedServer(null);
  };

  const handleElementClick = (
    event: React.MouseEvent,
    row: number,
    col: number,
    player: "defender" | "attacker",
  ) => {
    event.stopPropagation();
    setClickedCell({ row, col });
    setClickedElement({ row, col, player });
  };

  return {
    matrix,
    isDisabled,
    setDisabled,
    clickedCell,
    clearSelection,
    clickedElement,
    highlightedServer,
    highlightServer,
    isCellSelected,
    isElementSelected,
    isServerHighlighted,
    handleCellClick,
    handleElementClick,
  };
}
