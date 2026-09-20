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

**Value customization**: Lab 2 introduces user-adjustable game parameters. Example's four values (`S1`, `S2`, `Ch`, `Ce`) are fixed; Practice lets the user set all four themselves via sliders before working through the lab, with these constraints:
- `S1`: from `21` to `50`.
- `S2`: from `21` to `50`.
- `Ch`: from `1` to `10`.
- `Ce`: from `1` to `10`.

`S1`/`S2`'s minimum of `21` (rather than just `Ch + 1`) is deliberate, not arbitrary, it guarantees `H = S1*S2/(S1+S2)` (the harmonic-mean-style threshold that governs whether a Pure N.E. can exist, and whether Mixed N.E. needs all three strategies) always stays above `Ce`'s max of `10`. That in turn guarantees, for *any* slider combination: no Pure N.E. ever exists, and Mixed N.E. always reduces to the same 2-strategy calculation Lab 1 uses (excluding No Action), for both players, matching exactly what the Example teaches. Without this floor, some slider combinations would require a genuinely different, harder calculation method (a real Pure N.E. existing, or a full 3-strategy Mixed N.E. requiring feasibility checks / support enumeration), which would make Practice inconsistent with what Example demonstrates. If a future lab wants to explore that fuller complexity, it should be a deliberate, separate design decision, not something Practice stumbles into via slider ranges.

More Lab 2 details TBD as it's built out.
