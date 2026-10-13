import { useState } from "react";
import CIcon from "@coreui/icons-react";
import { cilSitemap, cilX } from "@coreui/icons";
import { totalServerValue } from "./gameTree";
import type { GameValues } from "./gameTree";

// A always-available look at the NETWORK, which is a different diagram from the
// one the labs normally show.
//
// The big diagram in both tabs is the *action* graph: it repeats the same
// servers many times over, once per sequence of moves that can reach them, and
// its layers are turns rather than hops. That is the right picture for solving
// the game and the wrong picture for understanding the network, because S1
// appears in it six times.
//
// This is the network itself: one Entry, two bridge nodes, four servers, six
// links. Each server appears exactly once. It is static for a given game, so
// it lives behind a button rather than taking up room on screen.

interface NetworkPeekProps {
  values: GameValues;
}

// Fixed geometry. The shape never changes (one entry, two bridges, four
// servers), so there is nothing to compute here the way the game tree needs.
const W = 420;
const H = 240;
const SERVER_X = [52, 160, 268, 376];
const SERVER_Y = 205;
// Each bridge sits over the midpoint of its two servers, and the entry over
// the midpoint of the bridges, so the whole thing is symmetric by construction
// rather than by eyeballed constants.
const BRIDGE_X = [
  (SERVER_X[0] + SERVER_X[1]) / 2,
  (SERVER_X[2] + SERVER_X[3]) / 2,
];
const BRIDGE_Y = 118;
const ENTRY_X = (BRIDGE_X[0] + BRIDGE_X[1]) / 2;
const ENTRY_Y = 32;
const NODE_R = 21;
const BOX_W = 62;
const BOX_H = 42;

export const NetworkPeek = ({ values }: NetworkPeekProps) => {
  const [open, setOpen] = useState(false);

  const servers = [
    { id: "S1", value: values.servers.S1, cost: values.edgeCosts.n1S1, bridge: 0 },
    { id: "S2", value: values.servers.S2, cost: values.edgeCosts.n1S2, bridge: 0 },
    { id: "S3", value: values.servers.S3, cost: values.edgeCosts.n2S3, bridge: 1 },
    { id: "S4", value: values.servers.S4, cost: values.edgeCosts.n2S4, bridge: 1 },
  ];
  const entryCosts = [values.edgeCosts.entryN1, values.edgeCosts.entryN2];

  return (
    <div className="lab3-netpeek">
      <button
        type="button"
        className="lab3-netpeek-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        title={open ? "Hide the network" : "Show the network"}
      >
        <CIcon icon={cilSitemap} />
        <span>Network</span>
      </button>

      {open && (
        <div className="lab3-netpeek-panel">
          <div className="lab3-netpeek-head">
            <span className="lab3-netpeek-title">The network</span>
            <button
              type="button"
              className="lab3-netpeek-close"
              onClick={() => setOpen(false)}
              aria-label="Hide the network"
            >
              <CIcon icon={cilX} />
            </button>
          </div>

          <svg
            className="lab3-netpeek-svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Network topology: one entry point, two bridge nodes, four servers"
          >
            {/* Entry to each bridge */}
            {BRIDGE_X.map((bx, i) => (
              <g key={`entry-${i}`} className="lab3-net-edge">
                <line
                  x1={ENTRY_X}
                  y1={ENTRY_Y + NODE_R}
                  x2={bx}
                  y2={BRIDGE_Y - NODE_R}
                />
                <text
                  x={(ENTRY_X + bx) / 2}
                  y={(ENTRY_Y + BRIDGE_Y) / 2}
                  dy="-4"
                >
                  {"·"}
                  {entryCosts[i]}
                </text>
              </g>
            ))}

            {/* Each bridge to its two servers */}
            {servers.map((server, i) => (
              <g key={`leg-${server.id}`} className="lab3-net-edge">
                <line
                  x1={BRIDGE_X[server.bridge]}
                  y1={BRIDGE_Y + NODE_R}
                  x2={SERVER_X[i]}
                  y2={SERVER_Y - BOX_H / 2}
                />
                <text
                  x={(BRIDGE_X[server.bridge] + SERVER_X[i]) / 2}
                  y={(BRIDGE_Y + SERVER_Y) / 2}
                  dy="-4"
                >
                  {"·"}
                  {server.cost}
                </text>
              </g>
            ))}

            {/* Entry */}
            <g className="lab3-net-node is-entry">
              <circle cx={ENTRY_X} cy={ENTRY_Y} r={NODE_R} />
              <text x={ENTRY_X} y={ENTRY_Y + 5}>
                E
              </text>
            </g>

            {/* Bridge nodes */}
            {BRIDGE_X.map((bx, i) => (
              <g key={`bridge-${i}`} className="lab3-net-node is-bridge">
                <circle cx={bx} cy={BRIDGE_Y} r={NODE_R} />
                <text x={bx} y={BRIDGE_Y + 5}>
                  N{i + 1}
                </text>
              </g>
            ))}

            {/* Servers */}
            {servers.map((server, i) => (
              <g key={server.id} className="lab3-net-server">
                <rect
                  x={SERVER_X[i] - BOX_W / 2}
                  y={SERVER_Y - BOX_H / 2}
                  width={BOX_W}
                  height={BOX_H}
                  rx={6}
                />
                <text className="lab3-net-server-id" x={SERVER_X[i]} y={SERVER_Y - 3}>
                  {server.id}
                </text>
                <text
                  className="lab3-net-server-value"
                  x={SERVER_X[i]}
                  y={SERVER_Y + 13}
                >
                  worth {server.value}
                </text>
              </g>
            ))}
          </svg>

          <p className="lab3-netpeek-note">
            Each server appears once here. Edge numbers are exploit costs, and
            the attacker pays every link they cross, so reaching{" "}
            <strong>S1</strong> costs{" "}
            {values.edgeCosts.entryN1 + values.edgeCosts.n1S1}. Total asset
            value SUM(Sx) is <strong>{totalServerValue(values)}</strong>.
          </p>
          <p className="lab3-netpeek-note is-aside">
            The large diagram is the <strong>action</strong> graph, where the
            layers are turns rather than hops, so the same server shows up once
            per route that can reach it.
          </p>
        </div>
      )}
    </div>
  );
};
