// Lab 6's Bayesian security game, and everything needed to solve it.
//
// Pure TypeScript, no React, like gameTree.ts, stackelberg.ts and repeated.ts
// before it. Every number the Example prints comes from here, so the prose
// cannot drift away from the whiteboard.
//
// WHAT THIS LAB IS
//
// The defender has one honeypot and three servers. Two different attackers
// exist, a high-skill one and a low-skill one, and they go after different
// things. The defender cannot see which has shown up; they only see IDS
// alerts. The lab is about turning those alerts into a better guess about
// who is on the network, and then acting on it.
//
// THE CONSTANT IS THE SAME AS LABS 4 AND 5
//
// Ud = SUM(V) - D - Ch = 18 - D - 1 = 17 - D. Three labs now share that
// shape, which is worth keeping intact.

// ---------------------------------------------------------------------------
// The game
// ---------------------------------------------------------------------------

export interface Target {
  id: string;
  /** What the asset is worth, and the damage if it is taken. */
  value: number;
  /** What the attacker pays to reach it. Carried for continuity with Labs 4
   *  and 5; the whiteboard's calculations do not use it. */
  exploitCost: number;
}

// The whiteboard calls these T1, T2, T3. Every other lab in this project
// calls its assets S1, S2, S3, and a student who has just finished Lab 5
// should not have to relearn the naming for one lab. Same three assets, same
// values, same costs.
export const TARGETS: Target[] = [
  { id: "S1", value: 8, exploitCost: 2 },
  { id: "S2", value: 6, exploitCost: 1 },
  { id: "S3", value: 4, exploitCost: 1 },
];

export const HONEYPOT_COST = 1;

export const SUM_V = TARGETS.reduce((s, t) => s + t.value, 0);

/** SUM(V) - Ch. Every defender payoff in this lab is this minus damage. */
export const BASE = SUM_V - HONEYPOT_COST;

// ---------------------------------------------------------------------------
// Types, and what each one goes after
// ---------------------------------------------------------------------------

export type AttackerType = "H" | "L";

/** The defender's belief before any evidence. */
export const PRIOR_H = 0.25;

/**
 * P(target | type). The high-skill attacker goes for the crown jewel; the
 * low-skill one pokes at softer things.
 *
 * On the whiteboard this is an assumption rather than something derived, and
 * the Example says so. It is threat intelligence: observed behaviour, not an
 * equilibrium strategy.
 */
export const PROPENSITY: Record<AttackerType, number[]> = {
  H: [0.8, 0.15, 0.05],
  L: [0.1, 0.6, 0.3],
};

// ---------------------------------------------------------------------------
// The sensors
// ---------------------------------------------------------------------------
//
// Two IDS, at two depths. IDS1 watches the perimeter (web applications, VPN,
// authentication). IDS2 watches inside the network.
//
// The alerts name OBSERVED ACTIVITY, never the attacker's type. In
// particular "High-Privilege" describes privilege-related activity, not the
// severity or confidence of the alert. Students read it the other way round
// and the Example says so outright.

export interface Sensor {
  id: string;
  where: string;
  /** The two mutually exclusive alerts it can raise. */
  alerts: [string, string];
  /** P(first alert | H) and P(first alert | L). */
  likelihood: { H: number; L: number };
  blurb: [string, string];
}

/**
 * IDS1's likelihoods are not assumptions, they are built from two separate
 * facts, and the Example derives them:
 *
 *   what the type actually does  x  whether the sensor reads it correctly
 *
 * A high-skill attacker web-probes 5 times in 6. The sensor labels what it
 * sees correctly 87.5% of the time. So a web alert appears with probability
 * 5/6 x 0.875 + 1/6 x 0.125 = 3/4 exactly.
 *
 * Note the sensor's error drags the number toward a coin flip: the attacker
 * web-probes 83% of the time but the alert only says so 75% of the time.
 * That gap is the whole reason an alert is evidence rather than proof.
 */
export const SENSOR_ACCURACY = 0.875;
export const WEB_PROPENSITY = { H: 5 / 6, L: 1 / 6 };

/** Combine "what they did" with "did the sensor get it right". */
export const alertLikelihood = (doesIt: number, accuracy: number): number =>
  doesIt * accuracy + (1 - doesIt) * (1 - accuracy);

export const IDS1: Sensor = {
  id: "IDS1",
  where: "the perimeter: web applications, VPN and authentication",
  alerts: ["Web-Probe", "Credential-Probe"],
  likelihood: {
    H: alertLikelihood(WEB_PROPENSITY.H, SENSOR_ACCURACY),
    L: alertLikelihood(WEB_PROPENSITY.L, SENSOR_ACCURACY),
  },
  blurb: [
    "Suspicious activity against web applications: exploitation attempts, endpoint enumeration.",
    "Suspicious activity against credentials: password spraying, VPN account misuse.",
  ],
};

/**
 * IDS2's numbers are given directly on the whiteboard rather than derived the
 * way IDS1's are. That asymmetry is real and the Example states it rather
 * than papering over it, because a student who followed the IDS1 derivation
 * will go looking for the matching one here.
 */
export const IDS2: Sensor = {
  id: "IDS2",
  where: "inside the network: host monitoring and audit logs",
  alerts: ["High-Privilege", "Generic-Probe"],
  likelihood: { H: 0.8, L: 0.2 },
  blurb: [
    "Discovery, attempted use, or elevation of privileged access.",
    "General network or host reconnaissance that does not involve privileged access.",
  ],
};

export const SENSORS = [IDS1, IDS2];

/** Likelihood of a given alert from a given sensor, for each type. */
export const likelihoodOf = (
  sensor: Sensor,
  alertIndex: 0 | 1,
): { H: number; L: number } =>
  alertIndex === 0
    ? sensor.likelihood
    : { H: 1 - sensor.likelihood.H, L: 1 - sensor.likelihood.L };

// ---------------------------------------------------------------------------
// Bayes' rule
// ---------------------------------------------------------------------------

export interface Update {
  /** P(H) going in. */
  prior: number;
  /** P(alert | H) and P(alert | L). */
  lh: number;
  ll: number;
  /** P(alert), the denominator, by the law of total probability. */
  evidence: number;
  /** P(H | alert) coming out. */
  posterior: number;
}

/**
 * One application of Bayes' rule.
 *
 *            P(alert|H) P(H)
 *   P(H|s) = -------------------------------
 *            P(alert|H)P(H) + P(alert|L)P(L)
 *
 * The denominator is the law of total probability: every way the alert could
 * have happened, added up. Chaining is just calling this again with the
 * previous posterior as the new prior, which is the step students miss.
 */
export const update = (prior: number, lh: number, ll: number): Update => {
  const evidence = lh * prior + ll * (1 - prior);
  return { prior, lh, ll, evidence, posterior: (lh * prior) / evidence };
};

// ---------------------------------------------------------------------------
// The same thing by counting
// ---------------------------------------------------------------------------
//
// Bayes' rule in fraction form is correct and opaque. The identical
// arithmetic done as whole numbers of incidents is neither.
//
// 400 keeps every count in this lab's chain a whole number: 400 -> 100 H and
// 300 L -> 75 and 75 web alerts -> 60 and 15 high-privilege alerts. No
// fractions anywhere, and the two 75s show at a glance WHY the first update
// lands on exactly 50%.
//
// 80 also works and is the smallest that does, but it reads worse: the prior
// is 25/75 and "100 out of 400" shows that at sight where "20 out of 80"
// needs a moment. The verification checks 400 is a multiple of the smallest
// whole base rather than that it is the smallest.

export const COUNT_BASE = 400;

export interface Tally {
  total: number;
  h: number;
  l: number;
  /** Of the H group, how many raise this alert. */
  hAlert: number;
  /** Of the L group, how many raise this alert. */
  lAlert: number;
  /** hAlert + lAlert: everyone who raises it, whoever they are. */
  alerts: number;
  /** hAlert / alerts, which is the posterior. */
  share: number;
}

/**
 * Pull a count back onto an integer when it is within rounding error of one.
 *
 * These counts are whole numbers in exact arithmetic, but 5/6 has no finite
 * binary representation, so `400 * 0.25 * 0.75` lands on 75.00000000000001.
 * That is harmless in a calculation and fatal on screen: the entire reason
 * the counting view exists is that a student sees 75 and 75 rather than a
 * pair of fractions. The tolerance is tight enough that a genuinely
 * fractional count still reports as fractional.
 */
const EPS = 1e-9;
const snap = (x: number): number => {
  const r = Math.round(x);
  return Math.abs(x - r) < EPS ? r : x;
};

export const tally = (
  total: number,
  pH: number,
  lh: number,
  ll: number,
): Tally => {
  const h = snap(total * pH);
  const l = snap(total * (1 - pH));
  const hAlert = snap(h * lh);
  const lAlert = snap(l * ll);
  const alerts = snap(hAlert + lAlert);
  return { total, h, l, hAlert, lAlert, alerts, share: hAlert / alerts };
};

/** True when a tally is free of fractions, which is what makes it teachable.
 *  A generator or a retuned game that breaks this should be caught, not
 *  rounded over, so this tests the snapped values rather than re-snapping. */
export const isWhole = (t: Tally): boolean =>
  [t.h, t.l, t.hAlert, t.lAlert, t.alerts].every((n) => Number.isInteger(n));

// ---------------------------------------------------------------------------
// From a belief about WHO to a belief about WHERE
// ---------------------------------------------------------------------------

/**
 * P(target) = P(target|H) P(H) + P(target|L) P(L).
 *
 * A belief about the attacker's type cannot be acted on: you cannot put a
 * honeypot on "probably high-skill". Mixing the two rows of the propensity
 * table by how likely each type now is turns it into something you can.
 */
export const targetBelief = (pH: number): number[] =>
  TARGETS.map((_, i) => PROPENSITY.H[i] * pH + PROPENSITY.L[i] * (1 - pH));

// ---------------------------------------------------------------------------
// Choosing where the honeypot goes
// ---------------------------------------------------------------------------

export interface Placement {
  target: number;
  /** Expected damage still taken, i.e. every target except the covered one. */
  damage: number;
  eu: number;
}

/** Expected utility of covering each target, given a belief about where the
 *  attack lands. Covering a target zeroes its damage and nothing else. */
export const placements = (belief: number[]): Placement[] =>
  TARGETS.map((_, i) => {
    const damage = belief.reduce(
      (s, p, j) => s + (j === i ? 0 : p * TARGETS[j].value),
      0,
    );
    return { target: i, damage, eu: BASE - damage };
  });

export const bestPlacement = (belief: number[]): Placement =>
  placements(belief).reduce((best, p) => (p.eu > best.eu ? p : best));

/**
 * The rule hiding inside that.
 *
 * EU(i) = BASE - (total expected damage) + p_i * V_i, and the first two terms
 * are the same for every i, so the defender is really maximising p_i * V_i.
 * Guard what is most *costly*, not what is most *likely*. On the Example's
 * numbers the two agree, so the Example points it out rather than relying on
 * the student noticing.
 */
export const exposure = (belief: number[]): number[] =>
  belief.map((p, i) => p * TARGETS[i].value);

// ---------------------------------------------------------------------------
// The whole walkthrough, solved once
// ---------------------------------------------------------------------------

export interface Stage {
  label: string;
  pH: number;
  belief: number[];
  placements: Placement[];
  best: Placement;
}

const stageAt = (label: string, pH: number): Stage => {
  const belief = targetBelief(pH);
  return {
    label,
    pH,
    belief,
    placements: placements(belief),
    best: bestPlacement(belief),
  };
};

/** Before anything happens. The baseline the rest of the lab improves on. */
export const BLIND = stageAt("No alerts", PRIOR_H);

/** After IDS1 raises a Web-Probe alert. */
export const UPDATE_1 = update(PRIOR_H, IDS1.likelihood.H, IDS1.likelihood.L);
export const AFTER_1 = stageAt("After IDS1", UPDATE_1.posterior);

/** After IDS2 then raises a High-Privilege alert. The previous posterior is
 *  the new prior, which is the step the Example makes a point of. */
export const UPDATE_2 = update(
  UPDATE_1.posterior,
  IDS2.likelihood.H,
  IDS2.likelihood.L,
);
export const AFTER_2 = stageAt("After IDS2", UPDATE_2.posterior);

/** What the evidence was worth, and what ignoring it would have cost.
 *
 *  Two different numbers, and the second is the larger: moving from the blind
 *  choice to the informed one gains a little, but sitting on the blind choice
 *  while the truth has moved loses a lot. */
export const EVIDENCE_VALUE = {
  blindChoice: BLIND.best,
  informedChoice: AFTER_2.best,
  gain: AFTER_2.best.eu - BLIND.best.eu,
  /** What the blind choice is actually worth once the belief has moved. */
  stubborn: AFTER_2.placements[BLIND.best.target].eu,
  costOfIgnoring: AFTER_2.best.eu - AFTER_2.placements[BLIND.best.target].eu,
};

/** Every alert pair, so the Example can show that most of them change nothing. */
export interface Combination {
  first: string;
  second: string;
  pH: number;
  best: number;
}

export const COMBINATIONS: Combination[] = ([0, 1] as const).flatMap((a) =>
  ([0, 1] as const).map((b) => {
    const l1 = likelihoodOf(IDS1, a);
    const l2 = likelihoodOf(IDS2, b);
    const one = update(PRIOR_H, l1.H, l1.L);
    const two = update(one.posterior, l2.H, l2.L);
    return {
      first: IDS1.alerts[a],
      second: IDS2.alerts[b],
      pH: two.posterior,
      best: bestPlacement(targetBelief(two.posterior)).target,
    };
  }),
);

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export const pct = (x: number, places = 0): string =>
  `${(x * 100).toFixed(places)}%`;

export const num = (x: number, places = 2): string => {
  const s = x.toFixed(places);
  return s.replace(/\.?0+$/, "") || "0";
};
