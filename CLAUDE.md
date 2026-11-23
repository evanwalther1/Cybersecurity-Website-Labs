# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Cybersecurity-Website-Labs: a website built with React/TypeScript providing educational labs to help undergraduate students learn cybersecurity.

## Status

Scaffolded with Vite (React + TypeScript template). No lab pages or routing exist yet — this is the base project setup.

## Commands

- `npm run dev` — start the Vite dev server (default http://localhost:5173, hot module reload)
- `npm run build` — type-check (`tsc -b`) then production-build via Vite into `dist/`
- `npm run preview` — serve the production build locally to sanity-check it
- `npm run lint` — run oxlint (this project uses oxlint, not ESLint)

## Architecture

- Entry point: [src/main.tsx](src/main.tsx) mounts [src/App.tsx](src/App.tsx) into `index.html`.
- Vite config: [vite.config.ts](vite.config.ts).
- TypeScript is split into `tsconfig.json` (root, references-only), `tsconfig.app.json` (app source), and `tsconfig.node.json` (Vite config itself) — this is Vite's standard project-references setup.
- No routing, state management, or backend integration is wired up yet. No database — this project does not use Firebase or any persistent storage (see Project description below).

## Developer Information (VERY IMPORTANT!!)

I am primarily an object oriented programmer with extensive background in Java and Delphi (Object Pascal), I'm very familiar with databases and database concepts. The goal of this project is to get extremely comftorable with react/typescript as well as other website programming concepts, when at all possible explain any concepts you think I might not know or be familiar with, E.X If I ask you for help designing a new component or importing a new API explain the underlying concepts and make sure I'm familiar with it. I want to learn and actually apply concepts not just let you do the work for me. I would like to incorporate some type of scripting language whether that's python or whatever, eventually we will use python for when the labs get a little bit more complicated, currently I haven't even build lab 1 yet so no need to worry about getting this implemented quite yet. I also want to get familiar with VS code commands and shortcuts, using the keyboard solely is nicer than just using keyboard and mouse.

## Project description

I am a student at Boise State interning for a professor and doing a project that spans until April for him. This repository is the only repository for this project, essentially what I'm building is a website that contains 7 labs all based around Game Theory. My job is to code and design the layout of the website so that's it's user friendly and easy to navigate. The website is lightweight and doesn't contain anything security related nor does it have persistent memory such as caching or cookies, it is used for a one time purpose for students to complete labs. There will be 7 labs that I have to code, more to come TBD there is a lot more information here but this is the general sense. The website will be run locally on my machine, eventually we will rig it up to Boise States w

## Languages used, technologies

React, Typescript, HTML, CSS, possibly Python possibly javascript (althought typscript is better in almost every way)

## Game Theory Concepts we will explor

Lab 1: Best Response, Pure Nash Equilibrium, Mixed Nash Equilibrium, Maxmin, MinMax
Lab 2: Best Response, Pure Nash Equilibrium, Mixed Nash Equilibrium, Maxmin, MinMax (same concepts as Lab 1, applied to a non-zero-sum game)
Lab 3: Extensive-Form Games, Sequential Decision-Making, Best Response, Backward Induction, Subgame Perfect Nash Equilibrium (SPNE), Perfect Information
Lab 4: Stackelberg Security Games, Commitment, Leader/Follower, Mixed Defense Strategies, Expected Utility, Best Response, Strong Stackelberg Equilibrium
Lab 5: Repeated Games, Attack Patterns, Trigger Strategies, Discount Factor, Long-Term Value of Adaptation, Exploitability
Lab 6:
Lab 7:

## Lab5 info

Lab 5 is about **repeated games**. The network, the constants and both payoff
equations are *identical to Lab 4's*, and the only thing that changes is that
the same two players meet round after round and both of them remember.

That continuity is load-bearing rather than cosmetic, so
[repeated.ts](src/components/Lab5/repeated.ts) imports `EXAMPLE_GAME`,
`attackerPayoff`, `defenderPayoff` and `equalizingCoverage` from Lab 4 instead
of re-declaring them the way Lab 4 did with Lab 3. The capstone of the lab is
that Lab 4's optimal mix is exactly the defense a learning attacker cannot
read, and that claim is only true if it is literally the same numbers.

### The game, per round

The defender places one honeypot on one server; the attacker hits one server.
With three servers that is nine outcomes, so the lab goes **back to a payoff
matrix**, which Labs 3 and 4 had left behind:

| | A -> S1 | A -> S2 | A -> S3 |
|---|---|---|---|
| **H at S1** | (17, -2) | (11, 5) | (13, 3) |
| **H at S2** | (9, 6) | (17, -1) | (13, 3) |
| **H at S3** | (9, 6) | (11, 5) | (17, -1) |

The diagonal is always `(SUM(V) - Ch, -Cei)`: caught, no damage, and the
attacker paid their exploit cost for nothing. Every cell is computed from the
two equations, never typed in.

### The discount factor

Written **delta**, matching the whiteboard (not gamma, which is the
reinforcement-learning convention; the symbol and the word have to agree or
the prose contradicts the formula).

`Ud = Ud1 + delta*Ud2 + delta^2*Ud3 + ...`, and for a flat stream that
collapses to `Ud / (1 - delta)`.

Every number on the whiteboard is reproduced exactly:

| | delta = 0.2 | delta = 0.8 |
|---|---|---|
| Static (always S2) | 11.25 | 45.00 |
| Trigger | 11.65 | 70.60 |

**The punchline the board gestures at but never writes down.** Subtract the two
closed forms and nearly everything cancels:

`value of adapting = 8*delta^2 / (1 - delta)`

0.40 at delta 0.2, and 25.60 at delta 0.8. Same defender, same attacker, same
network, and adaptation became 64x more valuable purely because the horizon
moved. The Example's last step is built on that one line.

### The eleven strategies

Five attackers and six defenses, all in `repeated.ts`. Each is a pure function
of the history. Ties everywhere resolve to the **lowest server index**, stated
once and used consistently so a seed replays identically.

Attackers: Greedy (`argmax(V - C)`, note **payoff** not value, which diverge
once an exploit cost is high enough), Target Rotation (fixed cycle, defaults to
the board's S1/S3), Reactive Best Response (assume the defender holds, dodge),
Frequency Avoidance (maximize `(1 - f)*V - C` from observed defense rates), and
Randomized Attack (uniform).

Defenses: Static (student picks the server), Trigger (the board's rule: same
server twice consecutively, then protect it, otherwise **hold position**, which
is what produces the 9, 9, 17, 17 ladder rather than an oscillation), Reactive
Best Response (protect last round's target), Frequency Response (protect
`argmax(f * V)`), Randomized Defense (draw from Lab 4's optimal mix), and Play
It Yourself.

### What the grid actually teaches

Measured per-round `Ud`, settled:

| | Static(S2) | Static(S1) | Trigger | Reactive | Frequency | Randomized |
|---|---|---|---|---|---|---|
| **Greedy** | 9.00 | **17.00** | 17.00 | 17.00 | 17.00 | 12.75 |
| **Rotation** | 11.00 | 15.00 | **11.00** | **11.00, never catches** | 15.00 | 13.03 |
| **Reactive** | 9.00 | chase | 12.33 | 13.50 | 12.14 | 12.77 |
| **Frequency** | 9.00 | ~11 | 13.67 | 14.47 | 9.00 | 13.22 |
| **Random** | 12.99 | 13.75 | 13.22 | 13.11 | 13.56 | 13.25 |

Six things that fall out of it, and five are worth teaching:

1. **Static is not weak, mis-specified static is weak.** On S1 against a greedy
   attacker it is a perfect game at 17. The board parks it on S2 deliberately,
   for drama, which is why the student gets to choose the start server.
2. **Reactive Best Response is the worst possible answer to rotation.** It
   guards where they were; they have already moved. Catch rate **0%, forever**,
   perfectly anti-correlated. The most dramatic cell in the grid.
3. **The honest fix for rotation, which the board does not give.** The discount
   factor is not a defense, it prices one. The real answers are frequency
   counting (15.00 versus the trigger rule's 11.00) and longer memory.
4. **Against a random attacker every clever defense collapses** to within a
   point of plain static on the most valuable server. Adaptation is worth
   exactly as much as the opponent's predictability.
5. **Adaptation can lose.** A reactive attacker beats the trigger rule down to
   12.33, which is *below* what simply randomizing (12.77) would have paid. Any
   deterministic rule is itself a pattern, and the moment the defense becomes
   readable, adaptation stops being an edge and becomes a handle.
6. Greedy against Trigger, Reactive and Frequency all converge to 17; three
   roads to the same place. Not harmful, just not separately interesting.

### The capstone

The Frequency Avoidance attacker maximizes `(1 - f_i)*V_i - C_i`. That is
algebraically **Lab 4's `EUa(Si) = (Vi - Ci) - Vi*xi`** with the observed
frequency standing in for the committed probability. Set the defense
frequencies to Lab 4's optimal mix `(44.23%, 42.31%, 13.46%)`:

```
S1:  (1 - 0.4423)*8 - 2  =  2.4615
S2:  (1 - 0.4231)*6 - 1  =  2.4615
S3:  (1 - 0.1346)*4 - 1  =  2.4615
```

All identical, and that is `32/13`, the exact `v` solved for in Lab 4
(verified: spread 4.4e-16). So the attacker's entire learning apparatus returns
nothing, because there is no "elsewhere" to go. Lab 5 ends by showing that the
unexploitable floor is the thing the student already computed last lab, and
*why* it is the floor rather than being told that it is.

The mix also guarantees a floor of **12.54** that no attacker behavior can
breach (checked against all five over 4000 rounds) and caps at 13.54. It never
exploits, which is why three of the five attacker rows beat it.

### Structure: three phases, each taking the whole screen

Deliberately unlike Labs 1 to 4, which are step-next-step throughout.

1. **Walkthrough**, 3 pages and 13 steps in the familiar two-column frame:
   the matrix and the one-shot best response, then the discount factor, then
   the board's ladder priced at both deltas ending on `8*delta^2/(1-delta)`.
2. **Picker**: the network disappears entirely and the panel becomes eleven
   strategy cards, attacker left in red, defender right in blue, with the
   start-server control between them. A card shows its full rule only once
   chosen; eleven rules at once is a wall of text. Six suggested matchups are
   numbered chips that set both sides, and explored matchups stay marked.
3. **Match**: network with the honeypot and the attack drawn, the round log
   building beside it, and the verdict column with the delta slider. Stepped a
   round at a time, or played out.

`.lab-window-5` joins `.lab-window-3` in taking the full viewport, since three
columns do not fit at the default inset.

### Simulated depth versus displayed depth

`SIM_ROUNDS = 200`, `DISPLAY_ROUNDS = 12`. These differ on purpose.

The infinite tail is summed in closed form by detecting the repeating cycle in
the move sequence (on moves, not payoffs, since every catch pays 17 and would
produce false positives). Adaptive-versus-adaptive matchups settle into cycles
as long as 6 or 7 rounds, and detection needs three repeats, so a 12-round
match cannot recognise its own cycle and falls back to estimating. Measured:
reactive vs trigger at delta 0.9 was off by 0.99 against a 3000-round brute
force. At 60 rounds the deterministic matchups became exact but the stochastic
ones were still up to 1.77% out at delta 0.95, where a 60-round tail is 46% of
the total. At 200 rounds the worst relative error across all 30 matchups and 3
deltas is **0.0014%**. Delta is capped at 0.95 for the same reason.

The verdict's headline is the **settled** rate, not the mean of the rows on
screen: trigger against a greedy attacker reads 17 while the table still shows
two rounds of 9. The opening cost shows up in the discounted total instead, and
the label says "settled" so the two numbers do not look like they disagree.

### Verification

Same discipline as Labs 3 and 4, run offline via esbuild into Node:

- The whiteboard matrix, the ladder, and all four discounted totals reproduce
  exactly, and the gap equals `8*delta^2/(1-delta)` to the cent.
- All 30 matchups: no non-finite numbers, `Ud = 17 - D` holds in every round,
  no round where a catch did damage, and all 30 replay identically from a seed.
- Tail accuracy: 0.0014% worst case over 30 matchups x 3 deltas against a
  9000-round brute force.
- 90,000 matches over 3,000 randomly generated games: zero problems.
- 270 debriefs (every matchup x every start server x three deltas): no
  "undefined", "NaN" or "[object" ever reaches the screen, 28 distinct titles.
- Manual play honors every supplied move and scores at every partial length
  from 1 to 12 rounds.
- Delta sweep found three genuine ranking flips, the best being **greedy vs
  trigger/randomized at delta ~0.70**: below it randomizing wins because the
  trigger rule's two learning rounds dominate, above it the trigger wins. The
  slider makes that swap something the student can feel.

### Practice: three sections of play and one of concepts

The student is **always the defender**. The attacker is played by the machine,
and the only question that looks at the attacker's side at all is "name their
strategy", which is a reading exercise rather than a turn.

**14 questions, 100 points**, in
[practiceStages.ts](src/components/Lab5/practiceStages.ts). Four blocks:

| block | what it is | pts |
|---|---|---|
| Section 1 | Greedy attacker, you run Trigger. Execute the strategy, name the attacker, what made the two learning rounds cost anything | 20 |
| Section 2 | Rotating attacker, same strategy. It never fires: execute (hold), name them, why it failed, what beats them | 32 |
| Section 3 | A learning attacker, you run Frequency Response. Execute, name them, pick the counter | 26 |
| Section 4 | Three concept questions: when adapting fails, what a low delta means for how you play, and why a static defense reveals less | 22 |

Four question kinds, one layout. Every question is a round table plus a prompt
plus one of four controls (server picker, strategy picker, multiple choice,
number). The three columns are the same ones the Example's match screen uses,
so a student who played free play already knows how to read the screen.

**Rounds accumulate inside a section and it plays out regardless of the
answer**, so a wrong answer never derails the rest. Answers are final once
locked in, for the same reason Lab 3's are: the next round reveals what
actually happened, so allowing a change would be allowing a correction.

**Vocabulary**: the lab says *strategy*, never *rule*, because the Example
defines a strategy as a rule that turns history into a move and prose that
alternates between the two words invites the reader to hunt for a distinction
that is not there. Blocks are *sections*, not engagements.

[StrategyPeek.tsx](src/components/Lab5/StrategyPeek.tsx) is a reference panel
behind a button in the top left, modelled on Lab 3's `NetworkPeek` so a
student who met that one already knows how it behaves. It lists all eleven
strategies with what each does, read straight from `repeated.ts` so the
reference, the free-play cards and the simulator cannot disagree. It exists so
the section header can be one sentence (`You are the defender. Your honeypot
starts on S2 and you are running Trigger Defense.`) instead of restating the
current strategy's definition every time, and so no question is a memory test.

**Two questions were cut as busywork**: "how many rounds do you expect at
delta 0.8" and "what is a flat 9 worth at delta 0.6". Both test whether a
student can evaluate `1/(1 - delta)`, which the Example already does in front
of them and which says nothing about whether they understand what delta is
for. A third, on Lab 4's mix leaving a learner indifferent, went with them.
The replacements ask what a horizon implies about how to play.

### Why the scenarios need a gate

[practiceScenarios.ts](src/components/Lab5/practiceScenarios.ts) exists
because a question built from a randomly drawn matchup is very often
unanswerable, and the only way to know is to simulate every candidate.

Measured over every deterministic matchup: "name the strategy pair behind this
history" has a unique answer only **25 times out of 34**, and *showing more
rounds does not help*. At 8, 12 and 15 rounds the scores are 23, 25 and 25,
because once a matchup settles into its cycle every further round carries no
new information. The collisions are structural:

```
greedy/static == greedy/trigger == greedy/reactive == greedy/frequency
rotation/static == rotation/trigger == rotation/frequency
reactive/static == frequency/static
```

The first is the start-server case: park the honeypot where a greedy attacker
was going anyway and every defense sits still forever. The second is a trigger
rule whose condition never fires, indistinguishable from never having a rule.

**The third is worth teaching rather than hiding.** Asking for only one side
resolves nearly everything: identifying the attacker is unambiguous against
Trigger, Reactive, Frequency and Randomized, and ambiguous **only against
Static**, in 3 cases. Against a defense that never moves, three different
attackers behave identically, because two of them are reacting to a signal
that is not there. You can only identify an adaptive opponent if your own
behaviour varies enough to provoke them.

`consistentWith` returns every deterministic pair reproducing a history and
`identifies` is the gate. There are 116 usable "name the attacker" scenarios
and 21 to 27 per defense for "name the defense".

### Three gate findings that changed the questions

1. **A strategy must be shown its own history.** The first version generated the
   rounds with one defense and then told the student they were running
   another, producing "you are running Static Defense" above a table of the
   honeypot moving every round. `describeUnusableExecute` now rejects it.
   With coherent histories the hold/move split is Static 50/0, Trigger 19/8,
   Reactive 0/30, Frequency 18/9, so Trigger and Frequency carry the teaching.
2. **Section 3's "name the attacker" needs seven rounds, not six.** At six
   the history is equally consistent with Reactive Best Response. The gate
   caught it.
3. **The counter questions only work at some horizons.** Against a Frequency
   attacker at delta 0.8 the top two defenses are separated by **0.001**,
   which would mark a student wrong for a distinction nothing on screen could
   reveal. `describeUnusableCounter` requires a margin of 1.5, so Section 2
   asks at delta 0.8 (margin 6.40) and Section 3 at delta 0.9 (margin 6.79).

### Two answers that are not the obvious ones

**Section 3's execute question is a value-weighted tie-break.** Four rounds
in, the attacks split 2 and 2, so counting hits gives no answer at all. Only
weighting by server value breaks it: S1 has cost 2 x 8 = 16 against S2's
2 x 6 = 12. A student who counts gets a tie; a student who runs the actual
rule gets S1.

**Against the learning attacker, randomizing loses.** Reactive Best Response
scores 140.70 and Randomized Defense 133.91. An earlier draft of this block
had "randomize" as the capstone answer, which is simply false in this game:
the Example's claim is that Lab 4's mix leaves a learner *indifferent*, not
that it beats them. Indifference is unexploitability, not optimality, and
those are different. The capstone is therefore a concept question about what
indifference does to a counting attacker, and the counter question has the
true answer.

### Verification

- The stage list throws at module load if any gate fails or the points do not
  total 100, so a retuned game stops the lab rather than reaching a student.
- All three execute answers re-derived independently from the engine agree
  with the stage list.
- UI invariants per question: controls have the data they need, `revealTo`
  never exceeds the section or moves backwards inside a block, a "where
  does it go" question always has a real next round, and its answer is never
  already visible in the revealed rows.
- Every option on every question scored individually: each one is worth
  exactly its own points and nothing else. Perfect run 100, blank run 0.
- Number questions accept the exact answer and the tolerance band, and reject
  off-by-one, double, empty and non-numeric.
- No "undefined", "NaN" or "[object" in any prompt, hint or explanation.

## Lab1 info

// //Best Response
// //Pure Nash Equilibrium
// //Mixed Nash Equilibrium
// //Maxmin
// //Minmax

// //Best Response
// What is the best response to (D _ S1) -> (A _ S2)
// What is the best response to (D _ S2) -> (A _ S1)

// //Pure Nash Equilibrium (Where the game is in a stable state in which each player chooses a singe specific action,
// //pure strategy, no player wants to change their choice
// What is the Pure Nash Equilibrium in this game (might want to rephrase this) -> There is no pure N.E

// //Mixed Nash Equilibrium
// What is the Mixed Nash Equilibrium? For the attacker
// e.x with payoff matrix different numbers than normal
// (D _ S1) -> -3q + (1-q) = -4q + 1
// (D _ S2) -> 2q - 2(1-q) = 4q-2
// 8q = 3 therefore q = 37.5% where q is percent of wanting to attack a certain server based on the payoffs Server 1 is q server 2 is 1-q
// What is the Mixed N.E? For the defender
// I'm not gonna calculate this again but same calculations
// where p is the percent of wanting to defender a server based on the payoffs
// //Maxmin
// What is the Maxmin

// //MinMax

## Lab2 info

Lab 2 asks the same category of questions as Lab 1 (Best Response, Pure N.E., Mixed N.E., Maxmin, Minmax), but the underlying game is non-zero-sum instead of zero-sum, which makes it meaningfully more complex.

There is still a Defender and an Attacker, but two new cost variables are introduced:
- `Ch` — the Defender's cost of running a honeypot.
- `Ce` — the Attacker's cost of executing an exploit.

These feed into each player's result (payoff) via two separate equations (notably NOT symmetric/opposite like Lab 1's zero-sum payoffs, since this is non-zero-sum):
- `Rd = (Sz - D - Ch)` — the Defender's result equals the value of the server being targeted (`Sz`, i.e. `S1` or `S2` depending on which server is in play) minus the damage done (`D`) minus the honeypot cost (`Ch`).
- `Ra = (D - Ce)` — the Attacker's result equals the damage done (`D`) minus the cost of the exploit (`Ce`).

Because both players now also have the option to take no action, the payoff matrix grows from Lab 1's 2x2 (Defend S1/S2 x Attack S1/S2) to a **3x3 matrix**: Defend S1 / Defend S2 / No Action (Defender) crossed with Attack S1 / Attack S2 / No Action (Attacker).

**Value customization**: Lab 2 introduces user-adjustable game parameters. Example's four values (`S1`, `S2`, `Ch`, `Ce`) are fixed; Practice lets the user set all four themselves via fully open sliders:
- `S1`: from `1` to `50`.
- `S2`: from `1` to `50`.
- `Ch`: from `1` to `10`.
- `Ce`: from `1` to `10`.

Because the ranges are open, **every Practice answer is computed from the actual game rather than from any fixed formula.** [PracticeLab2.tsx](src/components/Lab2/PracticeLab2.tsx) embeds a real Nash equilibrium solver (`findEquilibria`, support enumeration over equal-size supports), and `analyzeGame` gates Start Lab: a value set is accepted only when the game has **exactly one** Nash equilibrium **and** the method this lab teaches (`taughtSolution`: check for a Pure N.E. first, else the three-variable mixed system, else fall back to two variables) actually reproduces it. Anything else is rejected with a "retry with different values" message, because those games would mark a correct student answer wrong.

Why the gate is necessary, measured by sweeping all 250,000 slider combinations:
- 6,514 combos (2.6%) have zero or multiple equilibria, so no single correct answer exists. `S1 == S2` is one of these.
- Of the combos that do have a unique equilibrium, the method this lab teaches only reproduces it about 73% of the time. The rest settle on supports like {Defend S1, No Action} that the lab never covers.
- Net: **177,439 combos (71.0%) are usable**, and all three outcomes stay reachable (5,115 Pure N.E., 163,931 two-strategy mixes, 8,393 three-strategy mixes), matching the three cases the Example teaches.
- Rejections cluster at low server values: servers 1 to 10 are 59% usable, 11 to 20 are 71%, and **21 and up are 100%** usable (which is what the old `21` floor was really buying).

Answers can also legitimately tie (if `S1 == Ch`, defending Server 1 and doing nothing are exactly equally good; if `S1 == S2 == Ce`, all three Attacker options tie), so `Step.correctAnswer` holds a *list* of accepted answers and grading counts any tied-optimal choice as correct.

`analyzeGame`, `generatePages`, `findEquilibria`, and `calculateLab2Matrix` are exported so this can be re-verified offline: bundle a small entry with esbuild (`--loader:.css=empty`) and sweep the space. The current implementation passes with zero problems across 2.1 million generated question instances, checking that every question always has a correct answer, that the correct answer always appears among the choices, and that no choice contains NaN.

**Example's two-form steps**: three of the Example steps (Pure N.E., and both Mixed N.E. steps) have a second form behind a button, so the student sees the same procedure land on a different outcome. Revealing the answer shows the walkthrough on the lab's primary values; a follow-up button rebuilds the matrix from an alternate value set and re-runs the same method. Navigating to any other step drops back to the primary values automatically, so the other topics are never left running on an alternate set.

Three value sets exist in [ExampleLab2.tsx](src/components/Lab2/ExampleLab2.tsx):
- `PRIMARY_VALUES` = S1 45, S2 30, Ch 4, Ce 7. No Pure N.E.; the Mixed N.E. three-variable check fails (p3 = -0.611) and collapses to 2 strategies.
- `PURE_NE_ALT_VALUES` = S1 8, S2 6, Ch 3, Ce 10. Used only by the Pure N.E. step. Ce exceeds both server values, so attacking is a guaranteed loss, the Attacker stands down, and (No Action, No Action) is a stable equilibrium at payoffs (14, 0).
- `MIXED3_ALT_VALUES` = S1 20, S2 10, Ch 4, Ce 8. Used by both Mixed N.E. steps. Sits in the band `Ch <= S1*S2/(S1+S2) <= Ce <= min(S1,S2)`, so both players' three-strategy mixes are feasible: Attacker 20/40/40, Defender 60/20/20.

Two alternate sets are needed rather than one because **no single value set can have both a Pure N.E. and a full three-strategy Mixed N.E.** (verified by exhaustive search over S1,S2 in 2..50 and Ch,Ce in 1..20: zero hits). A Pure N.E. requires `Ce >= max(S1,S2)`, while a three-way mix requires `Ce <= min(S1,S2)`; the same cost condition that makes a player stand down is what removes them from a full mix. Each individual problem still only ever shows two forms, which is what matters to the student.

More Lab 2 details TBD as it's built out.

## Lab3 info

Lab 3 leaves the payoff-matrix world of Labs 1 and 2 entirely. The subject is **extensive-form games**: sequential interaction represented as a rooted game tree, solved by **backward induction** to a **Subgame Perfect Nash Equilibrium (SPNE)**, under **perfect information** (each player observes every move made before theirs).

### Graph structure

The tree is an attack path through a small network, not an abstract game.

- **Entry node** at the top, the root.
- **Bridge nodes** `N1` and `N2` in the middle. These are waypoints/infrastructure, not targets. They hold no value.
- **Servers** `S1` to `S4` are the terminal nodes and the only things with value. `N1` leads to `S1`/`S2`, `N2` leads to `S3`/`S4`.

A node records *whose turn it is*. The *edges* are the actions. A terminal records the payoff for the complete path that reached it.

### Variables

- Four **server values**, `S1` to `S4`.
- Six **exploit costs**, one per edge (`Entry->N1`, `Entry->N2`, `N1->S1`, `N1->S2`, `N2->S3`, `N2->S4`). The attacker pays the cost of every edge they traverse. **The two legs under a given bridge node must differ** (`n1S1 != n1S2`, `n2S3 != n2S4`), or the attacker ties in the defender-first graph, where approach cost is the only thing distinguishing the options.
- One **honeypot cost** `Ch`, a constant.
- One **capture penalty** `P`, what getting caught costs the attacker beyond the exploit costs already sunk: burned tooling, attribution, lost access.

### Payoff functions

- `Ua = Sx - SUM(Ex) - P`, the captured server's value minus every exploit cost paid along the path taken, minus the capture penalty if the attacker was caught. Path-dependent, which is what makes a terminal's payoff a property of the whole history rather than of the last move.
- `Ud = SUM(Sx) - D - Ch`, where **`SUM(Sx)` is always all four server values and is therefore a constant**, `D` is the damage (the value of the server the attacker captured), and `Ch` is the honeypot cost if one was deployed.

**Honeypot capture** is just those same two formulas with the captured value set to zero. The attacker takes nothing (`Sx = 0`) and pays `P` on top of their sunk exploit costs; the defender takes no damage (`D = 0`) but still paid `Ch`. There is no special case and no undefined value.

**Trapped terminals are always off the equilibrium path.** Because the attacker moves last under perfect information, a rational attacker never steps into a honeypot they can see. This was verified: filling the trap payoffs four different ways (sunk costs only, plus a defender intelligence gain, plus an attacker penalty, and a symmetric transfer) produces the *identical* SPNE in every case, with the attacker walking into a trap at 0 of 4 opportunities.

That has a consequence worth teaching: **in this model a honeypot's entire value is deterrence and redirection, never capture.** It pays off by pushing the attacker somewhere cheaper (which is what happens at N2 in the Example) and never by catching anyone. That is a direct result of perfect information. Dropping that assumption, so the attacker does not know where the honeypot is, would make capture payoffs live and would require probability, which is a natural seam for a later lab.

`P` therefore does not change any answer. It is chosen for teaching (the traps should look dangerous) and for one practical reason: it pushes trapped payoffs down, which makes the `trapPreferredNodes` constraint below easier to satisfy.

### The governing principle: the attacker always moves last

It never makes sense for the attacker to be left standing on a non-terminal bridge node, so the attacker must always take the final move. This single rule is what determines the shape of both graphs, and it should be stated explicitly to students.

### Two graphs

**Attacker-first** (three decision layers, 9 decision nodes, 12 terminals):
1. Attacker picks `N1` or `N2`.
2. Defender observes the choice and picks one of three actions: honeypot the left server, honeypot the right server, or **no honeypot**.
3. Attacker picks a server beneath the node they entered.

The "no honeypot" option is what keeps `Ud` interesting. Without it `SUM(Sx)` and `Ch` are both constant, only `D` varies, and the defender degenerates into a one-rule lookup ("always protect the bigger server"). With it, the defender weighs `Ch` against the gap between the two servers, and eating the damage is sometimes correct.

**Defender-first** (two decision layers, 3 decision nodes, 4 terminals, all trapped):
1. Defender picks a node to defend. There is no opt-out, and `Ch` is paid up front whether or not the honeypot is ever entered. Every server beneath the chosen node gains the honeypot property.
2. The attacker is confined to that node's two servers: N1 reaches S1 and S2, N2 reaches S3 and S4.

**This game has no unique SPNE, and that is a known property of the structure rather than a bug.** Because the attacker can only reach honeypotted servers, they are always caught, so `D` is always 0 and `Ud = SUM(Sx) - Ch` is the same number at all four terminals (27 on `EXAMPLE_VALUES`). The defender is completely indifferent between defending N1 and defending N2. `tiedNodes` reports the root.

Distinct exploit costs fix the **attacker's** half of this and are required for it: with `n1S1 != n1S2` and `n2S3 != n2S4` the attacker has a real strict comparison inside each branch, choosing the cheaper way to get caught (S2 at -7 over S1 at -14; S3 at -7 over S4 at -8). They cannot fix the defender's half, because **exploit costs appear only in `Ua` and never in `Ud`**. The only things that could are a per-node honeypot cost (`Ch1` vs `Ch2`), a defender payoff that depends on which server the capture happened on, or letting the attacker sometimes get through.

Example therefore annotates only the two attacker nodes on this tree and leaves the root unpruned, since pruning it would present an arbitrary pick as the answer. The step names the indifference explicitly and uses it as the point: a defender who cannot lose also has nothing to decide, and the attacker-first ordering is interesting precisely because the attacker can sometimes get through.

`EXAMPLE_VALUES` note: `n2S4` is 2 rather than 1 specifically so the attacker does not tie inside the N2 branch. That also shifts the attacker-first N2 subgame from `(2, 22)` to `(1, 22)`, which does not change the SPNE.

### Practice: a played match, not a solver

Practice is a **turn-based match against a perfectly rational opponent**, on the attacker-first graph only (defender-first can never be used: it has no unique SPNE). The student picks a side, and the two sides play genuinely different games.

An earlier version had both sides annotate all nine decision nodes. That equalized workload but made the lab a solver and the side choice purely cosmetic, so it was scrapped. Equal difficulty now comes from weighting, not from identical work.

The match is defined as a list of stages in [practiceStages.ts](src/components/Lab3/practiceStages.ts), kept out of the component because the stage list *is* the design of the lab. Later stages are rebuilt from the student's earlier moves, so the opponent genuinely responds to what they did.

**Attacker, 10 graded stages:** 3 recon, read the defender at N1 (10), read them at N2 (10), your opening (15), *defender's reply revealed*, your finish (15), counterfactual on the branch not taken (10), threshold (15), concept (10).

**Defender, 11 graded stages:** 3 recon, read the attacker's opening (20, the hardest single question in the lab), *attacker's move revealed*, predict their finish under each of your three options (5 each), your move (15), *their finish revealed*, counterfactual on the option you passed up (10), threshold (15), concept (10).

Both total exactly 100. Verified by simulating 3,000 perfect playthroughs per role (always 100, every graded stage has a non-empty correct answer) and 3,000 deliberately-wrong playthroughs per role (stage list always terminates, weights still total 100, no "undefined" ever reaches the screen).

Four question types, so the lab cannot be passed by comparing adjacent numbers:

1. **Recon.** The tree starts with every payoff hidden (`visiblePayoffIds` on `GameTreeSVG`). The student computes three terminals from the formulas, one of which is a honeypot capture so they have to apply `Sx = 0`, `D = 0` and `P`. The rest then fill in, because backward induction needs them. Three terminals rather than all twelve, since 24 inputs is data entry.
2. **Predictions.** Click the edge the opponent will take. Forces lookahead instead of local comparison.
3. **The threshold question.** "How expensive would a honeypot have to get before it stopped being worth it at this node?" `honeypotThreshold` derives it: `Ch* = Ud(honeypot) - Ud(nothing) + Ch`, the point of exact indifference. This is the only question whose answer is not visible anywhere on screen. Verified across 20,000 games: always present, always an integer, always above `Ch` (range 3 to 9), and independently cross-checked against `D_none - D_shift`.
4. **One conceptual multiple choice**, with the greedy misconception as the distractor. Options are rotated by a hash of the server values rather than shuffled randomly, so a re-render never moves them under the cursor.

**The grade is never shown before submit.** Finishing the match leads to a review screen that steps back and forth through every committed answer with no marks and no score, then Submit hands the result to `LabLayout` the way Labs 1 and 2 do. Review is read-only on purpose: predictions were made under uncertainty, and letting them be edited after the opponent's moves are revealed would defeat them. The opponent's moves *are* revealed during play, since that is what makes it a match rather than a worksheet.

Restart generates fresh values. Because every generated game satisfies the same constraints, that is a reroll of the numbers and never a reroll into an easier tree.

### Generation constraints for Practice

`generateGame` is rejection sampling over servers 6 to 15, entry costs 1 to 3, leg costs 1 to 9, `Ch` 2 to 6, `P` 3 to 7. `describeUnusable` is the single gate and returns *why* a candidate failed rather than a bare boolean. A value set is usable only if all of these hold:

- `tiedNodes(...)` is empty. A tie means the SPNE is not unique and the node cannot be graded.
- `trapPreferredNodes(...)` is empty. The attacker must strictly prefer a real capture to walking into a honeypot. Getting trapped beats a real capture whenever `e_B - e_A > S_B`, so this is reachable with bad values.
- The two legs under each bridge differ (`n1S1 != n1S2`, `n2S3 != n2S4`), or the attacker ties where approach cost is the only thing separating options.
- The two defender nodes reach different conclusions, or the tree is pattern-matchable. This also guarantees at least one node buys a honeypot, which is what the threshold question needs.
- The attacker's single best terminal sits in the branch they do **not** enter, so the greedy answer is wrong.
- The attacker's equilibrium payoff is positive.

Measured over 200,000 candidates: **12.66% acceptance**, so generation is effectively instant. Rejection reasons: tie 26.7%, defender nodes agree 24.0%, greedy answer correct 14.3%, N1 legs equal 11.0%, N2 legs equal 10.0%, attacker cannot profit 1.4%. Across 20,000 *generated* games there were zero problems: always 9 decision nodes and 12 terminals, root choice splits 45/55, and all eight defender-pattern combinations occur.

### Layout and color

Attacker is **red**, defender is **blue**, in both tabs. These are independent of the lab's theme colors, and they carry the single most important piece of state on screen: whose turn it is and whose payoff is being maximized. The most common student error in backward induction is maximizing the wrong player's payoff, so color is paired with consistent screen position rather than used alone.

- **Example**: graph on the left, explanations and calculation steps on the right, matching the Lab 1 and Lab 2 frame. The familiar layout keeps the novelty in the content.
- **Practice**: three columns, defender left, graph center, attacker right, with the question bar above the graph. The question bar is colored to the active player and lights that player's rail.

### Concepts the lab must land

- An **action** is one move at one node. A **strategy** is a complete contingent plan, one action at *every* node that player owns, including nodes that are never reached.
- An **SPNE is a strategy profile, not a path.** Off-path choices are load-bearing: the defender's response to an attack that never happens is exactly why the attacker avoided that branch.
- **Exploit costs drive a wedge between the players.** The attacker maximizes `Sx - SUM(Ex)` while the defender minimizes `D = Sx` alone, so the attacker may take a lower-value server because it is cheaper to reach, and the defender has to predict that rather than just counting server values.

More Lab 3 details TBD as it's built out.

## Lab4 info

Lab 4 is a **Stackelberg security game**. Where Lab 3 was about a defender *reacting* to a move already made, Lab 4 is about **commitment**: the defender moves first, publicly, and must choose while anticipating what the attacker will do about that choice.

The definitive source for this lab is the whiteboard design session with the professor, not the written brief. The brief said "we can use the same network structure as Lab 3", but the whiteboard uses a flat one-hop network with three servers, and that is what is built.

### The game

```
  values                   ( E )
  S1   8           .2  /     .1  |     .1  \
  S2   6         [ S1 ]      [ S2 ]      [ S3 ]
  S3   4         [ 44% ]     [ 42% ]     [ 13% ]   <- coverage bars
  Ch   1
  SUM 18
```

Server values and the two constants live in a panel at the top left of the
diagram, the way Lab 2 does it, rather than inside the server boxes. The boxes
carry identity and coverage only. Edge labels are bare exploit costs
(`.2`, `.1`, `.1`), matching how Lab 3 draws them.

- Three **servers**, each with a value and an exploit cost the attacker pays whether or not the attack lands.
- One **honeypot**, cost `Ch = 1`, paid up front before anyone moves.
- `SUM(V) = 18`.

**Payoffs** (note these drop Lab 3's capture penalty `P`; there is no equivalent here):
- `Ua = Di - Cei`
- `Ud = SUM(V) - Di - Ch`

The hinge of the whole lab: **covering a server sets `Di` to 0 but the attacker still pays `Cei`.** A failed attack is not free, which is what lets coverage make a server unattractive without ever being certain.

### Roles

The **defender is the Stackelberg leader**. They commit to a coverage distribution `x = (x1, x2, x3)` summing to 1 (exactly one honeypot, it goes somewhere). The **attacker is the follower**: they see the probabilities, because the commitment is public, but not the realized placement.

### The maths, all verified against both whiteboard photos

Both expectations are linear in that server's own coverage, which is what lets each be a single line:

```
EUa(S1) = 6 - 8x1    EUd(S1) =  9 + 8x1
EUa(S2) = 5 - 6x2    EUd(S2) = 11 + 6x2
EUa(S3) = 3 - 4x3    EUd(S3) = 13 + 4x3
```

`BR(x) = argmax {6 - 8x1, 5 - 6x2, 3 - 4x3}`.

**The optimal commitment equalizes the attacker.** Set all three equal to `v`, substitute into `SUM(xi) = 1`, clear to a denominator of 24: `3(6-v) + 4(5-v) + 6(3-v) = 24`, so `56 - 13v = 24` and `v = 32/13`. That gives

`x = (23/52, 11/26, 7/52) = (44.2%, 42.3%, 13.5%)`.

**The ladder the Example is built around**, and the reason the lab works as a story:

| commitment | attacker takes | defender gets |
|---|---|---|
| best pure (cover S1) | S2 | 11 |
| mixed by guesswork (0.5, 0.3, 0.2) | S2 | 12.8 |
| mixed, optimized | S2 or S3 | **13.54** |

Nothing about the network changes between those rows. The entire gain comes from controlling what the attacker knows.

**Whiteboard typo**: board 2 writes `EUd(S1) = 9 + 8(23/52) = 163/16 ~ 12.54`. It is `163/13`. The decimal is right, the fraction is not.

### Two things that are easy to get wrong

**Strong Stackelberg tie-breaking.** At the optimum the attacker is indifferent across all three servers *by construction*, so "which server do they hit" has no answer without a stated convention. The lab uses **Strong Stackelberg**: an indifferent follower breaks the tie in the leader's favor, giving 13.54. This is justified in the Example rather than asserted: the defender could always shift a sliver of coverage to make one server strictly best, so 13.54 is a value they can approach arbitrarily closely.

This also means the professor's instruction that "the student should always be asked to predict which server the attacker would choose" cannot be applied at the optimum. Any future Practice must only ask for that prediction at non-optimal commitments.

**The equalizer is not always feasible.** When a server is unattractive enough its equalizing share comes out negative, and the right answer is to drop that server and re-solve on the rest. Measured over 20,000 random games: the equalizer is **infeasible 53% of the time**, and when it *is* feasible it is **never suboptimal** (0 counterexamples). So "equalize and you are done" is a sound rule exactly when all shares are non-negative. `equalizingCoverage` returns null rather than nonsense in that case, and `defenderOptimum` solves it properly. A Practice generator will need this as its gate.

### Files

- [stackelberg.ts](src/components/Lab4/stackelberg.ts): pure, no React. Game definition, payoffs, the line forms, `bestResponses`, `attackedTarget` (SSE), `equalizingCoverage`, and `defenderOptimum`, which finds the true optimum per-server rather than assuming the equalizer. Verified offline the way `gameTree.ts` was: every whiteboard number reproduced exactly, and `defenderOptimum` cross-checked against a brute-force sweep of the simplex that never exceeds it and converges on it as the grid tightens.
- [ServerNetwork.tsx](src/components/Lab4/ServerNetwork.tsx): the SVG. Each server box carries a **coverage bar**, which is the component that matters: it turns `x = (0.44, 0.42, 0.13)` from three decimals into a picture, and it animates as the walkthrough steps between the three commitments.
- [ExampleLab4.tsx](src/components/Lab4/ExampleLab4.tsx): six pages in the Lab 1 and 2 frame (definition box, topic, question, Show Answer, arrows, finish screen). Every number in the prose is computed from the solver, never typed in, so the text cannot drift from the diagram.
- [ExampleLab4.css](src/styles/ExampleLab4.css): amber `#f08c00` chrome. Attacker red and defender blue are kept identical to Lab 3 on purpose, so a student does not have to relearn them.


### Practice: one long derivation as a transcript

Practice Lab 4 is a **single scrolling conversation** between the attacker and the defender, three columns with the attacker on the left, the network in the middle and the defender on the right. The student is always the defender, matching the professor's brief.

Unlike Lab 3's Practice, which showed one exchange at a time, the whole history stays on screen. Lab 4 is one derivation that builds on itself, so being able to scroll back to the line you derived four questions ago matters.

**14 stages, 100 points**, in [practiceStages.ts](src/components/Lab4/practiceStages.ts):

| stage | kind | pts |
|---|---|---|
| what the attacker gets on a covered server | choice | 5 |
| `EUa` at each of the three servers | equation x3 | 8 each |
| how the attacker picks between them | choice | 5 |
| best response to the trial mix (50/30/20) | choice | 7 |
| what happens if one server is strictly best | choice | 6 |
| the third equation, `x1 + x2 + x3 = 1` | choice | 4 |
| solve for the coverage, as percentages | triple | 15 |
| what the defender keeps on a covered server | number | 4 |
| `EUd` at each of the three servers | equation x3 | 7 each |
| the defender's expected utility at the optimum | number | 9 |

Verified across 3,000 generated games: weights always total 100, always 14 stages, a perfect run scores exactly 100, a blank run scores 0, and no stage ever renders `NaN` or `undefined`.

**Who speaks.** The question bubble sits on the side of the player whose reasoning it concerns, so answering an attacker-side question means modeling the opponent, which is the skill. The student's reply always appears as a defender bubble, because the student is the defender.

### Grading equations by meaning, not by string

The same answer has many correct spellings, so [linearExpression.ts](src/components/Lab4/linearExpression.ts) reduces whatever is typed to a pair of numbers, the constant term and the coefficient, and compares those. A list of accepted strings per question would be endless and would still reject something reasonable.

Accepted: `6-8x1`, `6 - 8x1`, `-8x1+6`, `6-8*x1`, `6-8x` (dropped subscript), `EUa(S1)=6-8x1`, unicode minus, decimals, and simple fractions like `23/52`. A trailing operator (`6-8x1+`) is accepted as an unambiguous typo.

Rejected: the wrong variable (`6-8x2` when x1 was asked for), parentheses, two variables in a term, powers, and anything non-numeric. All of those are real mistakes rather than notation choices.

Percentages are graded to two decimal places as the question asks, and accept either `27.27` or `0.2727`, since students flip between the two constantly. The decimal reading is only tried when the typed number is at most 1, so the two readings can never both be plausible.

### Practice generation

`generatePracticeGame` is rejection sampling over server values 5 to 12, exploit costs 1 to 4, and `Ch` 1 to 3. The payoff lines collapse to something very simple, which is worth knowing when reading the code: with value `V` and cost `C`, `EUa = (V - C) - V*x` and `EUd = (SUM(V) - V - Ch) + V*x`. The attacker's slope is just `-V`.

`describeUnusablePractice` is the gate and returns the reason rather than a bare boolean:

- Server values must be **distinct**, since equal values give identical equations.
- No server may cost more to reach than it is worth.
- The trial mix must have a **unique** best response, or that question has no single answer.
- The equalizer must be feasible (this is the constraint that rejects most candidates).
- No share may be below 4% or above 90%, and no two shares within 2 points of each other, so the three answers are worth asking for separately.
- Optimizing must beat the trial mix by at least 0.05, or the lab's punchline does not land.

Measured over 200,000 candidates: **42.15% acceptance**. Rejection reasons: duplicate server values 34.4%, equalizer infeasible 12.8%, share at an extreme 5.6%, shares too close 4.2%, trial mix ties 0.9%. Across 5,000 generated games there were zero problems, all three servers occur as the trial-mix best response, and the gain from optimizing ranges 0.08 to 6.85 with a median of 2.63.

### Two giveaways that were caught and removed

An early version printed the expected payoff beside each option in the best-response question (`"S2, for 6.7"`), which let the student pick the largest number without evaluating the lines they had just derived. The options are bare server names now.

The covered-payoff question originally stated both `SUM(V)` and `Ch` in the prompt, turning it into a subtraction prompt rather than a question about the damage going to zero. The numbers moved to the panel beside the network, where the student has to go and find them.

### Example structure

An intro roadmap, then seven pages and 21 steps.

**Intro** defines what a Stackelberg game is, defines expected utility with a worked micro-example, and lists the seven pages with one line each. It stays reachable: pressing back from page 1 returns to it.

1. **The network and the payoffs**: read the diagram, then both formulas worked on S2 open and S2 covered.
2. **Commitment**: leader and follower, all three pure commitments, lands on 11.
3. **Why a certain defense fails**: the bridge that makes mixing feel necessary rather than arbitrary. Shows that under *every* pure commitment the honeypot catches nobody, so a certain commitment does not defend a server, it redirects the attacker, and with three servers and one honeypot there is always somewhere to redirect them to. Then the fix: what the defender needs is not more coverage but doubt, demonstrated by dropping the attacker's S2 payoff from 5 to 3.2 with nothing but a 30% chance of being covered.
4. **Setting up the mixed strategy**: `x1 = P(HP @ S1)` notation straight off the board, the `x1 + x2 + x3 = 1` budget, then each `EUa` derived from its protected/unprotected cases in a two-row table before being tidied to `6 - 8x1`. Ends with the argmax rule and the interactive sliders.
5. **Trying a mix**: runs `(0.5, 0.3, 0.2)` through the machinery, gets `2 / 3.2 / 2.2`, best response S2, defender 12.8. The final step reads the three numbers back and asks what is being wasted, which sets up the optimization.
6. **Optimizing, make the attacker indifferent**: the condition, each `xi` in terms of `v`, the multiply-through-by-24 algebra line by line, `v = 32/13`, then substitution back with a guess-versus-optimized table.
7. **Your expected utility, tuned against untuned**: `EUd` derived per server, evaluated at the optimum, Strong Stackelberg tie-breaking, and both ladders.

**`(0.5, 0.3, 0.2)` is a given, not a result.** On the whiteboard it sits *above* the solve, as a worked illustration. Deriving the probabilities properly (three `EUa` lines, argmax, `sum(xi) = 1`) produces `(44.2%, 42.3%, 13.5%)`, not 50/30/20, and no natural weighting rule gives 50/30/20 either: proportional to value gives 44.4/33.3/22.2, proportional to value minus cost gives 42.9/35.7/21.4. The Example therefore presents it explicitly as a trial mix whose job is to exercise the machinery before anything is optimized.

**Both ladders move, and the Example shows both.** The defender climbs 11 to 12.8 to 13.54 while the attacker falls 5 to 3.2 to 2.46.
