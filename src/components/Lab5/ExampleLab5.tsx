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
import { Slider } from "@mui/material";
import "../../styles/LabPanel.css";
import "../../styles/ExampleLab1.css";
import "../../styles/ExampleLab4.css";
import "../../styles/ExampleLab5.css";
import { ServerNetwork } from "../Lab4/ServerNetwork";
import { totalValue } from "../Lab4/stackelberg";
import {
  ATTACKER_STRATEGIES,
  DEFENDER_STRATEGIES,
  DELTA_MAX,
  DELTA_MIN,
  DISPLAY_ROUNDS,
  EXAMPLE_GAME,
  SIM_ROUNDS,
  simulateMatch,
  summarize,
  valueMatch,
  type AttackerStrategyId,
  type DefenderStrategyId,
} from "./repeated";
import { SUGGESTED, matchupNote } from "./matchupNotes";

const LAB5_ACCENT = "#7048e8";

const G = EXAMPLE_GAME;
const SV = totalValue(G);
const S = G.servers;

// Everything the prose quotes is computed from the engine, never typed in, so
// the walkthrough cannot drift away from the simulator the student is about to
// play with. This is the same discipline as Lab 4's Example and it matters
// more here, because free play lets the student go and check every number.

const n2 = (x: number) => x.toFixed(2);

/** The whiteboard's two reference matches, both against a greedy attacker. */
const BOARD_START = 1; // the board parks the defense on S2, deliberately wrong
const staticMatch = simulateMatch({
  game: G,
  attacker: "greedy",
  defender: "static",
  startServer: BOARD_START,
  rounds: SIM_ROUNDS,
  seed: 1,
});
const triggerMatch = simulateMatch({
  game: G,
  attacker: "greedy",
  defender: "trigger",
  startServer: BOARD_START,
  rounds: SIM_ROUNDS,
  seed: 1,
});
const boardValue = (delta: number) => ({
  stat: valueMatch(staticMatch, delta).total,
  trig: valueMatch(triggerMatch, delta).total,
});

/** The server a greedy attacker takes: argmax(V - C), not argmax(V). */
const greedyIndex = S.map((s) => s.value - s.exploitCost).reduce(
  (best, v, i, arr) => (v > arr[best] ? i : best),
  0,
);

/** One cell of the payoff matrix: honeypot at `h`, attack at `a`. */
const cell = (h: number, a: number) => {
  const caught = h === a;
  const damage = caught ? 0 : S[a].value;
  return { ud: SV - damage - G.honeypotCost, ua: damage - S[a].exploitCost };
};

// ---------------------------------------------------------------------------
// The walkthrough: three pages, in the Lab 1 to 4 frame
// ---------------------------------------------------------------------------

interface Step {
  topic: string;
  body: ReactNode;
  /** Drawn on the network while this step is open. */
  view?: { attacked?: number | null; defended?: number | null };
}

interface Page {
  title: string;
  steps: Step[];
}

const Matrix = ({ mark }: { mark?: [number, number] }) => (
  <table className="lab5-matrix">
    <thead>
      <tr>
        <th />
        {S.map((s) => (
          <th key={s.id}>A &rarr; {s.id}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {S.map((hs, h) => (
        <tr key={hs.id}>
          <th>H at {hs.id}</th>
          {S.map((as, a) => {
            const c = cell(h, a);
            const on = mark && mark[0] === h && mark[1] === a;
            return (
              <td key={as.id} className={on ? "is-marked" : undefined}>
                ({c.ud}, {c.ua})
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
);

const PAGES: Page[] = [
  {
    title: "The same game, played again and again",
    steps: [
      {
        topic: "What a repeated game is",
        view: {},
        body: (
          <>
            <p>
              A <strong>repeated game</strong> is one game, played over and over
              by the same players, where everyone can see everything that has
              already happened.
            </p>
            <p>Three things define one:</p>
            <dl className="lab5-defs">
              <dt>The stage game</dt>
              <dd>
                what happens in a single round. On its own it is an ordinary
                one-shot game, exactly like the ones in the earlier labs.
              </dd>
              <dt>The history</dt>
              <dd>
                everything both players have observed up to now. This is the new
                resource, and it is available to both sides.
              </dd>
              <dt>The horizon</dt>
              <dd>
                how long the players expect to keep meeting, and how much the
                later rounds are worth to them today.
              </dd>
            </dl>
            <p>
              That changes what the word <em>strategy</em> means. In a one-shot
              game a strategy is a move. In a repeated game it is a{" "}
              <strong>rule that turns history into a move</strong>, and the
              whole lab is about which rules are any good.
            </p>
            <p className="lab5-aside">
              Where we left off in Lab 4: that lab's network and payoffs are the
              stage game here, so a single round already works the way you know.
            </p>
          </>
        ),
      },
      {
        topic: "The stage game",
        view: {},
        body: (
          <>
            <p>
              Three servers, each worth something and each costing the attacker
              something to reach. One honeypot, costing <code>Ch</code> to run,
              which catches whoever walks into it. Two payoff equations:
            </p>
            <div className="lab5-formulas">
              <code>Ua = Di &minus; Cei</code>
              <code>Ud = SUM(V) &minus; Di &minus; Ch</code>
            </div>
            <p>
              Play that once and it is a one-shot game. Play it a hundred times
              against the same opponent and almost nothing about the arithmetic
              changes.
            </p>
            <p>
              One thing is different, and it changes everything. In a one-shot
              game the two players meet once and guess. Here they meet{" "}
              <strong>round after round</strong>, and both of them remember.
            </p>
          </>
        ),
      },
      {
        topic: "The payoff matrix",
        body: (
          <>
            <p>
              With a single honeypot and three servers there are only nine ways
              a round can go, so we can write the whole game down. Rows are
              where you put the honeypot, columns are where the attacker
              strikes, and each cell is (<code>Ud</code>, <code>Ua</code>).
            </p>
            <Matrix />
            <p>
              The diagonal is every round where you guessed right: no damage, so{" "}
              <code>
                Ud = {SV} &minus; 0 &minus; {G.honeypotCost} ={" "}
                {SV - G.honeypotCost}
              </code>
              , and the attacker pays their exploit cost for nothing. Everywhere
              else they get through.
            </p>
          </>
        ),
      },
      {
        topic: "One round, in isolation",
        view: { attacked: 0, defended: 0 },
        body: (
          <>
            <p>
              Suppose you knew the attacker was about to hit {S[0].id}. Read
              down that column: {cell(0, 0).ud}, {cell(1, 0).ud},{" "}
              {cell(2, 0).ud}.
            </p>
            <Matrix mark={[0, 0]} />
            <p>
              Your best response is to honeypot {S[0].id} and take{" "}
              {cell(0, 0).ud}. That is Lab 1's question, asked about a bigger
              matrix, and you have been able to answer it since the first lab.
            </p>
            <p className="lab5-aside">
              The hard part was never the arithmetic. It is that nobody tells
              you which column you are in.
            </p>
          </>
        ),
      },
      {
        topic: "What repetition gives you",
        body: (
          <>
            <p>
              In a one-shot game you have to guess the column. In a{" "}
              <strong>repeated game</strong> you get to watch. After every round
              you observe:
            </p>
            <ul className="lab5-observe">
              <li>which server was attacked</li>
              <li>whether the honeypot was triggered</li>
              <li>how much damage was done</li>
              <li>both players' rewards</li>
            </ul>
            <p>
              That history is the new resource, and this whole lab is about what
              it is worth. Note that it cuts both ways: while you are watching
              them, they are watching you.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: "What is a future round worth?",
    steps: [
      {
        topic: "The problem with adding up rounds",
        body: (
          <>
            <p>
              If the game repeats forever, a defense earning 9 a round earns 9 +
              9 + 9 + ... which is infinite. So does a defense earning 17.
              Comparing them by total is useless; both are infinity.
            </p>
            <p>
              We also have the opposite problem. A rule that loses two rounds
              and then wins forever is excellent if the game runs a thousand
              rounds and terrible if it ends on round three.
            </p>
          </>
        ),
      },
      {
        topic: "The discount factor",
        body: (
          <>
            <p>
              Both problems have one fix. Weight each round by how much the
              future matters, using the <strong>discount factor</strong>{" "}
              <code>&delta;</code>, where <code>0 &le; &delta; &le; 1</code>.
            </p>
            <div className="lab5-deltacases">
              <div>
                <code>&delta; &rarr; 0</code>
                <span>only the round in front of you matters</span>
              </div>
              <div>
                <code>&delta; &rarr; 1</code>
                <span>the future matters as much as the present</span>
              </div>
            </div>
            <p>
              It is not just a maths trick. <code>&delta;</code> is how long you
              expect to be in this fight: a contractor defending a network for
              one more week has a low <code>&delta;</code>, and a bank has a
              high one.
            </p>
          </>
        ),
      },
      {
        topic: "The long-term reward",
        body: (
          <>
            <p>Your reward over the whole game is the discounted sum:</p>
            <div className="lab5-bigformula">
              Ud = Ud<sub>1</sub> + &delta;&middot;Ud<sub>2</sub> + &delta;
              <sup>2</sup>&middot;Ud<sub>3</sub> + ...
            </div>
            <p>
              When the per-round reward is the same every round, this is a
              geometric series and collapses to one term:
            </p>
            <div className="lab5-bigformula">Ud = Ud / (1 &minus; &delta;)</div>
            <p>
              So a defense earning a flat 9 a round is worth{" "}
              <code>9 / (1 &minus; 0.2) = {n2(9 / 0.8)}</code> at{" "}
              <code>&delta; = 0.2</code>, and{" "}
              <code>9 / (1 &minus; 0.8) = {n2(9 / 0.2)}</code> at{" "}
              <code>&delta; = 0.8</code>. Same defense. The number changed
              because the horizon did.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: "What adaptation is worth",
    steps: [
      {
        topic: "Read the history",
        body: (
          <>
            <p>Four rounds in, here is what you have seen:</p>
            <table className="lab5-history-sample">
              <tbody>
                <tr>
                  {[1, 2, 3, 4].map((r) => (
                    <th key={r}>R{r}</th>
                  ))}
                </tr>
                <tr>
                  {[1, 2, 3, 4].map((r) => (
                    <td key={r}>A &rarr; {S[greedyIndex].id}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p>
              No variation at all. This attacker is running a{" "}
              <strong>greedy strategy</strong>: every round, take whatever pays
              most right now. For them that is{" "}
              <code>
                {S[greedyIndex].id}: {S[greedyIndex].value} &minus;{" "}
                {S[greedyIndex].exploitCost} ={" "}
                {S[greedyIndex].value - S[greedyIndex].exploitCost}
              </code>
              , the best raw payoff on the board.
            </p>
            <p className="lab5-aside">
              Greedy means highest <em>payoff</em>, not highest value. Those
              happen to agree here. Make {S[0].id} expensive enough to reach and
              they would stop being the same server.
            </p>
          </>
        ),
      },
      {
        topic: "A rule instead of a guess",
        view: { attacked: greedyIndex, defended: greedyIndex },
        body: (
          <>
            <p>
              You could just move the honeypot to {S[greedyIndex].id}. But a
              one-off reaction is not a strategy, and the attacker may not stay
              greedy. What you want is a <strong>rule</strong>:
            </p>
            <blockquote className="lab5-rule">
              If the same server is attacked twice in a row, protect it in the
              next round.
            </blockquote>
            <p>
              This is a <strong>trigger strategy</strong>. It does nothing until
              the attacker shows you a pattern, and then it commits.
            </p>
          </>
        ),
      },
      {
        topic: "The defense sequence",
        body: (
          <>
            <p>
              Here is what happens when that rule meets this attacker, starting
              with the honeypot parked on {S[BOARD_START].id}:
            </p>
            <table className="lab5-sequence">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Attack</th>
                  <th>Defense</th>
                  <th>Ud</th>
                </tr>
              </thead>
              <tbody>
                {triggerMatch.rounds.slice(0, 5).map((r, i) => (
                  <tr key={i} className={r.caught ? "is-caught" : undefined}>
                    <td>{i + 1}</td>
                    <td>{S[r.attacked].id}</td>
                    <td>{S[r.defended].id}</td>
                    <td>{r.ud}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Two rounds of tuition at 9, then {SV - G.honeypotCost} forever.
              The static defense that never moves stays at 9 the whole way.
            </p>
          </>
        ),
      },
      {
        topic: "Price them both: a short horizon",
        body: (
          <>
            <p>
              At <code>&delta; = 0.2</code>, where almost nothing beyond the
              next round or two counts:
            </p>
            <div className="lab5-compare">
              <div>
                <span>Static</span>
                <strong>{n2(boardValue(0.2).stat)}</strong>
                <em>9 / (1 &minus; 0.2)</em>
              </div>
              <div>
                <span>Trigger</span>
                <strong>{n2(boardValue(0.2).trig)}</strong>
                <em>
                  9 + 0.2&middot;9 + 0.2<sup>2</sup>&middot;17 / (1 &minus; 0.2)
                </em>
              </div>
            </div>
            <p>
              The clever rule wins by{" "}
              <strong>{n2(boardValue(0.2).trig - boardValue(0.2).stat)}</strong>
              . Barely worth the trouble. Those two bad opening rounds are
              almost the entire game at this horizon.
            </p>
          </>
        ),
      },
      {
        topic: "Price them both: a long horizon",
        body: (
          <>
            <p>
              Now <code>&delta; = 0.8</code>. Nothing about the network, the
              attacker or the rule has changed. Only the horizon.
            </p>
            <div className="lab5-compare">
              <div>
                <span>Static</span>
                <strong>{n2(boardValue(0.8).stat)}</strong>
                <em>9 / (1 &minus; 0.8)</em>
              </div>
              <div>
                <span>Trigger</span>
                <strong>{n2(boardValue(0.8).trig)}</strong>
                <em>
                  9 + 0.8&middot;9 + 0.8<sup>2</sup>&middot;17 / (1 &minus; 0.8)
                </em>
              </div>
            </div>
            <p>
              The same rule against the same attacker is now worth{" "}
              <strong>{n2(boardValue(0.8).trig - boardValue(0.8).stat)}</strong>{" "}
              more than standing still.
            </p>
          </>
        ),
      },
      {
        topic: "The long-term value of adaptation",
        body: (
          <>
            <p>
              Subtract the two closed forms and nearly everything cancels. The
              only thing adaptation ever buys you here is the difference between
              17 and 9, delayed by the two rounds it takes to learn:
            </p>
            <div className="lab5-bigformula">
              value of adapting = 8&delta;<sup>2</sup> / (1 &minus; &delta;)
            </div>
            <p>
              At <code>&delta; = 0.2</code> that is{" "}
              <strong>{n2((8 * 0.04) / 0.8)}</strong>. At{" "}
              <code>&delta; = 0.8</code> it is{" "}
              <strong>{n2((8 * 0.64) / 0.2)}</strong>. Same defender, same
              attacker, same network, and being smart became{" "}
              {Math.round((8 * 0.64) / 0.2 / ((8 * 0.04) / 0.8))} times more
              valuable purely because the future started mattering.
            </p>
            <p>So: adapt. The next question is the hard one.</p>
          </>
        ),
      },
    ],
  },
];

// No step counter is shown. An "8 / 14" in the corner tells the reader
// nothing they can act on and spends space the prose needs.

// ---------------------------------------------------------------------------

type Phase = "pages" | "bridge" | "picker" | "match";

export const ExampleLab5 = () => {
  const [phase, setPhase] = useState<Phase>("pages");

  // --- walkthrough state ---
  const [page, setPage] = useState(0);
  const [step, setStep] = useState(0);

  // --- free play state ---
  const [attacker, setAttacker] = useState<AttackerStrategyId | null>(null);
  const [defender, setDefender] = useState<DefenderStrategyId | null>(null);
  const [startServer, setStartServer] = useState(1);
  const [delta, setDelta] = useState(0.8);
  const [shown, setShown] = useState(1);
  const [manual, setManual] = useState<number[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const isManual = defender === "manual";

  // The match is a pure function of the picks, so it is derived rather than
  // stored. Storing it would let the table and the network disagree with the
  // cards above them after a re-pick.
  const match = useMemo(() => {
    if (!attacker || !defender) return null;
    // Nothing to simulate until the student has placed their first honeypot:
    // simulateMatch substitutes the start server for a missing manual move,
    // which would draw and score a round that was never played.
    if (isManual && manual.length === 0) return null;
    return simulateMatch({
      game: G,
      attacker,
      defender,
      startServer,
      // A manual match is exactly as long as the student is willing to play,
      // so there is no tail to compute and no reason to simulate past it.
      rounds: isManual ? manual.length : SIM_ROUNDS,
      seed: 20250101,
      manualMoves: isManual ? manual : undefined,
    });
  }, [attacker, defender, startServer, isManual, manual]);

  const value = useMemo(
    () => (match ? valueMatch(match, delta) : null),
    [match, delta],
  );
  const stats = useMemo(
    () => (match && value ? summarize(match, value) : null),
    [match, value],
  );
  const note = useMemo(
    () => (match && stats ? matchupNote(match, stats) : null),
    [match, stats],
  );

  // Every defense that can be auto-played, run against the chosen attacker.
  // "Play It Yourself" is excluded because there is nobody to play it.
  const rivals = useMemo(() => {
    if (!attacker) return [];
    return DEFENDER_STRATEGIES.filter((d) => d.id !== "manual").map((d) => ({
      id: d.id,
      // Static is the one defense whose identity depends on the setup, so it
      // says which server it parked on. Otherwise the row is ambiguous.
      name: d.id === "static" ? `${d.name} (${S[startServer].id})` : d.name,
      match: simulateMatch({
        game: G,
        attacker,
        defender: d.id,
        startServer,
        rounds: SIM_ROUNDS,
        seed: 20250101,
      }),
    }));
  }, [attacker, startServer]);

  // Re-valued on every delta change, which is the whole point: the ordering
  // is not fixed, and watching it rearrange is the lesson.
  const ranking = useMemo(
    () =>
      rivals
        .map((r) => ({ ...r, total: valueMatch(r.match, delta).total }))
        .sort((a, b) => b.total - a.total),
    [rivals, delta],
  );
  // Bars are scaled against the leader. The list is already sorted, so that
  // is just the first row; the fallback keeps the division safe before a
  // strategy has been chosen.
  const rankTop = ranking.length > 0 ? ranking[0].total : 1;

  // -------------------------------------------------------------- navigation

  const steps = PAGES[page].steps;
  const atFirst = page === 0 && step === 0;
  // There is no "at last" guard any more: the forward arrow runs off the end
  // of the final page into the bridge screen rather than stopping dead.

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else if (page > 0) {
      setPage(page - 1);
      setStep(PAGES[page - 1].steps.length - 1);
    }
  };
  const goForward = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else if (page < PAGES.length - 1) {
      setPage(page + 1);
      setStep(0);
    } else setPhase("bridge");
  };

  const openMatch = () => {
    setShown(1);
    setManual([]);
    setPhase("match");
    if (attacker && defender) {
      setSeen((prev) => new Set(prev).add(`${attacker}/${defender}`));
    }
  };

  // ============================================================ PHASE 1: pages

  if (phase === "pages") {
    const current = steps[step];
    return (
      <div className="lab-panel-columns lab5">
        <div className="lab-panel-static">
          <div className="static-lab lab4-static-lab">
            <div className="lab4-variables">
              {S.map((s) => (
                <div className="lab4-variables-row" key={s.id}>
                  <span className="lab4-variables-key">{s.id}</span>
                  <span className="lab4-variables-val">{s.value}</span>
                </div>
              ))}
              <div className="lab4-variables-row is-divider">
                <span className="lab4-variables-key">Ch</span>
                <span className="lab4-variables-val">{G.honeypotCost}</span>
              </div>
              <div className="lab4-variables-row">
                <span className="lab4-variables-key">SUM(V)</span>
                <span className="lab4-variables-val">{SV}</span>
              </div>
            </div>
            <ServerNetwork
              game={G}
              attacked={current.view?.attacked ?? null}
              defended={current.view?.defended ?? null}
            />
            <div className="lab4-legend">
              <span>
                <code>Ua = Di &minus; Cei</code>
              </span>
              <span>
                <code>Ud = SUM(V) &minus; Di &minus; Ch</code>
              </span>
            </div>
          </div>
        </div>

        <div className="lab-panel-divider" />

        <div className="lab-panel-dynamic">
          <div className="dynamic-lab lab5-dynamic">
            <div className="lab5-scroll">
              <p className="dynamic-topic">{current.topic}</p>
              <div className="lab5-body">{current.body}</div>
            </div>

            <div className="dynamic-nav">
              <CButton color="secondary" onClick={goBack} disabled={atFirst}>
                <CIcon icon={cilArrowLeft} />
              </CButton>

              <CButton color="secondary" onClick={goForward}>
                <CIcon icon={cilArrowRight} />
              </CButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================== PHASE 2: bridge
  //
  // Its own screen rather than the tail of the last walkthrough step. It is
  // the turn from "adaptation is worth something" to "so what should I
  // actually do", and that question deserves to be the only thing on the
  // page. It also gives the eleven strategies somewhere to be introduced as a
  // set before the student has to choose between them.

  if (phase === "bridge") {
    return (
      <div className="lab5-full lab5-bridge">
        <div className="lab5-bridge-inner">
          <p className="dynamic-topic">Adapt how?</p>
          <p className="lab5-bridge-lead">
            That is the whole argument for adapting. Now the harder question:
            adapt <em>how</em>? The attacker in that example never changed their
            mind. Real ones do, and some of them are watching you back.
          </p>

          <p className="lab5-bridge-lead">
            There are five ways to attack and six ways to defend. Some of them
            beat each other. None of them beats everything.
          </p>

          <div className="lab5-bridge-lists">
            <section className="is-attacker">
              <h4>Attacker</h4>
              <ol>
                {ATTACKER_STRATEGIES.map((st) => (
                  <li key={st.id}>{st.name}</li>
                ))}
              </ol>
            </section>
            <section className="is-defender">
              <h4>Defender</h4>
              <ol>
                {DEFENDER_STRATEGIES.map((st) => (
                  <li key={st.id}>{st.name}</li>
                ))}
              </ol>
            </section>
          </div>

          <div className="lab5-bridge-actions">
            <CButton
              color="primary"
              size="lg"
              onClick={() => setPhase("picker")}
              style={{ background: LAB5_ACCENT, borderColor: LAB5_ACCENT }}
            >
              Begin Free Play
            </CButton>
            <button
              type="button"
              className="lab5-backlink"
              onClick={() => setPhase("pages")}
            >
              <CIcon icon={cilArrowLeft} /> Back to the walkthrough
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================== PHASE 3: picker

  if (phase === "picker") {
    return (
      <div className="lab5-full">
        <div className="lab5-pickhead">
          <h3>Pick a fight</h3>
          <p>
            In a repeated game there is no single right answer. What works
            depends entirely on what you can observe, which is why there are so
            many strategies. Choose one for each side and watch them play.
          </p>
        </div>

        <div className="lab5-suggest">
          <span>Suggested order:</span>
          {SUGGESTED.map((s, i) => {
            const done = seen.has(`${s.attacker}/${s.defender}`);
            return (
              <button
                key={`${s.attacker}/${s.defender}`}
                type="button"
                className={`lab5-chip ${done ? "is-done" : ""}`}
                title={s.why}
                onClick={() => {
                  setAttacker(s.attacker as AttackerStrategyId);
                  setDefender(s.defender as DefenderStrategyId);
                }}
              >
                {i + 1}
              </button>
            );
          })}
          <em>
            {seen.size} of{" "}
            {ATTACKER_STRATEGIES.length * DEFENDER_STRATEGIES.length} matchups
            explored
          </em>
        </div>

        <div className="lab5-picker">
          <section className="lab5-side is-attacker">
            <h4>Attacker</h4>
            {ATTACKER_STRATEGIES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`lab5-card ${attacker === s.id ? "is-picked" : ""}`}
                onClick={() => setAttacker(s.id)}
              >
                <span className="lab5-card-name">
                  {s.name}
                  {s.adaptive && <i>adaptive</i>}
                </span>
                <span className="lab5-card-blurb">{s.blurb}</span>
                {attacker === s.id && (
                  <span className="lab5-card-rule">{s.rule}</span>
                )}
              </button>
            ))}
          </section>

          <section className="lab5-setup">
            <h4>Setup</h4>
            <label>
              Honeypot starts on
              <div className="lab5-startpick">
                {S.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    className={startServer === i ? "is-picked" : ""}
                    onClick={() => setStartServer(i)}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </label>
            <p className="lab5-setup-note">
              Where the defense sits before round one. Static Defense never
              leaves it, and every other defense falls back to it until there is
              something to read.
            </p>
            <CButton
              color="primary"
              disabled={!attacker || !defender}
              onClick={openMatch}
              style={{ background: LAB5_ACCENT, borderColor: LAB5_ACCENT }}
            >
              Run the match
            </CButton>
            {(!attacker || !defender) && (
              <span className="lab5-setup-hint">
                Choose one strategy from each side.
              </span>
            )}
            <button
              type="button"
              className="lab5-backlink"
              onClick={() => setPhase("bridge")}
            >
              Back
            </button>
          </section>

          <section className="lab5-side is-defender">
            <h4>Defender</h4>
            {DEFENDER_STRATEGIES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`lab5-card ${defender === s.id ? "is-picked" : ""}`}
                onClick={() => setDefender(s.id)}
              >
                <span className="lab5-card-name">
                  {s.name}
                  {s.adaptive && <i>adaptive</i>}
                </span>
                <span className="lab5-card-blurb">{s.blurb}</span>
                {defender === s.id && (
                  <span className="lab5-card-rule">{s.rule}</span>
                )}
              </button>
            ))}
          </section>
        </div>
      </div>
    );
  }

  // ============================================================ PHASE 4: match

  if (!attacker || !defender) return null;

  const aName = ATTACKER_STRATEGIES.find((s) => s.id === attacker)!.name;
  const dName = DEFENDER_STRATEGIES.find((s) => s.id === defender)!.name;
  // A manual match only ever shows the rounds actually played; a simulated one
  // is revealed a round at a time by the transport controls.
  const rows = !match
    ? []
    : match.rounds.slice(
        0,
        isManual ? manual.length : Math.min(shown, DISPLAY_ROUNDS),
      );
  const live = rows.length > 0 ? rows[rows.length - 1] : null;
  const finished = isManual
    ? manual.length >= DISPLAY_ROUNDS
    : shown >= DISPLAY_ROUNDS;
  const awaitingMove = isManual && manual.length < DISPLAY_ROUNDS;
  const scored = value !== null && stats !== null;

  return (
    <div className="lab5-full lab5-match">
      <div className="lab5-matchhead">
        <div>
          <span className="lab5-tag is-attacker">{aName}</span>
          <span className="lab5-vs">vs</span>
          <span className="lab5-tag is-defender">{dName}</span>
        </div>
        <button
          type="button"
          className="lab5-backlink"
          onClick={() => setPhase("picker")}
        >
          <CIcon icon={cilReload} /> Try another matchup
        </button>
      </div>

      <div className="lab5-matchbody">
        {/* ---------------------------------------------------- the network */}
        <section className="lab5-arena">
          <ServerNetwork
            game={G}
            attacked={live ? live.attacked : null}
            defended={live ? live.defended : null}
          />

          {awaitingMove ? (
            <div className="lab5-manual">
              <p>Round {manual.length + 1}: where does the honeypot go?</p>
              <div className="lab5-startpick">
                {S.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setManual([...manual, i])}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="lab5-transport">
              <div className="lab5-transport-step">
                <CButton
                  color="secondary"
                  disabled={shown <= 1}
                  onClick={() => setShown(shown - 1)}
                >
                  <CIcon icon={cilArrowLeft} />
                </CButton>
                <span>
                  Round {rows.length} of {DISPLAY_ROUNDS}
                </span>
                <CButton
                  color="secondary"
                  disabled={finished}
                  onClick={() => setShown(shown + 1)}
                >
                  <CIcon icon={cilArrowRight} />
                </CButton>
              </div>
              {/* Below the stepper rather than tucked beside it. Skipping to
                  the end is the most common thing to want here after the
                  first couple of matchups, so it should not be the smallest
                  target on the screen. */}
              {!isManual && (
                <CButton
                  color="primary"
                  className="lab5-playout"
                  disabled={finished}
                  onClick={() => setShown(DISPLAY_ROUNDS)}
                  style={{
                    background: LAB5_ACCENT,
                    borderColor: LAB5_ACCENT,
                  }}
                >
                  {finished ? "Match complete" : "Play it out"}
                </CButton>
              )}
            </div>
          )}
        </section>

        {/* ---------------------------------------------------- the history */}
        <section className="lab5-log">
          <table className="lab5-sequence is-log">
            <thead>
              <tr>
                <th>R</th>
                <th>Attack</th>
                <th>Defense</th>
                <th>Damage</th>
                <th>Ud</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={[
                    r.caught ? "is-caught" : "",
                    i === rows.length - 1 ? "is-live" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <td>{i + 1}</td>
                  <td>{S[r.attacked].id}</td>
                  <td>{S[r.defended].id}</td>
                  <td>{r.damage === 0 ? "caught" : r.damage}</td>
                  <td>{r.ud}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ---------------------------------------------------- the verdict */}
        <section className="lab5-verdict">
          {!scored || !value || !stats ? (
            <p className="lab5-deltanote">
              Place the honeypot to begin. Your score appears once the first
              round has been played.
            </p>
          ) : (
            <>
              <div className="lab5-scores">
                {/* The settled rate, not the mean of the rows on screen.
                    Trigger against a greedy attacker reads 17 here while the
                    table still shows two opening rounds of 9, and that split
                    is correct: this box is what the defense earns from now
                    on, and the price of those two rounds shows up in the
                    discounted total below. The label has to say so, or the
                    two numbers look like they disagree. */}
                <div className="is-primary">
                  <span>Per round, settled</span>
                  <strong>{n2(stats.perRound)}</strong>
                </div>
                <div>
                  <span>Caught</span>
                  <strong>{Math.round(stats.catchRate * 100)}%</strong>
                </div>
                <div
                  className={stats.versusMix >= 0 ? "is-better" : "is-worse"}
                >
                  <span>vs Lab 4's mix</span>
                  <strong>
                    {stats.versusMix >= 0 ? "+" : ""}
                    {n2(stats.versusMix)}
                  </strong>
                </div>
              </div>

              <div className="lab5-deltabox">
                <div className="lab5-deltahead">
                  <span>Horizon</span>
                  <strong>&delta; = {delta.toFixed(2)}</strong>
                </div>
                <Slider
                  value={delta}
                  min={DELTA_MIN}
                  max={DELTA_MAX}
                  step={0.05}
                  onChange={(_, v) => setDelta(v as number)}
                  sx={{ color: LAB5_ACCENT }}
                />

                {/* A discounted total is meaningless on its own: 243.92 says
                    nothing without something to compare it against, and only
                    one matchup is ever on screen. So the comparison IS the
                    panel. Every defense is scored against the same attacker
                    at the same horizon, and dragging delta rearranges them,
                    which is the page 3 lesson made physical. */}
                <p className="lab5-rankhead">
                  Every defense against <b>{aName}</b>, scored over the whole
                  game at this horizon.
                </p>

                <ul className="lab5-ranking">
                  {ranking.map((r) => (
                    <li
                      key={r.id}
                      className={r.id === defender ? "is-current" : undefined}
                    >
                      <span className="lab5-rank-name">{r.name}</span>
                      <span className="lab5-rank-bar">
                        <i style={{ width: `${(r.total / rankTop) * 100}%` }} />
                      </span>
                      <span className="lab5-rank-val">{n2(r.total)}</span>
                    </li>
                  ))}
                </ul>

                {isManual && (
                  <p className="lab5-rankmine">
                    <span>Your own play</span>
                    <strong>{n2(value.visible)}</strong>
                  </p>
                )}

                <p className="lab5-deltanote">
                  {isManual
                    ? `Your number covers only the ${rows.length} rounds you have played, so it is not on the same footing as the rest.`
                    : "Infinite horizon: the rounds on screen plus the repeating tail, summed in closed form."}{" "}
                  Drag &delta; and watch the order change.
                </p>
              </div>

              {finished && note && (
                <div className="lab5-note">
                  <h5>{note.title}</h5>
                  <p>{note.text}</p>
                  {note.lesson && (
                    <p className="lab5-lesson">
                      <CIcon icon={cilLightbulb} />
                      {note.lesson}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
