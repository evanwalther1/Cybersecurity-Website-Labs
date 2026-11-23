import { useMemo, useState } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft, cilArrowRight } from "@coreui/icons";
import "../../styles/ExampleLab4.css";
import "../../styles/ExampleLab5.css";
import "../../styles/PracticeLab5.css";
import { ServerNetwork } from "../Lab4/ServerNetwork";
import { StrategyPeek, StrategyPeekChip } from "./StrategyPeek";
import { totalValue } from "../Lab4/stackelberg";
import type { LabResult, QuestionResult } from "../../types/labResult";
import { G } from "./practiceScenarios";
import {
  ALL_QUESTIONS,
  BLOCKS,
  answerLabel,
  isCorrect,
  type Block,
  type Question,
} from "./practiceStages";

const LAB5_ACCENT = "#7048e8";
const S = G.servers;
const SV = totalValue(G);

/**
 * The questions in order, each carrying the block it belongs to.
 *
 * Flattened once at module load rather than tracked as a (block, question)
 * pair of indices in state. Two indices that have to stay in step is two
 * indices that eventually do not.
 */
const FLAT: { block: Block; q: Question }[] = BLOCKS.flatMap((b) =>
  b.questions.map((q) => ({ block: b, q })),
);

interface PracticeLab5Props {
  onSubmit: (result: LabResult) => void;
}

export const PracticeLab5 = ({ onSubmit }: PracticeLab5Props) => {
  const [phase, setPhase] = useState<"intro" | "play" | "review">("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [draft, setDraft] = useState("");
  const [reviewAt, setReviewAt] = useState(0);

  const graded: LabResult = useMemo(() => {
    const results: QuestionResult[] = ALL_QUESTIONS.map((q) => ({
      question: q.prompt,
      yourAnswer: answerLabel(q, answers[q.id] ?? null),
      correctAnswer: q.correct.map((c) => answerLabel(q, c)).join(" or "),
      isCorrect: isCorrect(q, answers[q.id] ?? null),
    }));
    return {
      score: ALL_QUESTIONS.reduce(
        (sum, q) => sum + (isCorrect(q, answers[q.id] ?? null) ? q.points : 0),
        0,
      ),
      results,
    };
  }, [answers]);

  const current = FLAT[Math.min(index, FLAT.length - 1)];

  const lockIn = () => {
    setAnswers((prev) => ({ ...prev, [current.q.id]: draft || null }));
    setDraft("");
    if (index + 1 >= FLAT.length) setPhase("review");
    else setIndex(index + 1);
  };

  // ------------------------------------------------------------------ intro

  if (phase === "intro") {
    return (
      <div className="lab5p">
        <div className="lab5p-intro">
          <p className="lab5p-kicker">Repeated Games</p>
          <h3>You are the defender</h3>
          <p>
            Three sections against three different attackers. Each section tells
            you which strategy you are running, and your job is to run it, read
            the opponent, and decide what you should have done instead.
          </p>
          <p className="lab5p-intro-note">
            The <StrategyPeekChip /> button in the top left opens a list of
            every attacker and defender strategy and what each one does.
          </p>

          <CButton
            color="primary"
            size="lg"
            onClick={() => setPhase("play")}
            style={{ background: LAB5_ACCENT, borderColor: LAB5_ACCENT }}
          >
            Begin
          </CButton>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------- review

  if (phase === "review") {
    const q = ALL_QUESTIONS[reviewAt];
    return (
      <div className="lab5p">
        <div className="lab5p-review">
          <div className="lab5p-review-head">
            <h4>Check your answers</h4>
            <p>
              Step through what you committed to. Nothing is marked yet, and
              nothing can be changed. Submit when you are ready.
            </p>
          </div>

          <div className="lab5p-review-card">
            <span className="lab5p-review-count">
              Question {reviewAt + 1} of {ALL_QUESTIONS.length} &middot;{" "}
              {q.points} pts
            </span>
            <p className="lab5p-review-q">{q.prompt}</p>
            <p className="lab5p-review-a">
              <span>Your answer</span>
              <strong>{answerLabel(q, answers[q.id] ?? null)}</strong>
            </p>
          </div>

          <div className="lab5p-review-nav">
            <CButton
              color="secondary"
              disabled={reviewAt === 0}
              onClick={() => setReviewAt(reviewAt - 1)}
            >
              <CIcon icon={cilArrowLeft} />
            </CButton>
            <CButton
              color="secondary"
              disabled={reviewAt >= ALL_QUESTIONS.length - 1}
              onClick={() => setReviewAt(reviewAt + 1)}
            >
              <CIcon icon={cilArrowRight} />
            </CButton>
          </div>

          <CButton
            color="primary"
            size="lg"
            onClick={() => onSubmit(graded)}
            style={{ background: LAB5_ACCENT, borderColor: LAB5_ACCENT }}
          >
            Submit lab
          </CButton>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------- play

  const { block, q } = current;
  const section = block.section;
  const shown = section ? section.rounds.slice(0, q.revealTo) : [];
  const live = shown.length > 0 ? shown[shown.length - 1] : null;
  const answered = draft.trim() !== "";

  const pick = (value: string) => setDraft(value);

  const optionList = (opts: { id: string; label: string }[]) => (
    <ul className="lab5p-options">
      {opts.map((o) => (
        <li key={o.id}>
          <button
            type="button"
            className={draft === o.id ? "is-picked" : undefined}
            onClick={() => pick(o.id)}
          >
            {o.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="lab5p">
      {/* ---------------------------------------------------------- header */}
      <div className="lab5p-head">
        <div className="lab5p-head-text">
          <span className="lab5p-block">{block.title}</span>
          {/* Composed here, not stored as a string, so the strategy name can
              be marked up. It is the single most important word on the
              screen: every "execute" question is asking the student to apply
              exactly this strategy and nothing else. */}
          {section ? (
            <p className="lab5p-setup">
              You are the defender. Your honeypot starts on{" "}
              <b>{S[section.startServer].id}</b> and you are running{" "}
              <strong>{section.runningName}</strong>.
            </p>
          ) : (
            <p>{block.blurb}</p>
          )}
        </div>
        <div className="lab5p-progress" aria-label="progress">
          {FLAT.map((f, i) => (
            <i
              key={f.q.id}
              className={
                i < index ? "is-done" : i === index ? "is-live" : undefined
              }
            />
          ))}
        </div>
      </div>

      <div className={`lab5p-body ${section ? "" : "is-theory"}`}>
        {section && (
          <>
            {/* ------------------------------------------------- the board */}
            <section className="lab5p-board">
              <StrategyPeek />
              <ServerNetwork
                game={G}
                attacked={live ? live.attacked : null}
                defended={live ? live.defended : null}
              />
              {/* Underneath the diagram rather than floating over it. The
                  panel is absolutely positioned in the Example, where the
                  column is half the window; here it is a third, and it would
                  sit on top of S1. Practice Lab 4 solved the same problem the
                  same way. Server values are not decoration in this lab:
                  Engagement 3 cannot be answered without them. */}
              <div className="lab4-variables">
                {S.map((s) => (
                  <div className="lab4-variables-row" key={s.id}>
                    <span className="lab4-variables-key">{s.id}</span>
                    <span className="lab4-variables-val">{s.value}</span>
                  </div>
                ))}
                <div className="lab4-variables-row is-divider">
                  <span className="lab4-variables-key">Ch</span>
                  <span className="lab4-variables-val">{G.honeypotCost}</span>
                </div>
                <div className="lab4-variables-row">
                  <span className="lab4-variables-key">SUM(V)</span>
                  <span className="lab4-variables-val">{SV}</span>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------- the log --- */}
            <section className="lab5p-log">
              <table className="lab5-sequence is-log">
                <thead>
                  <tr>
                    <th>R</th>
                    <th>Attack</th>
                    <th>Honeypot</th>
                    <th>Ud</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r, i) => (
                    <tr
                      key={i}
                      className={[
                        r.caught ? "is-caught" : "",
                        i === shown.length - 1 ? "is-live" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <td>{i + 1}</td>
                      <td>{S[r.attacked].id}</td>
                      <td>{S[r.defended].id}</td>
                      <td>{r.ud}</td>
                    </tr>
                  ))}
                  {/* The round being asked about, left blank on purpose: the
                      question is literally "fill this row in". */}
                  {q.kind === "server" && (
                    <tr className="lab5p-pending">
                      <td>{shown.length + 1}</td>
                      <td>?</td>
                      <td>{draft || "?"}</td>
                      <td>?</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {/* ------------------------------------------------------ question */}
        <section className="lab5p-ask">
          {!section && <StrategyPeek />}
          <span className="lab5p-pts">{q.points} pts</span>
          <p className="lab5p-prompt">{q.prompt}</p>
          {q.detail && <p className="lab5p-detail">{q.detail}</p>}

          {q.kind === "server" && (
            <div className="lab5p-servers">
              {S.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={draft === s.id ? "is-picked" : undefined}
                  onClick={() => pick(s.id)}
                >
                  {s.id}
                </button>
              ))}
            </div>
          )}

          {(q.kind === "strategy" || q.kind === "choice") &&
            optionList(q.options ?? [])}

          {q.kind === "number" && (
            <div className="lab5p-number">
              <input
                value={draft}
                inputMode="decimal"
                placeholder="0"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && answered) lockIn();
                }}
              />
              {q.suffix && <i>{q.suffix}</i>}
            </div>
          )}

          <div className="lab5p-commit">
            <CButton
              color="primary"
              disabled={!answered}
              onClick={lockIn}
              style={{ background: LAB5_ACCENT, borderColor: LAB5_ACCENT }}
            >
              {index + 1 >= FLAT.length ? "Lock in and review" : "Lock in"}
            </CButton>
            <span className="lab5p-final">
              Question {index + 1} of {FLAT.length}.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
