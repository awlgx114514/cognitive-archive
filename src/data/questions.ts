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
    question: "哪个在你心中更有份量？",
    a: "解决问题",
    b: "获得他人认可",
  },
  {
    question: "平等和自由的价值观重要吗？",
    a: "无所谓",
    b: "重要",
  },
  {
    question: "对企业来说哪个重要？",
    a: "效率与降本增效",
    b: "信誉与社会责任",
  },
  {
    question: "哪个为人处世的原则令你坚守或信赖？",
    a: "利益取舍",
    b: "善恶观念",
  },
  {
    question: "遇到问题你习惯？",
    a: "旁征博引",
    b: "独出己见",
  },
  {
    question: "更令你讨厌的是？",
    a: "自私冷漠",
    b: "虚伪做作",
  },
  {
    question: "如果意外捡到一块奇石，你会如何思考？",
    a: "考虑使用奇石，比如收藏或拍卖",
    b: "思考本质，奇石是什么？从哪来？有没有危险或价值？",
  },
  {
    question: "当你发现自己的爱好不被世俗或社会认同",
    a: "难免不适",
    b: "感觉更好",
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
        ? ["Q_FINAL_GROUP_1", "Q_FINAL_GROUP_2"]
        : ["Q_FINAL_GROUP_3", "Q_FINAL_GROUP_4"];
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

function makeFinalQuestion(
  group: 1 | 2 | 3 | 4,
  prompt: string,
  options: readonly [
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
  ],
): QuestionNode {
  const [a, b, c, d] = options;
  const id = `Q_FINAL_GROUP_${group}`;
  return {
    id,
    traceCode: `ARC-FINAL-GROUP-${group}`,
    shortQuestion: prompt,
    question: prompt,
    options: {
      A: terminalOption("A", a[0], a[1]),
      B: terminalOption("B", b[0], b[1]),
      C: terminalOption("C", c[0], c[1]),
      D: terminalOption("D", d[0], d[1]),
    },
    allowUncertain: false,
    transitionSceneId: transitionSceneIdForQuestion(id),
    stage: "calibration",
    internalNote: `Final group ${group}`,
  };
}

const firstRoundScoreQuestions = makeFirstRoundScoreQuestions();
const secondRoundNodes = firstRoundDeityIds.flatMap((firstWinnerId) => [
  makeSecondRoundSelection(firstWinnerId),
  ...makeSecondRoundScoreQuestions(firstWinnerId),
]);

const finalQuestions: QuestionNode[] = [
  makeFinalQuestion(1, "最令你恐惧的是：", [
    ["细菌病毒", "ESFP"],
    ["情绪崩溃", "ENTJ"],
    ["嘈杂噪音的环境/“恐高”（悬崖距离三四米）", "INTJ"],
    ["工作重负/被迫强制命令他人", "ISFP"],
  ]),
  makeFinalQuestion(2, "最令你恐惧的是：", [
    ["未来噩运缠身", "ESTP"],
    ["被指责或质疑“逻辑不通”", "ENFJ"],
    ["嘈杂噪音的环境/“恐高”（悬崖距离三四米）", "INFJ"],
    ["高强度令人窒息的社交", "ISTP"],
  ]),
  makeFinalQuestion(3, "令你最恐惧的是：", [
    ["机械重复的日常工作", "ENFP"],
    ["情绪崩溃", "ESTJ"],
    ["混乱", "ISTJ"],
    ["工作重负/被迫强制命令他人", "INFP"],
  ]),
  makeFinalQuestion(4, "令你最恐惧的是：", [
    ["机械重复的日常工作", "ENTP"],
    ["被指责或质疑“逻辑不通”", "ESFJ"],
    ["混乱", "ISFJ"],
    ["高强度令人窒息的社交", "INTP"],
  ]),
];

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
