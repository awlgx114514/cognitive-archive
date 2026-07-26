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

type FirstGodId = 1 | 2 | 3 | 4;
type SecondGodId = 5 | 6 | 7 | 8;

const firstScreeningAnswers: Record<FirstGodId, readonly AnswerOptionId[]> = {
  1: ["A", "B"],
  2: ["B", "B"],
  3: ["A", "A"],
  4: ["B", "A"],
};

const secondScreeningAnswers: Record<SecondGodId, readonly AnswerOptionId[]> = {
  5: ["A", "A"],
  6: ["B", "A"],
  7: ["A", "B"],
  8: ["B", "B"],
};

const matchingBankAnswers: Record<
  FirstGodId | SecondGodId,
  readonly AnswerOptionId[]
> = {
  1: ["A", "A", "A", "A", "B", "A"],
  2: ["B", "B", "A", "B", "A", "A"],
  3: ["A", "B", "B", "B", "B", "B"],
  4: ["A", "A", "B", "A", "A", "B"],
  5: ["B", "A", "B", "A", "B", "B"],
  6: ["A", "B", "A", "A", "A", "A"],
  7: ["A", "A", "A", "B", "B", "B"],
  8: ["B", "B", "B", "B", "B", "A"],
};

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

function completedPath(
  firstGodId: FirstGodId,
  secondGodId: SecondGodId,
  finalOptionId: "A" | "B" | "C" | "D",
): TestSession {
  return answerPath([
    ...firstScreeningAnswers[firstGodId],
    ...matchingBankAnswers[firstGodId],
    ...secondScreeningAnswers[secondGodId],
    ...matchingBankAnswers[secondGodId],
    finalOptionId,
  ]);
}

describe("revised four-corner question graph", () => {
  it("is valid and every complete route contains 17 questions", () => {
    const report = validateDemoContent();
    const analysis = analyzeConfiguredPaths();

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(analysis.incompletePaths).toHaveLength(0);
    expect(analysis.shortestPathLength).toBe(17);
    expect(analysis.longestPathLength).toBe(17);
    expect(testConfig.minimumPathLength).toBe(17);
    expect(testConfig.maximumPathLength).toBe(17);
  });

  it("uses the supplied first-round screening questions", () => {
    expect(getQuestionById("Q_START")?.shortQuestion).toBe(
      "你更关注事物的实际细节，还是抽象概念？",
    );
    expect(getQuestionById("Q_START")?.options.A.nextQuestionId).toBe(
      "Q_R1_STYLE_S",
    );
    expect(getQuestionById("Q_R1_STYLE_S")?.options.A.nextQuestionId).toBe(
      "Q_R1_G3_1",
    );
    expect(getQuestionById("Q_R1_STYLE_S")?.options.B.nextQuestionId).toBe(
      "Q_R1_G1_1",
    );
    expect(getQuestionById("Q_R1_STYLE_N")?.options.A.nextQuestionId).toBe(
      "Q_R1_G4_1",
    );
    expect(getQuestionById("Q_R1_STYLE_N")?.options.B.nextQuestionId).toBe(
      "Q_R1_G2_1",
    );
  });

  it("switches 1↔2 after questions 1–2 when either answer misses", () => {
    const firstMisses = answerPath(["A", "B", "B", "A"]);
    expect(firstMisses.currentQuestionId).toBe("Q_R1_G2_3");

    const secondMisses = answerPath(["A", "B", "A", "B"]);
    expect(secondMisses.currentQuestionId).toBe("Q_R1_G2_3");

    const bothMatch = answerPath(["A", "B", "A", "A"]);
    expect(bothMatch.currentQuestionId).toBe("Q_R1_G1_3");
  });

  it("switches 1↔3 after questions 3–4 only when both answers miss", () => {
    const bothMiss = answerPath(["A", "B", "A", "A", "B", "B"]);
    expect(bothMiss.currentQuestionId).toBe("Q_R1_G3_5");

    const onlyThirdMisses = answerPath(["A", "B", "A", "A", "B", "A"]);
    expect(onlyThirdMisses.currentQuestionId).toBe("Q_R1_G1_5");

    const onlyFourthMisses = answerPath(["A", "B", "A", "A", "A", "B"]);
    expect(onlyFourthMisses.currentQuestionId).toBe("Q_R1_G1_5");
  });

  it("never switches after questions 5–6", () => {
    const session = answerPath([
      "A",
      "B",
      "A",
      "A",
      "A",
      "A",
      "A",
      "B",
    ]);
    expect(session.currentQuestionId).toBe("Q_R2_DECISION_F1");
  });

  it("applies the same early and middle switch rules in the second round", () => {
    const earlySwitch = answerPath([
      ...firstScreeningAnswers[1],
      ...matchingBankAnswers[1],
      ...secondScreeningAnswers[5],
      "A",
      "A",
    ]);
    expect(earlySwitch.currentQuestionId).toBe("Q_R2_F1_G6_3");

    const middleSwitch = answerPath([
      ...firstScreeningAnswers[1],
      ...matchingBankAnswers[1],
      ...secondScreeningAnswers[5],
      "B",
      "A",
      "A",
      "B",
    ]);
    expect(middleSwitch.currentQuestionId).toBe("Q_R2_F1_G7_5");
  });

  it.each([
    ["Q_R1_G1_2_C", "B", "Q_R1_G2_3"],
    ["Q_R1_G2_2_C", "A", "Q_R1_G1_3"],
    ["Q_R1_G3_2_C", "A", "Q_R1_G4_3"],
    ["Q_R1_G4_2_C", "B", "Q_R1_G3_3"],
    ["Q_R2_F1_G5_2_C", "B", "Q_R2_F1_G6_3"],
    ["Q_R2_F1_G6_2_C", "A", "Q_R2_F1_G5_3"],
    ["Q_R2_F1_G7_2_C", "B", "Q_R2_F1_G8_3"],
    ["Q_R2_F1_G8_2_C", "A", "Q_R2_F1_G7_3"],
  ] as const)(
    "uses the required early pair at %s",
    (questionId, wrongOptionId, expectedNextId) => {
      expect(
        getQuestionById(questionId)?.options[wrongOptionId].nextQuestionId,
      ).toBe(expectedNextId);
    },
  );

  it.each([
    ["Q_R1_G1_4_W", "B", "Q_R1_G3_5"],
    ["Q_R1_G2_4_W", "A", "Q_R1_G4_5"],
    ["Q_R1_G3_4_W", "A", "Q_R1_G1_5"],
    ["Q_R1_G4_4_W", "B", "Q_R1_G2_5"],
    ["Q_R2_F1_G5_4_W", "B", "Q_R2_F1_G7_5"],
    ["Q_R2_F1_G6_4_W", "B", "Q_R2_F1_G8_5"],
    ["Q_R2_F1_G7_4_W", "A", "Q_R2_F1_G5_5"],
    ["Q_R2_F1_G8_4_W", "A", "Q_R2_F1_G6_5"],
  ] as const)(
    "uses the required middle pair at %s",
    (questionId, wrongOptionId, expectedNextId) => {
      expect(
        getQuestionById(questionId)?.options[wrongOptionId].nextQuestionId,
      ).toBe(expectedNextId);
    },
  );

  it.each([
    [1, 5, "ESFP"],
    [1, 6, "ESTP"],
    [1, 7, "ESTP"],
    [1, 8, "ESFP"],
    [2, 5, "ENFP"],
    [2, 6, "ENTP"],
    [2, 7, "ENTP"],
    [2, 8, "ENFP"],
    [3, 5, "ENFP"],
    [3, 6, "ENTP"],
    [3, 7, "ENTP"],
    [3, 8, "ENFP"],
    [4, 5, "ESFP"],
    [4, 6, "ESTP"],
    [4, 7, "ESTP"],
    [4, 8, "ESFP"],
  ] as const)(
    "maps deity pair %s%s to the correct final group",
    (firstGodId, secondGodId, expectedTypeForOptionA) => {
      const session = completedPath(firstGodId, secondGodId, "A");
      const result = calculateResult(session.history, questions);
      expect(result.resultTypeId).toBe(expectedTypeForOptionA);
    },
  );

  it.each([
    ["ESFP", 1, 5, "A"],
    ["ENTJ", 1, 5, "B"],
    ["INTJ", 1, 5, "C"],
    ["ISFP", 1, 5, "D"],
    ["ESTP", 1, 6, "A"],
    ["ENFJ", 1, 6, "B"],
    ["INFJ", 1, 6, "C"],
    ["ISTP", 1, 6, "D"],
    ["ENFP", 2, 5, "A"],
    ["ESTJ", 2, 5, "B"],
    ["ISTJ", 2, 5, "C"],
    ["INFP", 2, 5, "D"],
    ["ENTP", 2, 6, "A"],
    ["ESFJ", 2, 6, "B"],
    ["ISFJ", 2, 6, "C"],
    ["INTP", 2, 6, "D"],
  ] as const)(
    "can complete a %s route",
    (expectedType, firstGodId, secondGodId, finalOptionId) => {
      const session = completedPath(
        firstGodId,
        secondGodId,
        finalOptionId,
      );
      const result = calculateResult(session.history, questions);

      expect(session.status).toBe("completed");
      expect(session.history).toHaveLength(17);
      expect(result.resultTypeId).toBe(expectedType);
      expect(result.needsRetest).toBe(false);
    },
  );
});

describe("session invariants", () => {
  it("allows four final choices while keeping uncertain unavailable", () => {
    const finalQuestion = getQuestionById("Q_FINAL_GROUP_1")!;
    expect(getAnswerAvailability(finalQuestion, "D", []).allowed).toBe(true);
    expect(getAnswerAvailability(finalQuestion, "U", []).allowed).toBe(false);
    expect(questions.some((question) => question.options.U)).toBe(false);
  });

  it("truncates a stale suffix after an upstream edit", () => {
    let session = answerPath(["A", "B", "A", "A"]);
    session = goBackOneStep(session);

    const changed = answerQuestion(session, "B", { answeredAt: 9 }).session;
    expect(changed.history).toHaveLength(4);
    expect(changed.history[3]?.selectedOptionId).toBe("B");
    expect(changed.currentQuestionId).toBe("Q_R1_G2_3");
  });

  it("does not generate a result when terminal calibration data is missing", () => {
    const session = completedPath(1, 5, "A");
    const brokenQuestions = questions.map((question) =>
      question.id === "Q_FINAL_GROUP_1"
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
