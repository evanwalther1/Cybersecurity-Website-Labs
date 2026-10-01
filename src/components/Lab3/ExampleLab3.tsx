import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilArrowLeft,
  cilArrowRight,
  cilLightbulb,
  cilReload,
} from "@coreui/icons";
import "../../styles/LabPanel.css";
import "../../styles/ExampleLab1.css";
import "../../styles/ExampleLab3.css";
import { GameTreeSVG } from "./GameTreeSVG";
import {
  EXAMPLE_VALUES,
  buildAttackerFirstTree,
  buildDefenderFirstTree,
  collectDecisionNodes,
  equilibriumPath,
  isBottomTier,
  prunedAndSurviving,
  solveTree,
  strategyProfile,
  totalServerValue,
} from "./gameTree";
import type { Action, GameNode } from "./gameTree";

export const LAB3_ACCENT = "#c22982";

const V = EXAMPLE_VALUES;
const SUM_S = totalServerValue(V);

// How the tree should look during a given step. Everything here is derived
// from the solver rather than hardcoded, so changing EXAMPLE_VALUES changes
// the walkthrough's diagram and its prose numbers together.
interface TreeView {
  tree?: "attackerFirst" | "defenderFirst";
  showPayoffs?: boolean;
  /** Decision nodes to annotate with their backward-induction value. */
  solved?: string[];
  /** Dim everything outside this subgame. */
  focus?: string;
}

interface Step {
  topic: string;
  definition?: string;
  body: ReactNode;
  /** When present, a Show Answer button reveals this. */
  reveal?: ReactNode;
  view: TreeView;
  /** The one step where the student drives the tree instead of reading it. */
  interactive?: boolean;
}

const Att = ({ children }: { children: ReactNode }) => (
  <span className="lab3-attacker-text">{children}</span>
);
const Def = ({ children }: { children: ReactNode }) => (
  <span className="lab3-defender-text">{children}</span>
);

export const ExampleLab3 = () => {
  const attackerTree = useMemo(() => buildAttackerFirstTree(V), []);
  const defenderTree = useMemo(() => buildDefenderFirstTree(V), []);
  const solution = useMemo(() => solveTree(attackerTree), [attackerTree]);
  // Defender-first is a different game, so it needs its own solution. Step 10
  // renders against this one rather than the attacker-first solve.
  const defenderSolution = useMemo(
    () => solveTree(defenderTree),
    [defenderTree],
  );

  const decisionNodes = useMemo(
    () => collectDecisionNodes(attackerTree),
    [attackerTree],
  );
  const bottomIds = useMemo(
    () => decisionNodes.filter(isBottomTier).map((n) => n.id),
    [decisionNodes],
  );
  const bottomN1 = useMemo(
    () => bottomIds.filter((id) => id.includes("N1")),
    [bottomIds],
  );
  const defenderIds = useMemo(
    () =>
      decisionNodes
        .filter((n) => n.kind === "decision" && n.player === "defender")
        .map((n) => n.id),
    [decisionNodes],
  );

  const profile = useMemo(
    () => strategyProfile(attackerTree, solution),
    [attackerTree, solution],
  );
  const onPath = useMemo(
    () => new Set(equilibriumPath(attackerTree, solution).nodeIds),
    [attackerTree, solution],
  );

  const [stepIndex, setStepIndex] = useState(0);
  // Which steps have had their answer revealed, keyed by step index rather than
  // a single boolean. A boolean would reset every time you navigated, so a step
  // you had already solved would show "Show Answer" again on the way back.
  const [revealedSteps, setRevealedSteps] = useState<ReadonlySet<number>>(
    new Set(),
  );

  // Play-it state. `playNode` is where the attacker currently stands, and the
  // log is the running transcript of the exchange.
  const [playNode, setPlayNode] = useState<GameNode>(attackerTree);
  const [playLog, setPlayLog] = useState<
    { who: "attacker" | "defender"; text: string }[]
  >([]);
  const [playedActions, setPlayedActions] = useState<string[]>([]);

  const resetPlay = () => {
    setPlayNode(attackerTree);
    setPlayLog([]);
    setPlayedActions([]);
  };

  // The student only ever clicks attacker edges. After their move, if the
  // tree hands control to the defender, the defender immediately plays its
  // best response, which is what "the defender observes and responds" means.
  const handlePlayAction = (action: Action) => {
    const log = [...playLog];
    const played = [...playedActions, action.id];
    log.push({ who: "attacker", text: action.label });
    let next = action.child;

    if (next.kind === "decision" && next.player === "defender") {
      const best = next.actions.find(
        (a) => a.id === solution[next.id]?.bestActionId,
      );
      if (best) {
        log.push({
          who: "defender",
          text:
            best.label === "No honeypot"
              ? "I'll skip the honeypot this time."
              : `${best.label}.`,
        });
        played.push(best.id);
        next = best.child;
      }
    }

    setPlayLog(log);
    setPlayedActions(played);
    setPlayNode(next);
  };

  const isRevealed = revealedSteps.has(stepIndex);
  const playFinished = playNode.kind === "terminal";
  const playPayoff = playFinished ? playNode.payoff : null;

  const steps: Step[] = [
    {
      topic: "Reading the tree",
      definition:
        "An extensive-form game represents a sequential interaction as a rooted tree. Each decision node belongs to one player, the edges leaving it are that player's available actions, and play moves forward from the root until it reaches a terminal node.",
      body: (
        <>
          <p className="dynamic-question">
            This is the network the game is played on. Before any numbers, let's
            get the read the graph properly.
          </p>
          <p className="dynamic-response">
            The <strong>Entry</strong> node at the top is the root, where play
            begins. <strong>N1</strong> and <strong>N2</strong> below it are{" "}
            <strong>bridge nodes</strong>: waypoints in the network, not
            targets. They hold no value at all.
          </p>
          <p className="dynamic-response">
            The four <strong>servers</strong> S1 to S4 at the bottom are the{" "}
            <strong>terminal nodes</strong>. They are the only things worth
            taking, and they are where payoffs live.
          </p>
          <p className="dynamic-response">
            A circle tells you <em>whose turn it is</em>, nothing more. The
            moves themselves are the <strong>edges</strong>. An <Att>A</Att>{" "}
            circle is the <Att>attacker</Att> choosing, a <Def>D</Def> circle is
            the <Def>defender</Def> choosing, and every edge is colored to
            whoever made that move.
          </p>
          <div className="lab3-note">
            Important: an <strong>action</strong> is one move at one node. A{" "}
            <strong>strategy</strong> is a complete plan, one action at every
            node you own, including nodes you might never reach. Those are
            different objects, and that difference is important
          </div>
        </>
      ),
      view: { showPayoffs: false },
    },
    {
      topic: "The numbers",
      definition:
        "Each server has a value, each edge has an exploit cost the attacker pays to traverse it, and the defender has a single honeypot cost. A terminal's payoff is computed from the entire path taken to reach it, not just from the server at the end.",
      body: (
        <>
          <p className="dynamic-question">
            Where do the payoff pairs at the bottom come from?
          </p>
          <div className="lab3-values-panel">
            <span>
              <span className="lab3-values-label">S1</span> {V.servers.S1}
            </span>
            <span>
              <span className="lab3-values-label">S2</span> {V.servers.S2}
            </span>
            <span>
              <span className="lab3-values-label">S3</span> {V.servers.S3}
            </span>
            <span>
              <span className="lab3-values-label">S4</span> {V.servers.S4}
            </span>
            <span>
              <span className="lab3-values-label">Ch</span> {V.honeypotCost}
            </span>
            <span>
              <span className="lab3-values-label">P</span> {V.capturePenalty}
            </span>
            <span>
              <span className="lab3-values-label">SUM(Sx)</span> {SUM_S}
            </span>
          </div>
          <p className="dynamic-response">
            Every attacker edge carries an exploit cost, shown on the diagram as{" "}
            <code>&middot;n</code>. The attacker pays the cost of{" "}
            <em>every edge they walk</em>.
          </p>
          <code className="lab3-formula is-attacker">
            Ua = Sx &minus; SUM(Ex) &minus; P if caught
          </code>
          <code className="lab3-formula is-defender">
            Ud = SUM(Sx) &minus; D &minus; Ch
          </code>
          <p className="dynamic-response">
            <strong>SUM(Sx) is always all four servers</strong>, so for this
            game it is fixed at {SUM_S} no matter what happens. D is the damage,
            the value of whichever server the attacker walks away with. Ch is
            only subtracted if a honeypot was actually deployed.
          </p>
        </>
      ),
      reveal: (
        <>
          <p className="dynamic-response">
            Take the path <Att>Entry &rarr; N1 &rarr; S2</Att> with no honeypot
            deployed. The attacker paid {V.edgeCosts.entryN1} to reach N1 and{" "}
            {V.edgeCosts.n1S2} to reach S2, and captured a server worth{" "}
            {V.servers.S2}.
          </p>
          <code className="lab3-formula is-attacker">
            Ua = {V.servers.S2} &minus; ({V.edgeCosts.entryN1} +{" "}
            {V.edgeCosts.n1S2}) ={" "}
            {V.servers.S2 - V.edgeCosts.entryN1 - V.edgeCosts.n1S2}
          </code>
          <code className="lab3-formula is-defender">
            Ud = {SUM_S} &minus; {V.servers.S2} &minus; 0 ={" "}
            {SUM_S - V.servers.S2}
          </code>
          <p className="dynamic-response">
            This is why a payoff belongs to a <em>path</em> and not to a server.
            S2 is worth {V.servers.S2} either way, but reaching it through a
            different route would cost the attacker something different.
          </p>
          <div className="lab3-note">
            Notice the dashed boxes. Those are servers the attacker walked onto
            while a honeypot was sitting there. They capture nothing, so Sx and
            D are both zero, and the attacker pays a{" "}
            <strong>capture penalty of {V.capturePenalty}</strong> on top of the
            exploit costs already spent getting there. Those payoffs are ugly on
            purpose, and the next few steps show why they never actually happen.
          </div>
        </>
      ),
      view: {},
    },
    {
      topic: "Who moves when",
      definition:
        "This game has perfect information: every player sees every move made before their own. That is exactly the assumption that makes backward induction a valid method.",
      body: (
        <>
          <p className="dynamic-question">
            Read the tree top to bottom and you get the order of play.
          </p>
          <p className="dynamic-response">
            <strong>1.</strong> The <Att>attacker</Att> picks an entry point, N1
            or N2.
          </p>
          <p className="dynamic-response">
            <strong>2.</strong> The <Def>defender</Def> watches that happen and
            responds, placing a honeypot on one of the two servers below, or
            deciding not to spend the {V.honeypotCost} at all.
          </p>
          <p className="dynamic-response">
            <strong>3.</strong> The <Att>attacker</Att> picks a server.
          </p>
          <div className="lab3-note">
            <strong>The attacker always moves last.</strong> It would make no
            sense for the game to end with the attacker stranded on a bridge
            node, since bridge nodes hold nothing. That single rule is what
            fixes the shape of this tree at three layers.
          </div>
          <p className="dynamic-response">
            The defender genuinely sees the attacker's first move before
            choosing. That is not a detail, it is whole point of sequential
            games with <em>perfect information</em>.
          </p>
        </>
      ),
      view: {},
    },
    {
      topic: "Play it yourself",
      definition:
        "Before learning the method, play the game once on instinct. You are the attacker. The defender will respond rationally to whatever you do.",
      body: (
        <>
          <p className="dynamic-question">
            You are the <Att>attacker</Att>. Click a highlighted edge on the
            tree to make your move. Try to walk away with as much as you can.
          </p>
          {playLog.length > 0 && (
            <div className="lab3-play-log">
              {playLog.map((entry, index) => (
                <div key={index} className={`lab3-bubble is-${entry.who}`}>
                  <span className="lab3-bubble-who">{entry.who}</span>
                  {entry.text}
                </div>
              ))}
            </div>
          )}
          {playFinished && (
            <>
              <p className="dynamic-response">
                You walked away with <strong>{playPayoff?.attacker}</strong>,
                and the defender kept <strong>{playPayoff?.defender}</strong>.
              </p>
              <p className="dynamic-response">
                Play it again and take a different route. There are six
                different ways this can go, and it is worth seeing more than one
                before moving on.
              </p>
              <div className="dynamic-controls">
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={resetPlay}
                >
                  <CIcon icon={cilReload} /> Play again
                </CButton>
              </div>
            </>
          )}
        </>
      ),
      reveal: (
        <>
          <p className="dynamic-response">
            The single biggest number available to the attacker anywhere in this
            tree is <strong>6</strong>, by taking S3 through N2. Most people go
            for it.
          </p>
          <p className="dynamic-response">
            It isn't reachable. The defender sees you enter N2 and honeypots S3,
            and you end up on S4 with <strong>1</strong>. The best the attacker
            can actually guarantee in this game is <strong>3</strong>, and it is
            in the other branch entirely.
          </p>
          <div className="lab3-note">
            Chasing the biggest terminal payoff is the most common mistake in
            sequential games, because it ignores that someone else moves in
            between. The rest of this walkthrough is the method that gets it
            right.
          </div>
        </>
      ),
      view: {},
      interactive: true,
    },
    {
      topic: "Backward induction: the N1 subgame",
      definition:
        "Backward induction starts at the last decision nodes, where the outcome of a choice is immediate and certain, and works upward. A subgame is any node plus everything below it, solvable on its own.",
      body: (
        <>
          <p className="dynamic-question">
            Start at the bottom, inside N1. What does the <Att>attacker</Att> do
            at each of these three nodes?
          </p>
          <p className="dynamic-response">
            These are the easiest nodes in the tree, because nothing happens
            after them. The attacker just compares their own payoffs and takes
            the larger one.
          </p>
        </>
      ),
      reveal: (
        <>
          <p className="dynamic-response">
            <strong>S1 honeypotted:</strong> S1 is a trap, so the attacker takes
            S2 for {V.servers.S2} &minus; ({V.edgeCosts.entryN1} +{" "}
            {V.edgeCosts.n1S2}) = <strong>3</strong>.
          </p>
          <p className="dynamic-response">
            <strong>S2 honeypotted:</strong> forced onto S1 for {V.servers.S1}{" "}
            &minus; ({V.edgeCosts.entryN1} + {V.edgeCosts.n1S1}) ={" "}
            <strong>0</strong>.
          </p>
          <p className="dynamic-response">
            <strong>No honeypot:</strong> free choice, so compare S1 at 0
            against S2 at 3. The attacker takes <strong>S2</strong>.
          </p>
          <div className="lab3-note">
            S1 is the more valuable server, worth {V.servers.S1} against S2's{" "}
            {V.servers.S2}, and the attacker still doesn't want it. It costs{" "}
            {V.edgeCosts.n1S1} to break into, which eats the whole difference.
            This is the exploit costs doing real work: the attacker maximizes Sx
            &minus; SUM(Ex), while the defender only cares about Sx. The two
            players are not looking at the same number.
          </div>
        </>
      ),
      view: { solved: bottomN1, focus: "d:N1" },
    },
    {
      topic: "Backward induction: the N2 subgame",
      body: (
        <>
          <p className="dynamic-question">
            Same three comparisons on the other side. What does the{" "}
            <Att>attacker</Att> do inside N2?
          </p>
        </>
      ),
      reveal: (
        <>
          <p className="dynamic-response">
            <strong>S3 honeypotted:</strong> forced onto S4 for {V.servers.S4}{" "}
            &minus; ({V.edgeCosts.entryN2} + {V.edgeCosts.n2S4}) ={" "}
            <strong>
              {V.servers.S4 - V.edgeCosts.entryN2 - V.edgeCosts.n2S4}
            </strong>
            .
          </p>
          <p className="dynamic-response">
            <strong>S4 honeypotted:</strong> forced onto S3 for {V.servers.S3}{" "}
            &minus; ({V.edgeCosts.entryN2} + {V.edgeCosts.n2S3}) ={" "}
            <strong>6</strong>.
          </p>
          <p className="dynamic-response">
            <strong>No honeypot:</strong> compare S3 at 6 against S4 at{" "}
            {V.servers.S4 - V.edgeCosts.entryN2 - V.edgeCosts.n2S4}. The
            attacker takes <strong>S3</strong>.
          </p>
          <p className="dynamic-response">
            Both edges into this branch are cheap, so here the attacker's
            ranking does line up with raw server value. The six bottom nodes are
            now all solved, and every one of them carries a value the layer
            above can use.
          </p>
        </>
      ),
      view: { solved: bottomIds, focus: "d:N2" },
    },
    {
      topic: "Backward induction: the defender's move",
      definition:
        "Move up one layer. The defender never sees the terminal payoffs directly, they see the values just written onto the nodes below, because that is what the attacker will actually do.",
      body: (
        <>
          <p className="dynamic-question">
            At each bridge node the <Def>defender</Def> compares three options
            using their own payoff. What do they choose?
          </p>
          <p className="dynamic-response">
            Remember the defender's formula. SUM(Sx) is fixed at {SUM_S} and Ch
            is fixed at {V.honeypotCost}, so the defender is really weighing the
            honeypot's cost against how much damage it prevents.
          </p>
        </>
      ),
      reveal: (
        <>
          <p className="dynamic-response">
            <strong>At N1:</strong> honeypot S1 gives {SUM_S} &minus;{" "}
            {V.servers.S2} &minus; {V.honeypotCost} = <strong>21</strong>,
            honeypot S2 gives <strong>17</strong>, and no honeypot gives {SUM_S}{" "}
            &minus; {V.servers.S2} &minus; 0 = <strong>24</strong>. The defender{" "}
            <strong>skips the honeypot</strong>.
          </p>
          <p className="dynamic-response">
            Why: the attacker was already heading for S2. Honeypotting S1
            changes nothing about that and costs {V.honeypotCost} anyway.
            Honeypotting S2 is actively worse, because it pushes the attacker
            onto S1 and turns a {V.servers.S2}-damage outcome into a{" "}
            {V.servers.S1}-damage one.
          </p>
          <p className="dynamic-response">
            <strong>At N2:</strong> honeypot S3 gives <strong>22</strong>,
            honeypot S4 gives <strong>18</strong>, and no honeypot gives{" "}
            <strong>21</strong>. The defender <strong>honeypots S3</strong>.
          </p>
          <p className="dynamic-response">
            Here it pays for itself: spending {V.honeypotCost} pushes the
            attacker off S3 ({V.servers.S3} damage) onto S4 ({V.servers.S4}{" "}
            damage), saving {V.servers.S3 - V.servers.S4} for a cost of{" "}
            {V.honeypotCost}.
          </p>
          <div className="lab3-note">
            The two defender nodes reach <em>opposite</em> conclusions from the
            same three options. That is the lesson: a honeypot is worth buying
            only when it actually changes where the attacker goes.
          </div>
        </>
      ),
      view: { solved: [...bottomIds, ...defenderIds] },
    },
    {
      topic: "Backward induction: the root",
      body: (
        <>
          <p className="dynamic-question">
            One layer left. Which entry point does the <Att>attacker</Att>{" "}
            choose?
          </p>
          <div className="lab3-note">
            This is the actual inductive step, and the only place in the
            walkthrough where it appears. The attacker does <strong>not</strong>{" "}
            look at the twelve terminals. They compare the two numbers written
            on the bridge nodes, which are values you derived a moment ago. Your
            earlier work is the input to this comparison.
          </div>
        </>
      ),
      reveal: (
        <>
          <p className="dynamic-response">
            N1 is worth <strong>(3, 24)</strong> and N2 is worth{" "}
            <strong>(1, 22)</strong>. The attacker compares their own component,
            3 against 1, and enters <strong>N1</strong>.
          </p>
          <p className="dynamic-response">
            Play runs Entry &rarr; N1, no honeypot, S2, and the game ends at{" "}
            <strong>(3, 24)</strong>.
          </p>
          <p className="dynamic-response">
            Compare that to the instinct from earlier. The attacker's best
            terminal in the whole tree was S3 at 6, and it sits in N2, the
            branch they just declined. The 6 was never on offer, because
            entering N2 is what triggers the honeypot that removes it.
          </p>
        </>
      ),
      view: {
        solved: [...bottomIds, ...defenderIds, "root"],
      },
    },
    {
      topic: "The Subgame Perfect Nash Equilibrium",
      definition:
        "An SPNE is a strategy profile: one complete plan per player, specifying an action at every decision node they own. It is not a path. The off-path entries are what make the on-path choices rational.",
      body: (
        <>
          <p className="dynamic-question">
            So what is the answer? It is tempting to say "Enter N1, no honeypot,
            take S2", but that is the <em>path</em>, not the equilibrium.
          </p>
          <p className="dynamic-response">
            The SPNE names an action at all nine decision nodes, including the
            six that never get visited.
          </p>
        </>
      ),
      reveal: (
        <>
          <table className="lab3-profile">
            <thead>
              <tr>
                <th>Player</th>
                <th>At</th>
                <th>Plays</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {profile.map((entry) => (
                <tr
                  key={entry.nodeId}
                  className={onPath.has(entry.nodeId) ? "" : "is-offpath"}
                >
                  <td>
                    {entry.player === "attacker" ? (
                      <Att>Attacker</Att>
                    ) : (
                      <Def>Defender</Def>
                    )}
                  </td>
                  <td>{entry.label}</td>
                  <td>
                    <strong>{entry.actionLabel}</strong>
                  </td>
                  <td>
                    {onPath.has(entry.nodeId) && (
                      <span className="lab3-profile-badge is-onpath">
                        on path
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="lab3-note">
            The greyed rows are never reached in actual play, and they are still
            required. Delete the row that says the defender honeypots S3 at N2,
            and there is no longer any reason for the attacker to have chosen N1
            in the first place. The threat of a response that never happens is
            exactly what makes the attacker avoid that branch.
          </div>
        </>
      ),
      view: {
        solved: [...bottomIds, ...defenderIds, "root"],
      },
    },
    {
      topic: "The other graph: defender first",
      definition:
        "Reversing the order of play produces a different game, not a relabelled one. The attacker still moves last, so the tree collapses from three decision layers to two.",
      body: (
        <>
          <p className="dynamic-question">
            What changes if the <Def>defender</Def> commits first?
          </p>
          <p className="dynamic-response">
            The defender picks a node to defend, with no option to skip, and
            every server beneath it gains the honeypot property. The attacker is
            then confined to that node, choosing between its two servers only:
            N1 reaches S1 and S2, N2 reaches S3 and S4.
          </p>
          <p className="dynamic-response">
            Two decision layers instead of three, four terminals instead of
            twelve. The attacker still has the last move. Solve it the same way,
            bottom first.
          </p>
        </>
      ),
      reveal: (
        <>
          <p className="dynamic-response">
            <strong>If N1 is defended:</strong> both servers are honeypots, so
            the attacker is caught either way and is only choosing how much to
            waste getting there. S1 costs{" "}
            {V.edgeCosts.entryN1 + V.edgeCosts.n1S1} to reach and S2 costs{" "}
            {V.edgeCosts.entryN1 + V.edgeCosts.n1S2}, so they take{" "}
            <strong>S2</strong> and lose 7 instead of 14.
          </p>
          <p className="dynamic-response">
            <strong>If N2 is defended:</strong> same logic. S3 costs{" "}
            {V.edgeCosts.entryN2 + V.edgeCosts.n2S3} and S4 costs{" "}
            {V.edgeCosts.entryN2 + V.edgeCosts.n2S4}, so they take{" "}
            <strong>S3</strong> and lose 7 instead of 8.
          </p>
          <div className="lab3-note">
            Now look at the <Def>defender's</Def> column. It reads{" "}
            <strong>27</strong> at all four terminals. Because the attacker can
            only ever reach honeypotted servers, they are always caught, so the
            damage D is always zero and{" "}
            <code>Ud = SUM(Sx) &minus; Ch = {SUM_S} &minus; {V.honeypotCost}</code>{" "}
            no matter what anyone does. The defender is{" "}
            <strong>completely indifferent</strong> between defending N1 and
            defending N2, so this game has no single best first move.
          </div>
          <p className="dynamic-response">
            That is worth sitting with rather than glossing over. A defender who
            cannot lose also has nothing to decide. The attacker-first ordering
            is interesting precisely because the attacker can sometimes get
            through, which is what gives the defender's choice consequences.
          </p>
        </>
      ),
      view: {
        tree: "defenderFirst",
        // Only the two attacker nodes. The root is a genuine tie, so pruning an
        // edge there would be presenting an arbitrary pick as the answer.
        solved: ["a:defend-N1", "a:defend-N2"],
      },
    },
  ];

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const canAdvance = !isLastStep && (!currentStep.reveal || isRevealed);

  const isDefenderFirst = currentStep.view.tree === "defenderFirst";
  const activeTree = isDefenderFirst ? defenderTree : attackerTree;
  const activeSolution = isDefenderFirst ? defenderSolution : solution;

  // Only annotate and prune once the step's answer is on screen, so the
  // diagram never gives away the step the student is being asked to do.
  // Joined into a string so the memo has a stable, statically-checkable
  // dependency. The array itself is rebuilt on every render, so depending on
  // it directly would defeat the memo.
  const solvedKey = (isRevealed ? (currentStep.view.solved ?? []) : []).join(
    "|",
  );
  const solvedIds = useMemo(
    () => (solvedKey === "" ? [] : solvedKey.split("|")),
    [solvedKey],
  );
  const { surviving, pruned } = useMemo(
    () => prunedAndSurviving(activeTree, activeSolution, solvedIds),
    [activeTree, activeSolution, solvedIds],
  );

  // Navigation only moves the cursor. Revealed answers and the play-it
  // transcript are both left alone, so stepping back shows what you did rather
  // than a reset step.
  const goTo = (index: number) => setStepIndex(index);

  const reveal = () => setRevealedSteps((prev) => new Set(prev).add(stepIndex));

  const clickableNodeId =
    currentStep.interactive && !playFinished && playNode.kind === "decision"
      ? playNode.id
      : undefined;

  return (
    <div className="lab-panel-columns lab3">
      <div className="lab-panel-static">
        <div className="static-lab lab3-static-lab">
          <GameTreeSVG
            tree={activeTree}
            solution={activeSolution}
            solvedNodeIds={new Set(solvedIds)}
            survivingActionIds={surviving}
            prunedActionIds={pruned}
            focusNodeId={isRevealed ? currentStep.view.focus : undefined}
            playedActionIds={new Set(playedActions)}
            showPayoffs={currentStep.view.showPayoffs ?? true}
            clickableNodeId={clickableNodeId}
            onActionClick={handlePlayAction}
          />
          <div className="lab3-legend">
            <span className="lab3-legend-item lab3-attacker-text">
              <span className="lab3-legend-dot" /> Attacker
            </span>
            <span className="lab3-legend-item lab3-defender-text">
              <span className="lab3-legend-dot" /> Defender
            </span>
            <span className="lab3-legend-item">
              Edge labels show exploit cost
            </span>
            <span className="lab3-legend-item">
              Dashed box = honeypot capture
            </span>
          </div>
        </div>
      </div>

      <div className="lab-panel-divider" />

      <div className="lab-panel-dynamic">
        <div className="dynamic-lab lab3-dynamic">
          {currentStep.definition && (
            <div className="dynamic-definition">
              <CIcon icon={cilLightbulb} className="dynamic-definition-icon" />
              <div>
                <p>{currentStep.definition}</p>
              </div>
            </div>
          )}

          <p className="dynamic-topic">{currentStep.topic}</p>

          {currentStep.body}

          {isRevealed && currentStep.reveal}

          {currentStep.reveal && !isRevealed && (
            <div className="dynamic-controls">
              <CButton
                style={{
                  backgroundColor: LAB3_ACCENT,
                  borderColor: LAB3_ACCENT,
                }}
                onClick={reveal}
              >
                Show Answer
              </CButton>
            </div>
          )}

          <div className="dynamic-nav">
            <CButton
              color="secondary"
              onClick={() => goTo(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
            >
              <CIcon icon={cilArrowLeft} />
            </CButton>
            <CButton
              color="secondary"
              onClick={() => goTo(stepIndex + 1)}
              disabled={!canAdvance}
            >
              <CIcon icon={cilArrowRight} />
            </CButton>
          </div>
        </div>
      </div>
    </div>
  );
};
