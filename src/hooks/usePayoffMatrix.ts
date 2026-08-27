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

export function usePayoffMatrix() {
  const [matrix] = useState<Payoff[][]>(generateMatrix);
  const [isDisabled, setDisabled] = useState(true);
  const [clickedCell, setClickedCell] = useState<ClickedCell | null>(null);
  const [clickedElement, setClickedElement] = useState<ClickedElement | null>(
    null,
  );

  const isCellSelected = (row: number, col: number) =>
    clickedCell?.row === row && clickedCell?.col === col;

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
  }

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
    isCellSelected,
    isElementSelected,
    handleCellClick,
    handleElementClick,
  };
}
