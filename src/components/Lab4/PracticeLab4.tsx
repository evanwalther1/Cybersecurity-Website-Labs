import { useEffect, useMemo, useRef, useState } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft, cilArrowRight, cilReload } from "@coreui/icons";
import "../../styles/ExampleLab4.css";
import "../../styles/PracticeLab4.css";
import type { LabResult, QuestionResult } from "../../types/labResult";
import { ServerNetwork } from "./ServerNetwork";
import {
  TRIAL_COVERAGE,
  generatePracticeGame,
  totalValue,
} from "./stackelberg";
import type { Coverage, PracticeGame } from "./stackelberg";
import { TRIPLE_SEPARATOR, buildStages } from "./practiceStages";
import type { Bubble, Stage } from "./practiceStages";

const LAB4_ACCENT = "#f08c00";

type Phase = "intro" | "play" | "review";

/** One line of the transcript. */
interface Entry {
  key: string;
  kind: "say" | "ask" | "answer";
  speaker: "attacker" | "defender";
  text?: string;
  stage?: Stage;
  /** True for the stage the student is currently on. */
  live?: boolean;
}

export interface PracticeLab4Props {
  onSubmit: (result: LabResult) => void;
}

export const PracticeLab4 = ({ onSubmit }: PracticeLab4Props) => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [practice, setPractice] = useState<PracticeGame | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [reviewIndex, setReviewIndex] = useState(0);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const stages: Stage[] = useMemo(
    () => (practice ? buildStages(practice) : []),
    [practice],
  );

  // Marked as we go so the review screen needs no extra work, but never shown
  // until submit. Same reasoning as Lab 3: seeing the score first turns
  // Restart into a way to fish for an easier run.
  const graded: LabResult = useMemo(() => {
    const results: QuestionResult[] = stages.map((stage) => {
      const given = answers.get(stage.id) ?? "";
      return {
        question: stage.prompt,
        yourAnswer: stage.describe(given),
        correctAnswer: stage.answerLabel,
        isCorrect: stage.isCorrect(given),
      };
    });
    const score = stages.reduce(
      (sum, stage, i) => (results[i].isCorrect ? sum + stage.weight : sum),
      0,
    );
    return { score: Math.round(score), results };
  }, [stages, answers]);

  // Keep the newest exchange in view as the transcript grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [stageIndex, phase]);

  const begin = () => {
    setPractice(generatePracticeGame());
    setPhase("play");
    setStageIndex(0);
    setAnswers(new Map());
    setReviewIndex(0);
    setDraft({});
  };

  const restart = () => {
    setPractice(null);
    setPhase("intro");
    setStageIndex(0);
    setAnswers(new Map());
    setReviewIndex(0);
    setDraft({});
  };

  // ----------------------------------------------------------------- intro -

  if (phase === "intro" || !practice) {
    return (
      <div className="lab4 lab4-practice-intro">
        <h3>You are the defender</h3>
        <p>
          One honeypot, three servers, and an attacker who will see your
          commitment before they move. Work out the coverage that leaves them
          with the worst possible best option.
        </p>
        <CButton
          style={{ backgroundColor: LAB4_ACCENT, borderColor: LAB4_ACCENT }}
          onClick={begin}
        >
          Start
        </CButton>
      </div>
    );
  }

  const { game, equalizer } = practice;
  const stage = stages[stageIndex];
  const isLast = stageIndex === stages.length - 1;

  // ---------------------------------------------------------------- review -

  if (phase === "review") {
    const item = stages[reviewIndex];
    return (
      <div className="lab4 lab4-practice-review">
        <div className="lab4-review-head">
          <h4>Check your answers</h4>
          <p>
            Nothing is marked yet. Step back through what you committed, then
            submit when you are ready.
          </p>
        </div>
        <div className="lab4-review-card">
          <span className="lab4-review-count">
            {reviewIndex + 1} of {stages.length} &middot; {item.weight} pts
          </span>
          <p className="lab4-review-q">{item.prompt}</p>
          <p className="lab4-review-a">
            <span>you answered</span>
            <strong>{item.describe(answers.get(item.id) ?? "")}</strong>
          </p>
        </div>
        <div className="lab4-review-nav">
          <CButton
            color="secondary"
            onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
            disabled={reviewIndex === 0}
          >
            <CIcon icon={cilArrowLeft} />
          </CButton>
          <CButton
            color="secondary"
            onClick={() =>
              setReviewIndex(Math.min(stages.length - 1, reviewIndex + 1))
            }
            disabled={reviewIndex === stages.length - 1}
          >
            <CIcon icon={cilArrowRight} />
          </CButton>
        </div>
        <div className="lab4-review-actions">
          <CButton color="secondary" variant="outline" onClick={restart}>
            <CIcon icon={cilReload} /> Start over, new values
          </CButton>
          <CButton
            style={{ backgroundColor: LAB4_ACCENT, borderColor: LAB4_ACCENT }}
            onClick={() => onSubmit(graded)}
          >
            Submit lab
          </CButton>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ play -

  // What the diagram shows. Nothing until a commitment is on the table, the
  // trial mix while it is being tested, then the student's own solution.
  const coverageShown: Coverage | undefined = answers.has("coverage")
    ? equalizer
    : stages.findIndex((s) => s.id === "trial-br") <= stageIndex
      ? TRIAL_COVERAGE
      : undefined;

  // Build the transcript: every stage up to and including the current one.
  const entries: Entry[] = [];
  stages.slice(0, stageIndex + 1).forEach((s, i) => {
    (s.lead ?? []).forEach((bubble: Bubble, b) =>
      entries.push({
        key: `${s.id}-lead-${b}`,
        kind: "say",
        speaker: bubble.speaker,
        text: bubble.text,
      }),
    );
    entries.push({
      key: `${s.id}-ask`,
      kind: "ask",
      speaker: s.speaker,
      stage: s,
    });
    const given = answers.get(s.id);
    if (given !== undefined || i === stageIndex) {
      entries.push({
        key: `${s.id}-answer`,
        kind: "answer",
        // The student is the defender, so their replies always sit on that
        // side regardless of who asked.
        speaker: "defender",
        stage: s,
        live: i === stageIndex,
      });
    }
  });

  const fieldValue = (key: string) => draft[key] ?? "";
  const setField = (key: string, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const encodeDraft = (): string => {
    if (stage.kind === "choice") return draft.choice ?? "";
    if (stage.kind === "triple") {
      return (stage.fields ?? [])
        .map((f) => (draft[f.key] ?? "").trim())
        .join(TRIPLE_SEPARATOR);
    }
    const only = stage.fields?.[0]?.key ?? "n";
    return (draft[only] ?? "").trim();
  };

  const canCommit = (() => {
    if (stage.kind === "choice") return (draft.choice ?? "") !== "";
    if (stage.kind === "triple") {
      return (stage.fields ?? []).every(
        (f) => (draft[f.key] ?? "").trim() !== "",
      );
    }
    const only = stage.fields?.[0]?.key ?? "n";
    return (draft[only] ?? "").trim() !== "";
  })();

  const commit = () => {
    if (!canCommit) return;
    const next = new Map(answers);
    next.set(stage.id, encodeDraft());
    setAnswers(next);
    setDraft({});
    if (isLast) {
      setPhase("review");
      setReviewIndex(0);
    } else {
      setStageIndex(stageIndex + 1);
    }
  };

  const answered = stages
    .slice(0, stageIndex)
    .filter((s) => answers.has(s.id)).length;

  const renderAnswerBody = (s: Stage, live: boolean) => {
    if (!live) {
      return (
        <span className="lab4-bubble-given">
          {s.describe(answers.get(s.id) ?? "")}
        </span>
      );
    }
    return (
      <>
        {s.kind === "choice" && (
          <ul className="lab4-bubble-options">
            {s.options?.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={draft.choice === option.id ? "is-picked" : ""}
                  onClick={() => setField("choice", option.id)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {s.kind !== "choice" && (
          <div className="lab4-bubble-inputs">
            {(s.fields ?? []).map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <span className="lab4-input-wrap">
                  <input
                    type="text"
                    inputMode={s.kind === "equation" ? "text" : "decimal"}
                    value={fieldValue(field.key)}
                    onChange={(event) =>
                      setField(field.key, event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commit();
                    }}
                    placeholder={s.kind === "equation" ? "e.g. 6 - 8x1" : ""}
                  />
                  {field.suffix && <i>{field.suffix}</i>}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="lab4-bubble-commit">
          <CButton
            size="sm"
            style={{ backgroundColor: LAB4_ACCENT, borderColor: LAB4_ACCENT }}
            disabled={!canCommit}
            onClick={commit}
          >
            {isLast ? "Finish" : "Send"}
          </CButton>
        </div>
      </>
    );
  };

  return (
    <div className="lab4 lab4-practice">
      <div className="lab4-practice-head">
        <span className="lab4-practice-side is-attacker">Attacker</span>
        <span className="lab4-practice-count">
          {Math.min(answered + 1, stages.length)} of {stages.length}
        </span>
        <span className="lab4-practice-side is-defender">Defender</span>
      </div>

      <div className="lab4-board">
        {/* The graph sits in the middle column and spans every transcript row,
            with a sticky inner wrapper so it stays in view while the
            conversation scrolls past it. Explicit rows are required: grid
            auto-placement would put a left bubble and the next right bubble on
            the same row and the conversation would lose its order. */}
        <div
          className="lab4-board-graph"
          style={{ gridRow: `1 / ${entries.length + 2}` }}
        >
          <div className="lab4-board-sticky">
            <ServerNetwork game={game} coverage={coverageShown} />
            {/* Reference data sits under the diagram rather than over it, so
                the network stays uncluttered and the numbers read as a
                footer the student scans rather than part of the picture. */}
            <div className="lab4-board-ledger">
              <div className="lab4-variables">
                {game.servers.map((server) => (
                  <div className="lab4-variables-row" key={server.id}>
                    <span className="lab4-variables-key">{server.id}</span>
                    <span className="lab4-variables-val">{server.value}</span>
                  </div>
                ))}
                <div className="lab4-variables-row is-divider">
                  <span className="lab4-variables-key">Ch</span>
                  <span className="lab4-variables-val">
                    {game.honeypotCost}
                  </span>
                </div>
                <div className="lab4-variables-row">
                  <span className="lab4-variables-key">SUM(V)</span>
                  <span className="lab4-variables-val">
                    {totalValue(game)}
                  </span>
                </div>
              </div>
              <div className="lab4-board-formulas">
                <code>Ua = Di &minus; Cei</code>
                <code>Ud = SUM(V) &minus; Di &minus; Ch</code>
              </div>
            </div>
          </div>
        </div>

        {entries.map((entry, row) => (
          <div
            key={entry.key}
            style={{ gridRow: row + 1 }}
            className={[
              "lab4-bubble",
              `is-${entry.speaker}`,
              `is-${entry.kind}`,
              entry.live ? "is-live" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="lab4-bubble-who">
              {entry.speaker === "attacker" ? "Attacker" : "Defender"}
              {entry.kind === "ask" && entry.stage && (
                <i className="lab4-bubble-pts">{entry.stage.weight} pts</i>
              )}
            </span>

            {entry.kind === "say" && entry.text}

            {entry.kind === "ask" && entry.stage && (
              <>
                <p className="lab4-bubble-prompt">{entry.stage.prompt}</p>
                {entry.stage.detail && (
                  <p className="lab4-bubble-detail">{entry.stage.detail}</p>
                )}
              </>
            )}

            {entry.kind === "answer" &&
              entry.stage &&
              renderAnswerBody(entry.stage, entry.live ?? false)}
          </div>
        ))}

        <div ref={bottomRef} style={{ gridRow: entries.length + 1 }} />
      </div>
    </div>
  );
};
