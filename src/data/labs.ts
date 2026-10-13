import {
  cilBalanceScale,
  cilPuzzle,
  cilChartLine,
  cilGraph,
  cilShieldAlt,
  cilLockLocked,
  cilBug,
} from "@coreui/icons";

// The one place a lab's identity is defined.
//
// This exists because the same three facts (icon, accent color, title) are
// needed by the home page, the sidebar and the lab window, and duplicating
// them is how they drift: Home.css used to tint the cards from its own
// hardcoded nth-child ramp, so Lab 2 showed blue on the home page while its
// own lab window was green. Anything that needs to know about a lab reads it
// from here.

export interface Lab {
  number: number;
  /** Home card title, deliberately short enough to stay on one line. */
  title: string;
  /** The qualifier that used to be parenthesised in the title. */
  subtitle?: string;
  description: string;
  icon: string[];
  /**
   * The lab's accent. Must stay in step with `accentColor` in its Lab{n}.tsx.
   *
   * Its presence also marks the lab as built, which is deliberate rather than
   * a shortcut: the accent only exists because the lab exists, so one field
   * answers both "what color" and "is there anything to open".
   */
  accent?: string;
  /**
   * Where the sidebar links this lab. `null` reproduces the existing
   * `href="#"` no-op for the labs past Lab 4.
   *
   * Note that /lab4 has no route in App.tsx, so that entry navigates to a
   * blank content area. Left as it was on purpose; gating the unbuilt labs is
   * a separate change.
   */
  sidebarPath: string | null;
}

export const LABS: Lab[] = [
  {
    number: 1,
    title: "Lab 1: Zero-Sum Game",
    subtitle: "Normal form",
    description:
      "Best response, pure Nash Equilibrium, mixed Nash Equilibrium, maxmin, and minmax.",
    icon: cilBalanceScale,
    accent: "#4dabf7",
    sidebarPath: "/lab1",
  },
  {
    number: 2,
    title: "Lab 2: Non-Zero-Sum Game",
    subtitle: "Normal form",
    description:
      "Best response, pure Nash Equilibrium, mixed Nash Equilibrium, maxmin, and minmax.",
    icon: cilPuzzle,
    accent: "#20c997",
    sidebarPath: "/lab2",
  },
  {
    number: 3,
    title: "Lab 3: Extensive-Form Game",
    subtitle: "Game tree",
    description:
      "Sequential games, game trees, Subgame Perfect Nash Equilibrium, and backward induction.",
    icon: cilChartLine,
    accent: "#c22982",
    sidebarPath: "/lab3",
  },
  {
    number: 4,
    title: "Lab 4: Stackelberg Game",
    subtitle: "Commitment",
    description:
      "Leader and follower, commitment, mixed defense strategies, expected utility, and optimizing against a best-responding attacker.",
    icon: cilGraph,
    accent: "#f08c00",
    sidebarPath: "/lab4",
  },
  {
    number: 5,
    title: "Lab 5",
    description: "Concepts for this lab are still being defined.",
    icon: cilShieldAlt,
    sidebarPath: null,
  },
  {
    number: 6,
    title: "Lab 6",
    description: "Concepts for this lab are still being defined.",
    icon: cilLockLocked,
    sidebarPath: null,
  },
  {
    number: 7,
    title: "Lab 7",
    description: "Concepts for this lab are still being defined.",
    icon: cilBug,
    sidebarPath: null,
  },
];
