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

## Project description

I am a student at Boise State interning for a professor and doing a project that spans until April for him. This repository is the only repository for this project, essentially what I'm building is a website that contains 7 labs all based around Game Theory. My job is to code and design the layout of the website so that's it's user friendly and easy to navigate. The website is lightweight and doesn't contain anything security related nor does it have persistent memory such as caching or cookies, it is used for a one time purpose for students to complete labs. There will be 7 labs that I have to code, more to come TBD there is a lot more information here but this is the general sense. The website will be run locally on my machine, eventually we will rig it up to Boise States w

## Languages used, technologies

React, Typescript, HTML, CSS, possibly Python possibly javascript (althought typscript is better in almost every way)
