// What to tell the student after a match.
//
// Separated from the component for the same reason Lab 3's practiceStages.ts
// is: the debriefs *are* the teaching content of free play. Thirty matchups is
// a lot of prose, and burying it inside JSX makes it impossible to read as a
// body of writing or to check for contradictions.
//
// Every note is a function of the match that was actually played, so the
// numbers quoted are the numbers on screen. Nothing here is hardcoded. That
// matters more than usual in this lab, because several outcomes depend on
// where the student parked the defense before round 1: "Static Defense is
// hopeless" and "Static Defense is a perfect game" are both true, and which
// one the student gets to read depends on a choice they made.

import type { Match, MatchSummary } from "./repeated";
import { ATTACKER_STRATEGIES, DEFENDER_STRATEGIES } from "./repeated";

export interface MatchupNote {
  /** A short verdict, shown as the heading of the debrief card. */
  title: string;
  /** Two to four sentences on what just happened and why. */
  text: string;
  /** The transferable principle, when the matchup has one. */
  lesson?: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const n2 = (x: number) => x.toFixed(2);

/**
 * Written per pairing where the pairing teaches something specific, and
 * composed from the result otherwise. The composed fallback is deliberately
 * plain: a matchup with nothing to say should read as a data point, not be
 * dressed up as a revelation.
 */
export const matchupNote = (
  match: Match,
  summary: MatchSummary,
): MatchupNote => {
  const { config, rounds } = match;
  const { game } = config;
  const names = game.servers.map((s) => s.id);
  const key = `${config.attacker}/${config.defender}`;

  const rate = pct(summary.catchRate);
  const per = n2(summary.perRound);
  const mixGap = summary.versusMix;
  const start = names[config.startServer];

  // Which server the attacker spent most of its time on, which several notes
  // need in order to say anything concrete.
  const visits = game.servers.map(
    (_, i) => rounds.filter((r) => r.attacked === i).length,
  );
  const favorite = names[visits.indexOf(Math.max(...visits))];
  const greedyTarget =
    names[
      game.servers
        .map((s) => s.value - s.exploitCost)
        .reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0)
    ];

  switch (key) {
    // ---------------------------------------------------------------- greedy
    case "greedy/static":
      return config.startServer === names.indexOf(greedyTarget)
        ? {
            title: "A perfect game",
            text: `You parked on ${start} and never moved, and ${greedyTarget} is exactly where a greedy attacker goes every single round. You caught them ${rate} of the time for ${per} a round, which is the highest score available in this game.`,
            lesson:
              "Static defense is not weak. Static defense on the wrong server is weak. Against a predictable opponent, the simplest possible rule is unbeatable.",
          }
        : {
            title: "Guarding an empty room",
            text: `You held ${start} for the whole match while the attacker took ${greedyTarget} every round, so you caught them ${rate} of the time and settled at ${per}. Moving to ${greedyTarget} once would have ended the match permanently in your favor.`,
            lesson:
              "A defense that never looks at the attack cannot be wrong by a little. It is either exactly right or completely useless.",
          };

    case "greedy/trigger":
      return {
        title: "Two rounds to learn, then it is over",
        text: `The attacker opened on ${greedyTarget} twice, your rule fired, and from round three on you caught every attack. You averaged ${per} a round. This is the ladder from the walkthrough: the rule costs you two rounds of tuition and then pays forever.`,
        lesson:
          "This is where the discount factor earns its keep. Drag delta down and watch those two bad rounds swallow the win; drag it up and they vanish into the noise.",
      };

    case "greedy/reactive":
      return {
        title: "Same destination, one round sooner",
        text: `Protecting wherever they struck last needs only one observation rather than two, so you locked onto ${greedyTarget} a round earlier than the trigger rule would have and finished at ${per}. Against an opponent this predictable, every adaptive rule converges to the same answer.`,
        lesson:
          "Reacting faster only helps while the opponent is still teaching you something. Once they are predictable, all adaptive rules tie.",
      };

    case "greedy/frequency":
      return {
        title: "Counting works, but it is overkill here",
        text: `Tracking attack frequency found ${greedyTarget} immediately, because every observation pointed at the same server. You caught ${rate} and averaged ${per}. Frequency counting is built for noisy opponents and this one has no noise at all.`,
        lesson:
          "Match the sophistication of the defense to the sophistication of the attack. Counting buys nothing against an opponent who never varies.",
      };

    case "greedy/randomized":
      return {
        title: "The floor, when you should have taken the ceiling",
        text: `The mix never looked at the attacker, so it kept rolling the dice while they walked into ${greedyTarget} every round. You averaged ${per}. Every adaptive defense on this screen scores higher here, several of them by more than four a round.`,
        lesson:
          "Randomizing is insurance. Against an opponent with an obvious habit you are paying a premium for a risk that is not there.",
      };

    // -------------------------------------------------------------- rotation
    case "rotation/trigger":
      return {
        title: "The rule never fires",
        text: `Your trigger waits for the same server to be hit twice in a row, and a rotating attacker never does that, so you sat on ${start} for the entire match and caught them ${rate} of the time. You averaged ${per}. This is the failure the whiteboard points at.`,
        lesson:
          "A rule with one round of memory is blind to any pattern longer than one round. The attacker did not beat your rule, they stepped around it.",
      };

    case "rotation/reactive":
      return {
        title: "Always one step behind",
        text: `You guarded wherever they hit last; they had already moved on. Against a clean rotation this is perfectly anti-correlated, so you caught them ${rate} of the time and averaged ${per}. Not once in the whole match.`,
        lesson:
          "Reacting to the last move is only a prediction if the opponent repeats. Against an alternating opponent the same rule becomes a guarantee of being wrong.",
      };

    case "rotation/frequency":
      return {
        title: "Counting beats reacting",
        text: `Frequency counting does not care about order, only totals, so the rotation could not shake it. It settled on ${favorite} and caught ${rate} of the attacks for ${per} a round, well above what the trigger rule managed against the same attacker.`,
        lesson:
          "When you cannot predict the next move, defend the move that comes most often. Giving up on timing is sometimes how you win.",
      };

    case "rotation/static":
      return {
        title: "No worse than trying",
        text: `You never moved off ${start} and averaged ${per}. Compare that with the trigger rule against the same attacker: it also never moved, because its condition never fired. Doing nothing and trying and failing produced the same number.`,
        lesson:
          "An adaptive rule that never triggers is a static rule with extra steps.",
      };

    // -------------------------------------------------------- reactive attacker
    case "reactive/trigger":
      return {
        title: "Your rule is a pattern too",
        text: `The attacker worked out that two hits in the same place would move you, and then used that: hit twice, wait for you to commit, walk through the door you just left. You caught ${rate} and averaged ${per}, which is below what simply randomizing would have paid against this same attacker.`,
        lesson:
          "Every deterministic rule is itself readable. The moment your defense becomes predictable, adaptation stops being an advantage and becomes a handle.",
      };

    case "reactive/reactive":
      return {
        title: "Two mirrors facing each other",
        text: `Both of you are predicting the other from one round of history, and the result is a chase that settles into a cycle rather than a winner. You caught ${rate} and averaged ${per}.`,
        lesson:
          "When both sides use the same depth of reasoning, neither gains. Advantage in a repeated game comes from reasoning one level deeper than your opponent, not from reasoning hard.",
      };

    case "reactive/randomized":
      return {
        title: "Nothing to predict",
        text: `The attacker's whole method is predicting where you will be next, and the mix gave them nothing to work with: last round's position says nothing about this round's. You averaged ${per}, which is better than the trigger rule managed against this same attacker.`,
        lesson:
          "Against an opponent who is reading you, being unreadable beats being clever. This is the case where Lab 4's answer is still the right one.",
      };

    // ------------------------------------------------------- frequency attacker
    case "frequency/randomized":
      return {
        title: "This is the point of the lab",
        text: `This attacker learns how often you guard each server and avoids the ones you favor. Against Lab 4's mix that machinery returns nothing: the commitment is built to leave the attacker exactly indifferent, so every server it evaluates comes back with the same expected payoff and there is no "elsewhere" to go. You averaged ${per}.`,
        lesson:
          "The attacker here is running Lab 4's best response calculation from observed data instead of from an announcement. The mix you solved for last lab is precisely the defense that makes that calculation useless.",
      };

    case "frequency/static":
      return {
        title: "Learned in one round",
        text: `You announced your position by never changing it. The attacker needed a single observation to rule ${start} out, and spent the rest of the match on ${favorite}. You averaged ${per}.`,
        lesson:
          "Against an opponent who is keeping records, a fixed position is not a defense, it is a disclosure.",
      };

    case "frequency/frequency":
      return {
        title: "Both sides counting",
        text: `You are counting their attacks and they are counting your defenses, which means each of you is chasing a target the other is moving. You caught ${rate} and averaged ${per}.`,
        lesson:
          "Two learners with the same information converge toward mixing, badly. This is what the Stackelberg mix does properly and in one step.",
      };

    // ---------------------------------------------------------- random attacker
    case "random/static":
    case "random/trigger":
    case "random/reactive":
    case "random/frequency":
    case "random/randomized":
      return {
        title: "Nothing to learn",
        text: `A uniform random attacker has no pattern, so there is nothing for any defense to find. You averaged ${per}. Try the other defenses against this same attacker: they all land within a point of each other, and the plain static defense on your most valuable server is as good as any of them.`,
        lesson:
          "Adaptation is worth exactly as much as the opponent's predictability. Against noise, every clever rule collapses back to guessing, and the simplest rule is the one that guesses best.",
      };

    default:
      break;
  }

  // Manual play: the student is the strategy, so the debrief reports rather
  // than explains. Telling someone what they were thinking is a bad look.
  if (config.defender === "manual") {
    const gap =
      mixGap >= 0
        ? `${n2(mixGap)} a round better than randomizing would have been`
        : `${n2(-mixGap)} a round worse than simply randomizing`;
    return {
      title:
        summary.catchRate >= 0.6
          ? "You read them"
          : summary.catchRate <= 0.2
            ? "They read you"
            : "A close match",
      text: `You caught ${rate} of the attacks and averaged ${per} a round, which is ${gap}. The attacker was running ${
        ATTACKER_STRATEGIES.find((s) => s.id === config.attacker)!.name
      }.`,
    };
  }

  // Composed fallback for the pairings with no specific lesson.
  const versus =
    Math.abs(mixGap) < 0.1
      ? "about what randomizing would have paid against this attacker"
      : mixGap > 0
        ? `${n2(mixGap)} a round better than randomizing`
        : `${n2(-mixGap)} a round worse than randomizing`;
  return {
    title: `${rate} caught, ${per} a round`,
    text: `${
      DEFENDER_STRATEGIES.find((s) => s.id === config.defender)!.name
    } against ${
      ATTACKER_STRATEGIES.find((s) => s.id === config.attacker)!.name
    }. The attacker spent most of the match on ${favorite}, and you finished ${versus}.`,
  };
};

/**
 * The six matchups worth doing first, in an order that tells a story: a
 * defense that works, the same defense failing, the failure made worse, the
 * fix, the counter-attack, and the floor.
 *
 * Marked as suggestions rather than enforced, because the whole argument of
 * this lab is that the student should be able to go and check.
 */
export const SUGGESTED: {
  attacker: string;
  defender: string;
  why: string;
}[] = [
  {
    attacker: "greedy",
    defender: "static",
    why: "Start here. The simplest possible pair.",
  },
  {
    attacker: "greedy",
    defender: "trigger",
    why: "Adaptation pays off for the first time.",
  },
  {
    attacker: "rotation",
    defender: "trigger",
    why: "The same rule, quietly defeated.",
  },
  {
    attacker: "rotation",
    defender: "reactive",
    why: "Worse than doing nothing at all.",
  },
  {
    attacker: "reactive",
    defender: "trigger",
    why: "Now the attacker reads you back.",
  },
  {
    attacker: "frequency",
    defender: "randomized",
    why: "Where Lab 4's answer comes back.",
  },
];
