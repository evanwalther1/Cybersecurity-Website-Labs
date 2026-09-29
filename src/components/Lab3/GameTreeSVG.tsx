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

// These four constants set the tree's proportions. The viewBox is sized from
// them, and the whole drawing is then scaled to fit its panel, so SHRINKING
// X_SLOT or growing Y_GAP makes the rendered tree bigger as well as more
// vertical: a narrower viewBox means a larger scale factor for the same panel.
// X_SLOT is floored by TERMINAL_W (the boxes must not touch) and Y_GAP is
// floored by the edge labels needing room between tiers.
const X_SLOT = 68; // horizontal distance between adjacent terminals
const Y_GAP = 160; // vertical distance between tiers
// The margins are asymmetric on purpose. The left only has to clear half a
// terminal box, but the right also has to hold the value labels that backward
// induction writes beside each node, and the rightmost of those would
// otherwise run past the viewBox edge.
const MARGIN_LEFT = 30;
const MARGIN_RIGHT = 57;
const MARGIN_Y = 38;
const TERMINAL_W = 56;
const TERMINAL_H = 44;
const NODE_R = 22;

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
  /** Only actions leaving this node are clickable. */
  clickableNodeId?: string;
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
  clickableNodeId,
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
            ? action.label.replace("Honeypot ", "HP ").replace("No honeypot", "none")
            : child.node.kind === "terminal"
              ? `·${action.exploitCost}`
              : `${action.label.replace("Attack ", "")} ·${action.exploitCost}`;

        const midX = (parent.x + child.x) / 2;
        const midY = (parent.y + child.y) / 2;

        return (
          <g key={action.id} className={classes}>
            <line
              x1={parent.x}
              y1={parent.y + NODE_R}
              x2={child.x}
              y2={child.y - (child.node.kind === "terminal" ? TERMINAL_H / 2 : NODE_R)}
            />
            <text className="lab3-edge-label" x={midX} y={midY} dy="-3">
              {label}
            </text>
            {clickable && onActionClick && (
              // A fat transparent line over the top so the click target is
              // forgiving without making the drawn stroke thick.
              <line
                className="lab3-edge-hit"
                x1={parent.x}
                y1={parent.y}
                x2={child.x}
                y2={child.y}
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
                  {payoffText(node)}
                </text>
              )}
            </g>
          );
        }

        const solved = solvedNodeIds?.has(node.id) ? solution?.[node.id] : undefined;
        const solvedText = solved
          ? `(${solved.value.attacker}, ${solved.value.defender})`
          : null;

        return (
          <g
            key={node.id}
            className={[
              "lab3-node",
              `lab3-node-${node.player}`,
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
