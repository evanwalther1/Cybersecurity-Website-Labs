// Lab 6's network, drawn as it appears on the whiteboard but turned a
// quarter turn.
//
// WHY IT RUNS TOP TO BOTTOM
//
// The board draws this left to right, and the first version of this
// component copied that: an 820 x 350 landscape strip. Every lab in this
// project puts its diagram in the LEFT half of a two-column panel, which is
// a tall narrow space, and a landscape strip dropped into it scales down
// until the labels are unreadable while leaving most of the panel empty.
//
// So the direction of travel is rotated and the geometry re-derived for a
// portrait frame. The boxes themselves are NOT rotated: every label stays
// horizontal and upright. Only the flow changed; it is the same graph with
// the same nodes, edges, costs and sensors.
//
// One consequence worth knowing: the three sensor regions shared a top and
// bottom edge on the board, which is what made them read as one tier of
// monitoring rather than three unrelated annotations. Rotated, the
// equivalent is sharing a LEFT and RIGHT edge, which is what they do here.
//
// Hand-rolled SVG for the same reasons as Lab 3's tree and Lab 4's network:
// the shape is fixed, the only hard part is the arithmetic of laying it out,
// and a graph library would fight us on the dashed sensor regions.
//
// Nothing here interprets the numbers. The whiteboard writes 0.25 on each
// segment edge and 2, 1, 1 on the three target edges, so that is what this
// draws.

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const W = 440;
const H = 580;

/** Horizontal centre line. Everything on the attack path sits on it except
 *  the DMZ/VPN pair, which fan out left and right. */
const MID = 220;

/** Row centres, top to bottom along the attack path. */
const ROW = {
  attacker: 36,
  fw: 120,
  tier1: 210, // DMZ and VPN share a row
  jump: 300,
  core: 392,
  target: 510,
};

interface BoxNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** One entry per line of the label; the box is sized for them by hand. */
  lines: string[];
}

const BOXES: BoxNode[] = [
  {
    id: "attacker",
    x: MID,
    y: ROW.attacker,
    w: 104,
    h: 44,
    lines: ["External", "Attacker"],
  },
  { id: "fw", x: MID, y: ROW.fw, w: 60, h: 34, lines: ["Firewall"] },
  { id: "dmz", x: 140, y: ROW.tier1, w: 72, h: 34, lines: ["DMZ"] },
  { id: "vpn", x: 300, y: ROW.tier1, w: 72, h: 34, lines: ["VPN"] },
  { id: "jump", x: MID, y: ROW.jump, w: 88, h: 44, lines: ["Jump", "host"] },
  {
    id: "core",
    x: MID,
    y: ROW.core,
    w: 126,
    h: 56,
    lines: ["Internal", "management", "segment"],
  },
];

const box = (id: string) => BOXES.find((b) => b.id === id)!;

interface TargetNode {
  id: string;
  x: number;
}

/** The same three assets as Labs 4 and 5, named the same way. Their values
 *  live in the variables panel beside the diagram rather than under each
 *  circle, which is how Labs 2, 4 and 5 do it: the picture carries structure
 *  and the panel carries numbers. */
const TARGETS: TargetNode[] = [
  { id: "S1", x: 70 },
  { id: "S2", x: MID },
  { id: "S3", x: 370 },
];

const TARGET_R = 22;

interface EdgeSpec {
  from: string;
  to: string;
  label: string;
}

const EDGES: EdgeSpec[] = [
  { from: "attacker", to: "fw", label: "0.25" },
  { from: "fw", to: "dmz", label: "0.25" },
  { from: "fw", to: "vpn", label: "0.25" },
  { from: "dmz", to: "jump", label: "0.25" },
  { from: "vpn", to: "jump", label: "0.25" },
  { from: "jump", to: "core", label: "0.25" },
  { from: "core", to: "S1", label: "2" },
  { from: "core", to: "S2", label: "1" },
  { from: "core", to: "S3", label: "1" },
];

/** Every edge runs top to bottom, so an edge leaves the bottom of one node
 *  and arrives at the top of the next. Two cases, no general intersection
 *  maths needed. */
const exitPoint = (id: string): [number, number] => {
  const b = box(id);
  return [b.x, b.y + b.h / 2];
};

const entryPoint = (id: string): [number, number] => {
  const t = TARGETS.find((x) => x.id === id);
  if (t) return [t.x, ROW.target - TARGET_R];
  const b = box(id);
  return [b.x, b.y - b.h / 2];
};

// ---------------------------------------------------------------------------
// The sensors
// ---------------------------------------------------------------------------

const SENSOR_LEFT = 86;
const SENSOR_RIGHT = 354;
const SENSOR_PAD = 13;
/** Labels sit to the right of the stack and stay horizontal, so nothing in
 *  the diagram has to be read sideways. */
const SENSOR_LABEL_X = SENSOR_RIGHT + 8;

interface SensorSpec {
  label: string;
  members: string[];
}

const SENSORS: SensorSpec[] = [
  { label: "IDS1", members: ["dmz", "vpn"] },
  { label: "IDS2", members: ["jump"] },
  { label: "IDS2", members: ["core"] },
];

/** Vertical extent of a sensor region, from the boxes it covers. */
const sensorSpan = (members: string[]) => {
  const bs = members.map(box);
  const top = Math.min(...bs.map((b) => b.y - b.h / 2)) - SENSOR_PAD;
  const bottom = Math.max(...bs.map((b) => b.y + b.h / 2)) + SENSOR_PAD;
  return { top, bottom };
};

// ---------------------------------------------------------------------------

export interface BayesianNetworkProps {
  /** Sensor to light up, "IDS1" or "IDS2". The walkthrough steps through
   *  them in order, so the diagram shows which observation is being talked
   *  about instead of sitting inert beside the prose. */
  live?: string | null;
  /** Target to ring, used once the honeypot placement is chosen. */
  guarded?: number | null;
  /** Dim everything except the live sensor, so a step about IDS1 is visibly
   *  about IDS1 rather than about the whole network. */
  focus?: boolean;
}

export const BayesianNetwork = ({
  live = null,
  guarded = null,
  focus = false,
}: BayesianNetworkProps) => (
  <svg
    className={`lab6-network ${focus ? "is-focused" : ""}`}
    viewBox={`0 0 ${W} ${H}`}
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="Attack path from top to bottom: an external attacker crosses a firewall, then the DMZ or VPN, then a jump host and the internal management segment, to reach three servers. Three intrusion detection sensors monitor the inner segments."
  >
    {/* Sensor regions first, so the boxes and edges draw on top of them. */}
    {SENSORS.map((s, i) => {
      const { top, bottom } = sensorSpan(s.members);
      return (
        <g
          className={`lab6-sensor ${live === s.label ? "is-live" : ""}`}
          key={`${s.label}-${i}`}
        >
          <rect
            x={SENSOR_LEFT}
            y={top}
            width={SENSOR_RIGHT - SENSOR_LEFT}
            height={bottom - top}
            rx={6}
          />
          <text x={SENSOR_LABEL_X} y={(top + bottom) / 2 + 4}>
            {s.label}
          </text>
        </g>
      );
    })}

    {EDGES.map((e) => {
      const [x1, y1] = exitPoint(e.from);
      const [x2, y2] = entryPoint(e.to);
      return (
        <g className="lab6-edge" key={`${e.from}-${e.to}`}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} />
          {/* Label at the midpoint. The halo in CSS is what keeps it readable
              where it sits on top of its own edge, which now happens on
              every vertical run. */}
          <text x={(x1 + x2) / 2} y={(y1 + y2) / 2} dy={4}>
            {e.label}
          </text>
        </g>
      );
    })}

    {BOXES.map((b) => (
      <g className={`lab6-node is-${b.id}`} key={b.id}>
        <rect
          x={b.x - b.w / 2}
          y={b.y - b.h / 2}
          width={b.w}
          height={b.h}
          rx={5}
        />
        {b.lines.map((line, i) => (
          <text
            key={line}
            x={b.x}
            // Centre the block of lines on the box: shift up by half the
            // stack, then step down one line height at a time.
            y={b.y + 4 - ((b.lines.length - 1) * 13) / 2 + i * 13}
          >
            {line}
          </text>
        ))}
      </g>
    ))}

    {TARGETS.map((t, i) => (
      <g
        className={`lab6-target ${guarded === i ? "is-guarded" : ""}`}
        key={t.id}
      >
        <circle cx={t.x} cy={ROW.target} r={TARGET_R} />
        <text className="lab6-target-id" x={t.x} y={ROW.target + 5}>
          {t.id}
        </text>
        {guarded === i && (
          <text
            className="lab6-target-hp"
            x={t.x}
            y={ROW.target - TARGET_R - 8}
          >
            honeypot
          </text>
        )}
      </g>
    ))}
  </svg>
);
