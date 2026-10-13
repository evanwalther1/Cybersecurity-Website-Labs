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
Lab 5:
Lab 6:
Lab 7:

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

The definitive source for this lab is the whiteboard design session with the professor, not the written brief. The brief said "we can use the same network structure as Lab 3", but the whiteboard uses a flat one-hop network with three targets, and that is what is built.

### The game

```
                      ( E )
            e1=2 /     e2=1 |     e3=1 \
            [ T1 ]       [ T2 ]      [ T3 ]
            worth 8      worth 6     worth 4
```

- Three **targets**, each with a value and an exploit cost the attacker pays whether or not the attack lands.
- One **honeypot**, cost `Ch = 1`, paid up front before anyone moves.
- `SUM(V) = 18`.

**Payoffs** (note these drop Lab 3's capture penalty `P`; there is no equivalent here):
- `Ua = Di - Cei`
- `Ud = SUM(V) - Di - Ch`

The hinge of the whole lab: **covering a target sets `Di` to 0 but the attacker still pays `Cei`.** A failed attack is not free, which is what lets coverage make a target unattractive without ever being certain.

### Roles

The **defender is the Stackelberg leader**. They commit to a coverage distribution `x = (x1, x2, x3)` summing to 1 (exactly one honeypot, it goes somewhere). The **attacker is the follower**: they see the probabilities, because the commitment is public, but not the realized placement.

### The maths, all verified against both whiteboard photos

Both expectations are linear in that target's own coverage, which is what lets each be a single line:

```
EUa(T1) = 6 - 8x1    EUd(T1) =  9 + 8x1
EUa(T2) = 5 - 6x2    EUd(T2) = 11 + 6x2
EUa(T3) = 3 - 4x3    EUd(T3) = 13 + 4x3
```

`BR(x) = argmax {6 - 8x1, 5 - 6x2, 3 - 4x3}`.

**The optimal commitment equalizes the attacker.** Set all three equal to `v`, substitute into `SUM(xi) = 1`, clear to a denominator of 24: `3(6-v) + 4(5-v) + 6(3-v) = 24`, so `56 - 13v = 24` and `v = 32/13`. That gives

`x = (23/52, 11/26, 7/52) = (44.2%, 42.3%, 13.5%)`.

**The ladder the Example is built around**, and the reason the lab works as a story:

| commitment | attacker takes | defender gets |
|---|---|---|
| best pure (cover T1) | T2 | 11 |
| mixed by guesswork (0.5, 0.3, 0.2) | T2 | 12.8 |
| mixed, optimized | T2 or T3 | **13.54** |

Nothing about the network changes between those rows. The entire gain comes from controlling what the attacker knows.

**Whiteboard typo**: board 2 writes `EUd(T1) = 9 + 8(23/52) = 163/16 ~ 12.54`. It is `163/13`. The decimal is right, the fraction is not.

### Two things that are easy to get wrong

**Strong Stackelberg tie-breaking.** At the optimum the attacker is indifferent across all three targets *by construction*, so "which target do they hit" has no answer without a stated convention. The lab uses **Strong Stackelberg**: an indifferent follower breaks the tie in the leader's favor, giving 13.54. This is justified in the Example rather than asserted: the defender could always shift a sliver of coverage to make one target strictly best, so 13.54 is a value they can approach arbitrarily closely.

This also means the professor's instruction that "the student should always be asked to predict which target the attacker would choose" cannot be applied at the optimum. Any future Practice must only ask for that prediction at non-optimal commitments.

**The equalizer is not always feasible.** When a target is unattractive enough its equalizing share comes out negative, and the right answer is to drop that target and re-solve on the rest. Measured over 20,000 random games: the equalizer is **infeasible 53% of the time**, and when it *is* feasible it is **never suboptimal** (0 counterexamples). So "equalize and you are done" is a sound rule exactly when all shares are non-negative. `equalizingCoverage` returns null rather than nonsense in that case, and `defenderOptimum` solves it properly. A Practice generator will need this as its gate.

### Files

- [stackelberg.ts](src/components/Lab4/stackelberg.ts): pure, no React. Game definition, payoffs, the line forms, `bestResponses`, `attackedTarget` (SSE), `equalizingCoverage`, and `defenderOptimum`, which finds the true optimum per-target rather than assuming the equalizer. Verified offline the way `gameTree.ts` was: every whiteboard number reproduced exactly, and `defenderOptimum` cross-checked against a brute-force sweep of the simplex that never exceeds it and converges on it as the grid tightens.
- [TargetNetwork.tsx](src/components/Lab4/TargetNetwork.tsx): the SVG. Each target box carries a **coverage bar**, which is the component that matters: it turns `x = (0.44, 0.42, 0.13)` from three decimals into a picture, and it animates as the walkthrough steps between the three commitments.
- [ExampleLab4.tsx](src/components/Lab4/ExampleLab4.tsx): six pages in the Lab 1 and 2 frame (definition box, topic, question, Show Answer, arrows, finish screen). Every number in the prose is computed from the solver, never typed in, so the text cannot drift from the diagram.
- [ExampleLab4.css](src/styles/ExampleLab4.css): amber `#f08c00` chrome. Attacker red and defender blue are kept identical to Lab 3 on purpose, so a student does not have to relearn them.

Practice Lab 4 is a stub.

### Example structure

An intro roadmap, then seven pages and 21 steps.

**Intro** defines what a Stackelberg game is, defines expected utility with a worked micro-example, and lists the seven pages with one line each. It stays reachable: pressing back from page 1 returns to it.

1. **The network and the payoffs**: read the diagram, then both formulas worked on T2 open and T2 covered.
2. **Commitment**: leader and follower, all three pure commitments, lands on 11.
3. **Why a certain defense fails**: the bridge that makes mixing feel necessary rather than arbitrary. Shows that under *every* pure commitment the honeypot catches nobody, so a certain commitment does not defend a target, it redirects the attacker, and with three targets and one honeypot there is always somewhere to redirect them to. Then the fix: what the defender needs is not more coverage but doubt, demonstrated by dropping the attacker's T2 payoff from 5 to 3.2 with nothing but a 30% chance of being covered.
4. **Setting up the mixed strategy**: `x1 = P(HP @ T1)` notation straight off the board, the `x1 + x2 + x3 = 1` budget, then each `EUa` derived from its protected/unprotected cases in a two-row table before being tidied to `6 - 8x1`. Ends with the argmax rule and the interactive sliders.
5. **Trying a mix**: runs `(0.5, 0.3, 0.2)` through the machinery, gets `2 / 3.2 / 2.2`, best response T2, defender 12.8. The final step reads the three numbers back and asks what is being wasted, which sets up the optimization.
6. **Optimizing, make the attacker indifferent**: the condition, each `xi` in terms of `v`, the multiply-through-by-24 algebra line by line, `v = 32/13`, then substitution back with a guess-versus-optimized table.
7. **Your expected utility, tuned against untuned**: `EUd` derived per target, evaluated at the optimum, Strong Stackelberg tie-breaking, and both ladders.

**`(0.5, 0.3, 0.2)` is a given, not a result.** On the whiteboard it sits *above* the solve, as a worked illustration. Deriving the probabilities properly (three `EUa` lines, argmax, `sum(xi) = 1`) produces `(44.2%, 42.3%, 13.5%)`, not 50/30/20, and no natural weighting rule gives 50/30/20 either: proportional to value gives 44.4/33.3/22.2, proportional to value minus cost gives 42.9/35.7/21.4. The Example therefore presents it explicitly as a trial mix whose job is to exercise the machinery before anything is optimized.

**Both ladders move, and the Example shows both.** The defender climbs 11 to 12.8 to 13.54 while the attacker falls 5 to 3.2 to 2.46.
