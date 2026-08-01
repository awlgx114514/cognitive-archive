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
  finalCandidateOptionId: "A" | "B" | "C" | "D",
  finalCalibrationOptionId: "A" | "B",
): TestSession {
  return answerPath([
    firstSelectionAnswers[firstDeityId],
    ...firstWinnerAnswers[firstDeityId],
    secondSelectionAnswers[secondDeityId],
    ...secondWinnerAnswers[secondDeityId],
    finalCandidateOptionId,
    finalCalibrationOptionId,
  ]);
}

describe("eighth-edition scored question bank", () => {
  it("is structurally valid and every complete route contains 20 answers", () => {
    const report = validateDemoContent();
    const analysis = analyzeConfiguredPaths();

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(analysis.incompletePaths).toHaveLength(0);
    expect(analysis.shortestPathLength).toBe(20);
    expect(analysis.longestPathLength).toBe(20);
    expect(testConfig.minimumPathLength).toBe(20);
    expect(testConfig.maximumPathLength).toBe(20);
    expect(testConfig.storageVersion).toBe("11.0.0");
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
      "执笔万纪万象与铭记之神",
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

  it("contains the exact eighth-edition first and second round wording", () => {
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
        "当团队遇到危机，进度严重滞后，成员们情绪低落，你作为负责人会？",
        "制定流程和标准重启效率",
        "解决人心和凝聚力重振士气",
      ],
      [
        "你会把匿名票投给哪位演讲嘉宾？",
        "观点与我一致但似曾相识的陌生人",
        "观点与我矛盾但关系融洽的好友",
      ],
      [
        "公司机构臃肿，上层勾心斗角，你会如何力挽狂澜？",
        "裁员，调研清楚后果断裁员，不惜把一整个部门裁撤",
        "替换，跨部门人员调整，把有能力有工作热情的人换上来，悄无声息地完成权力交接。",
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

    expect(getQuestionById("Q_R1_SCORE_1")?.options.A.text).toBe("");
    expect(deityProfiles[2].desire).toBe("奇思妙想到创意涌现");
    expect(deityProfiles[3].name).toBe("司岁帝君");
    expect(deityProfiles[3].description).toBe("执笔万纪万象与铭记之神");
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

  it("contains the exact eighth-edition two-question final sections", () => {
    const prompt =
      "在日常生活中，下列哪一种状态最能代表你最核心、最不假思索的心理本能与安全感来源？";
    const expectedGroups = {
      1: [
        ["追求行动与体验享乐", "极度看重当下的真实感知、刺激与回应，本能地拥抱现实与行动。"],
        ["追求价值与真我契合", "极度看重内心的真实喜恶、道德与情感纯粹，本能地坚守个人领地。"],
        ["追求规划与任务完成", "极度看重效率、秩序与结果，本能地想去掌控事态、解决问题。"],
        ["追求想象与洞察预测", "极度看重趋势与终极意义，本能地在脑海里捕捉事物的抽象规律与未来演化。"],
      ],
      2: [
        ["追求行动与体验享乐", "极度看重当下的真实感知与快速反应，本能地拥抱现实、解决眼前的危机。"],
        ["追求解构与逻辑自洽", "极度看重逻辑的严密与精确，本能地想要把事物的底层运作机制拆解明白。"],
        ["追求道德与他人共情", "极度看重群体氛围与他人感受，本能地去体贴、照顾周围人的需求。"],
        ["追求想象与洞察预测", "极度看重趋势与终极意义，本能地在脑海里捕捉事物的抽象规律与未来演化。"],
      ],
      3: [
        ["追求创意与奇思妙想", "极度看重可能性与头脑风暴，本能地用新奇想法去挑战固有观念、打破常规。"],
        ["追求价值与真我契合", "极度看重内心的真实喜恶、道德与情感纯粹，本能地坚守个人领地。"],
        ["追求规划与任务完成", "极度看重效率、秩序与结果，本能地想去掌控事态、解决问题。"],
        ["追求安全与验证复盘", "极度看重细节、既有经验与责任，本能地在熟悉、有秩序的框架里默默守护。"],
      ],
      4: [
        ["追求创意与奇思妙想", "极度看重可能性与头脑风暴，本能地用新奇想法去挑战固有观念、打破常规。"],
        ["追求解构与逻辑自洽", "极度看重逻辑的严密与精确，本能地想要把事物的底层运作机制拆解明白。"],
        ["追求道德与他人共情", "极度看重群体氛围与他人感受，本能地去体贴、照顾周围人的需求。"],
        ["追求安全与验证复盘", "极度看重细节、既有经验与责任，本能地在熟悉、有秩序的框架里默默守护。"],
      ],
    } as const;
    const expectedCalibrationOptions = {
      1: [
        "噩运缠身/加班到没有个人生活",
        "情绪崩溃失控/喧闹嘈杂到无法思考",
      ],
      2: [
        "噩运缠身/高强度令人窒息的社交",
        "被指责或质疑“逻辑不通”/喧闹嘈杂到无法思考",
      ],
      3: [
        "机械重复的日常工作/加班到没有个人生活",
        "情绪崩溃失控/混乱",
      ],
      4: [
        "机械重复的日常工作/高强度令人窒息的社交",
        "被指责或质疑“逻辑不通”/混乱",
      ],
    } as const;

    for (const group of [1, 2, 3, 4] as const) {
      const candidateQuestion = getQuestionById(`Q_FINAL_GROUP_${group}_1`);
      expect(candidateQuestion?.shortQuestion).toBe(prompt);
      expect(["A", "B", "C", "D"].map((optionId) => {
        const option = candidateQuestion?.options[optionId as AnswerOptionId];
        return [option?.title, option?.text];
      })).toEqual(expectedGroups[group]);

      for (const candidate of ["A", "B", "C", "D"] as const) {
        const calibration = getQuestionById(
          `Q_FINAL_GROUP_${group}_CAL_${candidate}`,
        );
        expect(calibration?.shortQuestion).toBe(
          "【潜意识校对】下列哪一组更令你不适？",
        );
        expect([
          calibration?.options.A.title,
          calibration?.options.B.title,
        ]).toEqual(expectedCalibrationOptions[group]);
      }
    }
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
    ["ESFP", 1, 5, "A", "A"],
    ["ISFP", 1, 5, "B", "A"],
    ["ENTJ", 1, 5, "C", "B"],
    ["INTJ", 1, 5, "D", "B"],
    ["ESTP", 1, 6, "A", "A"],
    ["ISTP", 1, 6, "B", "A"],
    ["ENFJ", 1, 6, "C", "B"],
    ["INFJ", 1, 6, "D", "B"],
    ["ENFP", 2, 5, "A", "A"],
    ["INFP", 2, 5, "B", "A"],
    ["ESTJ", 2, 5, "C", "B"],
    ["ISTJ", 2, 5, "D", "B"],
    ["ENTP", 2, 6, "A", "A"],
    ["INTP", 2, 6, "B", "A"],
    ["ESFJ", 2, 6, "C", "B"],
    ["ISFJ", 2, 6, "D", "B"],
  ] as const)(
    "can complete the %s result",
    (
      expectedType,
      firstDeityId,
      secondDeityId,
      finalCandidateOptionId,
      finalCalibrationOptionId,
    ) => {
      const session = completedPath(
        firstDeityId,
        secondDeityId,
        finalCandidateOptionId,
        finalCalibrationOptionId,
      );
      const result = calculateResult(session.history, questions);

      expect(session.status).toBe("completed");
      expect(session.history).toHaveLength(20);
      expect(result.resultTypeId).toBe(expectedType);
      expect(result.needsRetest).toBe(false);
    },
  );

  it("marks a mismatched subconscious calibration for retesting", () => {
    const session = completedPath(1, 5, "A", "B");
    const result = calculateResult(session.history, questions);

    expect(session.status).toBe("completed");
    expect(result.resultTypeId).toBe("ESFP");
    expect(result.needsRetest).toBe(true);
    expect(result.calibrationMatched).toBe(false);
    expect(result.retestReason).toBe(
      "潜意识校对失败，请遵循本心，返回第三轮题目重选。",
    );
  });

  it("returns a failed calibration to the same third-round choice without clearing earlier rounds", () => {
    const completed = completedPath(1, 5, "A", "B");
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
    expect(retried.currentQuestionId).toBe("Q_FINAL_GROUP_1_1");
    expect(retried.history).toHaveLength(18);
    expect(retried.history.at(-1)?.questionId).toBe("Q_R2_F1_SCORE_8");
    expect(retried.completedAt).toBeUndefined();

    const changedCandidate = answerQuestion(retried, "D", {
      questions,
      config: testConfig,
      answeredAt: 999,
    }).session;
    expect(changedCandidate.history).toHaveLength(19);
    expect(changedCandidate.currentQuestionId).toBe("Q_FINAL_GROUP_1_CAL_D");
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
    const completed = completedPath(4, 8, "D", "B");
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
