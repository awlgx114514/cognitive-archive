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
  advancePastRoundBlessing,
  answerQuestion,
  countUncertainSelections,
  createTestSession,
  enterFinalBlessing,
  finishFinalBlessing,
  finishTransition,
  getAnswerAvailability,
  goBackOneStep,
  isTestSessionSnapshot,
  restoreTestSession,
  startTestSession,
} from "./testEngine";
import { analyzeConfiguredPaths } from "./pathAnalysis";
import { calculateResult } from "./resultResolver";
import { validateDemoContent } from "./validation";
import * as testEngine from "./testEngine";

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
  5: ["B", "A"],
  6: ["A", "B"],
  7: ["A", "B"],
  8: ["B", "A"],
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

function visibleQuestionTuple(
  questionId: string,
): readonly [string | undefined, string | undefined, string | undefined] {
  const question = getQuestionById(questionId);
  return [
    question?.shortQuestion,
    question?.options.A.title,
    question?.options.B.title,
  ];
}

function visibleFinalQuestionTuple(
  questionId: string,
): readonly [
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
] {
  const question = getQuestionById(questionId);
  return [
    question?.shortQuestion,
    question?.options.A.title,
    question?.options.B.title,
    question?.options.C?.title,
    question?.options.D?.title,
  ];
}

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
  finalAnswerIds: readonly AnswerOptionId[],
): TestSession {
  return answerPath([
    firstSelectionAnswers[firstDeityId],
    ...firstWinnerAnswers[firstDeityId],
    secondSelectionAnswers[secondDeityId],
    ...secondWinnerAnswers[secondDeityId],
    ...finalAnswerIds,
  ]);
}

describe("eleventh-edition scored question bank", () => {
  it("is structurally valid and every complete route contains 14 answers", () => {
    const report = validateDemoContent();
    const analysis = analyzeConfiguredPaths();

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(analysis.incompletePaths).toHaveLength(0);
    expect(analysis.shortestPathLength).toBe(14);
    expect(analysis.longestPathLength).toBe(14);
    expect(testConfig.minimumPathLength).toBe(14);
    expect(testConfig.recommendedPathLength).toBe(14);
    expect(testConfig.maximumPathLength).toBe(14);
    expect(testConfig.storageVersion).toBe("14.0.0");
  });

  it("starts each round with the requested four deity cards", () => {
    const firstSelection = getQuestionById("Q_R1_GOD_SELECT");
    expect(firstSelection?.shortQuestion).toBe("请选择你的神祇：");
    expect(firstSelection?.question).toBe("请遵循本心选择神祇。");
    expect(firstSelection?.options.A.title).toBe("现世主宰");
    expect(firstSelection?.options.A.text).toBe("主宰即时体验与享乐之神");
    expect(firstSelection?.options.A.nextQuestionId).toBe("Q_R1_SCORE_1");
    expect(firstSelection?.options.C?.title).toBe("司岁帝君");
    expect(firstSelection?.options.C?.text).toBe(
      "执笔万象万纪与箴言之神",
    );
    expect(firstSelection?.options.D?.title).toBe("太虚灵官");
    expect(firstSelection?.options.D?.nextQuestionId).toBe("Q_R1_SCORE_1");

    const secondSelection = getQuestionById("Q_R2_GOD_SELECT_F3");
    expect(secondSelection?.shortQuestion).toBe("请选择你的神祇：");
    expect(secondSelection?.question).toBe("请选择神祇，遵循本心答题。");
    expect(secondSelection?.options.A.title).toBe("紫薇大帝");
    expect(secondSelection?.options.A.nextQuestionId).toBe(
      "Q_R2_F3_SCORE_1",
    );
    expect(secondSelection?.options.A.text).toBe(
      "统辖协调规划与法令严正之神",
    );
    expect(secondSelection?.options.B.title).toBe("救苦天尊");
    expect(secondSelection?.options.B.text).toBe(
      "执掌伦理和谐与感化众生之神",
    );
    expect(secondSelection?.options.C?.title).toBe("洞真道君");
    expect(secondSelection?.options.C?.text).toBe(
      "主导鉴真破妄与利弊权衡之神",
    );
    expect(secondSelection?.options.D?.title).toBe("逍遥散人");
    expect(secondSelection?.options.D?.nextQuestionId).toBe(
      "Q_R2_F3_SCORE_1",
    );
  });

  it("keeps the exact first round and eleventh-edition second round wording", () => {
    const expectedFirstRound = [
      ["健康无恙时你更喜欢？", "身体舒适", "脑嗨"],
      [
        "感到更舒适的是？",
        "重温发生过的经验和细节",
        "想象虚构出的未来和意义",
      ],
      [
        "哪一个更吸引你？",
        "眼前美轮美奂的东西",
        "遥远新奇古怪的事物",
      ],
      [
        "对“未来与记忆”的生理本能更接近？",
        "对未来莫名忧心忡忡，自然会把痛苦记忆塞到脑海角落",
        "对未来大多持积极心态，但质疑权威和历史的作用",
      ],
      ["你更愿待在哪种环境？", "陌生刺激的环境", "熟悉安全的环境"],
      ["哪一个让你更投入？", "喧嚣的头脑风暴", "寂静的冥想"],
      [
        "哪一个更吸引你？",
        "质感丰富崭新出炉的摆件",
        "质地朴素历史沉淀的文物",
      ],
      [
        "回忆一段数年前还清晰的记忆切片，你脑海里的画面更接近（注：少数人是音频，无画面）",
        "纪录片，清晰且牢固，甚至还能重现当时的细节或氛围",
        "抽象画，细节早已褪色，只剩下某种模糊的感觉和轮廓。",
      ],
    ] as const;
    expect(
      expectedFirstRound.map((_, index) =>
        visibleQuestionTuple(`Q_R1_SCORE_${index + 1}`),
      ),
    ).toEqual(expectedFirstRound);

    const expectedSecondRound = [
      [
        "你捍卫自己哪条底线？",
        "利益不被他人裹挟",
        "好恶不随世俗逐流",
      ],
      [
        "如果意外捡到一块奇石，你会如何思考？",
        "考虑使用奇石，比如收藏或拍卖",
        "思考本质，奇石是什么？从哪来？有没有危险或价值？",
      ],
    ] as const;
    expect(
      expectedSecondRound.map((_, index) =>
        visibleQuestionTuple(`Q_R2_F1_SCORE_${index + 1}`),
      ),
    ).toEqual(expectedSecondRound);

    expect(getQuestionById("Q_R1_SCORE_1")?.options.A.text).toBe("");
    expect(deityProfiles[2].desire).toBe("奇思妙想到创意涌现");
    expect(deityProfiles[3].name).toBe("司岁帝君");
    expect(deityProfiles[3].description).toBe("执笔万象万纪与箴言之神");
    expect(deityProfiles[5].description).toBe(
      "统辖协调规划与法令严正之神",
    );
    expect(deityProfiles[6].desire).toBe("肯定他人并与之共情");
    expect(deityProfiles[7].description).toBe(
      "主导鉴真破妄与利弊权衡之神",
    );
    expect(deityProfiles[7].desire).toBe("演绎逻辑达成深度理解");
    expect(deityProfiles[8].desire).toBe(
      "倾听内心的喜好和感受建立专属自己的价值体系",
    );
  });

  it("contains the exact tenth-edition final-round wording", () => {
    const expectedGroups = {
      1: [
        ["最接近你核心本能的是？", "体验享乐与倾听内心", "执行规划与想象洞察", undefined, undefined],
        ["符合你内心过程的描述是？", "倾听内心是为了体验享乐", "参与体验是为了内心价值", undefined, undefined],
        ["下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", "体验享乐", "内心价值", "完成任务", "洞察预测"],
      ],
      2: [
        ["最接近你核心本能的是？", "执行规划与想象洞察", "体验享乐与倾听内心", undefined, undefined],
        ["符合你内心过程的描述是？", "想象洞察是为了完成任务", "规划工作是为了洞察预测", undefined, undefined],
        ["下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", "体验享乐", "内心价值", "完成任务", "洞察预测"],
      ],
      3: [
        ["最接近你核心本能的是？", "体验享乐与拆解逻辑", "肯定赞美他人与想象洞察", undefined, undefined],
        ["符合你内心过程的描述是？", "拆解逻辑是为了体验享受", "参与体验是为了理解底层原理", undefined, undefined],
        ["下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", "体验享乐", "理解底层原理", "与他人共情并建立联结", "洞察预测"],
      ],
      4: [
        ["最接近你核心本能的是？", "肯定赞美他人与想象洞察", "体验享乐与拆解逻辑", undefined, undefined],
        ["符合你内心过程的描述是？", "想象洞察是为了与他人共情并建立联结", "肯定赞美他人是为了洞察预测", undefined, undefined],
        ["下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", "体验享乐", "理解底层原理", "与他人共情并建立联结", "洞察预测"],
      ],
      5: [
        ["最接近你核心本能的是？", "灵感涌现与倾听内心", "执行规划与验证复盘", undefined, undefined],
        ["符合你内心过程的描述是？", "倾听内心是为了灵感涌现", "灵感涌现是为了内心价值", undefined, undefined],
        ["下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", "灵感涌现", "内心价值", "完成任务", "验证复盘"],
      ],
      6: [
        ["最接近你核心本能的是？", "执行规划与验证复盘", "灵感涌现与倾听内心", undefined, undefined],
        ["符合你内心过程的描述是？", "验证复盘是为了执行规划", "执行规划是为了验证复盘", undefined, undefined],
        ["下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", "灵感涌现", "内心价值", "完成任务", "验证复盘"],
      ],
      7: [
        ["最接近你核心本能的是？", "灵感涌现与拆解逻辑", "肯定赞美他人与验证复盘", undefined, undefined],
        ["符合你内心过程的描述是？", "拆解逻辑是为了灵感涌现", "灵感涌现是为了理解底层原理", undefined, undefined],
        ["下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", "灵感涌现", "理解底层原理", "与他人共情并建立联结", "验证复盘"],
      ],
      8: [
        ["最接近你核心的本能的是？", "肯定赞美他人与验证复盘", "拆解逻辑与灵感涌现", undefined, undefined],
        ["符合你内心过程的描述是？", "验证复盘是为了与他人共情并建立联结", "肯定赞美他人与验证复盘", undefined, undefined],
        ["下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", "灵感涌现", "理解底层原理", "与与他人共情并建立联结", "验证复盘"],
      ],
    } as const;

    for (const group of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      expect(
        ["1", "2", "3"].map((suffix) =>
          visibleFinalQuestionTuple(`Q_FINAL_GROUP_${group}_${suffix}`),
        ),
      ).toEqual(expectedGroups[group]);
    }
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8] as const)(
    "routes final group %s from its first answer exactly as documented",
    (group) => {
      const prefix = `Q_FINAL_GROUP_${group}`;
      const first = getQuestionById(`${prefix}_1`)!;
      const second = getQuestionById(`${prefix}_2`)!;
      const third = getQuestionById(`${prefix}_3`)!;

      expect(first.options.A.nextQuestionId).toBe(`${prefix}_2`);
      expect(first.options.B.nextQuestionId).toBe(`${prefix}_3`);
      expect(second.options.A.terminal).toBe(true);
      expect(second.options.B.terminal).toBe(true);
      expect(third.options.A.terminal).toBe(true);
      expect(third.options.B.terminal).toBe(true);
      expect(third.options.C?.terminal).toBe(true);
      expect(third.options.D?.terminal).toBe(true);
    },
  );

  it("does not expose MBTI result hints in any reader-visible question text", () => {
    const personalityCode = /\b(?:ENTJ|INTJ|ESTJ|ISTJ|ENFJ|INFJ|ESFJ|ISFJ|ENTP|INTP|ESTP|ISTP|ENFP|INFP|ESFP|ISFP)\b/;

    for (const question of questions) {
      const visibleText = [
        question.shortQuestion,
        question.question,
        ...Object.values(question.options).flatMap((option) =>
          option ? [option.title, option.text] : [],
        ),
      ]
        .filter(Boolean)
        .join("\n");

      expect(visibleText).not.toMatch(personalityCode);
    }
  });

  it("uses the exact first-round score mapping", () => {
    firstScoreTargets.forEach(([aTarget, bTarget], index) => {
      expect(scoreTargetForAnswer(1, index + 1, "A")).toBe(aTarget);
      expect(scoreTargetForAnswer(1, index + 1, "B")).toBe(bTarget);
    });
  });

  it.each([
    [1, "A", [6, 7]],
    [1, "B", [5, 8]],
    [2, "A", [5, 8]],
    [2, "B", [6, 7]],
  ] as const)(
    "awards second-round question %s option %s to both documented deities",
    (ordinal, optionId, targetIds) => {
      const scoredDeityIds: readonly SecondDeityId[] = targetIds;
      const scores = calculateRoundScores(
        [
          {
            questionId: `Q_R2_F1_SCORE_${ordinal}`,
            selectedOptionId: optionId,
            transitionSceneId: "scene-score",
            answeredAt: 1,
          },
        ],
        2,
      );

      for (const deityId of [5, 6, 7, 8] as const) {
        expect(scores[deityId]).toBe(
          scoredDeityIds.includes(deityId) ? 1 : 0,
        );
      }
    },
  );

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
    "keeps deity pair %s%s in collective blessing group %s",
    (firstDeityId, secondDeityId, expectedGroup) => {
      expect(finalGroupForDeities(firstDeityId, secondDeityId)).toBe(
        expectedGroup,
      );
    },
  );

  it.each([
    [1, 5, 1],
    [1, 8, 1],
    [4, 5, 2],
    [4, 8, 2],
    [1, 6, 3],
    [1, 7, 3],
    [4, 6, 4],
    [4, 7, 4],
    [2, 5, 5],
    [2, 8, 5],
    [3, 5, 6],
    [3, 8, 6],
    [2, 6, 7],
    [2, 7, 7],
    [3, 6, 8],
    [3, 7, 8],
  ] as const)(
    "routes exact deity pair %s%s to tenth-edition final group %s",
    (firstDeityId, secondDeityId, expectedGroup) => {
      const session = answerPath([
        firstSelectionAnswers[firstDeityId],
        ...firstWinnerAnswers[firstDeityId],
        secondSelectionAnswers[secondDeityId],
        ...secondWinnerAnswers[secondDeityId],
      ]);
      expect(session.currentQuestionId).toBe(
        `Q_FINAL_GROUP_${expectedGroup}_1`,
      );
    },
  );

  it.each([
    ["ESFP", 1, 5, ["A", "A"]],
    ["ISFP", 1, 5, ["A", "B"]],
    ["ENTJ", 4, 5, ["A", "A"]],
    ["INTJ", 4, 5, ["A", "B"]],
    ["ESTP", 1, 6, ["A", "A"]],
    ["ISTP", 1, 6, ["A", "B"]],
    ["ENFJ", 4, 6, ["A", "A"]],
    ["INFJ", 4, 6, ["A", "B"]],
    ["ENFP", 2, 5, ["A", "A"]],
    ["INFP", 2, 5, ["A", "B"]],
    ["ESTJ", 3, 5, ["A", "A"]],
    ["ISTJ", 3, 5, ["A", "B"]],
    ["ENTP", 2, 6, ["A", "A"]],
    ["INTP", 2, 6, ["A", "B"]],
    ["ESFJ", 3, 6, ["A", "A"]],
    ["ISFJ", 3, 6, ["A", "B"]],
  ] as const)(
    "can complete the two-option %s result",
    (expectedType, firstDeityId, secondDeityId, finalAnswerIds) => {
      const session = completedPath(
        firstDeityId,
        secondDeityId,
        finalAnswerIds,
      );
      const result = calculateResult(session.history, questions);

      expect(session.status).toBe("completed");
      expect(session.history).toHaveLength(14);
      expect(result.resultTypeId).toBe(expectedType);
      expect(result.needsRetest).toBe(false);
    },
  );

  it.each([
    ["ESFP", 1, 5, ["B", "A"]],
    ["ISFP", 1, 5, ["B", "B"]],
    ["ENTJ", 1, 5, ["B", "C"]],
    ["INTJ", 1, 5, ["B", "D"]],
    ["ESTP", 1, 6, ["B", "A"]],
    ["ISTP", 1, 6, ["B", "B"]],
    ["ENFJ", 1, 6, ["B", "C"]],
    ["INFJ", 1, 6, ["B", "D"]],
    ["ENFP", 2, 5, ["B", "A"]],
    ["INFP", 2, 5, ["B", "B"]],
    ["ESTJ", 2, 5, ["B", "C"]],
    ["ISTJ", 2, 5, ["B", "D"]],
    ["ENTP", 2, 6, ["B", "A"]],
    ["INTP", 2, 6, ["B", "B"]],
    ["ESFJ", 2, 6, ["B", "C"]],
    ["ISFJ", 2, 6, ["B", "D"]],
  ] as const)(
    "can complete the four-option fallback %s result",
    (expectedType, firstDeityId, secondDeityId, finalAnswerIds) => {
      const session = completedPath(
        firstDeityId,
        secondDeityId,
        finalAnswerIds,
      );
      const result = calculateResult(session.history, questions);

      expect(session.status).toBe("completed");
      expect(session.history).toHaveLength(14);
      expect(result.resultTypeId).toBe(expectedType);
      expect(result.needsRetest).toBe(false);
    },
  );

  it("can return to the same third-round start without clearing earlier rounds", () => {
    const completed = completedPath(3, 6, ["A", "A"]);
    const retryFinalRound = (
      testEngine as typeof testEngine & {
        retryFinalRound?: (
          session: TestSession,
          questionBank: typeof questions,
        ) => TestSession;
      }
    ).retryFinalRound;

    expect(retryFinalRound).toBeTypeOf("function");
    if (!retryFinalRound) return;

    const retried = retryFinalRound(completed, questions);

    expect(retried.status).toBe("in-progress");
    expect(retried.currentQuestionId).toBe("Q_FINAL_GROUP_8_1");
    expect(retried.history).toHaveLength(12);
    expect(retried.history.at(-1)?.questionId).toBe("Q_R2_F3_SCORE_2");
    expect(retried.completedAt).toBeUndefined();

    const changedCandidate = answerQuestion(retried, "B", {
      questions,
      config: testConfig,
      answeredAt: 999,
    }).session;
    expect(changedCandidate.history).toHaveLength(13);
    expect(changedCandidate.currentQuestionId).toBe("Q_FINAL_GROUP_8_3");
  });
});

describe("session invariants", () => {
  it("inserts the collective blessing only after the second round blessing", () => {
    const base = startTestSession(createTestSession(1), 1);
    const historyEntry = (questionId: string) => ({
      questionId,
      selectedOptionId: "A" as const,
      nextQuestionId: "Q_FINAL_GROUP_1_1",
      transitionSceneId: "scene-score",
      answeredAt: 2,
    });
    const firstRound: TestSession = {
      ...base,
      status: "transitioning",
      history: [historyEntry("Q_R1_SCORE_8")],
    };
    const secondRound: TestSession = {
      ...base,
      status: "transitioning",
      currentQuestionId: "Q_FINAL_GROUP_1_1",
      history: [historyEntry("Q_R2_F1_SCORE_2")],
    };

    expect(advancePastRoundBlessing(firstRound).status).toBe("in-progress");
    expect(advancePastRoundBlessing(secondRound).status).toBe(
      "final-blessing",
    );
  });

  it("persists the collective blessing between round two and the final questions", () => {
    const transitioning: TestSession = {
      ...startTestSession(createTestSession(1), 1),
      status: "transitioning",
      currentQuestionId: "Q_FINAL_GROUP_1_1",
    };

    const blessing = enterFinalBlessing(transitioning);
    expect(blessing.status).toBe("final-blessing");
    expect(blessing.currentQuestionId).toBe("Q_FINAL_GROUP_1_1");
    expect(isTestSessionSnapshot(JSON.parse(JSON.stringify(blessing)))).toBe(
      true,
    );

    const continued = finishFinalBlessing(blessing);
    expect(continued.status).toBe("in-progress");
    expect(continued.currentQuestionId).toBe("Q_FINAL_GROUP_1_1");
  });

  it("keeps uncertain unavailable throughout the new bank", () => {
    const finalQuestion = getQuestionById("Q_FINAL_GROUP_1_1")!;
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
    const completed = completedPath(4, 8, ["B", "B", "B"]);
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
