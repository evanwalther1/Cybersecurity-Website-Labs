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
Lab 4:
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
- Six **exploit costs**, one per edge (`Entry->N1`, `Entry->N2`, `N1->S1`, `N1->S2`, `N2->S3`, `N2->S4`). The attacker pays the cost of every edge they traverse.
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

**Defender-first** (two decision layers, 3 decision nodes, 8 terminals):
1. Defender picks a node to defend. There is no opt-out, the defender must choose, and `Ch` is paid up front whether or not the honeypot is ever entered. Every server beneath the chosen node gains the honeypot property.
2. The attacker sees the defense and picks **any one of the four servers**.

The attacker choosing freely is load-bearing. The original description had the attacker placed onto the defended node, which means they are always caught, so `D` is always 0, so `Ud = SUM(Sx) - Ch` is identical down both branches and **the defender has no decision at all** (verified: `tiedNodes` reports a tie at the root). The defender's move only matters because it changes where the attacker can profitably go, so the attacker has to have somewhere else to go.

The four trapped terminals are strictly dominated and never played, but they are drawn, because their numbers are the reason the attacker declines them. This is the same lesson as the off-path rows in the strategy profile.

Solved on `EXAMPLE_VALUES`: defending N1 lets the attacker take S3 for `(6, 18)`, defending N2 lets them take S2 for `(3, 21)`, so the defender **defends N2** and the game ends at `(3, 21)`. No ties.

That outcome carries the defender-side version of the greedy trap: the defender leaves **N1 wide open even though it holds S1, the most valuable server in the network**, because S1 costs 8 to breach and nets the attacker 0. Nobody was going to take it. Exploit costs, not server values, decide what is actually at risk.

### Generation constraints for Practice

A generated value set is only usable if all of these hold. `gameTree.ts` exports the checks:

- `tiedNodes(...)` is empty. A tie means the SPNE is not unique and the node cannot be graded.
- `trapPreferredNodes(...)` is empty. The attacker must strictly prefer a real capture to walking into a honeypot. Getting trapped beats a real capture whenever `e_B - e_A > S_B`, so this is reachable with bad values and has to be excluded.
- The defender's two nodes should not reach the same conclusion, or the tree is pattern-matchable.
- The attacker's single best terminal should not sit in the branch the attacker actually enters, so the greedy answer is wrong.

### Layout and color

Attacker is **red**, defender is **blue**, in both tabs. These are independent of the lab's theme colors, and they carry the single most important piece of state on screen: whose turn it is and whose payoff is being maximized. The most common student error in backward induction is maximizing the wrong player's payoff, so color is paired with consistent screen position rather than used alone.

- **Example**: graph on the left, explanations and calculation steps on the right, matching the Lab 1 and Lab 2 frame. The familiar layout keeps the novelty in the content.
- **Practice**: three columns, defender left, graph center, attacker right, with the question bar above the graph. The question bar is colored to the active player and lights that player's rail.

### Concepts the lab must land

- An **action** is one move at one node. A **strategy** is a complete contingent plan, one action at *every* node that player owns, including nodes that are never reached.
- An **SPNE is a strategy profile, not a path.** Off-path choices are load-bearing: the defender's response to an attack that never happens is exactly why the attacker avoided that branch.
- **Exploit costs drive a wedge between the players.** The attacker maximizes `Sx - SUM(Ex)` while the defender minimizes `D = Sx` alone, so the attacker may take a lower-value server because it is cheaper to reach, and the defender has to predict that rather than just counting server values.

More Lab 3 details TBD as it's built out.
