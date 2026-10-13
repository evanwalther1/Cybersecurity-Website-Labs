import type { Coverage, GameSetup } from "./stackelberg";
import { asPercent } from "./stackelberg";

// The network, with the defender's commitment drawn on it.
//
// Hand-rolled SVG for the same reasons as Lab 3's tree: the shape is fixed, the
// only hard part is the arithmetic of laying it out, and a library would fight
// us on styling. Unlike Lab 3 this is a flat one-hop network, so there is no
// layout algorithm at all, just evenly spaced targets.
//
// The coverage bar inside each target is the point of this component. The
// whole lab turns on x = (x1, x2, x3) being a thing you can reason about, and
// three bars are far easier to hold in your head than three decimals.

const W = 470;
const H = 300;
const ENTRY_Y = 40;
const ENTRY_R = 25;
const BOX_W = 118;
const BOX_H = 108;
const BOX_TOP = 158;
const BAR_W = 88;
const BAR_H = 14;

export interface TargetNetworkProps {
  game: GameSetup;
  /** Omit to draw the network with no commitment on it yet. */
  coverage?: Coverage;
  /** Target the attacker hits; its edge and box are drawn in attacker red. */
  attacked?: number | null;
  /** Target the current step is talking about; gets an accent ring. */
  highlight?: number | null;
}

export const TargetNetwork = ({
  game,
  coverage,
  attacked = null,
  highlight = null,
}: TargetNetworkProps) => {
  const n = game.targets.length;
  // Evenly spaced across the full width, so the entry node is centered over them
  // by construction rather than by a hand-picked constant.
  const slot = W / n;
  const xs = game.targets.map((_, i) => slot * (i + 0.5));
  const entryX = (xs[0] + xs[n - 1]) / 2;
  const boxMid = BOX_TOP + BOX_H / 2;

  return (
    <svg
      className="lab4-network"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Network: one entry point leading to three targets"
    >
      {game.targets.map((target, i) => {
        const isHit = attacked === i;
        return (
          <g
            key={`edge-${target.id}`}
            className={`lab4-edge ${isHit ? "is-attacked" : ""}`}
          >
            <line
              x1={entryX}
              y1={ENTRY_Y + ENTRY_R}
              x2={xs[i]}
              y2={BOX_TOP}
            />
            <text
              x={(entryX + xs[i]) / 2}
              y={(ENTRY_Y + ENTRY_R + BOX_TOP) / 2}
              dy="-3"
            >
              e{i + 1}={target.exploitCost}
            </text>
          </g>
        );
      })}

      <g className="lab4-entry">
        <circle cx={entryX} cy={ENTRY_Y} r={ENTRY_R} />
        <text x={entryX} y={ENTRY_Y + 6}>
          E
        </text>
      </g>

      {game.targets.map((target, i) => {
        const x = xs[i];
        const share = coverage?.[i];
        const isHit = attacked === i;
        const classes = [
          "lab4-target",
          isHit ? "is-attacked" : "",
          highlight === i ? "is-highlit" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <g key={target.id} className={classes}>
            <rect
              x={x - BOX_W / 2}
              y={BOX_TOP}
              width={BOX_W}
              height={BOX_H}
              rx={8}
            />
            <text className="lab4-target-id" x={x} y={BOX_TOP + 26}>
              {target.id}
            </text>
            <text className="lab4-target-value" x={x} y={BOX_TOP + 44}>
              worth {target.value}
            </text>

            {share === undefined ? (
              <text className="lab4-target-nocover" x={x} y={BOX_TOP + 78}>
                no commitment yet
              </text>
            ) : (
              <>
                {/* Track, then fill. The fill is the defender's coverage, so it
                    takes the defender's color. */}
                <rect
                  className="lab4-bar-track"
                  x={x - BAR_W / 2}
                  y={boxMid + 6}
                  width={BAR_W}
                  height={BAR_H}
                  rx={BAR_H / 2}
                />
                <rect
                  className="lab4-bar-fill"
                  x={x - BAR_W / 2}
                  y={boxMid + 6}
                  width={Math.max(0, Math.min(1, share)) * BAR_W}
                  height={BAR_H}
                  rx={BAR_H / 2}
                />
                <text className="lab4-target-pct" x={x} y={BOX_TOP + 97}>
                  {asPercent(share)} covered
                </text>
              </>
            )}

            {isHit && (
              <text className="lab4-target-hit" x={x} y={BOX_TOP - 10}>
                attacked
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
