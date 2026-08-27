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
Lab 2:
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
