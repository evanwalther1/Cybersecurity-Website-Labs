import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilArrowLeft,
  cilArrowRight,
  cilCheckCircle,
  cilLightbulb,
} from "@coreui/icons";
import { Slider } from "@mui/material";
import "../../styles/LabPanel.css";
import "../../styles/ExampleLab1.css";
import "../../styles/ExampleLab4.css";
import { ServerNetwork } from "./ServerNetwork";
import {
  EXAMPLE_GAME,
  asPercent,
  attackerEU,
  attackerLine,
  attackerPayoff,
  bestResponses,
  defenderEU,
  defenderLine,
  defenderOutcome,
  equalizingCoverage,
  fractionText,
  round2,
  totalValue,
} from "./stackelberg";
import type { Coverage } from "./stackelberg";

const LAB4_ACCENT = "#f08c00";

const G = EXAMPLE_GAME;
const SV = totalValue(G);
const T = G.servers;

/** The three commitments the walkthrough compares, in the order it meets them. */
const PURE_T1: Coverage = [1, 0, 0];
const DEMO: Coverage = [0.5, 0.3, 0.2];
// A non-null assertion here would be a landmine: equalizingCoverage returns
// null whenever a server's equalizing share comes out negative, which happens
// for roughly half of all games. It is feasible for this one (verified), but
// fail loudly rather than silently if the numbers are ever retuned.
const EQ = (() => {
  const solved = equalizingCoverage(G);
  if (!solved) {
    throw new Error(
      "Lab 4's example game has no feasible equalizing coverage. Retune EXAMPLE_GAME.",
    );
  }
  return solved;
})();

// Everything printed below is computed, never typed in by hand, so the prose
// cannot drift away from the diagram if the game is ever retuned.
const ua = (coverage: Coverage, i: number) =>
  round2(attackerEU(G, coverage, i));
const ud = (coverage: Coverage, i: number) =>
  round2(defenderEU(G, coverage, i));
const aLine = (i: number) => attackerLine(G, i);
const dLine = (i: number) => defenderLine(G, i);

/** "6 - 8x1", built from the solver rather than written out. */
const aLineText = (i: number) => {
  const { intercept, slope } = aLine(i);
  return `${intercept} - ${Math.abs(slope)}x${i + 1}`;
};
const dLineText = (i: number) => {
  const { intercept, slope } = dLine(i);
  return `${intercept} + ${slope}x${i + 1}`;
};

const BEST_PURE = (() => {
  let best = { k: 0, value: -Infinity };
  T.forEach((_, k) => {
    const x = T.map((__, j) => (j === k ? 1 : 0));
    const outcome = defenderOutcome(G, x);
    if (outcome.value > best.value) best = { k, value: outcome.value };
  });
  return best;
})();

// One line per page, shown on the roadmap. Indexed against `pages`, so the
// count is asserted below rather than left to drift.
const ROADMAP_BLURBS = [
  "Read the network, and work out what each side gains or loses.",
  "Commit to protecting one server, and see what that tells the attacker.",
  "Find out why no certain commitment can ever work.",
  "Set up the mixed strategy, and derive what the attacker expects at each server.",
  "Try a mix, compute the attacker's best response, and see what you get.",
  "Tune the mix until the attacker has no favorite left.",
  "Compute your own expected utility, and compare tuned against untuned.",
];

interface View {
  coverage?: Coverage;
  attacked?: number | null;
  highlight?: number | null;
}

interface Step {
  question: string;
  /** Shown once Show Answer is pressed. */
  response: ReactNode;
  /** Diagram state before the answer is revealed. */
  view?: View;
  /** Diagram state after. Falls back to `view`. */
  revealView?: View;
  /** The one step the student drives themselves. */
  interactive?: boolean;
}

interface Page {
  topic: string;
  definition: string[];
  steps: Step[];
}

const Formula = ({ children }: { children: ReactNode }) => (
  <code className="lab4-formula">{children}</code>
);

const Note = ({ children }: { children: ReactNode }) => (
  <div className="lab4-note">{children}</div>
);

/** The three expected-payoff lines, with the winner marked. */
const PayoffTable = ({
  coverage,
  who,
}: {
  coverage: Coverage;
  who: "attacker" | "defender";
}) => {
  const winners = bestResponses(G, coverage);
  return (
    <table className="lab4-table">
      <thead>
        <tr>
          <th>Server</th>
          <th>{who === "attacker" ? "EUa" : "EUd"}</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {T.map((server, i) => (
          <tr key={server.id} className={winners.includes(i) ? "is-best" : ""}>
            <td>{server.id}</td>
            <td>
              <code>{who === "attacker" ? aLineText(i) : dLineText(i)}</code>
            </td>
            <td>
              <strong>
                {who === "attacker" ? ua(coverage, i) : ud(coverage, i)}
              </strong>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const ExampleLab4 = () => {
  // The roadmap sits in front of the walkthrough so students meet the two
  // ideas the lab assumes (what a Stackelberg game is, what expected utility
  // means) before any numbers appear.
  const [showIntro, setShowIntro] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  // Keyed by page and step so a revealed answer stays revealed when you
  // navigate away and come back, matching Labs 1 to 3.
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());

  // State for the one hands-on step. x3 is whatever is left, because the three
  // probabilities have to sum to 1.
  const [playX1, setPlayX1] = useState(0.5);
  const [playX2, setPlayX2] = useState(0.3);
  const playCoverage: Coverage = useMemo(
    () => [playX1, playX2, Math.max(0, 1 - playX1 - playX2)],
    [playX1, playX2],
  );
  const playHit = defenderOutcome(G, playCoverage);

  const pages: Page[] = [
    {
      topic: "The network and the payoffs",
      definition: [
        "Lab 4 is a Stackelberg security game. There is one entry point and three servers. Each server is worth something if the attacker takes it, and costs the attacker something to reach whether or not the attack lands.",
        `The defender has exactly one honeypot. Deploying it costs Ch = ${G.honeypotCost}, and that cost is paid up front, before anyone moves.`,
      ],
      steps: [
        {
          question:
            "The attacker reaches T2, and the honeypot is somewhere else. What does each side walk away with?",
          view: { highlight: 1 },
          revealView: { highlight: 1, attacked: 1 },
          response: (
            <>
              <p className="dynamic-response">
                T2 is undefended, so the damage is its full value:{" "}
                <strong>D2 = {T[1].value}</strong>.
              </p>
              <Formula>
                Ua = D2 &minus; Ce2 = {T[1].value} &minus; {T[1].exploitCost} ={" "}
                {attackerPayoff(G, 1, false)}
              </Formula>
              <Formula>
                Ud = SUM(V) &minus; D2 &minus; Ch = {SV} &minus; {T[1].value}{" "}
                &minus; {G.honeypotCost} = {ud([0, 0, 0], 1)}
              </Formula>
            </>
          ),
        },
        {
          question:
            "Same attack, but this time the honeypot is sitting on T2. What changes?",
          view: { coverage: [0, 1, 0], highlight: 1 },
          revealView: { coverage: [0, 1, 0], highlight: 1, attacked: 1 },
          response: (
            <>
              <p className="dynamic-response">
                The honeypot absorbs the attack, so no damage is done:{" "}
                <strong>D2 = 0</strong>.
              </p>
              <Formula>
                Ua = 0 &minus; Ce2 = 0 &minus; {T[1].exploitCost} ={" "}
                {attackerPayoff(G, 1, true)}
              </Formula>
              <Formula>
                Ud = {SV} &minus; 0 &minus; {G.honeypotCost} ={" "}
                {ud([0, 1, 0], 1)}
              </Formula>
              <Note>
                This is an important concept to understand. The honeypot absorbs
                the damage, but the attacker{" "}
                <em>still pays the exploit cost</em>. A failed attack is not
                free, and that is what lets coverage make a server unattractive
                without ever having to be certain.
              </Note>
            </>
          ),
        },
      ],
    },

    {
      topic: "Commitment",
      definition: [
        "A Stackelberg game has a leader and a follower. The leader commits to a strategy first, in the open. The follower sees that commitment and picks their best response to it.",
        "Here the defender is the leader. That is the reverse of Lab 3, where the defender reacted to a move the attacker had already made. Now you move first and have to live with it, so you must choose while anticipating what the attacker will do about your choice.",
      ],
      steps: [
        {
          question:
            "You commit to putting the honeypot on T1. Knowing that, where does the attacker go?",
          view: { coverage: PURE_T1 },
          revealView: { coverage: PURE_T1, attacked: 1 },
          response: (
            <>
              <PayoffTable coverage={PURE_T1} who="attacker" />
              <p className="dynamic-response">
                The attacker takes <strong>{T[1].id}</strong> for{" "}
                {ua(PURE_T1, 1)}, and you are left with{" "}
                <strong>{ud(PURE_T1, 1)}</strong>.
              </p>
              <Note>
                Not T1, even though it is the most valuable thing on the
                network. Covering it is exactly what took it off the table.
              </Note>
            </>
          ),
        },
        {
          question:
            "Would committing to T2 or T3 instead have done any better?",
          view: { coverage: PURE_T1 },
          revealView: {
            coverage: T.map((_, j) => (j === BEST_PURE.k ? 1 : 0)),
            attacked: defenderOutcome(
              G,
              T.map((_, j) => (j === BEST_PURE.k ? 1 : 0)),
            ).server,
          },
          response: (
            <>
              <table className="lab4-table">
                <thead>
                  <tr>
                    <th>You cover</th>
                    <th>Attacker takes</th>
                    <th>You get</th>
                  </tr>
                </thead>
                <tbody>
                  {T.map((server, k) => {
                    const x = T.map((_, j) => (j === k ? 1 : 0));
                    const outcome = defenderOutcome(G, x);
                    return (
                      <tr
                        key={server.id}
                        className={k === BEST_PURE.k ? "is-best" : ""}
                      >
                        <td>{server.id}</td>
                        <td>{T[outcome.server].id}</td>
                        <td>
                          <strong>{round2(outcome.value)}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="dynamic-response">
                Covering {T[BEST_PURE.k].id} is the best you can do with a
                single, certain choice:{" "}
                <strong>{round2(BEST_PURE.value)}</strong> out of {SV}.
              </p>
              <Note>
                A pure commitment tells the attacker precisely where not to go,
                and they always have somewhere else. You are handing over{" "}
                {round2(SV - BEST_PURE.value)} every time, and the attacker
                never has to take a risk to collect it.
              </Note>
            </>
          ),
        },
      ],
    },

    {
      topic: "Why a certain defense fails",
      definition: [
        "Before reaching for anything more complicated, it is worth being precise about what went wrong with the pure commitments, because the fix follows directly from it.",
      ],
      steps: [
        {
          question:
            "In all three pure commitments, how often did the honeypot actually catch anybody?",
          view: { coverage: PURE_T1, attacked: 1 },
          response: (
            <>
              <p className="dynamic-response">Never. Not once.</p>
              <table className="lab4-table">
                <thead>
                  <tr>
                    <th>You cover</th>
                    <th>Attacker takes</th>
                    <th>Caught?</th>
                  </tr>
                </thead>
                <tbody>
                  {T.map((server, k) => {
                    const x = T.map((_, j) => (j === k ? 1 : 0));
                    const hit = defenderOutcome(G, x).server;
                    return (
                      <tr key={server.id}>
                        <td>{server.id}</td>
                        <td>{T[hit].id}</td>
                        <td>{hit === k ? "yes" : "no"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="dynamic-response">
                You paid Ch = {G.honeypotCost} every single time and bought
                nothing with it. Covering {T[0].id} did not protect {T[0].id}.
                It just told the attacker to go to {T[1].id} instead.
              </p>
              <Note>
                This is the real problem. A single commitment does not defend a
                server, it <em>redirects</em> the attacker. And with three
                servers and one honeypot, there is always somewhere left to
                redirect them to.
              </Note>
            </>
          ),
        },
        {
          question:
            "So if you cannot cover everything, what can you actually do?",
          view: { coverage: PURE_T1 },
          response: (
            <>
              <p className="dynamic-response">
                You can make the attacker <strong>unsure</strong>.
              </p>
              <p className="dynamic-response">
                A server that is definitely safe is worth its full value to
                attack. A server that <em>might</em> be trapped is worth less,
                because some of the time the attack fails and the attacker still
                paid to try. You cannot cover three servers with one honeypot,
                but you can make all three uncertain.
              </p>
              <p className="dynamic-response">
                Look at what that does to a single number. Under your pure
                commitment the attacker took {T[1].id} and earned{" "}
                <strong>{ua(PURE_T1, 1)}</strong>, with no risk at all. Now
                suppose {T[1].id} merely had a 30% chance of being covered:
              </p>
              <Formula>
                0.3 &times; ({attackerPayoff(G, 1, true)}) + 0.7 &times;{" "}
                {attackerPayoff(G, 1, false)} = {ua([0, 0.3, 0], 1)}
              </Formula>
              <Note>
                The same server, the same honeypot, the same cost to you. Its
                value to the attacker fell from {ua(PURE_T1, 1)} to{" "}
                {ua([0, 0.3, 0], 1)} purely because they stopped being certain.
                That is the entire idea behind a mixed strategy, and the rest of
                this lab is working out how much uncertainty to put where.
              </Note>
            </>
          ),
        },
      ],
    },

    {
      topic: "Setting up the mixed strategy",
      definition: [
        "A mixed strategy replaces the single choice with a probability for each server. You still deploy exactly one honeypot; what you are committing to is the odds of where it lands.",
        "You commit to the odds publicly, so the attacker knows them. What they do not know is the draw. They have to choose a server before they find out where the honeypot went.",
      ],
      steps: [
        {
          question:
            "Name the three things you are now committing to, and the one rule they have to obey.",
          view: {},
          response: (
            <>
              <Formula>
                x1 = P(HP @ {T[0].id}){"\n"}x2 = P(HP @ {T[1].id}){"\n"}x3 =
                P(HP @ {T[2].id})
              </Formula>
              <p className="dynamic-response">
                And because there is exactly one honeypot and it has to go
                somewhere:
              </p>
              <Formula>x1 + x2 + x3 = 1</Formula>
              <Note>
                That constraint is doing real work later. It is the reason you
                cannot simply raise every xi at once: coverage is a fixed budget
                being divided up, and giving more to one server always means
                taking it from another.
              </Note>
            </>
          ),
        },
        {
          question:
            "To choose good numbers you first have to predict what the attacker will do. What does the attacker expect to earn at T1, for any x1?",
          view: { highlight: 0 },
          response: (
            <>
              <p className="dynamic-response">
                There are only two things that can happen at {T[0].id}, so work
                out both and weigh them:
              </p>
              <table className="lab4-table">
                <thead>
                  <tr>
                    <th>{T[0].id}</th>
                    <th>Attacker gets</th>
                    <th>How often</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>protected</td>
                    <td>
                      <code>
                        0 &minus; {T[0].exploitCost} ={" "}
                        {attackerPayoff(G, 0, true)}
                      </code>
                    </td>
                    <td>x1</td>
                  </tr>
                  <tr>
                    <td>unprotected</td>
                    <td>
                      <code>
                        {T[0].value} &minus; {T[0].exploitCost} ={" "}
                        {attackerPayoff(G, 0, false)}
                      </code>
                    </td>
                    <td>1 &minus; x1</td>
                  </tr>
                </tbody>
              </table>
              <Formula>
                EUa({T[0].id}) = x1 &middot; ({attackerPayoff(G, 0, true)}) + (1
                &minus; x1) &middot; {attackerPayoff(G, 0, false)} ={" "}
                {aLineText(0)}
              </Formula>
            </>
          ),
        },
        {
          question: "Now do exactly the same for T2 and T3.",
          view: {},
          response: (
            <>
              {[1, 2].map((i) => (
                <Formula key={T[i].id}>
                  EUa({T[i].id}) = x{i + 1} &middot; (
                  {attackerPayoff(G, i, true)}) + (1 &minus; x{i + 1}) &middot;{" "}
                  {attackerPayoff(G, i, false)} = {aLineText(i)}
                </Formula>
              ))}
              <p className="dynamic-response">
                Three servers, three equation, each one falling as its own
                coverage rises:
              </p>
              <table className="lab4-table">
                <thead>
                  <tr>
                    <th>Server</th>
                    <th>Open</th>
                    <th>Covered</th>
                    <th>EUa</th>
                  </tr>
                </thead>
                <tbody>
                  {T.map((server, i) => (
                    <tr key={server.id}>
                      <td>{server.id}</td>
                      <td>{attackerPayoff(G, i, false)}</td>
                      <td>{attackerPayoff(G, i, true)}</td>
                      <td>
                        <code>{aLineText(i)}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>
                Notice the slopes differ: {Math.abs(aLine(0).slope)},{" "}
                {Math.abs(aLine(1).slope)} and {Math.abs(aLine(2).slope)}.
                Coverage on {T[0].id} buys you more per unit than coverage on{" "}
                {T[2].id}, because {T[0].id} has more to lose. That is why the
                final answer will not just split the honeypot evenly.
              </Note>
            </>
          ),
        },
        {
          question:
            "Put the three equations together. How does the attacker decide?",
          view: {},
          response: (
            <>
              <Formula>
                BRa(x) = arg max &#123; {[0, 1, 2].map(aLineText).join(", ")}{" "}
                &#125;
              </Formula>
              <p className="dynamic-response">
                They compute all three and take whichever equation gives the
                highest payoff.
              </p>
              <Note>
                This is the piece you are really committing against. You do not
                get to choose where the attacker goes, but you do choose the
                three numbers they are choosing between, and that is enough.
              </Note>
            </>
          ),
        },
        {
          question:
            "Before putting real numbers through it, get a feel for the rule. Drag the coverage around and watch where the attacker goes.",
          interactive: true,
          response: (
            <>
              <p className="dynamic-response">
                Two things should have happened. Pouring coverage onto the
                server under attack pushed its line down until it stopped being
                the highest, and the instant that happened the attacker moved
                somewhere else and every further unit you added there earned you
                nothing.
              </p>
            </>
          ),
        },
      ],
    },

    {
      topic: "Trying a mix",
      definition: [
        "The machinery is built, so put numbers through it. The mix below is just a reasonable-looking guess, not the answer to anything; the point is to see the whole calculation run end to end before worrying about whether it is the best one.",
      ],
      steps: [
        {
          question:
            "Say the defender commits to x = (0.5, 0.3, 0.2). What does the attacker expect at each server?",
          view: { coverage: DEMO },
          revealView: { coverage: DEMO, attacked: 1 },
          response: (
            <>
              {T.map((server, i) => (
                <Formula key={server.id}>
                  EUa({server.id}) = {aLine(i).intercept} &minus;{" "}
                  {Math.abs(aLine(i).slope)}({DEMO[i]}) = {ua(DEMO, i)}
                </Formula>
              ))}
              <PayoffTable coverage={DEMO} who="attacker" />
              <p className="dynamic-response">
                The largest is {ua(DEMO, 1)}, so the attacker's best response is{" "}
                <strong>{T[1].id}</strong>.
              </p>
              <Note>
                Half your coverage went to {T[0].id} and it worked: the
                attacker's payoff there fell to {ua(DEMO, 0)}, the lowest of the
                three. The trouble is they do not have to go there.
              </Note>
            </>
          ),
        },
        {
          question:
            "The attacker is taking T2. What does that leave you with, and is it any better than committing purely?",
          view: { coverage: DEMO, attacked: 1 },
          response: (
            <>
              <p className="dynamic-response">
                Your payoff follows the same two-case logic. If {T[1].id} is
                covered you lose nothing and pay only Ch; if it is open you lose
                its value too:
              </p>
              <Formula>
                EUd({T[1].id}) = x2 &middot; {defenderPayoffCovered()} + (1
                &minus; x2) &middot; {round2(defenderEU(G, [0, 0, 0], 1))} ={" "}
                {dLineText(1)}
              </Formula>
              <Formula>
                EUd({T[1].id}) = {dLine(1).intercept} + {dLine(1).slope}(
                {DEMO[1]}) = {ud(DEMO, 1)}
              </Formula>
              <table className="lab4-table lab4-ladder">
                <tbody>
                  <tr>
                    <td>Best pure commitment</td>
                    <td>{round2(BEST_PURE.value)}</td>
                  </tr>
                  <tr className="is-best">
                    <td>This mix</td>
                    <td>
                      <strong>{ud(DEMO, 1)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Note>
                Better, and from a guess. Same network, same single honeypot,
                same Ch. The gain came entirely from the attacker no longer
                knowing where the honeypot is.
              </Note>
            </>
          ),
        },
        {
          question:
            "Look at the attacker's three numbers again. Is this mix wasting anything?",
          view: { coverage: DEMO, attacked: 1 },
          response: (
            <>
              <PayoffTable coverage={DEMO} who="attacker" />
              <p className="dynamic-response">
                The attacker is going to {T[1].id} for {ua(DEMO, 1)}. {T[0].id}{" "}
                and {T[2].id} are sitting at {ua(DEMO, 0)} and {ua(DEMO, 2)},
                well below that. They were never going to pick either of them.
              </p>
              <p className="dynamic-response">
                So every bit of coverage holding {T[0].id} and {T[2].id} down{" "}
                <em>below</em> {ua(DEMO, 1)} is doing nothing for you. It is
                deterring an attack that was not going to happen. Move some of
                it onto {T[1].id} and the server they actually want gets less
                attractive.
              </p>
              <Note>
                Which raises the obvious question: how far can that go? Keep
                shifting coverage onto whichever server is on top and{" "}
                <strong>it stops being on top</strong>. The process runs out
                exactly when no server is strictly the favorite, which is the
                next page.
              </Note>
            </>
          ),
        },
      ],
    },

    {
      topic: "Optimizing: make the attacker indifferent",
      definition: [
        "Any server strictly below the attacker's best is a server they will never choose, so coverage spent holding it down is wasted. That is true of every mix except one: the mix where all three are equal.",
        "So the optimal commitment is the one that makes the attacker exactly indifferent. Not because indifference is nice in itself, but because it is the only arrangement with no wasted coverage left in it.",
      ],
      steps: [
        {
          question:
            "Write the condition. What has to be true of the three expected payoffs?",
          view: { coverage: DEMO },
          response: (
            <>
              <Formula>{[0, 1, 2].map(aLineText).join(" = ")}</Formula>
              <Formula>subject to&nbsp;&nbsp;x1 + x2 + x3 = 1</Formula>
              <p className="dynamic-response">
                Three expressions set equal gives two equations, and the budget
                constraint gives a third. Three equations, three unknowns.
              </p>
              <Note>
                The tidy way to handle it is to call the common value{" "}
                <strong>v</strong>, which is what the attacker ends up expecting
                to earn whichever server they pick, and solve for each coverage
                in terms of v.
              </Note>
            </>
          ),
        },
        {
          question: "Write each coverage in terms of that common value v.",
          view: { coverage: DEMO },
          response: (
            <>
              {T.map((server, i) => (
                <Formula key={server.id}>
                  {aLineText(i)} = v &nbsp;&rarr;&nbsp; x{i + 1} = (
                  {aLine(i).intercept} &minus; v) / {Math.abs(aLine(i).slope)}
                </Formula>
              ))}
              <Note>
                Every coverage shrinks as v grows, which makes sense: the more
                you are willing to let the attacker earn, the less coverage you
                need to hold them to it.
              </Note>
            </>
          ),
        },
        {
          question: "Now use x1 + x2 + x3 = 1 to solve for v.",
          view: { coverage: DEMO },
          response: (
            <>
              <Formula>
                ({aLine(0).intercept} &minus; v)/{Math.abs(aLine(0).slope)} + (
                {aLine(1).intercept} &minus; v)/{Math.abs(aLine(1).slope)} + (
                {aLine(2).intercept} &minus; v)/{Math.abs(aLine(2).slope)} = 1
              </Formula>
              <p className="dynamic-response">
                Multiply through by 24, the smallest number{" "}
                {Math.abs(aLine(0).slope)}, {Math.abs(aLine(1).slope)} and{" "}
                {Math.abs(aLine(2).slope)} all divide into:
              </p>
              <Formula>
                3(6 &minus; v) + 4(5 &minus; v) + 6(3 &minus; v) = 24
              </Formula>
              <Formula>
                18 &minus; 3v + 20 &minus; 4v + 18 &minus; 6v = 24
              </Formula>
              <Formula>
                56 &minus; 13v = 24 &nbsp;&rarr;&nbsp; 13v = 32
                &nbsp;&rarr;&nbsp; v = 32/13 &asymp; {round2(EQ.attackerValue)}
              </Formula>
              <Note>
                Compare that to the {ua(DEMO, 1)} the attacker was getting from
                your guess. You have squeezed their best available outcome down
                to {round2(EQ.attackerValue)}, and critically they cannot dodge
                it by switching servers, because all three now pay the same.
              </Note>
            </>
          ),
        },
        {
          question:
            "We have solved for the attackers expected utility. Plugging v back into x1, x2, x3 gives us the defender's probabilities. What should you commit to?",
          view: { coverage: DEMO },
          revealView: { coverage: EQ.coverage },
          response: (
            <>
              {T.map((server, i) => (
                <Formula key={server.id}>
                  x{i + 1} = ({aLine(i).intercept} &minus; 32/13) /{" "}
                  {Math.abs(aLine(i).slope)} = {fractionText(EQ.coverage[i])}{" "}
                  &asymp; {asPercent(EQ.coverage[i])}
                </Formula>
              ))}
              <table className="lab4-table">
                <thead>
                  <tr>
                    <th>Server</th>
                    <th>Guess</th>
                    <th>Optimized</th>
                  </tr>
                </thead>
                <tbody>
                  {T.map((server, i) => (
                    <tr key={server.id}>
                      <td>{server.id}</td>
                      <td>{asPercent(DEMO[i], 0)}</td>
                      <td>
                        <strong>{asPercent(EQ.coverage[i])}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="dynamic-response">
                They add to exactly 1, as the constraint demands.
              </p>
              <Note>
                The big change is {T[1].id}, up from {asPercent(DEMO[1], 0)} to{" "}
                {asPercent(EQ.coverage[1])}, which is precisely the server the
                attacker was walking to. The coverage moved to where it was
                actually needed. And {T[2].id} still gets{" "}
                {asPercent(EQ.coverage[2])} despite being worth the least on the
                network, because it is cheap to reach and therefore tempting out
                of proportion to its value.
              </Note>
            </>
          ),
        },
      ],
    },

    {
      topic: "Your expected utility, tuned against untuned",
      definition: [
        "You have the attacker's side of the optimal commitment. Now compute your own, the same way, and check that all this work actually paid.",
      ],
      steps: [
        {
          question:
            "Write your expected utility at each server, then evaluate it at the optimized coverage.",
          view: { coverage: EQ.coverage },
          response: (
            <>
              <p className="dynamic-response">
                Two cases again. If the attacker hits a covered server you keep
                everything and pay only Ch; if they hit an open one you lose its
                value as well:
              </p>
              {T.map((server, i) => (
                <Formula key={server.id}>
                  EUd({server.id}) = x{i + 1} &middot; {defenderPayoffCovered()}{" "}
                  + (1 &minus; x{i + 1}) &middot;{" "}
                  {round2(defenderEU(G, [0, 0, 0], i))} = {dLineText(i)}
                </Formula>
              ))}
              <PayoffTable coverage={EQ.coverage} who="defender" />
              <Note>
                Every row is marked, because every server is now one the
                attacker is willing to take. That is what the optimization was
                for.
              </Note>
            </>
          ),
        },
        {
          question:
            "The attacker is indifferent between all three. So which do they take, and what do you actually get?",
          view: { coverage: EQ.coverage },
          revealView: {
            coverage: EQ.coverage,
            attacked: defenderOutcome(G, EQ.coverage).server,
          },
          response: (
            <>
              <p className="dynamic-response">
                By convention an indifferent follower breaks the tie in the{" "}
                <em>leader's</em> favor. That is the{" "}
                <strong>Strong Stackelberg</strong> assumption, and it gives you{" "}
                <strong>{round2(defenderOutcome(G, EQ.coverage).value)}</strong>
                .
              </p>
              <Note>
                That sounds like wishful thinking, so here is why it is not. You
                could always shave a sliver of coverage off {T[0].id} and put it
                on {T[1].id}, making {T[1].id} strictly the attacker's best
                server rather than merely tied. It would cost you almost
                nothing, so {round2(defenderOutcome(G, EQ.coverage).value)} is a
                figure you can get arbitrarily close to. The convention saves
                everyone from writing "minus a tiny amount" forever.
              </Note>
            </>
          ),
        },
        {
          question:
            "Was the optimization worth doing? Compare it against the guess and against going pure.",
          view: { coverage: EQ.coverage },
          revealView: {
            coverage: EQ.coverage,
            attacked: defenderOutcome(G, EQ.coverage).server,
          },
          response: (
            <>
              <table className="lab4-table lab4-ladder">
                <thead>
                  <tr>
                    <th>Commitment</th>
                    <th>Attacker gets</th>
                    <th>You get</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pure, cover {T[BEST_PURE.k].id}</td>
                    <td>{ua(PURE_T1, defenderOutcome(G, PURE_T1).server)}</td>
                    <td>{round2(BEST_PURE.value)}</td>
                  </tr>
                  <tr>
                    <td>Mixed, by guesswork</td>
                    <td>{ua(DEMO, defenderOutcome(G, DEMO).server)}</td>
                    <td>{round2(defenderOutcome(G, DEMO).value)}</td>
                  </tr>
                  <tr className="is-best">
                    <td>Mixed, optimized</td>
                    <td>{round2(EQ.attackerValue)}</td>
                    <td>
                      <strong>
                        {round2(defenderOutcome(G, EQ.coverage).value)}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="dynamic-response">
                Your payoff climbs {round2(BEST_PURE.value)} &rarr;{" "}
                {round2(defenderOutcome(G, DEMO).value)} &rarr;{" "}
                {round2(defenderOutcome(G, EQ.coverage).value)}, and the
                attacker's falls {ua(PURE_T1, 1)} &rarr; {ua(DEMO, 1)} &rarr;{" "}
                {round2(EQ.attackerValue)} alongside it.
              </p>
              <Note>
                Nothing about the network changed across those three rows. No
                second honeypot, no cheaper costs, no more valuable servers. The
                whole gain came from committing first, deliberately, and then
                choosing the commitment that leaves the attacker with the worst
                available best option.
              </Note>
            </>
          ),
        },
      ],
    },
  ];

  if (ROADMAP_BLURBS.length !== pages.length) {
    throw new Error(
      `Lab 4 roadmap has ${ROADMAP_BLURBS.length} entries for ${pages.length} pages.`,
    );
  }

  const currentPage = pages[pageIndex];
  const currentStep = currentPage.steps[stepIndex];
  const key = `${pageIndex}:${stepIndex}`;
  const isRevealed = revealed.has(key);
  const isLastStepOfPage = stepIndex === currentPage.steps.length - 1;
  const isLastPage = pageIndex === pages.length - 1;
  const isFinalStep = isLastPage && isLastStepOfPage;
  const canAdvance = !isComplete && isRevealed;

  const reveal = () => setRevealed((prev) => new Set(prev).add(key));

  const goForward = () => {
    if (isFinalStep) {
      setIsComplete(true);
    } else if (isLastStepOfPage) {
      setPageIndex(pageIndex + 1);
      setStepIndex(0);
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const goBack = () => {
    if (isComplete) {
      setIsComplete(false);
    } else if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
      setStepIndex(pages[pageIndex - 1].steps.length - 1);
    } else {
      // First step of the first page steps back out to the roadmap rather than
      // dead-ending, so the overview stays reachable the whole way through.
      setShowIntro(true);
    }
  };

  // Which diagram to draw. The interactive step is driven by its sliders; every
  // other step uses its own view, swapping to revealView once answered.
  const view: View = showIntro
    ? {}
    : currentStep.interactive
      ? { coverage: playCoverage, attacked: playHit.server }
      : ((isRevealed ? currentStep.revealView : undefined) ??
        currentStep.view ??
        {});

  return (
    <div className="lab-panel-columns lab4">
      <div className="lab-panel-static">
        <div className="static-lab lab4-static-lab">
          {/* Values live here rather than inside the server boxes, the same
              way Lab 2 puts its variables in a corner panel. Keeps the
              diagram about structure and coverage. */}
          <div className="lab4-variables">
            {T.map((server) => (
              <div className="lab4-variables-row" key={server.id}>
                <span className="lab4-variables-key">{server.id}</span>
                <span className="lab4-variables-val">{server.value}</span>
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
            coverage={view.coverage}
            attacked={view.attacked ?? null}
            highlight={view.highlight ?? null}
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
        <div className="dynamic-lab lab4-dynamic">
          {/* Everything except the arrows scrolls inside here. Without a
              bounded scroll container the intro simply grew taller than the
              panel and spilled out past the bottom border of the tab, which is
              why the Start button appeared below the grey line. */}
          <div className="lab4-scroll">
            {showIntro ? (
              <div className="dynamic-intro">
                <p className="dynamic-topic">Stackelberg Security Game</p>

                <p className="dynamic-intro-text">
                  A <strong>Stackelberg game</strong> has two players who do not
                  move at the same time and do not know the same things. The{" "}
                  <strong>leader</strong> picks a strategy and commits to it
                  publicly, in advance. The <strong>follower</strong> sees that
                  commitment and then picks whatever is best for them against
                  it.
                </p>

                <p className="dynamic-intro-text">
                  Showing your hand first sounds like a disadvantage. It is not.
                  Because the follower is predictable, they will always choose
                  the best option, the leader gets to anticipate this and choose{" "}
                  <em>which</em> best response they will be facing. Committing
                  first is a way of steering the other player.
                </p>

                <Note>
                  In this lab you are the <strong>defender</strong>, and the
                  defender is the leader. That is the reverse of Lab 3, where
                  the defender watched the attacker move and then answered. Here
                  you go first, everyone can see it, and you cannot change your
                  mind afterwards.
                </Note>

                <p className="dynamic-topic">Expected utility</p>

                <p className="dynamic-intro-text">
                  The other idea this lab leans on is{" "}
                  <strong>expected utility</strong>. If you commit to a
                  probability instead of a certainty, there is no single payoff
                  any more, there is a weighted average of the payoffs that
                  could happen. Expected utility is that average: every possible
                  outcome, multiplied by how often it occurs, added together.
                </p>

                <p className="dynamic-intro-text">
                  Say a server is covered 30% of the time, attacking it earns
                  the attacker &minus;1 when it is covered and 5 when it is not.
                  Their expected utility is{" "}
                  <code>0.3 &times; (&minus;1) + 0.7 &times; 5 = 3.2</code>.
                  They never actually collect 3.2 on any single attack. It is
                  what they would average over many, and it is what a rational
                  attacker chooses on.
                </p>

                <div className="dynamic-controls">
                  <CButton
                    style={{
                      backgroundColor: LAB4_ACCENT,
                      borderColor: LAB4_ACCENT,
                    }}
                    onClick={() => setShowIntro(false)}
                  >
                    Start Walkthrough
                  </CButton>
                </div>
              </div>
            ) : isComplete ? (
              <div className="dynamic-finish">
                <p className="dynamic-finish-title">Walkthrough complete!</p>
                <p className="dynamic-finish-subtitle">
                  You have taken a defense from {round2(BEST_PURE.value)} up to{" "}
                  {round2(defenderOutcome(G, EQ.coverage).value)} without adding
                  a single resource.
                </p>
                <div className="concepts-learned">
                  <p className="concepts-learned-title">Concepts learned</p>
                  <ul className="concepts-learned-list">
                    {[
                      "Stackelberg games: leader commits, follower responds",
                      "Why commitment is different from reacting",
                      "Expected utility under a mixed commitment",
                      "The attacker's best response function",
                      "Making the follower indifferent to optimize",
                      "Strong Stackelberg tie-breaking",
                    ].map((concept) => (
                      <li key={concept}>
                        <CIcon
                          icon={cilCheckCircle}
                          className="concepts-learned-icon"
                        />
                        <span>{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="dynamic-finish-subtitle">
                  Practice is now open to go and try it out yourself
                </p>
              </div>
            ) : (
              <>
                <div className="dynamic-definition">
                  <CIcon
                    icon={cilLightbulb}
                    className="dynamic-definition-icon"
                  />
                  <div>
                    {currentPage.definition.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>

                <p className="dynamic-topic">{currentPage.topic}</p>
                <p className="dynamic-question">{currentStep.question}</p>

                {currentStep.interactive && (
                  <div className="lab4-sliders">
                    <label>
                      <span>
                        x1 <b>{asPercent(playCoverage[0], 0)}</b>
                      </span>
                      <Slider
                        value={playX1}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(_, value) =>
                          setPlayX1(Math.min(value as number, 1 - playX2))
                        }
                        sx={{ color: LAB4_ACCENT }}
                      />
                    </label>
                    <label>
                      <span>
                        x2 <b>{asPercent(playCoverage[1], 0)}</b>
                      </span>
                      <Slider
                        value={playX2}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(_, value) =>
                          setPlayX2(Math.min(value as number, 1 - playX1))
                        }
                        sx={{ color: LAB4_ACCENT }}
                      />
                    </label>
                    <p className="lab4-sliders-rest">
                      x3 takes whatever is left:{" "}
                      <b>{asPercent(playCoverage[2], 0)}</b>
                    </p>
                    <PayoffTable coverage={playCoverage} who="attacker" />
                    <p className="dynamic-response">
                      The attacker takes <strong>{T[playHit.server].id}</strong>
                      , and you get <strong>{round2(playHit.value)}</strong>.
                    </p>
                  </div>
                )}

                {isRevealed && currentStep.response}

                {!isRevealed && (
                  <div className="dynamic-controls">
                    <CButton
                      style={{
                        backgroundColor: LAB4_ACCENT,
                        borderColor: LAB4_ACCENT,
                      }}
                      onClick={reveal}
                    >
                      Show Answer
                    </CButton>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Outside the scroller, so the arrows stay pinned to the bottom of
              the panel instead of being chased off by long pages. */}
          {/* No arrows on the roadmap. It has its own button, and offering
              two ways forward from the same screen is just ambiguity. */}
          {!showIntro && (
            <div className="dynamic-nav">
              <CButton color="secondary" onClick={goBack}>
                <CIcon icon={cilArrowLeft} />
              </CButton>
              <CButton
                color="secondary"
                onClick={goForward}
                disabled={!canAdvance}
              >
                <CIcon icon={cilArrowRight} />
              </CButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Defender's payoff when the attacked server turned out to be covered. It is
 *  the same number for every server, since no damage is done either way. */
function defenderPayoffCovered(): number {
  return round2(defenderEU(G, [1, 1, 1], 0));
}
