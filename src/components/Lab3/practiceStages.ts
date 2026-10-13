// The Practice Lab 3 match, expressed as a list of stages.
//
// This is kept out of the component because the stage list is the whole design
// of the lab: what gets asked, in what order, for how many marks, and how the
// two roles differ. Having it as data rather than JSX means it can be checked
// offline (weights summing to 100, every stage having a reachable answer) the
// same way the solver is.
//
// The two roles are deliberately NOT symmetric. An earlier version had both
// sides annotate all nine nodes, which equalized the workload but turned the
// lab into a solver and made the choice of side purely cosmetic. Here the
// attacker moves first and last and spends their effort reading the defender
// twice; the defender moves once in the middle and spends their effort on a
// single much harder read of the attacker's opening. Both add up to 100.

import {
  collectDecisionNodes,
  honeypotNode,
  totalServerValue,
} from "./gameTree";
import type {
  Action,
  DecisionNode,
  GameNode,
  GameValues,
  GeneratedGame,
  Player,
  Solution,
  TerminalNode,
} from "./gameTree";

export type Role = Player;

export type StageKind =
  /** Two number inputs: work a terminal's payoff pair out from the formulas. */
  | "calc2"
  /** Click an edge on the tree. */
  | "edge"
  /** One number input. */
  | "number"
  /** Multiple choice. */
  | "choice"
  /** No input; the opponent's move lands here. */
  | "reveal";

/**
 * One line of the conversation between the two players. `hypothetical` marks a
 * line that describes a what-if rather than a move actually made, which the UI
 * ghosts so the recon round cannot be mistaken for the match itself.
 */
export interface Bubble {
  player: Player;
  text: string;
  hypothetical?: boolean;
}

export interface StageField {
  key: "a" | "b";
  label: string;
}

export interface StageOption {
  id: string;
  label: string;
}

export interface Stage {
  id: string;
  kind: StageKind;
  /** Whose rail lights up. */
  player: Player;
  /**
   * Short tag, e.g. "Recon 1 of 3". No longer shown on the question bubble
   * during play (the bubble shows the point value instead), but still needed
   * to tell stages apart afterwards: three recon questions share the prompt
   * "What do we each walk away with?", so the review screen and the graded
   * results rows would otherwise be indistinguishable.
   */
  heading: string;
  /**
   * Narration shown above the question, as bubbles on each player's own side.
   * The question itself then appears as a bubble on `player`'s side, so the
   * side a question lands on is the side whose decision it concerns.
   */
  setup?: Bubble[];
  prompt: string;
  detail?: string;
  /**
   * Render the question bubble full width under the graph instead of in a side
   * column. Used only by the final multiple choice, whose options are
   * sentence-length and will not fit a side bubble.
   */
  wide?: boolean;
  weight: number;
  /** For "edge": the node whose edges are live. Also the node to highlight. */
  nodeId?: string;
  fields?: [StageField, StageField];
  options?: StageOption[];
  /** Terminals whose payoffs are readable during this stage. */
  visiblePayoffIds?: ReadonlySet<string>;
  /** Canonical correct answer, in the same encoding as the student's input. */
  answer: string;
  /** Human-readable form of the correct answer, for the results screen. */
  answerLabel: string;
  /** Human-readable form of whatever the student entered. */
  describe: (input: string) => string;
  /**
   * An action that is part of the match as actually played, used to draw the
   * live path on the tree. Set on reveal stages, where the opponent's move is
   * known at build time. A student's own move is read from their answer.
   */
  pathActionId?: string;
}

// Answers are stored as plain strings so the whole match is one Map:
//   edge    -> action id
//   calc2   -> "<a>|<b>"
//   number  -> "<n>"
//   choice  -> option id
//   reveal  -> "" (nothing to answer)
export type Answers = ReadonlyMap<string, string>;

export const pair = (a: number | string, b: number | string) => `${a}|${b}`;
export const payoffText = (a: number, b: number) => `(${a}, ${b})`;

// ---------------------------------------------------------------------------
// Terminal bookkeeping
// ---------------------------------------------------------------------------

export interface TerminalInfo {
  node: TerminalNode;
  bridge: string;
  /** The server the defender honeypotted in this subgame, or null. */
  honeypotOn: string | null;
  pathCost: number;
}

export const indexTerminals = (tree: GameNode): Map<string, TerminalInfo> => {
  const out = new Map<string, TerminalInfo>();
  const walk = (
    node: GameNode,
    bridge: string,
    honeypotOn: string | null,
    cost: number,
  ) => {
    if (node.kind === "terminal") {
      out.set(node.id, { node, bridge, honeypotOn, pathCost: cost });
      return;
    }
    node.actions.forEach((action) => {
      const nextBridge =
        node.player === "attacker" && node.id === tree.id
          ? action.label.replace("Attack ", "")
          : bridge;
      const nextHp =
        node.player === "defender"
          ? action.label === "No honeypot"
            ? null
            : action.label.replace("Honeypot ", "")
          : honeypotOn;
      walk(
        action.child,
        nextBridge,
        nextHp,
        cost + (action.exploitCost ?? 0),
      );
    });
  };
  walk(tree, "", null, 0);
  return out;
};

// Three terminals for the recon round: one plain capture in each branch, then
// one honeypot capture. The trap comes last so the student meets the easy form
// of the formula twice before the one with P and D = 0 in it.
export const reconTerminals = (
  index: Map<string, TerminalInfo>,
): TerminalInfo[] => {
  const all = [...index.values()];
  const plainIn = (bridge: string) =>
    all.find(
      (t) => t.bridge === bridge && !t.node.trapped && t.honeypotOn === null,
    );
  const first = plainIn("N1");
  const second = plainIn("N2");
  const trapped = all.find((t) => t.node.trapped);
  return [first, second, trapped].filter((t): t is TerminalInfo => !!t);
};

// The recon round is a hypothetical, so it is narrated as one, in the players'
// own voices rather than as a description of them.
const reconBubbles = (info: TerminalInfo): Bubble[] => [
  {
    player: "attacker",
    text: `I come in through ${info.bridge}.`,
    hypothetical: true,
  },
  {
    player: "defender",
    text:
      info.honeypotOn === null
        ? "No honeypot from me."
        : `Honeypot on ${info.honeypotOn}.`,
    hypothetical: true,
  },
  {
    player: "attacker",
    text: info.node.trapped
      ? `I walk into ${info.node.server} anyway.`
      : info.honeypotOn === null
        ? `Then I take ${info.node.server}.`
        : `I go around it and take ${info.node.server}.`,
    hypothetical: true,
  },
];

// ---------------------------------------------------------------------------
// Stage construction
// ---------------------------------------------------------------------------

const actionLabel = (node: DecisionNode, actionId: string): string =>
  node.actions.find((a) => a.id === actionId)?.label ?? "(nothing)";

const bridgeOfAction = (action: Action) => action.label.replace("Attack ", "");

// Under any defender option sits exactly one attacker node, by construction of
// the attacker-first tree.
const leafNodeUnder = (hpAction: Action): DecisionNode =>
  hpAction.child as DecisionNode;

/** Builds the stage list. Later stages depend on the student's earlier moves. */
export const buildStages = (
  game: GeneratedGame,
  role: Role,
  answers: Answers,
): Stage[] => {
  const { tree, solution, values } = game;
  const index = indexTerminals(tree);
  const recon = reconTerminals(index);
  const sum = totalServerValue(values);
  const stages: Stage[] = [];

  // --- Recon, identical for both roles ------------------------------------
  const scouted = new Set<string>();
  recon.forEach((info, i) => {
    const { attacker, defender } = info.node.payoff;
    stages.push({
      id: `recon-${i}`,
      kind: "calc2",
      player: role,
      heading: `Recon ${i + 1} of ${recon.length}`,
      setup: reconBubbles(info),
      prompt: "What do we each walk away with?",
      detail: info.node.trapped
        ? `Nothing is captured, so Sx and D are both 0. The attacker still pays every edge they walked, plus the capture penalty P of ${values.capturePenalty}.`
        : `${info.node.server} is worth ${values.servers[info.node.server]}. The attacker paid ${info.pathCost} in exploit costs to get there.`,
      weight: 5,
      fields: [
        { key: "a", label: "Ua" },
        { key: "b", label: "Ud" },
      ],
      visiblePayoffIds: new Set(scouted),
      answer: pair(attacker, defender),
      answerLabel: payoffText(attacker, defender),
      describe: (input) => {
        const [a, b] = input.split("|");
        return input ? payoffText(Number(a), Number(b)) : "(no answer)";
      },
    });
    scouted.add(info.node.id);
  });

  const allPayoffs = new Set(index.keys());
  const defenderNodes = collectDecisionNodes(tree).filter(
    (n) => n.player === "defender",
  );

  if (role === "attacker") {
    // --- Read the defender, once per entry point --------------------------
    defenderNodes.forEach((node) => {
      const bridge = node.id.replace("d:", "");
      stages.push({
        id: `read-${node.id}`,
        kind: "edge",
        player: "defender",
        heading: "Read your opponent",
        setup: [
          {
            player: "attacker",
            text: `Say I come in through ${bridge}.`,
            hypothetical: true,
          },
        ],
        prompt: "Which response do they pick?",
        detail: "They see your move first. Click the edge you expect.",
        weight: 10,
        nodeId: node.id,
        visiblePayoffIds: allPayoffs,
        answer: solution[node.id].bestActionId ?? "",
        answerLabel: actionLabel(node, solution[node.id].bestActionId ?? ""),
        describe: (input) => (input ? actionLabel(node, input) : "(no answer)"),
      });
    });

    // --- Your opening ----------------------------------------------------
    stages.push({
      id: "move-root",
      kind: "edge",
      player: "attacker",
      heading: "Your move",
      setup: [{ player: "defender", text: "I am watching. Pick a way in." }],
      prompt: "Which way in?",
      detail:
        "Choose the branch that pays you most once they have reacted to it.",
      weight: 15,
      nodeId: tree.id,
      visiblePayoffIds: allPayoffs,
      answer: solution[tree.id].bestActionId ?? "",
      answerLabel: actionLabel(tree as DecisionNode, solution[tree.id].bestActionId ?? ""),
      describe: (input) =>
        input ? actionLabel(tree as DecisionNode, input) : "(no answer)",
    });

    // Everything past here depends on which branch the student actually took.
    const rootChoice = answers.get("move-root");
    const rootAction = (tree as DecisionNode).actions.find(
      (a) => a.id === rootChoice,
    );
    if (rootAction) {
      const defNode = rootAction.child as DecisionNode;
      const reply = defNode.actions.find(
        (a) => a.id === solution[defNode.id].bestActionId,
      );
      if (reply) {
        stages.push({
          id: "reveal-defender",
          kind: "reveal",
          player: "defender",
          heading: "The defender responds",
          setup: [
            {
              player: "attacker",
              text: `I am coming in through ${bridgeOfAction(rootAction)}.`,
            },
            {
              player: "defender",
              text:
                reply.label === "No honeypot"
                  ? "I am not spending on a honeypot."
                  : `${reply.label}.`,
            },
          ],
          prompt: "That is their best response, not a guess.",
          detail: "Your last move is next.",
          weight: 0,
          pathActionId: reply.id,
          visiblePayoffIds: allPayoffs,
          answer: "",
          answerLabel: reply.label,
          describe: () => reply.label,
        });

        const leaf = leafNodeUnder(reply);
        stages.push({
          id: "move-leaf",
          kind: "edge",
          player: "attacker",
          heading: "Your move",
          setup: [
            {
              player: "defender",
              text:
                reply.label === "No honeypot"
                  ? "Nothing in your way."
                  : `${reply.label}. Your move.`,
            },
          ],
          prompt: "Which server do you take?",
          weight: 15,
          nodeId: leaf.id,
          visiblePayoffIds: allPayoffs,
          answer: solution[leaf.id].bestActionId ?? "",
          answerLabel: actionLabel(leaf, solution[leaf.id].bestActionId ?? ""),
          describe: (input) => (input ? actionLabel(leaf, input) : "(no answer)"),
        });

        // --- Counterfactual on the branch not taken ------------------------
        const other = (tree as DecisionNode).actions.find(
          (a) => a.id !== rootAction.id,
        );
        if (other) {
          const otherValue = solution[other.child.id].value.attacker;
          stages.push({
            id: "counterfactual",
            kind: "number",
            player: "attacker",
            heading: "The road not taken",
            setup: [
              {
                player: "attacker",
                text: `What if I had gone through ${bridgeOfAction(other)}?`,
                hypothetical: true,
              },
            ],
            prompt: "What would you have walked away with?",
            detail:
              "Same method: what do they do there, and what is left for you.",
            weight: 10,
            fields: [
              { key: "a", label: "Ua" },
              { key: "b", label: "" },
            ],
            visiblePayoffIds: allPayoffs,
            answer: String(otherValue),
            answerLabel: String(otherValue),
            describe: (input) => (input === "" ? "(no answer)" : input),
          });
        }
      }
    }
  } else {
    // --- Read the attacker's opening, the hardest single question ---------
    stages.push({
      id: "read-root",
      kind: "edge",
      player: "attacker",
      heading: "Read your opponent",
      setup: [
        {
          player: "defender",
          text: "They move first, and I have to be ready either way.",
        },
      ],
      prompt: "Which way will they come in?",
      detail:
        "Work out what you would do in each branch, and what they would do after that.",
      weight: 20,
      nodeId: tree.id,
      visiblePayoffIds: allPayoffs,
      answer: solution[tree.id].bestActionId ?? "",
      answerLabel: actionLabel(tree as DecisionNode, solution[tree.id].bestActionId ?? ""),
      describe: (input) =>
        input ? actionLabel(tree as DecisionNode, input) : "(no answer)",
    });

    // The attacker plays its equilibrium opening regardless of the read.
    const opening = (tree as DecisionNode).actions.find(
      (a) => a.id === solution[tree.id].bestActionId,
    );
    if (opening) {
      const defNode = opening.child as DecisionNode;
      stages.push({
        id: "reveal-attacker",
        kind: "reveal",
        player: "attacker",
        heading: "The attacker moves",
        setup: [
          {
            player: "attacker",
            text: `I am coming in through ${bridgeOfAction(opening)}.`,
          },
        ],
        prompt: "Your move is next.",
        detail: "First work out how they would finish under each option.",
        weight: 0,
        pathActionId: opening.id,
        visiblePayoffIds: allPayoffs,
        answer: "",
        answerLabel: opening.label,
        describe: () => opening.label,
      });

      // --- Predict their finish under each of your three options ---------
      defNode.actions.forEach((option) => {
        const leaf = leafNodeUnder(option);
        stages.push({
          id: `read-leaf-${option.id}`,
          kind: "edge",
          player: "attacker",
          heading: "Read your opponent",
          setup: [
            {
              player: "defender",
              text:
                option.label === "No honeypot"
                  ? "Say I spend nothing."
                  : `Say I put a honeypot on ${option.label.replace("Honeypot ", "")}.`,
              hypothetical: true,
            },
          ],
          prompt: "Which server do they take?",
          weight: 5,
          nodeId: leaf.id,
          visiblePayoffIds: allPayoffs,
          answer: solution[leaf.id].bestActionId ?? "",
          answerLabel: actionLabel(leaf, solution[leaf.id].bestActionId ?? ""),
          describe: (input) => (input ? actionLabel(leaf, input) : "(no answer)"),
        });
      });

      // --- Your move -------------------------------------------------------
      stages.push({
        id: "move-defender",
        kind: "edge",
        player: "defender",
        heading: "Your move",
        setup: [
          {
            player: "attacker",
            text: "I am in. What are you going to do about it?",
          },
        ],
        prompt: `Honeypot ${defNode.actions
          .filter((a) => a.label !== "No honeypot")
          .map((a) => a.label.replace("Honeypot ", ""))
          .join(" or ")}, or spend nothing?`,
        detail: `A honeypot costs ${values.honeypotCost}. Only worth it if it moves them somewhere cheaper by more than that.`,
        weight: 15,
        nodeId: defNode.id,
        visiblePayoffIds: allPayoffs,
        answer: solution[defNode.id].bestActionId ?? "",
        answerLabel: actionLabel(defNode, solution[defNode.id].bestActionId ?? ""),
        describe: (input) => (input ? actionLabel(defNode, input) : "(no answer)"),
      });

      const myChoice = answers.get("move-defender");
      const chosen = defNode.actions.find((a) => a.id === myChoice);
      if (chosen) {
        const leaf = leafNodeUnder(chosen);
        const theirPick = leaf.actions.find(
          (a) => a.id === solution[leaf.id].bestActionId,
        );
        stages.push({
          id: "reveal-finish",
          kind: "reveal",
          player: "attacker",
          heading: "The attacker finishes",
          setup: [
            {
              player: "defender",
              text:
                chosen.label === "No honeypot"
                  ? "I am spending nothing."
                  : `${chosen.label}.`,
            },
            {
              player: "attacker",
              text: `Then I take ${theirPick?.label.replace("Attack ", "") ?? "?"}.`,
            },
          ],
          prompt: "That is their best response to the board you left.",
          detail: "Two questions to go.",
          weight: 0,
          pathActionId: theirPick?.id,
          visiblePayoffIds: allPayoffs,
          answer: "",
          answerLabel: theirPick?.label ?? "",
          describe: () => theirPick?.label ?? "",
        });

        // --- Counterfactual on the option you passed up -------------------
        const alternative =
          chosen.label === "No honeypot"
            ? defNode.actions
                .filter((a) => a.label !== "No honeypot")
                .reduce((a, b) =>
                  solution[b.child.id].value.defender >
                  solution[a.child.id].value.defender
                    ? b
                    : a,
                )
            : defNode.actions.find((a) => a.label === "No honeypot");
        if (alternative) {
          const altValue = solution[alternative.child.id].value.defender;
          stages.push({
            id: "counterfactual",
            kind: "number",
            player: "defender",
            heading: "The road not taken",
            setup: [
              {
                player: "defender",
                text: `What if I had played ${alternative.label.toLowerCase()}?`,
                hypothetical: true,
              },
            ],
            prompt: "What would you have kept?",
            detail: `SUM(Sx) is fixed at ${sum}. Only D and whether you paid Ch move.`,
            weight: 10,
            fields: [
              { key: "a", label: "Ud" },
              { key: "b", label: "" },
            ],
            visiblePayoffIds: allPayoffs,
            answer: String(altValue),
            answerLabel: String(altValue),
            describe: (input) => (input === "" ? "(no answer)" : input),
          });
        }
      }
    }
  }

  // --- Threshold, the one question that cannot be read off the screen -----
  const hp = honeypotNode(tree, solution, values);
  if (hp) {
    const bridge = hp.node.id.replace("d:", "");
    stages.push({
      id: "threshold",
      kind: "number",
      player: "defender",
      heading: "Where the honeypot stops paying",
      setup: [
        {
          player: "defender",
          text: `At ${bridge} the honeypot is worth its ${values.honeypotCost}. But only just.`,
        },
      ],
      prompt: "How expensive before it stops being worth it?",
      detail:
        "The cost at which buying it and spending nothing pay exactly the same.",
      weight: 15,
      fields: [
        { key: "a", label: "Ch" },
        { key: "b", label: "" },
      ],
      visiblePayoffIds: allPayoffs,
      answer: String(hp.threshold),
      answerLabel: String(hp.threshold),
      describe: (input) => (input === "" ? "(no answer)" : input),
    });
  }

  // --- One conceptual question --------------------------------------------
  stages.push(conceptStage(tree, solution, values, allPayoffs));

  return stages;
};

const conceptStage = (
  tree: GameNode,
  solution: Solution,
  values: GameValues,
  allPayoffs: ReadonlySet<string>,
): Stage => {
  const captures = [...indexTerminals(tree).values()].filter(
    (info) => !info.node.trapped,
  );
  const prize = captures.reduce((a, b) =>
    b.node.payoff.attacker > a.node.payoff.attacker ? b : a,
  );
  const entered = (solution[tree.id].bestActionId ?? "").replace("root:", "");

  const options: StageOption[] = [
    {
      id: "correct",
      label: `Entering ${prize.bridge} lets the defender react, and that reaction leaves the attacker worse off than ${entered} does.`,
    },
    {
      id: "cost",
      label: `${prize.node.server} costs more to reach than it is worth.`,
    },
    { id: "trap", label: `${prize.node.server} is a honeypot.` },
    {
      id: "ch",
      label: "The defender's honeypot is too cheap for the attacker to care about.",
    },
  ];
  // Rotate so the right answer is not always listed first, deterministically
  // from the game's own numbers rather than from Math.random, so a re-render
  // never reshuffles the options under the student's cursor.
  const shift =
    (values.servers.S1 + values.servers.S2 + values.servers.S3 + values.servers.S4) %
    options.length;
  const rotated = [...options.slice(shift), ...options.slice(0, shift)];

  return {
    id: "concept",
    kind: "choice",
    player: "attacker",
    heading: "Last question",
    wide: true,
    prompt: `${prize.node.server} is the biggest payoff available to the attacker anywhere on this tree, worth ${prize.node.payoff.attacker}, and the attacker never takes it. Why not?`,
    weight: 10,
    options: rotated,
    visiblePayoffIds: allPayoffs,
    answer: "correct",
    answerLabel:
      options.find((o) => o.id === "correct")?.label ?? "",
    describe: (input) =>
      rotated.find((o) => o.id === input)?.label ?? "(no answer)",
  };
};

/**
 * How many graded stages the match will have in total.
 *
 * `buildStages` is lazy: the stages after a move only exist once that move is
 * committed, because their content depends on it. So the length of the list
 * grows during play, and reading it straight off made the progress counter
 * climb from "8" to "10" mid-match.
 *
 * The stage COUNT, though, does not depend on which action was chosen, only
 * that one was. So this walks a throwaway playthrough using the equilibrium
 * answers purely to count the result. Nothing from it reaches the UI except
 * the number.
 */
export const totalScorableStages = (
  game: GeneratedGame,
  role: Role,
): number => {
  const answers = new Map<string, string>();
  for (let i = 0; i < 64; i += 1) {
    const stages = buildStages(game, role, answers);
    if (i >= stages.length) {
      return stages.filter((stage) => stage.weight > 0).length;
    }
    answers.set(stages[i].id, stages[i].answer);
  }
  // Unreachable for any real game; a stage list this long means a builder bug.
  throw new Error("Lab 3 stage list did not terminate.");
};
