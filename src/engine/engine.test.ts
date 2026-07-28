import { describe, expect, it } from "vitest";
import { getQuestionById, questions } from "../data/questions";
import { testConfig } from "../data/testConfig";
import type { AnswerOptionId, TestSession } from "../types/test";
import {
  calculateRoundScores,
  finalGroupForDeities,
  resolveRoundWinner,
  scoreTargetForAnswer,
} from "./deityScoring";
import {
  answerQuestion,
  countUncertainSelections,
  createTestSession,
  finishTransition,
  getAnswerAvailability,
  goBackOneStep,
  restoreTestSession,
  startTestSession,
} from "./testEngine";
import { analyzeConfiguredPaths } from "./pathAnalysis";
import { calculateResult } from "./resultResolver";
import { validateDemoContent } from "./validation";

type FirstDeityId = 1 | 2 | 3 | 4;
type SecondDeityId = 5 | 6 | 7 | 8;

const firstSelectionAnswers: Record<FirstDeityId, AnswerOptionId> = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
};

const secondSelectionAnswers: Record<SecondDeityId, AnswerOptionId> = {
  5: "A",
  6: "B",
  7: "C",
  8: "D",
};

const firstWinnerAnswers: Record<
  FirstDeityId,
  readonly AnswerOptionId[]
> = {
  1: ["A", "A", "A", "A", "A", "A", "A", "A"],
  2: ["B", "A", "B", "A", "B", "A", "B", "A"],
  3: ["A", "A", "A", "A", "B", "A", "B", "A"],
  4: ["A", "B", "A", "B", "A", "B", "A", "B"],
};

const secondWinnerAnswers: Record<
  SecondDeityId,
  readonly AnswerOptionId[]
> = {
  5: ["A", "A", "A", "A", "A", "A", "A", "A"],
  6: ["B", "A", "B", "A", "B", "A", "B", "A"],
  7: ["A", "A", "A", "A", "B", "A", "B", "A"],
  8: ["A", "B", "A", "B", "A", "B", "A", "B"],
};

const firstScoreTargets = [
  [1, 2],
  [3, 4],
  [1, 2],
  [3, 4],
  [1, 3],
  [2, 4],
  [1, 3],
  [2, 4],
] as const;

const secondScoreTargets = [
  [5, 6],
  [7, 8],
  [5, 6],
  [7, 8],
  [5, 7],
  [6, 8],
  [5, 7],
  [6, 8],
] as const;

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
  firstDeityId: FirstDeityId,
  secondDeityId: SecondDeityId,
  finalOptionId: "A" | "B" | "C" | "D",
): TestSession {
  return answerPath([
    firstSelectionAnswers[firstDeityId],
    ...firstWinnerAnswers[firstDeityId],
    secondSelectionAnswers[secondDeityId],
    ...secondWinnerAnswers[secondDeityId],
    finalOptionId,
  ]);
}

describe("final three-step scoring question bank", () => {
  it("is structurally valid and every complete route contains 19 answers", () => {
    const report = validateDemoContent();
    const analysis = analyzeConfiguredPaths();

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(analysis.incompletePaths).toHaveLength(0);
    expect(analysis.shortestPathLength).toBe(19);
    expect(analysis.longestPathLength).toBe(19);
    expect(testConfig.minimumPathLength).toBe(19);
    expect(testConfig.maximumPathLength).toBe(19);
    expect(testConfig.storageVersion).toBe("8.0.0");
  });

  it("starts each round with the requested four deity cards", () => {
    const firstSelection = getQuestionById("Q_R1_GOD_SELECT");
    expect(firstSelection?.shortQuestion).toBe("请选择你的神祇");
    expect(firstSelection?.options.A.title).toBe("现世主宰");
    expect(firstSelection?.options.A.text).toBe("主宰即时体验与享乐之神");
    expect(firstSelection?.options.A.nextQuestionId).toBe("Q_R1_SCORE_1");
    expect(firstSelection?.options.D?.title).toBe("太虚灵官");
    expect(firstSelection?.options.D?.nextQuestionId).toBe("Q_R1_SCORE_1");

    const secondSelection = getQuestionById("Q_R2_GOD_SELECT_F3");
    expect(secondSelection?.options.A.title).toBe("紫薇大帝");
    expect(secondSelection?.options.A.nextQuestionId).toBe(
      "Q_R2_F3_SCORE_1",
    );
    expect(secondSelection?.options.D?.title).toBe("逍遥散人");
    expect(secondSelection?.options.D?.nextQuestionId).toBe(
      "Q_R2_F3_SCORE_1",
    );
  });

  it("contains the exact fifth-edition questions without changing score order", () => {
    expect(getQuestionById("Q_R1_SCORE_1")?.options.A.title).toBe("身体舒适");
    expect(getQuestionById("Q_R1_SCORE_2")?.options.A.title).toBe(
      "重温发生过的经验和细节",
    );
    expect(getQuestionById("Q_R1_SCORE_8")?.options.B.title).toBe(
      "结构完整的确定的结局",
    );
    expect(getQuestionById("Q_R2_F1_SCORE_1")?.options.A.title).toBe(
      "解决问题",
    );
    expect(getQuestionById("Q_R2_F4_SCORE_8")?.options.B.title).toBe(
      "感觉更好",
    );
    expect(getQuestionById("Q_R1_SCORE_1")?.options.A.text).toBe("");
    expect(getQuestionById("Q_FINAL_GROUP_1")?.shortQuestion).toBe(
      "最令你恐惧的是：",
    );
    expect(getQuestionById("Q_FINAL_GROUP_1")?.options.C?.title).toBe(
      "嘈杂噪音的环境/“恐高”（悬崖距离三四米）",
    );
    expect(getQuestionById("Q_FINAL_GROUP_2")?.options.B.title).toBe(
      "被指责或质疑“逻辑不通”",
    );
    expect(getQuestionById("Q_FINAL_GROUP_3")?.shortQuestion).toBe(
      "令你最恐惧的是：",
    );
    expect(getQuestionById("Q_FINAL_GROUP_4")?.options.D?.title).toBe(
      "高强度令人窒息的社交",
    );
  });

  it("uses the exact first-round score mapping", () => {
    firstScoreTargets.forEach(([aTarget, bTarget], index) => {
      expect(scoreTargetForAnswer(1, index + 1, "A")).toBe(aTarget);
      expect(scoreTargetForAnswer(1, index + 1, "B")).toBe(bTarget);
    });
  });

  it("uses the exact second-round score mapping", () => {
    secondScoreTargets.forEach(([aTarget, bTarget], index) => {
      expect(scoreTargetForAnswer(2, index + 1, "A")).toBe(aTarget);
      expect(scoreTargetForAnswer(2, index + 1, "B")).toBe(bTarget);
    });
  });

  it("counts the initial deity selection as one point", () => {
    const session = answerPath(["D"]);
    const scores = calculateRoundScores(session.history, 1);

    expect(scores[1]).toBe(0);
    expect(scores[2]).toBe(0);
    expect(scores[3]).toBe(0);
    expect(scores[4]).toBe(1);
  });

  it.each([1, 2, 3, 4] as const)(
    "routes first-round winner %s to its matching second selection",
    (deityId) => {
      const session = answerPath([
        firstSelectionAnswers[deityId],
        ...firstWinnerAnswers[deityId],
      ]);

      expect(resolveRoundWinner(session.history, 1).winnerId).toBe(deityId);
      expect(session.currentQuestionId).toBe(`Q_R2_GOD_SELECT_F${deityId}`);
    },
  );

  it("keeps the source selection as the tie-break when it shares first place", () => {
    const session = answerPath([
      "A",
      "A",
      "B",
      "B",
      "B",
      "A",
      "A",
      "B",
      "A",
    ]);
    const resolution = resolveRoundWinner(session.history, 1);

    expect(resolution.scores[1]).toBe(3);
    expect(resolution.scores[2]).toBe(3);
    expect(resolution.tiedWinnerIds).toEqual([1, 2]);
    expect(resolution.winnerId).toBe(1);
    expect(resolution.tieBreakUsed).toBe(true);
  });

  it.each([
    [1, 5, 1],
    [1, 6, 2],
    [1, 7, 2],
    [1, 8, 1],
    [2, 5, 3],
    [2, 6, 4],
    [2, 7, 4],
    [2, 8, 3],
    [3, 5, 3],
    [3, 6, 4],
    [3, 7, 4],
    [3, 8, 3],
    [4, 5, 1],
    [4, 6, 2],
    [4, 7, 2],
    [4, 8, 1],
  ] as const)(
    "maps deity pair %s%s to final group %s",
    (firstDeityId, secondDeityId, expectedGroup) => {
      expect(finalGroupForDeities(firstDeityId, secondDeityId)).toBe(
        expectedGroup,
      );

      const session = answerPath([
        firstSelectionAnswers[firstDeityId],
        ...firstWinnerAnswers[firstDeityId],
        secondSelectionAnswers[secondDeityId],
        ...secondWinnerAnswers[secondDeityId],
      ]);
      expect(session.currentQuestionId).toBe(
        `Q_FINAL_GROUP_${expectedGroup}`,
      );
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
    "can complete the %s result",
    (expectedType, firstDeityId, secondDeityId, finalOptionId) => {
      const session = completedPath(
        firstDeityId,
        secondDeityId,
        finalOptionId,
      );
      const result = calculateResult(session.history, questions);

      expect(session.status).toBe("completed");
      expect(session.history).toHaveLength(19);
      expect(result.resultTypeId).toBe(expectedType);
      expect(result.needsRetest).toBe(false);
    },
  );
});

describe("session invariants", () => {
  it("keeps uncertain unavailable throughout the new bank", () => {
    const finalQuestion = getQuestionById("Q_FINAL_GROUP_1")!;
    expect(getAnswerAvailability(finalQuestion, "D", []).allowed).toBe(true);
    expect(getAnswerAvailability(finalQuestion, "U", []).allowed).toBe(false);
    expect(questions.some((question) => question.options.U)).toBe(false);
    expect(testConfig.maxUncertainSelections).toBe(0);
  });

  it("truncates stale score history after an upstream edit", () => {
    let session = answerPath(["A", "A", "A"]);
    session = goBackOneStep(session);

    const changed = answerQuestion(session, "B", { answeredAt: 9 }).session;
    expect(changed.history).toHaveLength(3);
    expect(changed.history[2]?.selectedOptionId).toBe("B");
    expect(changed.currentQuestionId).toBe("Q_R1_SCORE_3");
  });

  it("restores a completed dynamically routed session", () => {
    const completed = completedPath(4, 8, "C");
    const restored = restoreTestSession(
      JSON.parse(JSON.stringify(completed)),
      questions,
      testConfig,
    );

    expect(restored).toEqual(completed);
  });

  it("still derives uncertain usage defensively from persisted history", () => {
    const entries = Array.from({ length: 3 }, (_, index) => ({
      questionId: `Q_${index}`,
      selectedOptionId: "U" as const,
      transitionSceneId: `scene-${index}`,
      answeredAt: index,
    }));
    expect(countUncertainSelections(entries)).toBe(3);
  });
});
