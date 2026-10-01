import { useMemo } from "react";
import type { Action, GameNode, Solution } from "./gameTree";

// Renders a game tree as inline SVG.
//
// Why hand-rolled rather than a graph library: this tree is small (at most 21
// nodes) and completely static in shape, so the only hard part is the layout
// math, and that math is four lines. A library like React Flow is built for
// draggable, user-editable graphs and would fight us on every styling detail.
//
// The layout is the classic tidy-tree trick:
//   1. Walk the tree and give every *terminal* the next x slot, left to right.
//   2. Give every internal node the midpoint of its first and last child.
//   3. y is just the depth.
// That produces a tree where no subtrees overlap and every parent sits centered
// over its children, which is all we need for a fixed-shape tree like this one.

// These constants set the tree's proportions. The viewBox is sized from them
// and the whole drawing is then scaled to fit its panel, so SHRINKING X_SLOT or
// growing Y_GAP makes the rendered tree bigger as well as more vertical: a
// narrower viewBox means a larger scale factor for the same panel. X_SLOT is
// floored by TERMINAL_W (the boxes must not touch) and Y_GAP by the edge labels
// needing room between tiers.
const X_SLOT = 68; // horizontal distance between adjacent terminals
const Y_GAP = 160; // vertical distance between tiers
// Asymmetric on purpose. The left only has to clear half a terminal box, but
// the right also has to hold the value labels backward induction writes beside
// each node, and the rightmost of those would otherwise run past the viewBox.
const MARGIN_LEFT = 30;
const MARGIN_RIGHT = 57;
const MARGIN_Y = 38;
const TERMINAL_W = 56;
const TERMINAL_H = 44;
const NODE_R = 22;
// Where along an edge its click target begins, as a fraction from parent to
// child. Keeps sibling hit areas from overlapping near their shared parent.
const HIT_START = 0.34;

interface Placed {
  node: GameNode;
  x: number;
  y: number;
  depth: number;
}

interface PlacedEdge {
  action: Action;
  parent: Placed;
  child: Placed;
}

interface Layout {
  nodes: Placed[];
  edges: PlacedEdge[];
  width: number;
  height: number;
  byId: Record<string, Placed>;
}

const buildLayout = (root: GameNode): Layout => {
  const nodes: Placed[] = [];
  const edges: PlacedEdge[] = [];
  const byId: Record<string, Placed> = {};
  let nextSlot = 0;
  let maxDepth = 0;

  const place = (node: GameNode, depth: number): Placed => {
    maxDepth = Math.max(maxDepth, depth);
    if (node.kind === "terminal") {
      const placed: Placed = {
        node,
        x: MARGIN_LEFT + nextSlot * X_SLOT,
        y: MARGIN_Y + depth * Y_GAP,
        depth,
      };
      nextSlot += 1;
      nodes.push(placed);
      byId[node.id] = placed;
      return placed;
    }

    const children = node.actions.map((action) => ({
      action,
      placed: place(action.child, depth + 1),
    }));

    const first = children[0].placed.x;
    const last = children[children.length - 1].placed.x;
    const placed: Placed = {
      node,
      x: (first + last) / 2,
      y: MARGIN_Y + depth * Y_GAP,
      depth,
    };
    nodes.push(placed);
    byId[node.id] = placed;
    children.forEach(({ action, placed: child }) =>
      edges.push({ action, parent: placed, child }),
    );
    return placed;
  };

  place(root, 0);

  return {
    nodes,
    edges,
    byId,
    width: MARGIN_LEFT + MARGIN_RIGHT + Math.max(0, nextSlot - 1) * X_SLOT,
    height: MARGIN_Y * 2 + maxDepth * Y_GAP + TERMINAL_H,
  };
};

// Every node id inside the subtree rooted at `id`, used to dim everything else
// when the walkthrough is focused on one subgame.
const subtreeIds = (root: GameNode, id: string): Set<string> => {
  const found = new Set<string>();
  const collect = (node: GameNode) => {
    found.add(node.id);
    if (node.kind === "decision") node.actions.forEach((a) => collect(a.child));
  };
  const find = (node: GameNode): boolean => {
    if (node.id === id) {
      collect(node);
      return true;
    }
    if (node.kind === "terminal") return false;
    return node.actions.some((a) => find(a.child));
  };
  find(root);
  return found;
};

export interface GameTreeSVGProps {
  tree: GameNode;
  solution?: Solution;
  /** Nodes whose backward-induction value should be displayed beside them. */
  solvedNodeIds?: Set<string>;
  /** Edges eliminated by backward induction. */
  prunedActionIds?: Set<string>;
  /** Edges that survived, drawn heavy. */
  survivingActionIds?: Set<string>;
  /** Restrict full opacity to this subgame; everything else dims. */
  focusNodeId?: string;
  /** Edges the student has walked during the play-it step. */
  playedActionIds?: Set<string>;
  /** Show terminal payoff pairs. Off during the read-the-graph step. */
  showPayoffs?: boolean;
  /**
   * When present, ONLY these terminals show their payoffs; every other one
   * renders "?". Practice uses it for the recon round, where the student works
   * the payoffs out from the formulas one terminal at a time.
   */
  visiblePayoffIds?: ReadonlySet<string>;
  /** Only actions leaving this node are clickable. */
  clickableNodeId?: string;
  /** Node the student is currently being asked about; gets a pulsing ring. */
  activeNodeId?: string;
  /**
   * Text to show beside a node INSTEAD of its solved value. Practice uses this
   * to display what the student entered, right or wrong, rather than the
   * solver's answer.
   */
  nodeValueLabels?: Record<string, string>;
  onActionClick?: (action: Action) => void;
}

const payoffText = (node: GameNode): string =>
  node.kind === "terminal"
    ? `(${node.payoff.attacker}, ${node.payoff.defender})`
    : "";

export const GameTreeSVG = ({
  tree,
  solution,
  solvedNodeIds,
  prunedActionIds,
  survivingActionIds,
  focusNodeId,
  playedActionIds,
  showPayoffs = true,
  visiblePayoffIds,
  clickableNodeId,
  activeNodeId,
  nodeValueLabels,
  onActionClick,
}: GameTreeSVGProps) => {
  const layout = useMemo(() => buildLayout(tree), [tree]);
  const inFocus = useMemo(
    () => (focusNodeId ? subtreeIds(tree, focusNodeId) : null),
    [tree, focusNodeId],
  );

  const dimmed = (id: string) => inFocus !== null && !inFocus.has(id);

  return (
    <svg
      className="lab3-tree"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Extensive-form game tree"
    >
      {layout.edges.map(({ action, parent, child }) => {
        const pruned = prunedActionIds?.has(action.id);
        const surviving = survivingActionIds?.has(action.id);
        const played = playedActionIds?.has(action.id);
        const clickable =
          clickableNodeId !== undefined && parent.node.id === clickableNodeId;
        const classes = [
          "lab3-edge",
          `lab3-edge-${action.owner}`,
          pruned ? "is-pruned" : "",
          surviving ? "is-surviving" : "",
          played ? "is-played" : "",
          dimmed(child.node.id) ? "is-dimmed" : "",
          clickable ? "is-clickable" : "",
        ]
          .filter(Boolean)
          .join(" ");

        // Edge labels stay terse on purpose. The bottom tier shows only the
        // exploit cost, because the terminal box underneath already names the
        // server, and repeating it at X_SLOT spacing would collide.
        const label =
          action.owner === "defender"
            ? action.label
                .replace("Honeypot ", "HP ")
                .replace("No honeypot", "none")
            : child.node.kind === "terminal"
              ? `·${action.exploitCost}`
              : `${action.label.replace("Attack ", "")} ·${action.exploitCost}`;

        // The drawn edge stops short at both ends so it does not run under the
        // parent circle or the child's box. The hit line is measured along
        // THESE endpoints, not parent-centre to child-centre, so the click band
        // sits exactly on the line the student can see.
        const x1 = parent.x;
        const y1 = parent.y + NODE_R;
        const x2 = child.x;
        const y2 =
          child.y - (child.node.kind === "terminal" ? TERMINAL_H / 2 : NODE_R);

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        return (
          <g key={action.id} className={classes}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <text className="lab3-edge-label" x={midX} y={midY} dy="-3">
              {label}
            </text>
            {clickable && onActionClick && (
              // A fat transparent line over the top so the click target is
              // forgiving without making the drawn stroke thick. It starts
              // HIT_START of the way down rather than at the parent, because
              // every edge leaving a node begins at the same point, so hit
              // areas that reached all the way up would overlap and the last
              // one drawn would swallow clicks meant for its siblings.
              <line
                className="lab3-edge-hit"
                x1={x1 + (x2 - x1) * HIT_START}
                y1={y1 + (y2 - y1) * HIT_START}
                x2={x2}
                y2={y2}
                onClick={() => onActionClick(action)}
              />
            )}
          </g>
        );
      })}

      {layout.nodes.map((placed) => {
        const { node, x, y } = placed;
        const isDim = dimmed(node.id);

        if (node.kind === "terminal") {
          return (
            <g
              key={node.id}
              className={[
                "lab3-terminal",
                node.trapped ? "is-trapped" : "",
                isDim ? "is-dimmed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <rect
                x={x - TERMINAL_W / 2}
                y={y - TERMINAL_H / 2}
                width={TERMINAL_W}
                height={TERMINAL_H}
                rx={6}
              />
              <text className="lab3-terminal-name" x={x} y={y - 4}>
                {node.server}
              </text>
              {showPayoffs && (
                <text className="lab3-terminal-payoff" x={x} y={y + 13}>
                  {visiblePayoffIds && !visiblePayoffIds.has(node.id)
                    ? "?"
                    : payoffText(node)}
                </text>
              )}
            </g>
          );
        }

        const solved = solvedNodeIds?.has(node.id)
          ? solution?.[node.id]
          : undefined;
        // A supplied label always wins, so Practice can show the student's own
        // figure next to a node even when it disagrees with the solver.
        const solvedText =
          nodeValueLabels?.[node.id] ??
          (solved ? `(${solved.value.attacker}, ${solved.value.defender})` : null);

        return (
          <g
            key={node.id}
            className={[
              "lab3-node",
              `lab3-node-${node.player}`,
              node.id === activeNodeId ? "is-active" : "",
              isDim ? "is-dimmed" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <circle cx={x} cy={y} r={NODE_R} />
            <text className="lab3-node-letter" x={x} y={y + 6}>
              {node.player === "attacker" ? "A" : "D"}
            </text>
            {solvedText && (
              <text className="lab3-node-value" x={x + NODE_R + 5} y={y + 5}>
                {solvedText}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
