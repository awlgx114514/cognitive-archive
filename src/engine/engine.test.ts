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

const firstSelectionAnswers: Record<FirstGodId, AnswerOptionId> = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
};

const secondSelectionAnswers: Record<SecondGodId, AnswerOptionId> = {
  5: "A",
  6: "B",
  7: "C",
  8: "D",
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
    firstSelectionAnswers[firstGodId],
    ...matchingBankAnswers[firstGodId],
    secondSelectionAnswers[secondGodId],
    ...matchingBankAnswers[secondGodId],
    finalOptionId,
  ]);
}

describe("revised four-corner question graph", () => {
  it("is valid and every complete route contains 15 questions", () => {
    const report = validateDemoContent();
    const analysis = analyzeConfiguredPaths();

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(analysis.incompletePaths).toHaveLength(0);
    expect(analysis.shortestPathLength).toBe(15);
    expect(analysis.longestPathLength).toBe(15);
    expect(testConfig.minimumPathLength).toBe(15);
    expect(testConfig.maximumPathLength).toBe(15);
  });

  it("starts both rounds with a direct four-god selection", () => {
    const firstSelection = getQuestionById("Q_R1_GOD_SELECT");
    expect(firstSelection?.shortQuestion).toBe(
      "第一轮：请选择最吸引你的神祇。",
    );
    expect(firstSelection?.options.A.title).toBe("现世主宰");
    expect(firstSelection?.options.A.nextQuestionId).toBe("Q_R1_G1_1");
    expect(firstSelection?.options.B.title).toBe("异界星君");
    expect(firstSelection?.options.B.nextQuestionId).toBe("Q_R1_G2_1");
    expect(firstSelection?.options.C?.title).toBe("太史文官");
    expect(firstSelection?.options.C?.nextQuestionId).toBe("Q_R1_G3_1");
    expect(firstSelection?.options.D?.title).toBe("太虚灵官");
    expect(firstSelection?.options.D?.nextQuestionId).toBe("Q_R1_G4_1");

    const secondSelection = getQuestionById("Q_R2_GOD_SELECT_F1");
    expect(secondSelection?.options.A.title).toBe("紫薇大帝");
    expect(secondSelection?.options.A.nextQuestionId).toBe("Q_R2_F1_G5_1");
    expect(secondSelection?.options.B.title).toBe("闻苦天尊");
    expect(secondSelection?.options.B.nextQuestionId).toBe("Q_R2_F1_G6_1");
    expect(secondSelection?.options.C?.title).toBe("空悟道人");
    expect(secondSelection?.options.C?.nextQuestionId).toBe("Q_R2_F1_G7_1");
    expect(secondSelection?.options.D?.title).toBe("逍遥散人");
    expect(secondSelection?.options.D?.nextQuestionId).toBe("Q_R2_F1_G8_1");

    [
      "Q_START",
      "Q_R1_STYLE_S",
      "Q_R1_STYLE_N",
      "Q_R2_DECISION_F1",
      "Q_R2_STYLE_T_F1",
      "Q_R2_STYLE_F_F1",
    ].forEach((questionId) => {
      expect(getQuestionById(questionId)).toBeUndefined();
    });
  });

  it("switches 1↔2 after questions 1–2 when either answer misses", () => {
    const firstMisses = answerPath(["A", "B", "A"]);
    expect(firstMisses.currentQuestionId).toBe("Q_R1_G2_3");

    const secondMisses = answerPath(["A", "A", "B"]);
    expect(secondMisses.currentQuestionId).toBe("Q_R1_G2_3");

    const bothMatch = answerPath(["A", "A", "A"]);
    expect(bothMatch.currentQuestionId).toBe("Q_R1_G1_3");
  });

  it("switches 1↔3 after questions 3–4 only when both answers miss", () => {
    const bothMiss = answerPath(["A", "A", "A", "B", "B"]);
    expect(bothMiss.currentQuestionId).toBe("Q_R1_G3_5");

    const onlyThirdMisses = answerPath(["A", "A", "A", "B", "A"]);
    expect(onlyThirdMisses.currentQuestionId).toBe("Q_R1_G1_5");

    const onlyFourthMisses = answerPath(["A", "A", "A", "A", "B"]);
    expect(onlyFourthMisses.currentQuestionId).toBe("Q_R1_G1_5");
  });

  it("never switches after questions 5–6", () => {
    const session = answerPath([
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
      "B",
    ]);
    expect(session.currentQuestionId).toBe("Q_R2_GOD_SELECT_F1");
  });

  it("applies the same early and middle switch rules in the second round", () => {
    const earlySwitch = answerPath([
      firstSelectionAnswers[1],
      ...matchingBankAnswers[1],
      secondSelectionAnswers[5],
      "A",
      "A",
    ]);
    expect(earlySwitch.currentQuestionId).toBe("Q_R2_F1_G6_3");

    const middleSwitch = answerPath([
      firstSelectionAnswers[1],
      ...matchingBankAnswers[1],
      secondSelectionAnswers[5],
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
      expect(session.history).toHaveLength(15);
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
    let session = answerPath(["A", "A", "A"]);
    session = goBackOneStep(session);

    const changed = answerQuestion(session, "B", { answeredAt: 9 }).session;
    expect(changed.history).toHaveLength(3);
    expect(changed.history[2]?.selectedOptionId).toBe("B");
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
