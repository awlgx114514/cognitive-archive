import { describe, expect, it } from "vitest";
import { deityProfiles } from "../data/deities";
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
  finalDesireOptionId: "A" | "B",
  finalFearOptionId: "A" | "B" | "C" | "D",
): TestSession {
  return answerPath([
    firstSelectionAnswers[firstDeityId],
    ...firstWinnerAnswers[firstDeityId],
    secondSelectionAnswers[secondDeityId],
    ...secondWinnerAnswers[secondDeityId],
    finalDesireOptionId,
    finalFearOptionId,
  ]);
}

describe("sixth-edition scored question bank", () => {
  it("is structurally valid and complete routes contain 20 to 22 answers", () => {
    const report = validateDemoContent();
    const analysis = analyzeConfiguredPaths();

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(analysis.incompletePaths).toHaveLength(0);
    expect(analysis.shortestPathLength).toBe(20);
    expect(analysis.longestPathLength).toBe(22);
    expect(testConfig.minimumPathLength).toBe(20);
    expect(testConfig.maximumPathLength).toBe(22);
    expect(testConfig.storageVersion).toBe("9.0.0");
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
    expect(secondSelection?.options.B.title).toBe("救世天尊");
    expect(secondSelection?.options.B.text).toBe(
      "执掌伦理和谐与联结他人之神",
    );
    expect(secondSelection?.options.D?.title).toBe("逍遥散人");
    expect(secondSelection?.options.D?.nextQuestionId).toBe(
      "Q_R2_F3_SCORE_1",
    );
  });

  it("contains the exact sixth-edition content without changing score order", () => {
    expect(getQuestionById("Q_R1_SCORE_1")?.options.A.title).toBe("身体舒适");
    expect(getQuestionById("Q_R1_SCORE_2")?.options.A.title).toBe(
      "重温发生过的经验和细节",
    );
    expect(getQuestionById("Q_R1_SCORE_8")?.options.B.title).toBe(
      "结构完整的确定的结局",
    );
    expect(getQuestionById("Q_R2_F1_SCORE_1")?.shortQuestion).toBe(
      "哪项工作对你来说更轻松好玩？",
    );
    expect(getQuestionById("Q_R2_F1_SCORE_1")?.options.A.title).toBe(
      "管理与资源协调",
    );
    expect(getQuestionById("Q_R2_F1_SCORE_3")?.options.B.title).toBe(
      "解决人心和凝聚力，重振士气",
    );
    expect(getQuestionById("Q_R2_F4_SCORE_5")?.options.B.title).toBe(
      "从底层原理推演给他们听",
    );
    expect(getQuestionById("Q_R2_F2_SCORE_6")?.options.A.title).toBe(
      "很累像被对方情绪污染",
    );
    expect(getQuestionById("Q_R2_F2_SCORE_6")?.options.B.title).toBe(
      "无感像看剧一样完全抽离",
    );
    expect(getQuestionById("Q_R2_F4_SCORE_8")?.options.B.title).toBe(
      "倾听自我内心，所以更偏向个人的内心自律",
    );
    expect(getQuestionById("Q_R1_SCORE_1")?.options.A.text).toBe("");
    expect(deityProfiles[2].desire).toBe("奇思妙想到创意涌现");
    expect(deityProfiles[7].description).toBe(
      "主导鉴真破妄与利弊权衡之神",
    );
    expect(deityProfiles[8].desire).toBe(
      "倾听内心的喜好和感受建立专属自己的价值体系",
    );
    expect(getQuestionById("Q_FINAL_GROUP_3_DESIRE")?.shortQuestion).toBe(
      "更令你愉悦的是？",
    );
    expect(getQuestionById("Q_FINAL_GROUP_3_DESIRE")?.options.A.title).toBe(
      "奇思妙想到创意涌现/协调规划到完成任务",
    );
    expect(getQuestionById("Q_FINAL_GROUP_1_FEAR_A")?.shortQuestion).toBe(
      "最令你恐惧的是？",
    );
    expect(getQuestionById("Q_FINAL_GROUP_1_FEAR_A")?.options.D?.title).toBe(
      "嘈杂的噪音环境/“恐高”实则距离边缘三四米外",
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
        `Q_FINAL_GROUP_${expectedGroup}_DESIRE`,
      );
    },
  );

  it.each([
    ["ESFP", 1, 5, "A", "A"],
    ["ISFP", 1, 5, "B", "B"],
    ["ENTJ", 1, 5, "A", "C"],
    ["INTJ", 1, 5, "B", "D"],
    ["ESTP", 1, 6, "A", "A"],
    ["ISTP", 1, 6, "B", "B"],
    ["ENFJ", 1, 6, "A", "C"],
    ["INFJ", 1, 6, "B", "D"],
    ["ENFP", 2, 5, "A", "A"],
    ["INFP", 2, 5, "B", "B"],
    ["ESTJ", 2, 5, "A", "C"],
    ["ISTJ", 2, 5, "B", "D"],
    ["ENTP", 2, 6, "A", "A"],
    ["INTP", 2, 6, "B", "B"],
    ["ESFJ", 2, 6, "A", "C"],
    ["ISFJ", 2, 6, "B", "D"],
  ] as const)(
    "can complete the %s result",
    (
      expectedType,
      firstDeityId,
      secondDeityId,
      finalDesireOptionId,
      finalFearOptionId,
    ) => {
      const session = completedPath(
        firstDeityId,
        secondDeityId,
        finalDesireOptionId,
        finalFearOptionId,
      );
      const result = calculateResult(session.history, questions);

      expect(session.status).toBe("completed");
      expect(session.history).toHaveLength(20);
      expect(result.resultTypeId).toBe(expectedType);
      expect(result.needsRetest).toBe(false);
    },
  );

  it("repeats the second calibration question and removes rejected options", () => {
    const baseAnswers: AnswerOptionId[] = [
      firstSelectionAnswers[1],
      ...firstWinnerAnswers[1],
      secondSelectionAnswers[5],
      ...secondWinnerAnswers[5],
      "A",
    ];
    const afterFirstMismatch = answerPath([...baseAnswers, "B"]);
    const firstRetry = getQuestionById(afterFirstMismatch.currentQuestionId);

    expect(afterFirstMismatch.status).toBe("in-progress");
    expect(firstRetry?.shortQuestion).toBe(
      "请遵从本心选择：最令你恐惧的是？",
    );
    expect(
      Object.values(firstRetry?.options ?? {}).map((option) => option.title),
    ).not.toContain("工作重负");
    expect(
      Object.values(firstRetry?.options ?? {}).map((option) => option.title),
    ).toContain("嘈杂的噪音环境/“恐高”实则距离边缘三四米外");

    const afterSecondMismatch = answerPath([...baseAnswers, "B", "C"]);
    const secondRetry = getQuestionById(afterSecondMismatch.currentQuestionId);

    expect(afterSecondMismatch.status).toBe("in-progress");
    expect(
      Object.values(secondRetry?.options ?? {}).map((option) => option.title),
    ).toEqual(["细菌病毒", "情绪失控"]);

    const completed = answerPath([...baseAnswers, "B", "C", "B"]);
    expect(completed.status).toBe("completed");
    expect(completed.history).toHaveLength(22);
    expect(calculateResult(completed.history, questions).resultTypeId).toBe(
      "ENTJ",
    );
  });
});

describe("session invariants", () => {
  it("keeps uncertain unavailable throughout the new bank", () => {
    const finalQuestion = getQuestionById("Q_FINAL_GROUP_1_DESIRE")!;
    expect(getAnswerAvailability(finalQuestion, "A", []).allowed).toBe(true);
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
    const completed = completedPath(4, 8, "B", "D");
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
