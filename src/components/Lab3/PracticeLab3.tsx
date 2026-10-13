import { useMemo, useState } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft, cilArrowRight, cilReload } from "@coreui/icons";
import "../../styles/ExampleLab3.css";
import "../../styles/PracticeLab3.css";
import type { LabResult, QuestionResult } from "../../types/labResult";
import { GameTreeSVG } from "./GameTreeSVG";
import { NetworkPeek } from "./NetworkPeek";
import { generateGame, totalServerValue } from "./gameTree";
import type { Action, GeneratedGame } from "./gameTree";
import { buildStages, pair, totalScorableStages } from "./practiceStages";
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
        question: `${stage.heading}: ${stage.prompt}`,
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

  // Fixed for the whole match, unlike stages.length, which grows as moves are
  // committed and made the counter jump mid-game.
  const scorableTotal = useMemo(
    () => (game && role ? totalScorableStages(game, role) : 0),
    [game, role],
  );

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
          The two sides play different games on the same tree. One moves twice
          and has to read the defender in both branches. The other moves once,
          and has to read the attacker&rsquo;s opening cold. Remember your
          opponent is a perfectly rational player and will always choose the
          best response, that is what makes this lab solveable
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
      </div>
    );
  }

  const { tree, solution, values } = game;
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
          <span className="lab3-review-tag">
            {item.heading} &middot; {item.weight} pts
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

  // The question bubble, plus whatever inputs it carries. Rendered inline in a
  // side column (or full width for the one wide stage), so the question is part
  // of the conversation rather than a separate card above it.
  const askRow = (stage.setup?.length ?? 0) + 2;
  const askBubble = (
    <div
      style={{ gridRow: askRow }}
      className={["lab3-bubble", "is-ask", `is-${stage.player}`].join(" ")}
    >
      <span className="lab3-bubble-who">
        {stage.player === "attacker" ? "Attacker" : "Defender"}
        {/* What the question is worth, in place of the old stage name. Reveal
            stages carry no marks, so they show nothing. */}
        {stage.weight > 0 && (
          <i className="lab3-bubble-points">{stage.weight} pts</i>
        )}
      </span>

      <p className="lab3-bubble-ask">{stage.prompt}</p>
      {stage.detail && <p className="lab3-bubble-detail">{stage.detail}</p>}

      <div className="lab3-bubble-controls">
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
          <span className="lab3-bubble-hint">
            {draftEdge ? "Edge picked." : "Click an edge on the tree."}
          </span>
        )}

        <CButton
          size="sm"
          style={{ backgroundColor: LAB3_ACCENT, borderColor: LAB3_ACCENT }}
          disabled={!canCommit}
          onClick={commit}
        >
          {stage.kind === "reveal" ? "Continue" : isLast ? "Finish" : "Commit"}
        </CButton>
      </div>
    </div>
  );

  // Narration, in each player's own voice on their own side.
  //
  // The explicit gridRow is not cosmetic. Grid auto-placement with a fixed
  // column uses a cursor that never moves backwards, so an item in column 1
  // followed by one in column 3 lands in the SAME row, side by side, and the
  // conversation loses its order. Numbering the rows by hand keeps one bubble
  // per row and the reading order top to bottom across both sides.
  const setupBubbles = (stage.setup ?? []).map((bubble, i) => (
    <div
      key={`${stage.id}-setup-${i}`}
      style={{ gridRow: i + 2 }}
      className={[
        "lab3-bubble",
        `is-${bubble.player}`,
        bubble.hypothetical ? "is-hypothetical" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="lab3-bubble-who">
        {bubble.player === "attacker" ? "Attacker" : "Defender"}
      </span>
      {bubble.text}
    </div>
  ));

  // The last question is a finale rather than another turn, so it covers the
  // board entirely. By this point the student should not need the graph, and
  // giving it the whole screen stops a sentence-length multiple choice from
  // having to fit anywhere in the three-column layout.
  const finale = (
    <div className="lab3-finale" role="dialog" aria-modal="true">
      <div className="lab3-finale-panel">
        <span className="lab3-finale-tag">{stage.weight} pts</span>
        <p className="lab3-finale-q">{stage.prompt}</p>
        <ul className="lab3-finale-options">
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
        <div className="lab3-finale-actions">
          <CButton
            style={{ backgroundColor: LAB3_ACCENT, borderColor: LAB3_ACCENT }}
            disabled={!canCommit}
            onClick={commit}
          >
            Finish
          </CButton>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lab3 lab3-match">
      {/* One grid, three columns. The graph lives in the middle and spans every
          bubble row, which is what keeps the left and right bubbles in a single
          shared vertical order. Separate scrolling columns would lose that. */}
      <div className="lab3-board">
        {/* Column heads. These give the two sides an identity even on a turn
            where only one of them speaks, which is what the bubbles alone
            could not do. */}
        <div className="lab3-col-head is-attacker">
          <span className="lab3-col-name">Attacker</span>
          {role === "attacker" && <span className="lab3-col-you">you</span>}
          {stage.player === "attacker" && (
            <span className="lab3-col-turn" aria-hidden="true" />
          )}
          <span className="lab3-count">
            {Math.min(answeredSoFar + 1, scorableTotal)} of {scorableTotal}
          </span>
        </div>
        <div className="lab3-col-head is-defender">
          {stage.player === "defender" && (
            <span className="lab3-col-turn" aria-hidden="true" />
          )}
          {role === "defender" && <span className="lab3-col-you">you</span>}
          <span className="lab3-col-name">Defender</span>
        </div>

        {setupBubbles}
        {!stage.wide && askBubble}

        <div className="lab3-board-graph">
          {/* Same network reference as the Example tab, top left of the center
              column where the action graph lives. */}
          <NetworkPeek values={values} />
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

      {/* The two formulas sit on their owners' sides, but every variable is
          shared by both players, so the values live in the middle belonging to
          neither. */}
      <div className="lab3-ledger">
        <code className="lab3-ledger-formula is-attacker">
          Ua = Sx &minus; SUM(Ex) &minus; P
        </code>
        <dl className="lab3-ledger-values">
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
            <dt>SUM(Sx)</dt>
            <dd>{totalServerValue(values)}</dd>
          </div>
          <div>
            <dt>Ch</dt>
            <dd>{values.honeypotCost}</dd>
          </div>
          <div>
            <dt>P</dt>
            <dd>{values.capturePenalty}</dd>
          </div>
        </dl>
        <code className="lab3-ledger-formula is-defender">
          Ud = SUM(Sx) &minus; D &minus; Ch
        </code>
      </div>

      {stage.wide && finale}
    </div>
  );
};
