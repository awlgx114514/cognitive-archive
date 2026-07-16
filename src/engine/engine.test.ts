import { describe, expect, it } from "vitest";
import { getQuestionById, questions } from "../data/questions";
import { testConfig } from "../data/testConfig";
import type { AnswerOptionId, TestSession } from "../types/test";
import {
  answerQuestion,
  countUncertainSelections,
  createTestSession,
  finishTransition,
  getAnswerAvailability,
  goBackOneStep,
  startTestSession,
} from "./testEngine";
import { analyzeConfiguredPaths } from "./pathAnalysis";
import { calculateResult } from "./resultResolver";
import { validateDemoContent } from "./validation";

function answerPath(answerIds: readonly AnswerOptionId[]): TestSession {
  let session = startTestSession(createTestSession(1), 1);
  answerIds.forEach((answerId, index) => {
    const transition = answerQuestion(session, answerId, {
      answeredAt: index + 2,
    });
    session = transition.terminal
      ? transition.session
      : finishTransition(transition.session);
  });
  return session;
}

describe("supplied question graph", () => {
  it("is valid and covers the configured 3–6 question range", () => {
    const report = validateDemoContent();
    const analysis = analyzeConfiguredPaths();

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(analysis.shortestPathLength).toBe(testConfig.minimumPathLength);
    expect(analysis.longestPathLength).toBe(testConfig.maximumPathLength);
    expect(analysis.completePaths.some((path) => path.length === 3)).toBe(true);
    expect(analysis.completePaths.some((path) => path.length === 6)).toBe(true);
  });

  it("routes the first two answers to exactly aa/ab/ba/bb/ca/cb", () => {
    expect(getQuestionById("Q_START")?.options.A.nextQuestionId).toBe("Q_STONE_A");
    expect(getQuestionById("Q_START")?.options.B.nextQuestionId).toBe("Q_STONE_B");
    expect(getQuestionById("Q_START")?.options.C?.nextQuestionId).toBe("Q_STONE_C");

    expect(getQuestionById("Q_STONE_A")?.options.A.nextQuestionId).toBe("Q_AA_3");
    expect(getQuestionById("Q_STONE_A")?.options.B.nextQuestionId).toBe("Q_AB_3");
    expect(getQuestionById("Q_STONE_B")?.options.A.nextQuestionId).toBe("Q_BA_3");
    expect(getQuestionById("Q_STONE_B")?.options.B.nextQuestionId).toBe("Q_BB_3");
    expect(getQuestionById("Q_STONE_C")?.options.A.nextQuestionId).toBe("Q_CA_CAL");
    expect(getQuestionById("Q_STONE_C")?.options.B.nextQuestionId).toBe("Q_CB_CAL");
  });

  it.each([
    ["ESFP", ["A", "A", "A", "A", "A", "A"]],
    ["ISFP", ["A", "A", "A", "B", "B", "B"]],
    ["ENTJ", ["A", "A", "B", "A", "A", "A"]],
    ["INTJ", ["A", "A", "B", "B", "B", "B"]],
    ["ESTP", ["A", "B", "A", "A", "A", "A"]],
    ["ISTP", ["A", "B", "A", "B", "B", "B"]],
    ["ENFJ", ["A", "B", "B", "A", "A", "A"]],
    ["INFJ", ["A", "B", "B", "B", "B", "B"]],
    ["ESTJ", ["B", "A", "A", "A", "A", "A"]],
    ["ISTJ", ["B", "A", "A", "B", "B", "B"]],
    ["INFP", ["B", "A", "B", "A"]],
    ["ESFJ", ["B", "B", "A", "A", "A", "A"]],
    ["ISFJ", ["B", "B", "A", "B", "B", "B"]],
    ["INTP", ["B", "B", "B", "A"]],
    ["ENFP", ["C", "A", "A"]],
    ["ENTP", ["C", "B", "A"]],
  ] as const)("can complete a confirmed %s path", (expectedType, answerIds) => {
    const session = answerPath(answerIds);
    const result = calculateResult(session.history, questions);

    expect(session.status).toBe("completed");
    expect(result.resultTypeId).toBe(expectedType);
    expect(result.needsRetest).toBe(false);
    expect(result).not.toHaveProperty("functionScores");
    expect(result).not.toHaveProperty("typeScores");
    expect(result).not.toHaveProperty("confidence");
    expect(result).not.toHaveProperty("secondaryTypeId");
  });
});

describe("session and calibration invariants", () => {
  it("supports C on the first screening item and keeps U unavailable", () => {
    const startQuestion = getQuestionById(testConfig.startQuestionId)!;
    expect(getAnswerAvailability(startQuestion, "C", []).allowed).toBe(true);
    expect(getAnswerAvailability(startQuestion, "U", []).allowed).toBe(false);
    expect(questions.some((question) => question.options.U)).toBe(false);
  });

  it("truncates a stale suffix after an upstream edit", () => {
    let session = answerPath(["A", "A", "A", "A"]);

    session = goBackOneStep(session);
    const changed = answerQuestion(session, "B", { answeredAt: 9 }).session;

    expect(changed.history).toHaveLength(4);
    expect(changed.history[3]?.selectedOptionId).toBe("B");
    expect(changed.history[3]).not.toHaveProperty("scoreEffects");
  });

  it("marks a unique-vote/calibration conflict for retest", () => {
    const session = answerPath(["A", "A", "A", "A", "A", "B"]);
    const result = calculateResult(session.history, questions);

    expect(result.resultTypeId).toBe("ISFP");
    expect(result.calibrationMatched).toBe(false);
    expect(result.needsRetest).toBe(true);
    expect(result.retestReason).toContain("不一致");
  });

  it("lets calibration resolve a split vote without a false conflict", () => {
    const session = answerPath(["A", "A", "A", "A", "B", "B"]);
    const result = calculateResult(session.history, questions);

    expect(result.resultTypeId).toBe("ISFP");
    expect(result.needsRetest).toBe(false);
  });

  it("marks an explicit single-type calibration rejection for retest", () => {
    const session = answerPath(["C", "A", "B"]);
    const result = calculateResult(session.history, questions);

    expect(result.resultTypeId).toBe("ENFP");
    expect(result.needsRetest).toBe(true);
    expect(result.retestReason).toContain("未通过");
  });

  it("does not fall back to a score when terminal calibration data is missing", () => {
    const session = answerPath(["C", "A", "A"]);
    const brokenQuestions = questions.map((question) =>
      question.id === "Q_CA_CAL"
        ? {
            ...question,
            options: {
              ...question.options,
              A: { ...question.options.A, calibrationTypeId: undefined },
            },
          }
        : question,
    );

    expect(() => calculateResult(session.history, brokenQuestions)).toThrow(
      "configured calibration result",
    );
  });

  it("still derives uncertain usage from persisted history defensively", () => {
    const entries = Array.from({ length: 3 }, (_, index) => ({
      questionId: `Q_${index}`,
      selectedOptionId: "U" as const,
      transitionSceneId: `scene-${index}`,
      answeredAt: index,
    }));
    expect(countUncertainSelections(entries)).toBe(3);
  });
});
