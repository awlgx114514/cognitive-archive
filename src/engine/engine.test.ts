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
  finalAnswers: readonly [
    "A" | "B",
    "A" | "B",
    "A" | "B",
    "A" | "B",
  ],
  finalOrderOptionId: "A" | "B",
): TestSession {
  return answerPath([
    firstSelectionAnswers[firstDeityId],
    ...firstWinnerAnswers[firstDeityId],
    secondSelectionAnswers[secondDeityId],
    ...secondWinnerAnswers[secondDeityId],
    ...finalAnswers,
    finalOrderOptionId,
  ]);
}

describe("seventh-edition scored question bank", () => {
  it("is structurally valid and every complete route contains 23 answers", () => {
    const report = validateDemoContent();
    const analysis = analyzeConfiguredPaths();

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(analysis.incompletePaths).toHaveLength(0);
    expect(analysis.shortestPathLength).toBe(23);
    expect(analysis.longestPathLength).toBe(23);
    expect(testConfig.minimumPathLength).toBe(23);
    expect(testConfig.maximumPathLength).toBe(23);
    expect(testConfig.storageVersion).toBe("10.0.0");
  });

  it("starts each round with the requested four deity cards", () => {
    const firstSelection = getQuestionById("Q_R1_GOD_SELECT");
    expect(firstSelection?.shortQuestion).toBe("请选择你的神祇：");
    expect(firstSelection?.question).toBe("请遵循本心选择神祇。");
    expect(firstSelection?.options.A.title).toBe("现世主宰");
    expect(firstSelection?.options.A.text).toBe("主宰即时体验与享乐之神");
    expect(firstSelection?.options.A.nextQuestionId).toBe("Q_R1_SCORE_1");
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

  it("contains the exact seventh-edition question wording", () => {
    const expectedFirstRound = [
      ["你更喜欢？", "身体舒适", "脑嗨"],
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
        "学习榜样人物，你倾向选择？",
        "身边的优秀前辈或行业标杆",
        "书中的“只言片语、皆成箴言”的哲学家。",
      ],
      ["你更愿待在哪种环境？", "陌生刺激的环境", "熟悉安全的环境"],
      ["哪一个让你更投入？", "喧嚣的头脑风暴", "寂静的冥想"],
      [
        "哪一个更吸引你？",
        "质感丰富崭新出炉的摆件",
        "质地朴素历史沉淀的文物",
      ],
      [
        "你更喜欢哪类结局？",
        "引人遐想的开放式结局",
        "结构完整的确定的结局",
      ],
    ] as const;
    expect(
      expectedFirstRound.map((_, index) =>
        visibleQuestionTuple(`Q_R1_SCORE_${index + 1}`),
      ),
    ).toEqual(expectedFirstRound);

    const expectedSecondRound = [
      [
        "下属犯错影响进度，但他确实家里遇到了极大变故，你会处罚吗？",
        "给予关怀和支持，不忍心按规矩冰冷惩罚",
        "同情归同情，但处罚要按规则处理“公事公办”",
      ],
      [
        "你会把匿名票投给哪位演讲嘉宾？",
        "观点与我一致但似曾相识的陌生人",
        "观点与我矛盾但关系融洽的好友",
      ],
      [
        "团队遇到危机，进度严重滞后，成员们情绪低落，你作为负责人会？",
        "制定流程和标准重启效率",
        "解决人心和凝聚力重振士气",
      ],
      ["你捍卫自己哪条底线？", "利益不被他人裹挟", "好恶不随世俗逐流"],
      [
        "面对一个“实践证明有效，但底层逻辑矛盾”的方案，你的本能反应是？",
        "管用就行，拿到结果最重要，懒得死磕逻辑瑕疵",
        "有点难受，想把它背后的逻辑推导顺了",
      ],
      [
        "听完朋友长时间负面情绪的倾诉后，你感到？",
        "很累像被对方情绪污染",
        "无感像看剧一样完全抽离",
      ],
      [
        "如果意外捡到一块奇石，你会如何思考？",
        "考虑使用奇石，比如收藏或拍卖",
        "思考本质，奇石是什么？从哪来？有没有危险或价值？",
      ],
      [
        "看到别人皱眉或面露不悦，你会下意识地留意吗？",
        "难免留心在意，甚至见不得别人受苦",
        "鲜少关心重视，“子非鱼焉知鱼之乐”",
      ],
    ] as const;
    expect(
      expectedSecondRound.map((_, index) =>
        visibleQuestionTuple(`Q_R2_F1_SCORE_${index + 1}`),
      ),
    ).toEqual(expectedSecondRound);

    const expectedFinalGroups = {
      1: [
        ["哪一个对你更重要？", "体验享乐", "协调规划到完成任务"],
        ["哪一个对你更重要？", "倾听内心的喜好和感受", "想象预测"],
        ["哪一个更令你不适？", "细菌病毒或噩运缠身", "情绪崩溃失控"],
        [
          "哪一个更令你不适？",
          "加班到没有个人生活",
          "喧闹嘈杂到无法思考",
        ],
      ],
      2: [
        ["哪一个对你更重要？", "体验享乐", "肯定他人并与之共情"],
        ["哪一个对你更重要？", "推敲命名达成深度理解", "想象预测"],
        [
          "哪一个更令你不适？",
          "细菌病毒或噩运缠身",
          "被指责或质疑“逻辑不通”",
        ],
        [
          "哪一个更令你不适？",
          "高强度令人窒息的社交",
          "喧闹嘈杂到无法思考",
        ],
      ],
      3: [
        [
          "哪一个对你更重要？",
          "奇思妙想到创意涌现",
          "协调规划到完成任务",
        ],
        ["哪一个对你更重要？", "倾听内心的喜好和感受", "验证复盘"],
        ["哪一个更令你不适？", "机械重复的日常工作", "情绪崩溃失控"],
        ["哪一个更令你不适？", "加班到没有个人生活", "混乱"],
      ],
      4: [
        [
          "哪一个对你更重要？",
          "奇思妙想到创意涌现",
          "肯定他人并与之共情",
        ],
        ["哪一个对你更重要？", "推敲命名达成深度理解", "验证复盘"],
        [
          "哪一个更令你不适？",
          "机械重复的日常工作",
          "被指责或质疑“逻辑不通”",
        ],
        ["哪一个更令你不适？", "高强度令人窒息的社交", "混乱"],
      ],
    } as const;
    for (const group of [1, 2, 3, 4] as const) {
      expect(
        expectedFinalGroups[group].map((_, index) =>
          visibleQuestionTuple(`Q_FINAL_GROUP_${group}_${index + 1}`),
        ),
      ).toEqual(expectedFinalGroups[group]);
    }

    expect(getQuestionById("Q_R1_SCORE_1")?.options.A.text).toBe("");
    expect(deityProfiles[2].desire).toBe("奇思妙想到创意涌现");
    expect(deityProfiles[5].description).toBe(
      "统辖协调规划与法令严正之神",
    );
    expect(deityProfiles[6].desire).toBe("肯定他人并与之共情");
    expect(deityProfiles[7].description).toBe(
      "主导鉴真破妄与利弊权衡之神",
    );
    expect(deityProfiles[8].desire).toBe(
      "倾听内心的喜好和感受建立专属自己的价值体系",
    );
    expect(getQuestionById("Q_FINAL_GROUP_1_ORDER_A")?.shortQuestion).toBe(
      "填空题：XX是服务于XX",
    );
    expect(getQuestionById("Q_FINAL_GROUP_1_ORDER_A")?.options.A.title).toBe(
      "倾听内心的喜好和感受是服务于体验享乐",
    );
  });

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
        `Q_FINAL_GROUP_${expectedGroup}_1`,
      );
    },
  );

  it.each([
    ["ESFP", 1, 5, ["A", "A", "A", "B"], "A"],
    ["ISFP", 1, 5, ["A", "A", "A", "B"], "B"],
    ["ENTJ", 1, 5, ["B", "B", "B", "A"], "A"],
    ["INTJ", 1, 5, ["B", "B", "B", "A"], "B"],
    ["ESTP", 1, 6, ["A", "A", "A", "B"], "A"],
    ["ISTP", 1, 6, ["A", "A", "A", "B"], "B"],
    ["ENFJ", 1, 6, ["B", "B", "B", "A"], "A"],
    ["INFJ", 1, 6, ["B", "B", "B", "A"], "B"],
    ["ENFP", 2, 5, ["A", "A", "A", "B"], "A"],
    ["INFP", 2, 5, ["A", "A", "A", "B"], "B"],
    ["ESTJ", 2, 5, ["B", "B", "B", "A"], "A"],
    ["ISTJ", 2, 5, ["B", "B", "B", "A"], "B"],
    ["ENTP", 2, 6, ["A", "A", "A", "B"], "A"],
    ["INTP", 2, 6, ["A", "A", "A", "B"], "B"],
    ["ESFJ", 2, 6, ["B", "B", "B", "A"], "A"],
    ["ISFJ", 2, 6, ["B", "B", "B", "A"], "B"],
  ] as const)(
    "can complete the %s result",
    (
      expectedType,
      firstDeityId,
      secondDeityId,
      finalAnswers,
      finalOrderOptionId,
    ) => {
      const session = completedPath(
        firstDeityId,
        secondDeityId,
        finalAnswers,
        finalOrderOptionId,
      );
      const result = calculateResult(session.history, questions);

      expect(session.status).toBe("completed");
      expect(session.history).toHaveLength(23);
      expect(result.resultTypeId).toBe(expectedType);
      expect(result.needsRetest).toBe(false);
    },
  );

  it.each([
    [1, 5, 1, "A"],
    [4, 5, 1, "B"],
    [1, 6, 2, "A"],
    [4, 6, 2, "B"],
    [2, 5, 3, "A"],
    [3, 5, 3, "B"],
    [2, 6, 4, "A"],
    [3, 6, 4, "B"],
  ] as const)(
    "uses deity pair %s%s to break a 2:2 tie toward branch %s",
    (firstDeityId, secondDeityId, group, expectedBranch) => {
      const session = answerPath([
        firstSelectionAnswers[firstDeityId],
        ...firstWinnerAnswers[firstDeityId],
        secondSelectionAnswers[secondDeityId],
        ...secondWinnerAnswers[secondDeityId],
        "A",
        "A",
        "B",
        "B",
      ]);

      expect(session.currentQuestionId).toBe(
        `Q_FINAL_GROUP_${group}_ORDER_${expectedBranch}`,
      );
    },
  );

  it("uses the four-answer majority before the deity-pair tie break", () => {
    const branchB = answerPath([
      firstSelectionAnswers[1],
      ...firstWinnerAnswers[1],
      secondSelectionAnswers[5],
      ...secondWinnerAnswers[5],
      "B",
      "B",
      "B",
      "A",
    ]);
    expect(branchB.currentQuestionId).toBe("Q_FINAL_GROUP_1_ORDER_B");

    const branchA = answerPath([
      firstSelectionAnswers[4],
      ...firstWinnerAnswers[4],
      secondSelectionAnswers[5],
      ...secondWinnerAnswers[5],
      "A",
      "A",
      "A",
      "B",
    ]);
    expect(branchA.currentQuestionId).toBe("Q_FINAL_GROUP_1_ORDER_A");
  });
});

describe("session invariants", () => {
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
    const completed = completedPath(
      4,
      8,
      ["B", "B", "B", "A"],
      "B",
    );
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
