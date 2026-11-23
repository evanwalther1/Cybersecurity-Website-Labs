import { useState } from "react";
import CIcon from "@coreui/icons-react";
import { cilBook, cilX } from "@coreui/icons";
import { ATTACKER_STRATEGIES, DEFENDER_STRATEGIES } from "./repeated";

// An always-available reference for the eleven strategies, behind a button.
//
// Same idea as Lab 3's NetworkPeek: a thing the student needs on hand for the
// whole lab but does not need taking up room on every screen. Practice asks
// "what strategy is this" and "which strategy beats it", and nobody can
// answer either from memory on a first pass. The alternative is restating
// each strategy inside every question that touches it, which crowds the
// prompt and buries the actual question.
//
// Definitions come straight from repeated.ts, so the reference, the cards in
// free play and the simulator can never disagree about what a strategy does.

/** Manual play exists only in the Example's free play, where there is a
 *  person to do the playing. Practice never offers it, so listing it here
 *  would describe an option the student cannot pick. */
const DEFENSES = DEFENDER_STRATEGIES.filter((d) => d.id !== "manual");

/** The button's face. Shared so that the real control and the picture of it
 *  on the intro screen cannot end up showing different things. */
const PeekFace = () => (
  <>
    <CIcon icon={cilBook} />
    <span>Strategies</span>
  </>
);

/**
 * A non-interactive copy of the button, for use inside a sentence.
 *
 * "The Strategies button in the top left" asks the reader to go and find
 * something from a description. Showing the button itself means they are
 * looking for a shape they have already seen, which is the difference
 * between being told where a control is and being shown it.
 */
export const StrategyPeekChip = () => (
  <span className="lab5-peek-btn is-inline">
    <PeekFace />
  </span>
);

export const StrategyPeek = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="lab5-peek">
      <button
        type="button"
        className="lab5-peek-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        title={open ? "Hide the strategies" : "Show every strategy"}
      >
        <PeekFace />
      </button>

      {open && (
        <div className="lab5-peek-panel">
          <div className="lab5-peek-head">
            <span className="lab5-peek-title">Every strategy</span>
            <button
              type="button"
              className="lab5-peek-close"
              onClick={() => setOpen(false)}
              aria-label="Hide the strategies"
            >
              <CIcon icon={cilX} />
            </button>
          </div>

          <div className="lab5-peek-body">
            <section className="is-attacker">
              <h5>Attacker</h5>
              {ATTACKER_STRATEGIES.map((s) => (
                <div className="lab5-peek-row" key={s.id}>
                  <strong>{s.name}</strong>
                  <span>{s.rule}</span>
                </div>
              ))}
            </section>
            <section className="is-defender">
              <h5>Defender</h5>
              {DEFENSES.map((s) => (
                <div className="lab5-peek-row" key={s.id}>
                  <strong>{s.name}</strong>
                  <span>{s.rule}</span>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
