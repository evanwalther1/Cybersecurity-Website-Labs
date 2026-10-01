import { useMemo, useState } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft, cilArrowRight, cilReload } from "@coreui/icons";
import "../../styles/ExampleLab3.css";
import "../../styles/PracticeLab3.css";
import type { LabResult, QuestionResult } from "../../types/labResult";
import { GameTreeSVG } from "./GameTreeSVG";
import { generateGame, totalServerValue } from "./gameTree";
import type { Action, GeneratedGame, Player } from "./gameTree";
import { buildStages, pair } from "./practiceStages";
import type { Role, Stage } from "./practiceStages";

const LAB3_ACCENT = "#c22982";

type Phase = "role" | "play" | "review";

export interface PracticeLab3Props {
  onSubmit: (result: LabResult) => void;
}

export const PracticeLab3 = ({ onSubmit }: PracticeLab3Props) => {
  const [role, setRole] = useState<Role | null>(null);
  const [phase, setPhase] = useState<Phase>("role");
  const [game, setGame] = useState<GeneratedGame | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [reviewIndex, setReviewIndex] = useState(0);

  // Draft inputs for whichever stage is on screen. Cleared on every commit.
  const [draftEdge, setDraftEdge] = useState<string | null>(null);
  const [draftA, setDraftA] = useState("");
  const [draftB, setDraftB] = useState("");
  const [draftChoice, setDraftChoice] = useState<string | null>(null);

  // Later stages depend on the moves already made, so the list is rebuilt as
  // the match progresses rather than computed once up front.
  const stages: Stage[] = useMemo(
    () => (game && role ? buildStages(game, role, answers) : []),
    [game, role, answers],
  );

  // Marked continuously so the review screen needs no extra work, but
  // deliberately never shown until the student submits.
  const graded: LabResult = useMemo(() => {
    const scorable = stages.filter((stage) => stage.weight > 0);
    const results: QuestionResult[] = scorable.map((stage) => {
      const given = answers.get(stage.id) ?? "";
      return {
        question: stage.prompt,
        yourAnswer: stage.describe(given),
        correctAnswer: stage.answerLabel,
        isCorrect: given !== "" && given === stage.answer,
      };
    });
    const score = scorable.reduce(
      (sum, stage, i) => (results[i].isCorrect ? sum + stage.weight : sum),
      0,
    );
    return { score: Math.round(score), results };
  }, [stages, answers]);

  const resetDrafts = () => {
    setDraftEdge(null);
    setDraftA("");
    setDraftB("");
    setDraftChoice(null);
  };

  const begin = (chosen: Role) => {
    setRole(chosen);
    setGame(generateGame());
    setPhase("play");
    setStageIndex(0);
    setAnswers(new Map());
    setReviewIndex(0);
    resetDrafts();
  };

  const restart = () => {
    setRole(null);
    setGame(null);
    setPhase("role");
    setStageIndex(0);
    setAnswers(new Map());
    setReviewIndex(0);
    resetDrafts();
  };

  // ---------------------------------------------------------- side select --

  if (phase === "role" || !game || !role) {
    return (
      <div className="lab3 lab3-intro">
        <h3 className="lab3-intro-title">Choose a side</h3>
        <p className="lab3-intro-lede">
          The two sides play genuinely different games on the same tree. One
          moves twice and has to read the defender in both branches. The other
          moves once, in the middle, and has to read the attacker&rsquo;s opening
          cold. Both are scored out of 100.
        </p>
        <div className="lab3-intro-sides">
          <button
            type="button"
            className="lab3-pick is-attacker"
            onClick={() => begin("attacker")}
          >
            <span className="lab3-pick-name">Attacker</span>
            <span className="lab3-pick-moves">moves 1st and 3rd</span>
            <span className="lab3-pick-desc">
              You open, the defender answers, then you finish. You have to know
              what they will do in <em>both</em> branches before committing to
              either one.
            </span>
          </button>
          <button
            type="button"
            className="lab3-pick is-defender"
            onClick={() => begin("defender")}
          >
            <span className="lab3-pick-name">Defender</span>
            <span className="lab3-pick-moves">moves 2nd</span>
            <span className="lab3-pick-desc">
              One move, three options, made after the attacker has already
              committed. Predicting their opening is the hardest single question
              in the lab.
            </span>
          </button>
        </div>
        <p className="lab3-intro-note">
          Your opponent is perfectly rational and sees every move you make
          before they move. That assumption is what makes this solvable.
        </p>
      </div>
    );
  }

  const { tree, solution, values } = game;
  const opponent: Role = role === "attacker" ? "defender" : "attacker";
  const scorable = stages.filter((s) => s.weight > 0);

  // ---------------------------------------------------------------- review -

  if (phase === "review") {
    const item = scorable[reviewIndex];
    return (
      <div className="lab3 lab3-review">
        <div className="lab3-review-head">
          <h4>Check your answers</h4>
          <p>
            Nothing here is marked. Step back through what you committed, then
            submit when you are satisfied.
          </p>
        </div>
        <div className="lab3-card lab3-review-card">
          <span className="lab3-count">
            {reviewIndex + 1} of {scorable.length}
          </span>
          <p className="lab3-review-q">{item.prompt}</p>
          <p className="lab3-review-a">
            <span>you answered</span>
            <strong>{item.describe(answers.get(item.id) ?? "")}</strong>
          </p>
        </div>
        <div className="lab3-review-nav">
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
              setReviewIndex(Math.min(scorable.length - 1, reviewIndex + 1))
            }
            disabled={reviewIndex === scorable.length - 1}
          >
            <CIcon icon={cilArrowRight} />
          </CButton>
        </div>
        <div className="lab3-review-actions">
          <CButton color="secondary" variant="outline" onClick={restart}>
            <CIcon icon={cilReload} /> Start over, new values
          </CButton>
          <CButton
            style={{ backgroundColor: LAB3_ACCENT, borderColor: LAB3_ACCENT }}
            onClick={() => onSubmit(graded)}
          >
            Submit lab
          </CButton>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ play -

  const stage = stages[stageIndex];
  const isLast = stageIndex === stages.length - 1;

  // The match as actually played: the student's own committed moves plus the
  // opponent's revealed replies, drawn heavy on the tree.
  const played = new Set<string>();
  stages.slice(0, stageIndex + 1).forEach((s) => {
    if (s.kind === "edge" && s.id.startsWith("move-")) {
      const chosen = answers.get(s.id);
      if (chosen) played.add(chosen);
    }
    if (s.pathActionId) played.add(s.pathActionId);
  });

  const canCommit = (() => {
    switch (stage.kind) {
      case "reveal":
        return true;
      case "edge":
        return draftEdge !== null;
      case "choice":
        return draftChoice !== null;
      case "number":
        return draftA.trim() !== "";
      case "calc2":
        return draftA.trim() !== "" && draftB.trim() !== "";
    }
  })();

  const commit = () => {
    if (!canCommit) return;
    const value =
      stage.kind === "edge"
        ? (draftEdge ?? "")
        : stage.kind === "choice"
          ? (draftChoice ?? "")
          : stage.kind === "calc2"
            ? pair(draftA.trim(), draftB.trim())
            : stage.kind === "number"
              ? draftA.trim()
              : "";
    const next = new Map(answers);
    next.set(stage.id, value);
    setAnswers(next);
    resetDrafts();
    if (isLast) {
      setPhase("review");
      setReviewIndex(0);
    } else {
      setStageIndex(stageIndex + 1);
    }
  };

  const answeredSoFar = stages
    .slice(0, stageIndex)
    .filter((s) => s.weight > 0).length;

  const rail = (who: Player) => {
    const yours = who === role;
    return (
      <aside
        className={[
          "lab3-rail",
          `is-${who}`,
          yours ? "is-you" : "",
          stage.player === who ? "is-lit" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="lab3-rail-head">
          <span className="lab3-rail-name">
            {who === "attacker" ? "Attacker" : "Defender"}
          </span>
          {yours && <span className="lab3-rail-you">you</span>}
        </div>

        {who === "attacker" ? (
          <>
            <code>Ua = Sx &minus; SUM(Ex) &minus; P</code>
            <dl>
              <div>
                <dt>S1</dt>
                <dd>{values.servers.S1}</dd>
              </div>
              <div>
                <dt>S2</dt>
                <dd>{values.servers.S2}</dd>
              </div>
              <div>
                <dt>S3</dt>
                <dd>{values.servers.S3}</dd>
              </div>
              <div>
                <dt>S4</dt>
                <dd>{values.servers.S4}</dd>
              </div>
              <div>
                <dt>P</dt>
                <dd>{values.capturePenalty}</dd>
              </div>
            </dl>
            <p>
              Edge numbers are exploit costs. Every edge walked gets paid for.
            </p>
          </>
        ) : (
          <>
            <code>Ud = SUM(Sx) &minus; D &minus; Ch</code>
            <dl>
              <div>
                <dt>SUM(Sx)</dt>
                <dd>{totalServerValue(values)}</dd>
              </div>
              <div>
                <dt>Ch</dt>
                <dd>{values.honeypotCost}</dd>
              </div>
            </dl>
            <p>
              SUM(Sx) never moves. Only the damage D, and whether Ch was spent.
            </p>
          </>
        )}
      </aside>
    );
  };

  return (
    <div className="lab3 lab3-match">
      {rail("attacker")}

      <div className="lab3-match-center">
        <div className={`lab3-card lab3-ask is-${stage.player}`}>
          <div className="lab3-ask-meta">
            <span className="lab3-count">
              {Math.min(answeredSoFar + 1, scorable.length)} of{" "}
              {scorable.length}
            </span>
            <span className="lab3-ask-heading">{stage.heading}</span>
            <span className="lab3-ask-who">
              {stage.player === role ? "your side" : `the ${opponent}`}
            </span>
          </div>

          <p className="lab3-ask-prompt">{stage.prompt}</p>
          {stage.detail && <p className="lab3-ask-detail">{stage.detail}</p>}

          {stage.kind === "choice" && (
            <ul className="lab3-ask-options">
              {stage.options?.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className={draftChoice === option.id ? "is-picked" : ""}
                    onClick={() => setDraftChoice(option.id)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="lab3-ask-controls">
            {(stage.kind === "calc2" || stage.kind === "number") && (
              <label>
                {stage.fields?.[0].label}
                <input
                  type="number"
                  value={draftA}
                  onChange={(event) => setDraftA(event.target.value)}
                />
              </label>
            )}
            {stage.kind === "calc2" && (
              <label>
                {stage.fields?.[1].label}
                <input
                  type="number"
                  value={draftB}
                  onChange={(event) => setDraftB(event.target.value)}
                />
              </label>
            )}
            {stage.kind === "edge" && (
              <span className="lab3-ask-hint">
                {draftEdge
                  ? "Edge selected. Commit, or click a different one."
                  : "Click an edge on the tree."}
              </span>
            )}

            <CButton
              style={{ backgroundColor: LAB3_ACCENT, borderColor: LAB3_ACCENT }}
              disabled={!canCommit}
              onClick={commit}
            >
              {stage.kind === "reveal"
                ? "Continue"
                : isLast
                  ? "Finish"
                  : "Commit"}{" "}
              <CIcon icon={cilArrowRight} />
            </CButton>
          </div>
        </div>

        <div className="lab3-match-graph">
          <GameTreeSVG
            tree={tree}
            solution={solution}
            visiblePayoffIds={stage.visiblePayoffIds}
            playedActionIds={played}
            survivingActionIds={draftEdge ? new Set([draftEdge]) : undefined}
            activeNodeId={stage.nodeId}
            clickableNodeId={stage.kind === "edge" ? stage.nodeId : undefined}
            onActionClick={(action: Action) => setDraftEdge(action.id)}
          />
        </div>
      </div>

      {rail("defender")}
    </div>
  );
};
