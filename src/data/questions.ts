import {
  deityProfiles,
  firstRoundDeityIds,
  secondRoundDeityIds,
  type DeityId,
  type FirstRoundDeityId,
} from "./deities";
import type {
  AnswerOption,
  AnswerOptionId,
  DynamicRouteKind,
  QuestionNode,
  QuestionStage,
} from "../types/test";

type OptionSeed = {
  title: string;
  text?: string;
  nextQuestionId?: string;
  terminal?: boolean;
  calibrationTypeId?: string;
  internalNote?: string;
};

type QuestionSeed = {
  id: string;
  question: string;
  detail?: string;
  a: OptionSeed;
  b: OptionSeed;
  c?: OptionSeed;
  d?: OptionSeed;
  stage?: QuestionStage;
  dynamicRoute?: DynamicRouteKind;
  dynamicNextQuestionIds?: string[];
  internalNote?: string;
};

type BinaryQuestionSeed = {
  question: string;
  a: string;
  b: string;
};

export function transitionSceneIdForQuestion(questionId: string): string {
  return `scene-${questionId.toLowerCase().replaceAll("_", "-")}`;
}

function makeOption(id: AnswerOptionId, seed: OptionSeed): AnswerOption {
  return {
    id,
    title: seed.title,
    text: seed.text ?? "",
    nextQuestionId: seed.nextQuestionId,
    terminal: seed.terminal,
    calibrationTypeId: seed.calibrationTypeId,
    internalNote: seed.internalNote,
  };
}

function makeQuestion(seed: QuestionSeed): QuestionNode {
  return {
    id: seed.id,
    traceCode: `ARC-${seed.id.replace("Q_", "")}`,
    shortQuestion: seed.question,
    question: seed.detail ?? seed.question,
    options: {
      A: makeOption("A", seed.a),
      B: makeOption("B", seed.b),
      ...(seed.c ? { C: makeOption("C", seed.c) } : {}),
      ...(seed.d ? { D: makeOption("D", seed.d) } : {}),
    },
    allowUncertain: false,
    transitionSceneId: transitionSceneIdForQuestion(seed.id),
    stage: seed.stage ?? "core",
    dynamicRoute: seed.dynamicRoute,
    dynamicNextQuestionIds: seed.dynamicNextQuestionIds,
    internalNote: seed.internalNote,
  };
}

function deitySelectionOption(
  deityId: DeityId,
  nextQuestionId: string,
): OptionSeed {
  const deity = deityProfiles[deityId];
  return {
    title: deity.name,
    text: deity.description,
    nextQuestionId,
  };
}

const firstRoundQuestions: readonly BinaryQuestionSeed[] = [
  {
    question: "你更喜欢？",
    a: "身体舒适",
    b: "脑嗨",
  },
  {
    question: "感到更舒适的是？",
    a: "重温发生过的经验和细节",
    b: "想象虚构出的未来和意义",
  },
  {
    question: "哪一个更吸引你？",
    a: "眼前美轮美奂的东西",
    b: "遥远新奇古怪的事物",
  },
  {
    question: "学习榜样人物，你倾向选择？",
    a: "身边的优秀前辈或行业标杆",
    b: "书中的“只言片语、皆成箴言”的哲学家",
  },
  {
    question: "你更愿待在哪种环境？",
    a: "陌生刺激的环境",
    b: "熟悉安全的环境",
  },
  {
    question: "哪一个让你更投入？",
    a: "喧嚣的头脑风暴",
    b: "寂静的冥想",
  },
  {
    question: "哪一个更吸引你？",
    a: "质感丰富崭新出炉的摆件",
    b: "质地朴素历史沉淀的文物",
  },
  {
    question: "你更喜欢哪类结局？",
    a: "引人遐想的开放式结局",
    b: "结构完整的确定的结局",
  },
];

const secondRoundQuestions: readonly BinaryQuestionSeed[] = [
  {
    question: "哪项工作对你来说更轻松好玩？",
    a: "管理与资源协调",
    b: "公关与关系协调",
  },
  {
    question: "你会把票投给哪位演讲嘉宾？",
    a: "观点与我一致但似曾相识的陌生人",
    b: "观点与我矛盾但关系融洽的好友",
  },
  {
    question: "团队遇到危机，进度严重滞后，成员们情绪低落，你作为负责人会？",
    a: "制定流程和标准，重启效率",
    b: "解决人心和凝聚力，重振士气",
  },
  {
    question: "你捍卫自己哪条底线？",
    a: "利益不被他人裹挟",
    b: "好恶不随世俗逐流",
  },
  {
    question: "当你的方案被外界质疑，你会？",
    a: "找现实案例证明方法管用",
    b: "从底层原理推演给他们听",
  },
  {
    question: "听完朋友长时间负面情绪的倾诉后，你感到？",
    a: "很累像被对方情绪污染",
    b: "无感像看剧一样完全抽离",
  },
  {
    question: "如果意外捡到一块奇石，你会如何思考？",
    a: "考虑使用奇石，比如收藏或拍卖",
    b: "思考本质，奇石是什么？从哪来？有没有危险或价值？",
  },
  {
    question: "坚守道德底线的原因是？",
    a: "感知他人疾苦，因而约定俗成的外在规范",
    b: "倾听自我内心，所以更偏向个人的内心自律",
  },
];

function makeFirstRoundScoreQuestions(): QuestionNode[] {
  return firstRoundQuestions.map((seed, index) => {
    const ordinal = index + 1;
    const id = `Q_R1_SCORE_${ordinal}`;
    const isLast = ordinal === firstRoundQuestions.length;
    const nextQuestionId = isLast ? undefined : `Q_R1_SCORE_${ordinal + 1}`;
    return makeQuestion({
      id,
      question: seed.question,
      a: { title: seed.a, nextQuestionId },
      b: { title: seed.b, nextQuestionId },
      dynamicRoute: isLast ? "first-round-score" : undefined,
      dynamicNextQuestionIds: isLast
        ? firstRoundDeityIds.map((deityId) => `Q_R2_GOD_SELECT_F${deityId}`)
        : undefined,
      internalNote: `round=1; score-question=${ordinal}`,
    });
  });
}

function makeSecondRoundScoreQuestions(
  firstWinnerId: FirstRoundDeityId,
): QuestionNode[] {
  return secondRoundQuestions.map((seed, index) => {
    const ordinal = index + 1;
    const id = `Q_R2_F${firstWinnerId}_SCORE_${ordinal}`;
    const isLast = ordinal === secondRoundQuestions.length;
    const nextQuestionId = isLast
      ? undefined
      : `Q_R2_F${firstWinnerId}_SCORE_${ordinal + 1}`;
    const finalGroups =
      firstWinnerId === 1 || firstWinnerId === 4
        ? ["Q_FINAL_GROUP_1_DESIRE", "Q_FINAL_GROUP_2_DESIRE"]
        : ["Q_FINAL_GROUP_3_DESIRE", "Q_FINAL_GROUP_4_DESIRE"];
    return makeQuestion({
      id,
      question: seed.question,
      a: { title: seed.a, nextQuestionId },
      b: { title: seed.b, nextQuestionId },
      dynamicRoute: isLast ? "second-round-score" : undefined,
      dynamicNextQuestionIds: isLast ? finalGroups : undefined,
      internalNote: `round=2; first-winner=${firstWinnerId}; score-question=${ordinal}`,
    });
  });
}

const firstRoundSelection = makeQuestion({
  id: "Q_R1_GOD_SELECT",
  question: "请选择你的神祇",
  detail: "请遵循本心选择神祇。",
  a: deitySelectionOption(1, "Q_R1_SCORE_1"),
  b: deitySelectionOption(2, "Q_R1_SCORE_1"),
  c: deitySelectionOption(3, "Q_R1_SCORE_1"),
  d: deitySelectionOption(4, "Q_R1_SCORE_1"),
  internalNote: "第一步选神；选择本身计入该神祇一分。",
});

function makeSecondRoundSelection(
  firstWinnerId: FirstRoundDeityId,
): QuestionNode {
  const nextQuestionId = `Q_R2_F${firstWinnerId}_SCORE_1`;
  return makeQuestion({
    id: `Q_R2_GOD_SELECT_F${firstWinnerId}`,
    question: "请选择你的神祇",
    detail: "请选择神祇，并遵循本心答题。",
    a: deitySelectionOption(5, nextQuestionId),
    b: deitySelectionOption(6, nextQuestionId),
    c: deitySelectionOption(7, nextQuestionId),
    d: deitySelectionOption(8, nextQuestionId),
    internalNote: `第二步选神；第一步获胜神祇=${firstWinnerId}；选择本身计一分。`,
  });
}

function terminalOption(
  id: AnswerOptionId,
  title: string,
  calibrationTypeId: string,
): AnswerOption {
  return makeOption(id, {
    title,
    terminal: true,
    calibrationTypeId,
  });
}

type FinalGroup = 1 | 2 | 3 | 4;
type FinalDesireOptionId = "A" | "B";
type FinalFearOptionId = "A" | "B" | "C" | "D";

type FinalGroupSeed = {
  desires: Readonly<Record<FinalDesireOptionId, string>>;
  fears: Readonly<Record<FinalFearOptionId, string>>;
  results: Readonly<
    Record<
      FinalDesireOptionId,
      Readonly<Partial<Record<FinalFearOptionId, string>>>
    >
  >;
};

const finalFearOptionIds = ["A", "B", "C", "D"] as const;

function finalFearQuestionId(
  group: FinalGroup,
  desireOptionId: FinalDesireOptionId,
  removedFearOptionIds: readonly FinalFearOptionId[],
): string {
  const retrySuffix =
    removedFearOptionIds.length > 0
      ? `_RETRY_${removedFearOptionIds.join("")}`
      : "";
  return `Q_FINAL_GROUP_${group}_FEAR_${desireOptionId}${retrySuffix}`;
}

function makeFinalDesireQuestion(
  group: FinalGroup,
  seed: FinalGroupSeed,
): QuestionNode {
  return makeQuestion({
    id: `Q_FINAL_GROUP_${group}_DESIRE`,
    question: "更令你愉悦的是？",
    a: {
      title: seed.desires.A,
      nextQuestionId: finalFearQuestionId(group, "A", []),
    },
    b: {
      title: seed.desires.B,
      nextQuestionId: finalFearQuestionId(group, "B", []),
    },
    stage: "calibration",
    internalNote: `Final group ${group}; desire question`,
  });
}

function makeFinalFearQuestion(
  group: FinalGroup,
  desireOptionId: FinalDesireOptionId,
  seed: FinalGroupSeed,
  removedFearOptionIds: readonly FinalFearOptionId[],
): QuestionNode {
  const removedFearOptionSet = new Set(removedFearOptionIds);
  const remainingFearOptionIds = finalFearOptionIds.filter(
    (fearOptionId) => !removedFearOptionSet.has(fearOptionId),
  );
  const options = remainingFearOptionIds.map((fearOptionId, index) => {
    const displayedOptionId = finalFearOptionIds[index];
    const resultTypeId = seed.results[desireOptionId][fearOptionId];
    if (resultTypeId) {
      return terminalOption(
        displayedOptionId,
        seed.fears[fearOptionId],
        resultTypeId,
      );
    }

    const nextRemovedFearOptionIds = finalFearOptionIds.filter(
      (candidateId) =>
        removedFearOptionSet.has(candidateId) || candidateId === fearOptionId,
    );
    return makeOption(displayedOptionId, {
      title: seed.fears[fearOptionId],
      nextQuestionId: finalFearQuestionId(
        group,
        desireOptionId,
        nextRemovedFearOptionIds,
      ),
    });
  });
  const [a, b, c, d] = options;
  if (!a || !b) {
    throw new Error(`Final group ${group} retry must keep at least two options.`);
  }

  const id = finalFearQuestionId(
    group,
    desireOptionId,
    removedFearOptionIds,
  );
  return {
    id,
    traceCode: `ARC-${id.replace("Q_", "")}`,
    shortQuestion:
      removedFearOptionIds.length > 0
        ? "请遵从本心选择：最令你恐惧的是？"
        : "最令你恐惧的是？",
    question:
      removedFearOptionIds.length > 0
        ? "请遵从本心选择：最令你恐惧的是？"
        : "最令你恐惧的是？",
    options: {
      A: a,
      B: b,
      ...(c ? { C: c } : {}),
      ...(d ? { D: d } : {}),
    },
    allowUncertain: false,
    transitionSceneId: transitionSceneIdForQuestion(id),
    stage: "calibration",
    internalNote: `Final group ${group}; desire=${desireOptionId}; removed fears=${removedFearOptionIds.join(",") || "none"}`,
  };
}

function makeFinalGroupQuestions(
  group: FinalGroup,
  seed: FinalGroupSeed,
): QuestionNode[] {
  const questions = [makeFinalDesireQuestion(group, seed)];

  for (const desireOptionId of ["A", "B"] as const) {
    const rejectedFearOptionIds = finalFearOptionIds.filter(
      (fearOptionId) => !seed.results[desireOptionId][fearOptionId],
    );
    if (rejectedFearOptionIds.length !== 2) {
      throw new Error(`Final group ${group} must reject exactly two fear options.`);
    }

    const retryStates: readonly (readonly FinalFearOptionId[])[] = [
      [],
      [rejectedFearOptionIds[0]],
      [rejectedFearOptionIds[1]],
      rejectedFearOptionIds,
    ];
    questions.push(
      ...retryStates.map((removedFearOptionIds) =>
        makeFinalFearQuestion(
          group,
          desireOptionId,
          seed,
          removedFearOptionIds,
        ),
      ),
    );
  }

  return questions;
}

const firstRoundScoreQuestions = makeFirstRoundScoreQuestions();
const secondRoundNodes = firstRoundDeityIds.flatMap((firstWinnerId) => [
  makeSecondRoundSelection(firstWinnerId),
  ...makeSecondRoundScoreQuestions(firstWinnerId),
]);

const finalGroupSeeds: Readonly<Record<FinalGroup, FinalGroupSeed>> = {
  1: {
    desires: {
      A: "体验享乐/协调规划到完成任务",
      B: "倾听内心的喜好和感受/想象预测",
    },
    fears: {
      A: "细菌病毒",
      B: "工作重负",
      C: "情绪失控",
      D: "嘈杂的噪音环境/“恐高”实则距离边缘三四米外",
    },
    results: {
      A: { A: "ESFP", C: "ENTJ" },
      B: { B: "ISFP", D: "INTJ" },
    },
  },
  2: {
    desires: {
      A: "体验享乐/与他人建立联结",
      B: "推敲命名达成深度理解/想象预测",
    },
    fears: {
      A: "未来噩运缠身",
      B: "高强度令人窒息的社交",
      C: "被指责或质疑“逻辑不通”",
      D: "嘈杂的噪音环境/“恐高”实则距离边缘三四米外",
    },
    results: {
      A: { A: "ESTP", C: "ENFJ" },
      B: { B: "ISTP", D: "INFJ" },
    },
  },
  3: {
    desires: {
      A: "奇思妙想到创意涌现/协调规划到完成任务",
      B: "验证复盘/倾听内心的喜好和感受建立专属自己的价值体系",
    },
    fears: {
      A: "机械重复的日常工作",
      B: "工作重负",
      C: "情绪失控",
      D: "混乱",
    },
    results: {
      A: { A: "ENFP", C: "ESTJ" },
      B: { B: "INFP", D: "ISTJ" },
    },
  },
  4: {
    desires: {
      A: "奇思妙想到创意涌现/与他人建立联结",
      B: "推敲命名达成深度理解/验证复盘",
    },
    fears: {
      A: "机械重复的日常工作",
      B: "高强度令人窒息的社交",
      C: "被指责或质疑“逻辑不通”",
      D: "混乱",
    },
    results: {
      A: { A: "ENTP", C: "ESFJ" },
      B: { B: "INTP", D: "ISFJ" },
    },
  },
};

const finalQuestions = ([1, 2, 3, 4] as const).flatMap((group) =>
  makeFinalGroupQuestions(group, finalGroupSeeds[group]),
);

export const questions: QuestionNode[] = [
  firstRoundSelection,
  ...firstRoundScoreQuestions,
  ...secondRoundNodes,
  ...finalQuestions,
];

export const questionMap: ReadonlyMap<string, QuestionNode> = new Map(
  questions.map((question) => [question.id, question]),
);

export function getQuestionById(questionId: string): QuestionNode | undefined {
  return questionMap.get(questionId);
}

export const configuredFirstRoundDeityIds = firstRoundDeityIds;
export const configuredSecondRoundDeityIds = secondRoundDeityIds;
