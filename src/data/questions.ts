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
      b: "书中的“只言片语、皆成箴言”的哲学家。",
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
    question: "下属犯错影响进度，但他确实家里遇到了极大变故，你会处罚吗？",
    a: "给予关怀和支持，不忍心按规矩冰冷惩罚",
    b: "同情归同情，但处罚要按规则处理“公事公办”",
  },
  {
    question: "你会把匿名票投给哪位演讲嘉宾？",
    a: "观点与我一致但似曾相识的陌生人",
    b: "观点与我矛盾但关系融洽的好友",
  },
  {
    question: "团队遇到危机，进度严重滞后，成员们情绪低落，你作为负责人会？",
    a: "制定流程和标准重启效率",
    b: "解决人心和凝聚力重振士气",
  },
  {
    question: "你捍卫自己哪条底线？",
    a: "利益不被他人裹挟",
    b: "好恶不随世俗逐流",
  },
  {
    question: "面对一个“实践证明有效，但底层逻辑矛盾”的方案，你的本能反应是？",
    a: "管用就行，拿到结果最重要，懒得死磕逻辑瑕疵",
    b: "有点难受，想把它背后的逻辑推导顺了",
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
    question: "看到别人皱眉或面露不悦，你会下意识地留意吗？",
    a: "难免留心在意，甚至见不得别人受苦",
    b: "鲜少关心重视，“子非鱼焉知鱼之乐”",
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
        ? ["Q_FINAL_GROUP_1_1", "Q_FINAL_GROUP_2_1"]
        : ["Q_FINAL_GROUP_3_1", "Q_FINAL_GROUP_4_1"];
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
  question: "请选择你的神祇：",
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
    question: "请选择你的神祇：",
    detail: "请选择神祇，遵循本心答题。",
    a: deitySelectionOption(5, nextQuestionId),
    b: deitySelectionOption(6, nextQuestionId),
    c: deitySelectionOption(7, nextQuestionId),
    d: deitySelectionOption(8, nextQuestionId),
    internalNote: `第二步选神；第一步获胜神祇=${firstWinnerId}；选择本身计一分。`,
  });
}

type FinalGroup = 1 | 2 | 3 | 4;
type FinalBranch = "A" | "B";

type FinalOrderSeed = {
  firstPhrase: string;
  secondPhrase: string;
  results: Readonly<Record<"A" | "B", string>>;
};

type FinalGroupSeed = {
  questions: readonly [
    BinaryQuestionSeed,
    BinaryQuestionSeed,
    BinaryQuestionSeed,
    BinaryQuestionSeed,
  ];
  orders: Readonly<Record<FinalBranch, FinalOrderSeed>>;
};

function makeFinalGroupQuestions(
  group: FinalGroup,
  seed: FinalGroupSeed,
): QuestionNode[] {
  const scoredQuestions = seed.questions.map((questionSeed, index) => {
    const ordinal = index + 1;
    const isLast = ordinal === seed.questions.length;
    const id = `Q_FINAL_GROUP_${group}_${ordinal}`;
    const nextQuestionId = isLast
      ? undefined
      : `Q_FINAL_GROUP_${group}_${ordinal + 1}`;
    return makeQuestion({
      id,
      question: questionSeed.question,
      a: { title: questionSeed.a, nextQuestionId },
      b: { title: questionSeed.b, nextQuestionId },
      stage: "calibration",
      dynamicRoute: isLast ? "final-majority" : undefined,
      dynamicNextQuestionIds: isLast
        ? [
            `Q_FINAL_GROUP_${group}_ORDER_A`,
            `Q_FINAL_GROUP_${group}_ORDER_B`,
          ]
        : undefined,
      internalNote: `Final group ${group}; score question ${ordinal}`,
    });
  });

  const orderQuestions = (["A", "B"] as const).map((branch) => {
    const order = seed.orders[branch];
    return makeQuestion({
      id: `Q_FINAL_GROUP_${group}_ORDER_${branch}`,
      question: "填空题：XX是服务于XX",
      a: {
        title: `${order.firstPhrase}是服务于${order.secondPhrase}`,
        terminal: true,
        calibrationTypeId: order.results.A,
      },
      b: {
        title: `${order.secondPhrase}是服务于${order.firstPhrase}`,
        terminal: true,
        calibrationTypeId: order.results.B,
      },
      stage: "calibration",
      internalNote: `Final group ${group}; majority branch ${branch}`,
    });
  });

  return [...scoredQuestions, ...orderQuestions];
}

const firstRoundScoreQuestions = makeFirstRoundScoreQuestions();
const secondRoundNodes = firstRoundDeityIds.flatMap((firstWinnerId) => [
  makeSecondRoundSelection(firstWinnerId),
  ...makeSecondRoundScoreQuestions(firstWinnerId),
]);

const finalGroupSeeds: Readonly<Record<FinalGroup, FinalGroupSeed>> = {
  1: {
    questions: [
      {
        question: "哪一个对你更重要？",
        a: "体验享乐",
        b: "协调规划到完成任务",
      },
      {
        question: "哪一个对你更重要？",
        a: "倾听内心的喜好和感受",
        b: "想象预测",
      },
      {
        question: "哪一个更令你不适？",
        a: "细菌病毒或噩运缠身",
        b: "情绪崩溃失控",
      },
      {
        question: "哪一个更令你不适？",
        a: "加班到没有个人生活",
        b: "喧闹嘈杂到无法思考",
      },
    ],
    orders: {
      A: {
        firstPhrase: "倾听内心的喜好和感受",
        secondPhrase: "体验享乐",
        results: { A: "ESFP", B: "ISFP" },
      },
      B: {
        firstPhrase: "想象预测",
        secondPhrase: "协调规划到完成任务",
        results: { A: "ENTJ", B: "INTJ" },
      },
    },
  },
  2: {
    questions: [
      {
        question: "哪一个对你更重要？",
        a: "体验享乐",
        b: "肯定他人并与之共情",
      },
      {
        question: "哪一个对你更重要？",
        a: "推敲命名达成深度理解",
        b: "想象预测",
      },
      {
        question: "哪一个更令你不适？",
        a: "细菌病毒或噩运缠身",
        b: "被指责或质疑“逻辑不通”",
      },
      {
        question: "哪一个更令你不适？",
        a: "高强度令人窒息的社交",
        b: "喧闹嘈杂到无法思考",
      },
    ],
    orders: {
      A: {
        firstPhrase: "推敲命名达成深度理解",
        secondPhrase: "体验享乐",
        results: { A: "ESTP", B: "ISTP" },
      },
      B: {
        firstPhrase: "想象预测",
        secondPhrase: "肯定他人并与之共情",
        results: { A: "ENFJ", B: "INFJ" },
      },
    },
  },
  3: {
    questions: [
      {
        question: "哪一个对你更重要？",
        a: "奇思妙想到创意涌现",
        b: "协调规划到完成任务",
      },
      {
        question: "哪一个对你更重要？",
        a: "倾听内心的喜好和感受",
        b: "验证复盘",
      },
      {
        question: "哪一个更令你不适？",
        a: "机械重复的日常工作",
        b: "情绪崩溃失控",
      },
      {
        question: "哪一个更令你不适？",
        a: "加班到没有个人生活",
        b: "混乱",
      },
    ],
    orders: {
      A: {
        firstPhrase: "倾听内心的喜好和感受",
        secondPhrase: "奇思妙想到创意涌现",
        results: { A: "ENFP", B: "INFP" },
      },
      B: {
        firstPhrase: "验证复盘",
        secondPhrase: "协调规划到完成任务",
        results: { A: "ESTJ", B: "ISTJ" },
      },
    },
  },
  4: {
    questions: [
      {
        question: "哪一个对你更重要？",
        a: "奇思妙想到创意涌现",
        b: "肯定他人并与之共情",
      },
      {
        question: "哪一个对你更重要？",
        a: "推敲命名达成深度理解",
        b: "验证复盘",
      },
      {
        question: "哪一个更令你不适？",
        a: "机械重复的日常工作",
        b: "被指责或质疑“逻辑不通”",
      },
      {
        question: "哪一个更令你不适？",
        a: "高强度令人窒息的社交",
        b: "混乱",
      },
    ],
    orders: {
      A: {
        firstPhrase: "推敲命名达成深度理解",
        secondPhrase: "奇思妙想到创意涌现",
        results: { A: "ENTP", B: "INTP" },
      },
      B: {
        firstPhrase: "验证复盘",
        secondPhrase: "肯定他人并与之共情",
        results: { A: "ESFJ", B: "ISFJ" },
      },
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
