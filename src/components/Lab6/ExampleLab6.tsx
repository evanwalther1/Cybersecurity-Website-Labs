import { useState } from "react";
import type { ReactNode } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilArrowLeft,
  cilArrowRight,
  cilCheckCircle,
  cilLightbulb,
} from "@coreui/icons";
import "../../styles/LabPanel.css";
import "../../styles/ExampleLab1.css";
import "../../styles/ExampleLab6.css";
import { BayesianNetwork } from "./BayesianNetwork";
import { ALL_TERMS } from "./glossary";
import { TermList } from "./Term";
import * as B from "./bayesian";

const T = B.TARGETS;
const id = (i: number) => T[i].id;

// Every number below is read from bayesian.ts, never typed in, so the prose
// cannot drift away from the solver.
//
// TEN SCREENS, NOT TWENTY-EIGHT. The first version split this into 7 pages
// of 3 to 5 steps each, which is how the earlier labs are built, and it was
// far too long: a reader could not tell how much was left or where they were
// in the argument. The walkthrough is now a flat list of ten screens, one
// idea each, with nothing but a pair of arrows to move between them.

const n = (x: number, p = 2) => B.num(x, p);
const pc = (x: number, p = 0) => B.pct(x, p);

/** 400 incidents, split and re-split by the two alerts. */
const TALLY_1 = B.tally(
  B.COUNT_BASE,
  B.PRIOR_H,
  B.IDS1.likelihood.H,
  B.IDS1.likelihood.L,
);
const TALLY_2 = B.tally(
  TALLY_1.alerts,
  TALLY_1.share,
  B.IDS2.likelihood.H,
  B.IDS2.likelihood.L,
);

interface Screen {
  title: string;
  body: ReactNode;
  /** What the diagram shows while this screen is open. */
  view?: { live?: string | null; guarded?: number | null; focus?: boolean };
}

// ---------------------------------------------------------------------------
// Pieces used on more than one screen
// ---------------------------------------------------------------------------

const PropensityTable = () => (
  <table className="lab6-table is-types">
    <thead>
      <tr>
        <th />
        {T.map((t) => (
          <th key={t.id}>{t.id}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {(["H", "L"] as const).map((k) => (
        <tr key={k}>
          <th>Type {k}</th>
          {B.PROPENSITY[k].map((p, i) => (
            <td key={i}>{pc(p)}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const BeliefBar = ({ pH, label }: { pH: number; label: string }) => (
  <div className="lab6-belief">
    <span className="lab6-belief-label">{label}</span>
    <div className="lab6-belief-bar">
      <i className="is-h" style={{ width: `${pH * 100}%` }}>
        H {pc(pH)}
      </i>
      <i className="is-l" style={{ width: `${(1 - pH) * 100}%` }}>
        L {pc(1 - pH)}
      </i>
    </div>
  </div>
);

/** The same arithmetic as Bayes' rule with the fractions taken out. */
const CountTree = ({
  t,
  alert,
  from,
}: {
  t: B.Tally;
  alert: string;
  from: string;
}) => (
  <div className="lab6-count">
    <div className="lab6-count-top">
      {t.total} {from}
    </div>
    <div className="lab6-count-split">
      <div className="is-h">
        <strong>{t.h}</strong> high skill
      </div>
      <div className="is-l">
        <strong>{t.l}</strong> low skill
      </div>
    </div>
    <div className="lab6-count-arrow">{alert} fires for&hellip;</div>
    <div className="lab6-count-split">
      <div className="is-h">
        <strong>{t.hAlert}</strong> of them
      </div>
      <div className="is-l">
        <strong>{t.lAlert}</strong> of them
      </div>
    </div>
    <div className="lab6-count-result">
      {t.alerts} alerts in all, <strong>{t.hAlert}</strong> of them high skill
      &nbsp;&rarr;&nbsp; <strong>{pc(t.share)}</strong>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// The ten screens
// ---------------------------------------------------------------------------

const SCREENS: Screen[] = [
  // ------------------------------------------------------------------- 1
  {
    title: "What a Bayesian game is",
    body: (
      <>
        <p>
          In every lab so far, both players could see everything that mattered.
          A <strong>Bayesian game</strong> is one where they cannot. At least
          one player holds private information, and the other has to act without
          it.
        </p>
        <p>
          That hidden thing is called the player&apos;s <strong>type</strong>.
          You never learn it directly. What you do instead is hold a{" "}
          <em>belief</em> about it, a probability, and revise that belief every
          time you see evidence. The machinery for revising it is{" "}
          <strong>Bayes&apos; rule</strong>, and it is the one piece of maths
          this lab is really about.
        </p>

        <p className="lab6-definehead">
          Some definitions to remember. Everything in this lab that is not
          obvious is defined here, so this is the one screen worth coming back
          to. <strong>Click any highlighted term</strong> for a plain example of
          it.
        </p>
        <TermList terms={ALL_TERMS} />
      </>
    ),
  },

  // ------------------------------------------------------------------- 2
  {
    title: "The whole point",
    body: (
      <>
        <p>
          You are the defender. You have <strong>one honeypot</strong> and three
          servers, and you have to put it on one of them <em>before</em> the
          attack arrives. Get it right and the attack hits a trap and does no
          damage. Get it wrong and it lands.
        </p>

        <p>
          Your whole job is to make the damage as small as you can. The server
          values and the honeypot cost are in the panel beside the diagram.
        </p>

        <h4 className="lab6-sub">Where you start</h4>
        <p>
          You are not completely blind. Two kinds of attacker exist, and from
          past incidents you know roughly how common each one is. Before you
          calculate anything, before a single alert has fired, you believe:
        </p>
        <BeliefBar pH={B.PRIOR_H} label="Before any evidence" />
        <p>
          That is your <strong>prior</strong>: {pc(B.PRIOR_H)} of attackers are
          high skill and {pc(1 - B.PRIOR_H)} are low skill.
        </p>

        <h4 className="lab6-sub">What the rest of this lab does</h4>
        <p>
          Every screen from here is one step of the same chain: take that
          starting belief and sharpen it with whatever evidence arrives.
        </p>
        <ol className="lab6-roadmap">
          <li>Work out what each kind of attacker actually goes after.</li>
          <li>Meet the two sensors, and find out how often they are wrong.</li>
          <li>
            Use <strong>Bayes&apos; rule</strong> to turn each alert into a
            revised belief, one alert at a time.
          </li>
          <li>
            Turn that belief about <em>who</em> into a belief about{" "}
            <em>where</em> they will strike.
          </li>
          <li>Place the honeypot, and measure what the evidence was worth.</li>
        </ol>
      </>
    ),
  },

  // ------------------------------------------------------------------- 3
  {
    title: "The two attackers",
    body: (
      <>
        <p>
          Two kinds of attacker exist. Here is where each one ends up, measured
          over many past incidents:
        </p>
        <PropensityTable />
        <p>
          They are not aiming at different things.{" "}
          <strong>Both of them want {id(0)}</strong>, because it is worth the
          most. The difference is that {id(0)} is the hardest thing on this
          network to reach, and only one of them is good enough to get there
          reliably: a high-skill attacker lands it {pc(B.PROPENSITY.H[0])} of
          the time, a low-skill one manages it just {pc(B.PROPENSITY.L[0])} of
          the time. The rest of the time they settle for whatever they can
          actually reach.
        </p>
        <p>
          So the table is not a record of preference. It is a record of{" "}
          <strong>capability</strong>, and that is what makes it useful to you:
          where an attack lands is evidence about how good the attacker was.
        </p>
        <p className="lab6-point">
          If you knew which one you were facing, this lab would be over. High
          skill, guard {id(0)}. Low skill, guard {id(1)}. The attacker knows
          their own type. You do not, which makes this a game of incomplete
          information.
        </p>
      </>
    ),
  },

  // ------------------------------------------------------------------- 4
  {
    title: "The alerts",
    view: { live: "IDS1" },
    body: (
      <>
        <p>
          You cannot see the attacker, but you can see them trip things on the
          way in. Two intrusion detection systems watch the network at different
          depths, and each raises one of two kinds of alert.
        </p>
        {B.SENSORS.map((sensor) => (
          <div className="lab6-alertgroup" key={sensor.id}>
            <h4 className="lab6-sub">
              {sensor.id}, watching {sensor.where}
            </h4>
            {sensor.alerts.map((a, i) => (
              <p key={a}>
                <strong>{a}</strong> &mdash; {sensor.blurb[i]}
              </p>
            ))}
          </div>
        ))}
        <p className="lab6-warn">
          <CIcon icon={cilLightbulb} />
          <span>
            An alert names <strong>an activity, not an attacker</strong>. In
            particular &quot;High-Privilege&quot; means the activity involved
            privileged access. It does <em>not</em> mean the alert is high
            confidence or high severity. Reading it that way is the most common
            mistake in this lab.
          </span>
        </p>
        <p>
          Two sensors means <strong>two separate observations</strong>, one
          after the other, so you get to refine your guess twice.
        </p>
      </>
    ),
  },

  // ------------------------------------------------------------------- 5
  {
    title: "Sensors are wrong sometimes",
    view: { live: "IDS1" },
    body: (
      <>
        <p>
          {B.IDS1.id} is good, not perfect. When it sees web probing it says so{" "}
          {pc(B.SENSOR_ACCURACY, 1)} of the time, and the rest of the time it
          mislabels it.
        </p>
        <table className="lab6-table is-wide">
          <thead>
            <tr>
              <th>What actually happened</th>
              <th>&quot;{B.IDS1.alerts[0]}&quot;</th>
              <th>&quot;{B.IDS1.alerts[1]}&quot;</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Web probing</th>
              <td className="is-good">{pc(B.SENSOR_ACCURACY, 1)}</td>
              <td>{pc(1 - B.SENSOR_ACCURACY, 1)}</td>
            </tr>
            <tr>
              <th>Credential probing</th>
              <td>{pc(1 - B.SENSOR_ACCURACY, 1)}</td>
              <td className="is-good">{pc(B.SENSOR_ACCURACY, 1)}</td>
            </tr>
          </tbody>
        </table>
        <p>
          Now stack that on top of behaviour. A high-skill attacker does web
          probing <strong>5/6</strong> of the time. So a web alert can arrive
          two different ways:
        </p>
        <div className="lab6-formula is-stack">
          <span>
            they web-probed <em>and</em> the sensor got it right
          </span>
          <span>
            5/6 &times; {B.SENSOR_ACCURACY} ={" "}
            {n(B.WEB_PROPENSITY.H * B.SENSOR_ACCURACY, 4)}
          </span>
          <span>
            they credential-probed <em>and</em> the sensor got it wrong
          </span>
          <span>
            1/6 &times; {n(1 - B.SENSOR_ACCURACY, 3)} ={" "}
            {n((1 - B.WEB_PROPENSITY.H) * (1 - B.SENSOR_ACCURACY), 4)}
          </span>
          <span className="is-total">
            P(Web alert | H) = {n(B.IDS1.likelihood.H)}
          </span>
        </div>
        <p>
          The same sum for a low-skill attacker, who web-probes only 1/6 of the
          time, gives{" "}
          <strong>P(Web alert | L) = {n(B.IDS1.likelihood.L)}</strong>.
        </p>
        <p className="lab6-point">
          Look at what the sensor&apos;s error did. The attacker web-probes{" "}
          {pc(B.WEB_PROPENSITY.H, 1)} of the time but the alert only says so{" "}
          {pc(B.IDS1.likelihood.H)} of the time. Every bit of sensor error drags
          the number toward a coin flip, and that gap is exactly why an alert is
          evidence rather than proof.
        </p>
      </>
    ),
  },

  // ------------------------------------------------------------------- 6
  {
    title: "The number you have is backwards",
    view: { live: "IDS1" },
    body: (
      <>
        <p>
          You know that <code>P(Web alert | H) = {n(B.IDS1.likelihood.H)}</code>
          . An alert comes in. So:
        </p>
        <blockquote className="lab6-quiz">
          A web alert just fired. Is there a {pc(B.IDS1.likelihood.H)} chance
          you are facing a high-skill attacker?
        </blockquote>
        <p>
          No. It is <strong>{pc(B.UPDATE_1.posterior)}</strong>. Forget the
          formulas for a second and just count {B.COUNT_BASE} incidents:
        </p>
        <CountTree t={TALLY_1} alert="A web alert" from="incidents" />
        <p>
          <strong>
            {TALLY_1.hAlert} and {TALLY_1.lAlert}, exactly the same.
          </strong>{" "}
          High-skill attackers are rare but noisy; low-skill ones are quiet but
          there are three times as many. The two effects cancel, so a web alert
          leaves you at a coin flip.
        </p>
        <div className="lab6-flip">
          <div>
            <span>What you were given</span>
            <code>P(Web alert | H)</code>
            <em>Of all high-skill attackers, how many trip a web alert?</em>
            <strong>{n(B.IDS1.likelihood.H)}</strong>
          </div>
          <div className="is-want">
            <span>What you actually need</span>
            <code>P(H | Web alert)</code>
            <em>
              Of all web alerts, how many came from a high-skill attacker?
            </em>
            <strong>{n(B.UPDATE_1.posterior)}</strong>
          </div>
        </div>
        <p className="lab6-point">
          Those are different questions. The bar in a conditional probability is
          not symmetric, and the answers differ because high-skill attackers are
          rare. Rarity does not go away just because an alarm went off.
        </p>
      </>
    ),
  },

  // ------------------------------------------------------------------- 7
  {
    title: "Bayes' rule",
    view: { live: "IDS1" },
    body: (
      <>
        <p>
          Bayes&apos; rule is the machine that turns the number you have into
          the number you want.
        </p>
        <div className="lab6-bayes">
          <div className="lab6-bayes-lhs">
            P(H | s) <span>=</span>
          </div>
          <div className="lab6-bayes-frac">
            <div className="is-num">P(s | H) &middot; P(H)</div>
            <div className="is-den">
              P(s | H) &middot; P(H) &nbsp;+&nbsp; P(s | L) &middot; P(L)
            </div>
          </div>
        </div>
        <p>
          The top is the high-skill attackers who set off this alert. The bottom
          is <em>everyone</em> who set it off, which is the law of total
          probability. Divide and you get the share that are high skill, which
          is exactly what the counting did.
        </p>
        <div className="lab6-formula is-stack">
          <span>the bottom line, every way a web alert can happen</span>
          <span>
            {n(B.IDS1.likelihood.H)} &times; {n(B.PRIOR_H)} +{" "}
            {n(B.IDS1.likelihood.L)} &times; {n(1 - B.PRIOR_H)} ={" "}
            {n(B.UPDATE_1.evidence, 3)}
          </span>
          <span>
            which is the {TALLY_1.alerts} out of {B.COUNT_BASE} you just counted
          </span>
          <span className="is-total">
            P(H | Web) = {n(B.IDS1.likelihood.H)} &times; {n(B.PRIOR_H)} /{" "}
            {n(B.UPDATE_1.evidence, 3)} = {n(B.UPDATE_1.posterior)}
          </span>
        </div>
        <BeliefBar pH={B.PRIOR_H} label="Before the alert" />
        <BeliefBar pH={B.UPDATE_1.posterior} label="After the web alert" />
        <p>
          Your suspicion <strong>doubled</strong>. It is also still a coin flip:
          one alert was not enough to convict anybody.
        </p>
      </>
    ),
  },

  // ------------------------------------------------------------------- 8
  {
    title: "A second alert",
    view: { live: "IDS2" },
    body: (
      <>
        <p>
          The attacker moves deeper and {B.IDS2.id} fires a{" "}
          <strong>{B.IDS2.alerts[0]}</strong> alert. You update again, and there
          is one rule that matters:
        </p>
        <blockquote className="lab6-quiz">
          Your posterior from the first alert becomes your prior for the second.
        </blockquote>
        <p>
          You do <em>not</em> go back to {pc(B.PRIOR_H)}. You already learned
          something, and starting over would throw the first alert away. Count
          it again, beginning from the {TALLY_1.alerts} incidents that produced
          a web alert:
        </p>
        <CountTree
          t={TALLY_2}
          alert={`A ${B.IDS2.alerts[0].toLowerCase()} alert`}
          from="with a web alert"
        />
        <div className="lab6-formula is-stack">
          <span>the same rule, starting from the belief you already have</span>
          <span className="is-total">
            P(H | both) = {n(B.IDS2.likelihood.H)} &times;{" "}
            {n(B.UPDATE_1.posterior)} / ({n(B.IDS2.likelihood.H)} &times;{" "}
            {n(B.UPDATE_1.posterior)} + {n(B.IDS2.likelihood.L)} &times;{" "}
            {n(1 - B.UPDATE_1.posterior)}) = {n(B.UPDATE_2.posterior)}
          </span>
        </div>
        <BeliefBar pH={B.PRIOR_H} label="Before any alert" />
        <BeliefBar pH={B.UPDATE_1.posterior} label={`After ${B.IDS1.id}`} />
        <BeliefBar pH={B.UPDATE_2.posterior} label={`After ${B.IDS2.id}`} />
      </>
    ),
  },

  // ------------------------------------------------------------------- 9
  {
    title: "From who to where",
    body: (
      <>
        <p>
          You now believe there is a {pc(B.UPDATE_2.posterior)} chance this is a
          high-skill attacker.
        </p>
        <p>
          The honeypot goes on a server, so you need a belief about{" "}
          <strong>which server</strong>. You have each attacker&apos;s habits
          and you have how likely each attacker is, so weight one by the other:
        </p>
        <div className="lab6-formula is-stack">
          {T.map((t, i) => (
            <span key={t.id}>
              P({t.id}) = {n(B.PROPENSITY.H[i])} &times;{" "}
              {n(B.UPDATE_2.posterior)} + {n(B.PROPENSITY.L[i])} &times;{" "}
              {n(1 - B.UPDATE_2.posterior)} ={" "}
              <strong>{n(B.AFTER_2.belief[i])}</strong>
            </span>
          ))}
        </div>
        <div className="lab6-beliefrow is-big">
          {B.AFTER_2.belief.map((p, i) => (
            <div key={i}>
              <span>{id(i)}</span>
              <strong>{pc(p)}</strong>
            </div>
          ))}
        </div>
        <p>
          They sum to {n(B.AFTER_2.belief.reduce((a, b) => a + b))}, as they
          must. Compare that with where you stood before any alerts, when{" "}
          {id(1)} looked like the most likely target:
        </p>
        <div className="lab6-compare">
          <div>
            <span>Blind</span>
            {B.BLIND.belief.map((p, i) => (
              <em key={i}>
                {id(i)} {pc(p)}
              </em>
            ))}
          </div>
          <div className="is-now">
            <span>After both alerts</span>
            {B.AFTER_2.belief.map((p, i) => (
              <em key={i}>
                {id(i)} {pc(p)}
              </em>
            ))}
          </div>
        </div>
      </>
    ),
  },

  // ------------------------------------------------------------------ 10
  {
    title: "Choose, and what it was worth",
    view: { guarded: B.AFTER_2.best.target },
    body: (
      <>
        <p>
          Try each honeypot placement. Calculate the expected utility based on
          our newfound probabilities.
        </p>
        <table className="lab6-table is-wide">
          <thead>
            <tr>
              <th>Honeypot on</th>
              <th>Damage you still take</th>
              <th>Expected utility</th>
            </tr>
          </thead>
          <tbody>
            {B.AFTER_2.placements.map((p) => (
              <tr
                key={p.target}
                className={
                  p.target === B.AFTER_2.best.target ? "is-best" : undefined
                }
              >
                <th>{id(p.target)}</th>
                <td>
                  {B.AFTER_2.belief
                    .map((b, j) =>
                      j === p.target ? null : `${n(b)} x ${T[j].value}`,
                    )
                    .filter(Boolean)
                    .join("  +  ")}{" "}
                  = {n(p.damage)}
                </td>
                <td>
                  <strong>{n(p.eu)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          <strong>Guard {id(B.AFTER_2.best.target)}</strong>. Back at the start,
          with no alerts at all, the best you could have done was guard{" "}
          {id(B.BLIND.best.target)} for {n(B.BLIND.best.eu)}.
        </p>
        <div className="lab6-ladder">
          <div>
            <span>Blind</span>
            <strong>guard {id(B.BLIND.best.target)}</strong>
            <em>{n(B.BLIND.best.eu)}</em>
          </div>
          <div className="is-best">
            <span>After both alerts</span>
            <strong>guard {id(B.AFTER_2.best.target)}</strong>
            <em>{n(B.AFTER_2.best.eu)}</em>
          </div>
        </div>
        <p className="lab6-point">
          The alerts did not merely nudge a number, they{" "}
          <strong>changed the answer</strong>. And ignoring them would have cost
          more than using them gained: sitting on {id(B.BLIND.best.target)}{" "}
          while the truth had moved to {pc(B.UPDATE_2.posterior)} is worth only{" "}
          {n(B.EVIDENCE_VALUE.stubborn)}, so stubbornness costs{" "}
          {n(B.EVIDENCE_VALUE.costOfIgnoring)} against the{" "}
          {n(B.EVIDENCE_VALUE.gain)} you gained by paying attention.
        </p>
        <p>
          One last thing, so this does not become &quot;every alert means
          panic&quot;. There are four ways the two sensors could have fired and{" "}
          <strong>only one of them changes what you do</strong>:
        </p>
        <table className="lab6-table is-wide">
          <thead>
            <tr>
              <th>{B.IDS1.id}</th>
              <th>{B.IDS2.id}</th>
              <th>P(H)</th>
              <th>Guard</th>
            </tr>
          </thead>
          <tbody>
            {B.COMBINATIONS.map((c) => (
              <tr
                key={`${c.first}-${c.second}`}
                className={
                  c.best !== B.BLIND.best.target ? "is-best" : undefined
                }
              >
                <td>{c.first}</td>
                <td>{c.second}</td>
                <td>{pc(c.pH, 1)}</td>
                <td>
                  <strong>{id(c.best)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Evidence that does not distinguish between the possibilities should
          not change your mind. Bayes&apos; rule is how you tell which is which,
          and you never did have to find out who the attacker was.
        </p>
      </>
    ),
  },

  // ------------------------------------------------------------------ 11
  {
    title: "",
    view: { guarded: B.AFTER_2.best.target },
    body: (
      <div className="dynamic-finish">
        <p className="dynamic-finish-title">Walkthrough complete!</p>
        <p className="dynamic-finish-subtitle">
          You never found out who the attacker was. Two imperfect alerts were
          enough to move your belief from {pc(B.PRIOR_H)} to{" "}
          {pc(B.UPDATE_2.posterior)}, change your answer from{" "}
          {id(B.BLIND.best.target)} to {id(B.AFTER_2.best.target)}, and leave
          you {n(B.EVIDENCE_VALUE.gain)} better off than guessing.
        </p>
        <div className="concepts-learned">
          <p className="concepts-learned-title">Concepts learned</p>
          <ul className="concepts-learned-list">
            {[
              "Bayesian games: acting when the other player holds private information",
              "Types, and why a belief stands in for one",
              "Prior and posterior beliefs",
              "Why P(evidence | cause) is not P(cause | evidence)",
              "Bayes' rule, and the law of total probability underneath it",
              "Chaining updates: one posterior becomes the next prior",
              "Turning a belief about who into a decision about where",
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
    ),
  },
];

// ---------------------------------------------------------------------------

export const ExampleLab6 = () => {
  const [at, setAt] = useState(0);
  const screen = SCREENS[at];

  return (
    <div className="lab-panel-columns lab6">
      <div className="lab-panel-static">
        <div className="lab6-static">
          {/* Values live in a panel at the top left, the way Labs 2, 4 and 5
              do it, rather than inside the diagram. The picture carries
              structure; the panel carries numbers. */}
          <div className="lab6-variables">
            {T.map((t) => (
              <div className="lab6-variables-row" key={t.id}>
                <span className="lab6-variables-key">{t.id}</span>
                <span className="lab6-variables-val">{t.value}</span>
              </div>
            ))}
            <div className="lab6-variables-row is-divider">
              <span className="lab6-variables-key">Ch</span>
              <span className="lab6-variables-val">{B.HONEYPOT_COST}</span>
            </div>
            <div className="lab6-variables-row">
              <span className="lab6-variables-key">SUM(V)</span>
              <span className="lab6-variables-val">{B.SUM_V}</span>
            </div>
          </div>

          <BayesianNetwork
            live={screen.view?.live ?? null}
            guarded={screen.view?.guarded ?? null}
            focus={screen.view?.focus ?? false}
          />

          {/* General forms, with no numbers substituted in: the diagram is
              the game, not one worked instance of it. */}
          <div className="lab6-legendbar">
            <span>
              <code>Ud = SUM(V) &minus; D &minus; Ch</code>
            </span>
            <span>
              <code>Ua = Di &minus; Cei</code>
            </span>
          </div>
        </div>
      </div>

      <div className="lab-panel-divider" />

      <div className="lab-panel-dynamic">
        <div className="lab6-dynamic">
          <div className="lab6-scroll">
            {screen.title && <p className="lab6-topic">{screen.title}</p>}
            <div className="lab6-body">{screen.body}</div>
          </div>

          <div className="lab6-nav">
            <CButton
              color="secondary"
              onClick={() => setAt(at - 1)}
              disabled={at === 0}
            >
              <CIcon icon={cilArrowLeft} />
            </CButton>
            <CButton
              color="secondary"
              onClick={() => setAt(at + 1)}
              disabled={at === SCREENS.length - 1}
            >
              <CIcon icon={cilArrowRight} />
            </CButton>
          </div>
        </div>
      </div>
    </div>
  );
};
