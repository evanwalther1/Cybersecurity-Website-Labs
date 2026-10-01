// Lab 3's game tree, plus the backward-induction solver that finds the SPNE.
//
// This file is deliberately pure TypeScript with no React in it. The tree and
// the solver are the part of Lab 3 that has to be *correct*, and keeping them
// out of a component means they can be exercised directly (see the verify
// script notes at the bottom) instead of only through the UI.
//
// Structure of the network being attacked:
//
//                          Entry
//                         /     \
//                       N1       N2        <- bridge nodes, no value
//                      /  \     /  \
//                    S1   S2   S3   S4     <- servers, the only things worth taking
//
// N1 and N2 are waypoints, not targets. Only the four servers carry value.

export type Player = "attacker" | "defender";
export type ServerId = "S1" | "S2" | "S3" | "S4";
export type BridgeId = "N1" | "N2";

export interface Payoff {
  attacker: number;
  defender: number;
}

export interface GameValues {
  servers: Record<ServerId, number>;
  // One exploit cost per edge in the network. The attacker pays the cost of
  // every edge they traverse, which is what makes a terminal's payoff depend
  // on the whole path rather than just on which server they landed on.
  edgeCosts: {
    entryN1: number;
    entryN2: number;
    n1S1: number;
    n1S2: number;
    n2S3: number;
    n2S4: number;
  };
  honeypotCost: number;
  // What getting caught costs the attacker beyond the exploit costs already
  // sunk into the approach: burned tooling, attribution, lost access. Applied
  // on top of capturing nothing.
  capturePenalty: number;
}

// The instance the Example walks through. Chosen so that:
//   - the defender's two nodes reach *different* conclusions (no honeypot at
//     N1, honeypot S3 at N2), so the lab can't be passed by pattern-matching;
//   - the attacker's single best terminal (S3, net 6) sits in the branch the
//     attacker must avoid, so the greedy answer is wrong;
//   - every comparison at every decision node is strict, so the SPNE is unique.
export const EXAMPLE_VALUES: GameValues = {
  servers: { S1: 10, S2: 6, S3: 9, S4: 5 },
  edgeCosts: { entryN1: 2, entryN2: 2, n1S1: 8, n1S2: 1, n2S3: 1, n2S4: 2 },
  honeypotCost: 3,
  capturePenalty: 4,
};

export const totalServerValue = (values: GameValues): number =>
  values.servers.S1 + values.servers.S2 + values.servers.S3 + values.servers.S4;

export interface Action {
  id: string;
  label: string;
  // Who is making this move. Carried on the edge as well as the node so the
  // renderer can color an edge without walking back up to its parent.
  owner: Player;
  // Present only on edges the attacker physically traverses. Defender honeypot
  // placements are choices, not movements, so they have no exploit cost.
  exploitCost?: number;
  child: GameNode;
}

export type GameNode =
  | {
      kind: "decision";
      id: string;
      player: Player;
      label: string;
      actions: Action[];
    }
  | {
      kind: "terminal";
      id: string;
      server: ServerId;
      // True when the attacker walked onto a honeypotted server: they capture
      // nothing and pay the capture penalty on top of their sunk exploit costs.
      trapped: boolean;
      payoff: Payoff;
    };

/**
 * The two halves of GameNode, named so callers can hold one without TypeScript
 * widening it back to the union. `Extract<Union, { kind: "..." }>` picks a
 * single member of a discriminated union by its tag, which beats redeclaring
 * the shape and letting the two drift apart.
 */
export type DecisionNode = Extract<GameNode, { kind: "decision" }>;
export type TerminalNode = Extract<GameNode, { kind: "terminal" }>;

export interface Solved {
  value: Payoff;
  /** Undefined at terminals, where nobody chooses anything. */
  bestActionId?: string;
}

export type Solution = Record<string, Solved>;

// Backward induction. Solve every child first, then let the player who owns
// this node pick the action that maximizes *their own* component of the payoff
// pair. The whole pair propagates upward, not just the chooser's number: the
// attacker at the root needs to know what they get in a subgame, and that is
// determined by a choice the defender makes inside it.
export const solve = (node: GameNode, out: Solution): Payoff => {
  if (node.kind === "terminal") {
    out[node.id] = { value: node.payoff };
    return node.payoff;
  }

  const results = node.actions.map((action) => ({
    action,
    value: solve(action.child, out),
  }));

  const best = results.reduce((a, b) =>
    b.value[node.player] > a.value[node.player] ? b : a,
  );

  out[node.id] = { value: best.value, bestActionId: best.action.id };
  return best.value;
};

// Decision nodes where the owning player is indifferent between two or more
// actions. A tie means the SPNE is not unique, so the node has no single
// correct answer and cannot be graded. Practice's generator has to reject any
// tree that produces one.
export const tiedNodes = (root: GameNode, solution: Solution): string[] => {
  const out: string[] = [];
  const walk = (node: GameNode) => {
    if (node.kind === "terminal") return;
    const best = solution[node.id].value[node.player];
    const atBest = node.actions.filter(
      (a) => solution[a.child.id].value[node.player] === best,
    );
    if (atBest.length > 1) out.push(node.id);
    node.actions.forEach((a) => walk(a.child));
  };
  walk(root);
  return out;
};

// Nodes where the attacker would rather walk into a honeypot than take a real
// server, which is narratively absurd and means the value set is unusable.
// Can happen when the alternative server costs more to reach than it is worth.
export const trapPreferredNodes = (
  root: GameNode,
  solution: Solution,
): string[] => {
  const out: string[] = [];
  const walk = (node: GameNode) => {
    if (node.kind === "terminal") return;
    const chosen = node.actions.find(
      (a) => a.id === solution[node.id].bestActionId,
    );
    if (chosen?.child.kind === "terminal" && chosen.child.trapped) {
      out.push(node.id);
    }
    node.actions.forEach((a) => walk(a.child));
  };
  walk(root);
  return out;
};

export const solveTree = (root: GameNode): Solution => {
  const out: Solution = {};
  solve(root, out);
  return out;
};

// ---------------------------------------------------------------------------
// Tree builders
// ---------------------------------------------------------------------------

const makeTerminal = (
  id: string,
  server: ServerId,
  trapped: boolean,
  values: GameValues,
  pathCost: number,
  honeypotDeployed: boolean,
): GameNode => {
  // A trapped attacker captures nothing, so there is no damage for the
  // defender either. Both formulas are the ordinary ones with the captured
  // value set to zero; the only addition is the attacker's capture penalty.
  const damage = trapped ? 0 : values.servers[server];
  return {
    kind: "terminal",
    id,
    server,
    trapped,
    payoff: {
      // Ua = Sx - sum of exploit costs on every edge traversed, minus the
      // capture penalty if this was a honeypot.
      attacker: damage - pathCost - (trapped ? values.capturePenalty : 0),
      // Ud = sum of ALL four servers (a constant) - damage - honeypot cost.
      defender:
        totalServerValue(values) -
        damage -
        (honeypotDeployed ? values.honeypotCost : 0),
    },
  };
};

const BRANCH: Record<
  BridgeId,
  { left: ServerId; right: ServerId; entry: keyof GameValues["edgeCosts"]; leftEdge: keyof GameValues["edgeCosts"]; rightEdge: keyof GameValues["edgeCosts"] }
> = {
  N1: { left: "S1", right: "S2", entry: "entryN1", leftEdge: "n1S1", rightEdge: "n1S2" },
  N2: { left: "S3", right: "S4", entry: "entryN2", leftEdge: "n2S3", rightEdge: "n2S4" },
};

// The attacker's final move: having entered `bridge` and seen where (or
// whether) the defender placed a honeypot, pick a server.
const makeAttackerLeafNode = (
  bridge: BridgeId,
  honeypotOn: ServerId | null,
  values: GameValues,
): GameNode => {
  const b = BRANCH[bridge];
  const entryCost = values.edgeCosts[b.entry];
  const suffix = honeypotOn ?? "none";
  const id = `a:${bridge}:${suffix}`;

  const leg = (server: ServerId, edge: keyof GameValues["edgeCosts"]) => {
    const cost = values.edgeCosts[edge];
    return {
      id: `${id}:${server}`,
      label: `Attack ${server}`,
      owner: "attacker" as const,
      exploitCost: cost,
      child: makeTerminal(
        `t:${bridge}:${suffix}:${server}`,
        server,
        honeypotOn === server,
        values,
        entryCost + cost,
        honeypotOn !== null,
      ),
    };
  };

  return {
    kind: "decision",
    id,
    player: "attacker",
    // The label has to name the honeypot placement, not just the bridge. All
    // three of these nodes sit under N1, and the strategy profile lists them
    // separately, so "Attacker at N1" alone would be ambiguous three times.
    label: honeypotOn
      ? `Attacker at ${bridge}, ${honeypotOn} honeypotted`
      : `Attacker at ${bridge}, no honeypot`,
    actions: [leg(b.left, b.leftEdge), leg(b.right, b.rightEdge)],
  };
};

// The defender's move in the attacker-first game: having watched the attacker
// enter `bridge`, honeypot one of the two servers below it or spend nothing.
//
// The "no honeypot" option is what keeps this decision interesting. Sum(Sx) and
// Ch are both constants, so without it only D varies and the defender collapses
// into "always protect the bigger server". With it, the defender is weighing Ch
// against the gap between the two servers, and eating the damage is sometimes
// correct.
const makeDefenderNode = (bridge: BridgeId, values: GameValues): GameNode => {
  const b = BRANCH[bridge];
  const id = `d:${bridge}`;
  const option = (honeypotOn: ServerId | null) => ({
    id: `${id}:${honeypotOn ?? "none"}`,
    label: honeypotOn ? `Honeypot ${honeypotOn}` : "No honeypot",
    owner: "defender" as const,
    child: makeAttackerLeafNode(bridge, honeypotOn, values),
  });

  return {
    kind: "decision",
    id,
    player: "defender",
    label: `Defender responds to ${bridge}`,
    actions: [option(b.left), option(b.right), option(null)],
  };
};

// Attacker-first: attacker picks a bridge, defender responds, attacker picks a
// server. Three decision layers, 9 decision nodes, 12 terminals. The attacker
// moves last, which is the rule that fixes this shape: it never makes sense to
// leave the attacker standing on a bridge node.
export const buildAttackerFirstTree = (values: GameValues): GameNode => ({
  kind: "decision",
  id: "root",
  player: "attacker",
  label: "Attacker chooses an entry point",
  actions: (["N1", "N2"] as BridgeId[]).map((bridge) => ({
    id: `root:${bridge}`,
    label: `Attack ${bridge}`,
    owner: "attacker" as const,
    exploitCost: values.edgeCosts[BRANCH[bridge].entry],
    child: makeDefenderNode(bridge, values),
  })),
});

// Defender-first: the defender commits to a node, every server beneath it gains
// the honeypot property, and the attacker is confined to that node's two
// servers. Two decision layers, 4 terminals, all of them honeypot captures.
//
// IMPORTANT, and this is a known property rather than a bug: because the
// attacker can only reach honeypotted servers, they are always caught, so D is
// always 0 and `Ud = SUM(Sx) - Ch` is the SAME NUMBER at all four terminals.
// The defender is therefore indifferent at the root and this game has no unique
// SPNE (`tiedNodes` reports the root).
//
// Distinct exploit costs fix the ATTACKER's side of this: with n1S1 != n1S2 and
// n2S3 != n2S4 the attacker has a real, strict comparison inside each branch,
// choosing the cheaper way to get caught. They cannot fix the defender's side,
// because exploit costs appear only in Ua and never in Ud.
export const buildDefenderFirstTree = (values: GameValues): GameNode => ({
  kind: "decision",
  id: "root",
  player: "defender",
  label: "Defender chooses a node to defend",
  actions: (["N1", "N2"] as BridgeId[]).map((defended) => {
    const b = BRANCH[defended];
    const id = `a:defend-${defended}`;
    const leg = (server: ServerId, edge: keyof GameValues["edgeCosts"]) => ({
      id: `${id}:${server}`,
      label: `Attack ${server}`,
      owner: "attacker" as const,
      exploitCost: values.edgeCosts[edge],
      child: makeTerminal(
        `t:defend-${defended}:${server}`,
        server,
        // Every server under the defended node is honeypotted, so the attacker
        // is caught wherever they go.
        true,
        values,
        values.edgeCosts[b.entry] + values.edgeCosts[edge],
        true,
      ),
    });
    return {
      id: `root:${defended}`,
      label: `Defend ${defended}`,
      owner: "defender" as const,
      child: {
        kind: "decision" as const,
        id,
        player: "attacker" as const,
        label: `Attacker at ${defended}, both servers honeypotted`,
        actions: [leg(b.left, b.leftEdge), leg(b.right, b.rightEdge)],
      },
    };
  }),
});

// ---------------------------------------------------------------------------
// Helpers the UI needs
// ---------------------------------------------------------------------------

// Walks the tree collecting the actions the SPNE prescribes at every decision
// node, including nodes that equilibrium play never reaches. This is the
// distinction the lab is built around: an SPNE is a strategy profile, not a
// path, and the off-path entries are exactly why the on-path choices are made.
export const strategyProfile = (
  root: GameNode,
  solution: Solution,
): { nodeId: string; player: Player; label: string; actionLabel: string }[] => {
  const out: ReturnType<typeof strategyProfile> = [];
  const walk = (node: GameNode) => {
    if (node.kind === "terminal") return;
    const chosen = solution[node.id]?.bestActionId;
    const action = node.actions.find((a) => a.id === chosen);
    if (action) {
      out.push({
        nodeId: node.id,
        player: node.player,
        label: node.label,
        actionLabel: action.label,
      });
    }
    node.actions.forEach((a) => walk(a.child));
  };
  walk(root);
  return out;
};

// The sequence of actions actually played when both players follow the SPNE.
export const equilibriumPath = (
  root: GameNode,
  solution: Solution,
): { nodeIds: string[]; actionIds: string[] } => {
  const nodeIds: string[] = [];
  const actionIds: string[] = [];
  let node = root;
  for (;;) {
    nodeIds.push(node.id);
    if (node.kind === "terminal") break;
    const chosen = solution[node.id]?.bestActionId;
    const action = node.actions.find((a) => a.id === chosen);
    if (!action) break;
    actionIds.push(action.id);
    node = action.child;
  }
  return { nodeIds, actionIds };
};

export const findNode = (root: GameNode, id: string): GameNode | undefined => {
  if (root.id === id) return root;
  if (root.kind === "terminal") return undefined;
  for (const action of root.actions) {
    const hit = findNode(action.child, id);
    if (hit) return hit;
  }
  return undefined;
};

export const collectDecisionNodes = (root: GameNode): DecisionNode[] => {
  const out: DecisionNode[] = [];
  const walk = (node: GameNode) => {
    if (node.kind === "terminal") return;
    out.push(node);
    node.actions.forEach((a) => walk(a.child));
  };
  walk(root);
  return out;
};

// A node is on the bottom decision tier when every one of its actions leads
// straight to a terminal. Derived rather than matched on the id scheme so the
// walkthrough keeps working if the tree shape ever changes.
// Deliberately a plain boolean rather than a `node is DecisionNode` type guard.
// As a guard, TypeScript would narrow the NEGATIVE branch of
// `filter(n => !isBottomTier(n))` to `never` when the input is already
// DecisionNode[], which is exactly how Practice splits the tiers apart.
export const isBottomTier = (node: GameNode): boolean =>
  node.kind === "decision" &&
  node.actions.every((a) => a.child.kind === "terminal");

// Splits the actions leaving each of `nodeIds` into the one backward induction
// kept and the ones it eliminated, which is what the renderer draws.
export const prunedAndSurviving = (
  root: GameNode,
  solution: Solution,
  nodeIds: string[],
): { surviving: Set<string>; pruned: Set<string> } => {
  const surviving = new Set<string>();
  const pruned = new Set<string>();
  nodeIds.forEach((id) => {
    const node = findNode(root, id);
    if (!node || node.kind !== "decision") return;
    const best = solution[id]?.bestActionId;
    node.actions.forEach((a) => (a.id === best ? surviving : pruned).add(a.id));
  });
  return { surviving, pruned };
};

// ---------------------------------------------------------------------------
// Practice game generation
// ---------------------------------------------------------------------------

// Everything Practice needs to know about a generated game, so the component
// never has to re-derive it.
export interface GeneratedGame {
  values: GameValues;
  tree: GameNode;
  solution: Solution;
}

const randInt = (rng: () => number, lo: number, hi: number): number =>
  lo + Math.floor(rng() * (hi - lo + 1));

// Which bridge a server hangs off, and the leg that reaches it.
const SERVER_BRIDGE: Record<ServerId, BridgeId> = {
  S1: "N1",
  S2: "N1",
  S3: "N2",
  S4: "N2",
};

// A generated game is only usable if every one of these holds. Together they
// guarantee the tree is gradeable AND that it teaches the same lesson every
// time, so a student who hits Restart gets different numbers at the same
// difficulty rather than an easier tree.
export const describeUnusable = (values: GameValues): string | null => {
  // The two legs under a bridge must differ, or the attacker can tie when the
  // only thing separating two options is the cost of reaching them.
  if (values.edgeCosts.n1S1 === values.edgeCosts.n1S2) return "N1 legs equal";
  if (values.edgeCosts.n2S3 === values.edgeCosts.n2S4) return "N2 legs equal";

  const tree = buildAttackerFirstTree(values);
  const solution = solveTree(tree);

  // No indifference anywhere, or the SPNE is not unique and cannot be graded.
  if (tiedNodes(tree, solution).length > 0) return "tie";

  // The attacker must never prefer being caught to a real capture.
  if (trapPreferredNodes(tree, solution).length > 0) return "trap preferred";

  // The two defender nodes must reach different conclusions, or the student can
  // pattern-match one rule across the whole tree instead of reasoning.
  const choiceAt = (id: string) =>
    solution[id].bestActionId?.slice(id.length + 1) ?? "";
  if (choiceAt("d:N1") === choiceAt("d:N2")) return "defender nodes agree";

  // The greedy trap must be live: the attacker's single best terminal has to
  // sit in the branch they do NOT enter. Otherwise a student who ignores the
  // defender entirely still picks the right first move.
  let best: { server: ServerId; value: number } | null = null;
  const scan = (node: GameNode) => {
    if (node.kind === "terminal") {
      if (!node.trapped && (best === null || node.payoff.attacker > best.value)) {
        best = { server: node.server, value: node.payoff.attacker };
      }
      return;
    }
    node.actions.forEach((a) => scan(a.child));
  };
  scan(tree);
  if (!best) return "no reachable capture";
  const entered = solution["root"].bestActionId?.slice("root:".length);
  if (SERVER_BRIDGE[(best as { server: ServerId }).server] === entered) {
    return "greedy answer is correct";
  }

  // The attacker must actually come out ahead, or the lesson is muddied by a
  // game nobody would play.
  if (solution["root"].value.attacker <= 0) return "attacker cannot profit";

  return null;
};

// Rejection sampling. The constraints are cheap (one solve per candidate), so
// this is far simpler than trying to construct a valid game directly.
export const generateGame = (
  rng: () => number = Math.random,
  maxAttempts = 20000,
): GeneratedGame => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const values: GameValues = {
      servers: {
        S1: randInt(rng, 6, 15),
        S2: randInt(rng, 6, 15),
        S3: randInt(rng, 6, 15),
        S4: randInt(rng, 6, 15),
      },
      edgeCosts: {
        entryN1: randInt(rng, 1, 3),
        entryN2: randInt(rng, 1, 3),
        n1S1: randInt(rng, 1, 9),
        n1S2: randInt(rng, 1, 9),
        n2S3: randInt(rng, 1, 9),
        n2S4: randInt(rng, 1, 9),
      },
      honeypotCost: randInt(rng, 2, 6),
      capturePenalty: randInt(rng, 3, 7),
    };
    if (describeUnusable(values) === null) {
      const tree = buildAttackerFirstTree(values);
      return { values, tree, solution: solveTree(tree) };
    }
  }
  throw new Error("Could not generate a usable Lab 3 game.");
};

// The honeypot cost at which a defender node flips from "worth it" to "not".
//
// The defender buys the honeypot when it shifts the attacker onto a cheaper
// server by more than the honeypot costs:
//
//   Ud(honeypot)  >  Ud(nothing)
//   SUM(Sx) - D_shift - Ch  >  SUM(Sx) - D_none
//   D_none - D_shift  >  Ch
//
// So the break-even honeypot cost is Ch* = D_none - D_shift, where the two
// options pay exactly the same. Rearranging in terms of the two Ud figures
// already on the tree, Ch* = Ud(honeypot) - Ud(nothing) + Ch.
//
// Returns null when this node declined the honeypot, since there is then no
// threshold to find. This is the one Practice question that cannot be answered
// by comparing two numbers on screen; it has to be derived.
export const honeypotThreshold = (
  node: DecisionNode,
  solution: Solution,
  values: GameValues,
): number | null => {
  if (node.player !== "defender") return null;
  const chosen = node.actions.find(
    (a) => a.id === solution[node.id].bestActionId,
  );
  const none = node.actions.find((a) => a.label === "No honeypot");
  if (!chosen || !none || chosen.id === none.id) return null;

  const udChosen = solution[chosen.child.id].value.defender;
  const udNone = solution[none.child.id].value.defender;
  return udChosen - udNone + values.honeypotCost;
};

// The defender node the threshold question is asked about: whichever one bought
// a honeypot. The generator guarantees the two defender nodes disagree, so at
// most one can be "No honeypot" and at least one always honeypots.
export const honeypotNode = (
  tree: GameNode,
  solution: Solution,
  values: GameValues,
): { node: DecisionNode; threshold: number } | null => {
  for (const node of collectDecisionNodes(tree)) {
    if (node.player !== "defender") continue;
    const threshold = honeypotThreshold(node, solution, values);
    if (threshold !== null) return { node, threshold };
  }
  return null;
};
