import { useEffect, useState } from "react";
import CIcon from "@coreui/icons-react";
import { cilX } from "@coreui/icons";
import { lookUp } from "./glossary";

// The opening screen's definitions, as a list rather than a wall of cards.
//
// Two earlier versions of this are worth recording, because both failed for
// the same reason: too much furniture around not much text.
//
//   1. An inline <Term> that made individual words in the prose clickable.
//      By the fourth screen the text was speckled with dotted underlines,
//      which invited the reader to stop and click rather than keep reading.
//   2. Seven bordered cards, each with its own heading, body and toggle
//      button. Seven boxes for seven sentences is mostly box.
//
// What is left is a plain definition list: term, dash, sentence. The term is
// the only thing marked up, and clicking it opens one small window with the
// example. Same idea as Lab 3's network peek and Lab 5's strategy peek, so a
// student who met either already knows what the highlighting means.

interface Props {
  /** Glossary ids to list, in order. */
  terms: string[];
}

export const TermList = ({ terms }: Props) => {
  // One at a time. Several open windows would be the card problem again,
  // with the stacking worse.
  const [open, setOpen] = useState<string | null>(null);
  const entry = open ? lookUp(open) : undefined;

  // Escape closes it. A window you can only dismiss by hunting for its X is
  // worse than one you did not open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <dl className="lab6-deflist">
        {terms.map((id) => {
          const g = lookUp(id);
          if (!g) return null;
          return (
            <div key={id}>
              <dt>
                <button
                  type="button"
                  className={`lab6-defterm ${open === id ? "is-open" : ""}`}
                  onClick={() => setOpen(open === id ? null : id)}
                  aria-expanded={open === id}
                  title={`An example of ${g.term.toLowerCase()}`}
                >
                  {g.term}
                </button>
              </dt>
              <dd>{g.what}</dd>
            </div>
          );
        })}
      </dl>

      {/*
        position: fixed, not absolute.
        The list sits inside .lab6-scroll, which is overflow-y: auto, so an
        absolutely positioned window would be clipped at the scroll edge and
        would scroll away with the text underneath it. Fixed escapes both.
        Verified there is no transform, filter or perspective on any ancestor,
        which would otherwise turn a fixed child back into an absolute one.
      */}
      {entry && (
        <div
          className="lab6-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${entry.term}: an example`}
          onClick={() => setOpen(null)}
        >
          <div
            className="lab6-overlay-box"
            // The backdrop closes on click, so the window itself must not
            // pass its own clicks up to it.
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lab6-overlay-head">
              <span>{entry.term}</span>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
              >
                <CIcon icon={cilX} />
              </button>
            </div>
            <p className="lab6-overlay-what">{entry.what}</p>
            <p className="lab6-overlay-like">
              <i>For example</i>
              {entry.like}
            </p>
            <p className="lab6-overlay-here">
              <i>In this lab</i>
              {entry.here}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
