// The nine terms Lab 6 needs, and a plain explanation of each.
//
// SEVEN, not thirty. (It was nine; the entries for 'likelihood' and
// 'expected utility' were cut as over-explaining, since the prose that
// uses them already says what they are.) If every other word is clickable the page reads as noise
// and nothing gets clicked, so the list is deliberately short: a term earns a
// place here only if a student could not reasonably guess it and the lab
// would stall without it.
//
// Each entry is defined once as a card where it first appears, and stays one
// click away everywhere after. A popover that only restates the term in
// different words is worse than nothing, so every entry carries:
//
//   what   one sentence, no notation
//   like   an everyday example with no security in it at all
//   here   one line tying it back to this lab's numbers
//
// The everyday example is the part that does the work. "Your belief before
// seeing evidence" teaches nobody anything; a bag of marbles does.

export interface GlossaryEntry {
  /** Lower-case key used by <Term of="..."> */
  id: string;
  term: string;
  what: string;
  like: string;
  here: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: "type",
    term: "Type",
    what: "A player's private characteristics: something true about them that the other player cannot see.",
    like: "Two people sit down to play poker. One is a professional and one has never played. They look identical across the table. Which one you are facing is your opponent's type.",
    here: "The attacker is either high-skill (H) or low-skill (L). They know which. You do not.",
  },
  {
    id: "incomplete",
    term: "Incomplete information",
    what: "A game where at least one player does not know something that affects the payoffs, usually the other player's type.",
    like: "Haggling over a used car. The seller knows whether it has been in a crash and you do not. You are playing the same game, but not with the same information.",
    here: "Every lab so far let both players see everything that mattered. This is the first one where you have to act on a guess.",
  },
  {
    id: "prior",
    term: "Prior",
    what: "What you believed before any evidence arrived.",
    like: "A bag holds 1 red marble and 3 blue ones. Before you reach in, you would say there is a 25% chance of red. That 25% is the prior.",
    here: "Before any alert fires, 25% of attackers are high-skill. That is your starting belief.",
  },
  {
    id: "posterior",
    term: "Posterior",
    what: "What you believe after taking the evidence into account. The prior, revised.",
    like: "You reach into the bag and feel something unusually heavy. You now think red is more likely than 25%. Your revised number is the posterior.",
    here: "After the first alert your belief moves from 25% to 50%. That 50% is a posterior, and it becomes the prior for the next alert.",
  },
  {
    id: "conditional",
    term: "Conditional probability",
    what: "The chance of one thing given that another thing is already known to be true. Written P(A | B), read 'the probability of A given B'.",
    like: "The chance a random person is over six feet tall is small. The chance they are over six feet tall GIVEN that they play professional basketball is large. Same person, different question, because you were told something first.",
    here: "P(Web alert | H) is the chance of a web alert when the attacker is high-skill. The bar means 'given'.",
  },
  {
    id: "total",
    term: "Law of total probability",
    what: "To find how often something happens overall, add up every separate way it could happen.",
    like: "To count how many people in a town own an umbrella, count the ones who commute plus the ones who do not, and add them together. You have to cover every group exactly once.",
    here: "A web alert can come from a high-skill attacker or a low-skill one. Add both ways and you get P(Web alert) = 0.375, the bottom of Bayes' rule.",
  },
  {
    id: "bayes",
    term: "Bayes' rule",
    what: "The formula that turns 'how likely is this evidence, given the cause' into 'how likely is the cause, given the evidence'. It flips a conditional probability around.",
    like: "A test for a rare illness is right 99% of the time. You test positive. Bayes' rule is what tells you your real chance of being ill is far below 99%, because the illness was rare to begin with.",
    here: "You are handed P(alert | type) and you need P(type | alert). Bayes' rule is the only way across.",
  },
];

export const lookUp = (id: string): GlossaryEntry | undefined =>
  GLOSSARY.find((g) => g.id === id);

/** Every term, in the order the opening screen lists them. Lives here rather
 *  than beside the component so the list and the definitions cannot fall out
 *  of step, and so the component file exports only components. */
export const ALL_TERMS = GLOSSARY.map((e) => e.id);
