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
  typeHintId?: string;
  calibrationTypeId?: string;
  requiresRetest?: boolean;
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
  consistencyGroupId?: string;
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
    typeHintId: seed.typeHintId,
    calibrationTypeId: seed.calibrationTypeId,
    requiresRetest: seed.requiresRetest,
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
    consistencyGroupId: seed.consistencyGroupId,
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
    question: "健康无恙时你更喜欢？",
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
    question: "对“未来与记忆”的生理本能更接近？",
    a: "对未来莫名忧心忡忡，自然会把痛苦记忆塞到脑海角落",
    b: "对未来大多持积极心态，但质疑权威和历史的作用",
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
    question:
      "回忆一段数年前还清晰的记忆切片，你脑海里的画面更接近（注：少数人是音频，无画面）",
    a: "纪录片，清晰且牢固，甚至还能重现当时的细节或氛围",
    b: "抽象画，细节早已褪色，只剩下某种模糊的感觉和轮廓。",
  },
];

const secondRoundQuestions: readonly BinaryQuestionSeed[] = [
  {
    question: "你捍卫自己哪条底线？",
    a: "利益不被他人裹挟",
    b: "好恶不随世俗逐流",
  },
  {
    question: "如果意外捡到一块奇石，你会如何思考？",
    a: "考虑使用奇石，比如收藏或拍卖",
    b: "思考本质，奇石是什么？从哪来？有没有危险或价值？",
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
    const finalGroupsByFirstWinner = {
      1: ["Q_FINAL_GROUP_1_1", "Q_FINAL_GROUP_3_1"],
      2: ["Q_FINAL_GROUP_5_1", "Q_FINAL_GROUP_7_1"],
      3: ["Q_FINAL_GROUP_6_1", "Q_FINAL_GROUP_8_1"],
      4: ["Q_FINAL_GROUP_2_1", "Q_FINAL_GROUP_4_1"],
    } as const satisfies Readonly<
      Record<FirstRoundDeityId, readonly [string, string]>
    >;
    return makeQuestion({
      id,
      question: seed.question,
      a: { title: seed.a, nextQuestionId },
      b: { title: seed.b, nextQuestionId },
      dynamicRoute: isLast ? "second-round-score" : undefined,
      dynamicNextQuestionIds: isLast
        ? [...finalGroupsByFirstWinner[firstWinnerId]]
        : undefined,
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

type FinalQuestionGroup = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type FinalBinarySeed = BinaryQuestionSeed & {
  resultTypeIds: readonly [string, string];
};

type FinalFourOptionSeed = {
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  resultTypeIds: readonly [string, string, string, string];
};

type FinalGroupSeed = {
  first: BinaryQuestionSeed;
  direct: FinalBinarySeed;
  fallback: FinalFourOptionSeed;
};

function makeFinalGroupQuestions(
  group: FinalQuestionGroup,
  seed: FinalGroupSeed,
): QuestionNode[] {
  const consistencyGroupId = `FINAL_GROUP_${group}`;
  const prefix = `Q_FINAL_GROUP_${group}`;
  const common = {
    stage: "calibration" as const,
    consistencyGroupId,
  };
  const terminalOption = (
    title: string,
    resultTypeId: string,
  ): OptionSeed => ({
    title,
    terminal: true,
    calibrationTypeId: resultTypeId,
    internalNote: `result=${resultTypeId}`,
  });

  return [
    makeQuestion({
      id: `${prefix}_1`,
      question: seed.first.question,
      a: { title: seed.first.a, nextQuestionId: `${prefix}_2` },
      b: { title: seed.first.b, nextQuestionId: `${prefix}_3` },
      ...common,
      internalNote: `Final group ${group}; A→2; B→3`,
    }),
    makeQuestion({
      id: `${prefix}_2`,
      question: seed.direct.question,
      a: terminalOption(seed.direct.a, seed.direct.resultTypeIds[0]),
      b: terminalOption(seed.direct.b, seed.direct.resultTypeIds[1]),
      ...common,
      internalNote: `Final group ${group}; two-option terminal`,
    }),
    makeQuestion({
      id: `${prefix}_3`,
      question: seed.fallback.question,
      a: terminalOption(seed.fallback.a, seed.fallback.resultTypeIds[0]),
      b: terminalOption(seed.fallback.b, seed.fallback.resultTypeIds[1]),
      c: terminalOption(seed.fallback.c, seed.fallback.resultTypeIds[2]),
      d: terminalOption(seed.fallback.d, seed.fallback.resultTypeIds[3]),
      ...common,
      internalNote: `Final group ${group}; four-option terminal`,
    }),
  ];
}

const firstRoundScoreQuestions = makeFirstRoundScoreQuestions();
const secondRoundNodes = firstRoundDeityIds.flatMap((firstWinnerId) => [
  makeSecondRoundSelection(firstWinnerId),
  ...makeSecondRoundScoreQuestions(firstWinnerId),
]);

const finalGroupSeeds: Readonly<Record<FinalQuestionGroup, FinalGroupSeed>> = {
  1: {
    first: { question: "最接近你核心本能的是？", a: "体验享乐与倾听内心", b: "执行规划与想象洞察" },
    direct: { question: "符合你内心过程的描述是？", a: "倾听内心是为了体验享乐", b: "参与体验是为了内心价值", resultTypeIds: ["ESFP", "ISFP"] },
    fallback: { question: "下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", a: "体验享乐", b: "内心价值", c: "完成任务", d: "洞察预测", resultTypeIds: ["ESFP", "ISFP", "ENTJ", "INTJ"] },
  },
  2: {
    first: { question: "最接近你核心本能的是？", a: "执行规划与想象洞察", b: "体验享乐与倾听内心" },
    direct: { question: "符合你内心过程的描述是？", a: "想象洞察是为了完成任务", b: "规划工作是为了洞察预测", resultTypeIds: ["ENTJ", "INTJ"] },
    fallback: { question: "下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", a: "体验享乐", b: "内心价值", c: "完成任务", d: "洞察预测", resultTypeIds: ["ESFP", "ISFP", "ENTJ", "INTJ"] },
  },
  3: {
    first: { question: "最接近你核心本能的是？", a: "体验享乐与拆解逻辑", b: "肯定赞美他人与想象洞察" },
    direct: { question: "符合你内心过程的描述是？", a: "拆解逻辑是为了体验享受", b: "参与体验是为了理解底层原理", resultTypeIds: ["ESTP", "ISTP"] },
    fallback: { question: "下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", a: "体验享乐", b: "理解底层原理", c: "与他人共情并建立联结", d: "洞察预测", resultTypeIds: ["ESTP", "ISTP", "ENFJ", "INFJ"] },
  },
  4: {
    first: { question: "最接近你核心本能的是？", a: "肯定赞美他人与想象洞察", b: "体验享乐与拆解逻辑" },
    direct: { question: "符合你内心过程的描述是？", a: "想象洞察是为了与他人共情并建立联结", b: "肯定赞美他人是为了洞察预测", resultTypeIds: ["ENFJ", "INFJ"] },
    fallback: { question: "下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", a: "体验享乐", b: "理解底层原理", c: "与他人共情并建立联结", d: "洞察预测", resultTypeIds: ["ESTP", "ISTP", "ENFJ", "INFJ"] },
  },
  5: {
    first: { question: "最接近你核心本能的是？", a: "灵感涌现与倾听内心", b: "执行规划与验证复盘" },
    direct: { question: "符合你内心过程的描述是？", a: "倾听内心是为了灵感涌现", b: "灵感涌现是为了内心价值", resultTypeIds: ["ENFP", "INFP"] },
    fallback: { question: "下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", a: "灵感涌现", b: "内心价值", c: "完成任务", d: "验证复盘", resultTypeIds: ["ENFP", "INFP", "ESTJ", "ISTJ"] },
  },
  6: {
    first: { question: "最接近你核心本能的是？", a: "执行规划与验证复盘", b: "灵感涌现与倾听内心" },
    direct: { question: "符合你内心过程的描述是？", a: "验证复盘是为了执行规划", b: "执行规划是为了验证复盘", resultTypeIds: ["ESTJ", "ISTJ"] },
    fallback: { question: "下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", a: "灵感涌现", b: "内心价值", c: "完成任务", d: "验证复盘", resultTypeIds: ["ENFP", "INFP", "ESTJ", "ISTJ"] },
  },
  7: {
    first: { question: "最接近你核心本能的是？", a: "灵感涌现与拆解逻辑", b: "肯定赞美他人与验证复盘" },
    direct: { question: "符合你内心过程的描述是？", a: "拆解逻辑是为了灵感涌现", b: "灵感涌现是为了理解底层原理", resultTypeIds: ["ENTP", "INTP"] },
    fallback: { question: "下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", a: "灵感涌现", b: "理解底层原理", c: "与他人共情并建立联结", d: "验证复盘", resultTypeIds: ["ENTP", "INTP", "ESFJ", "ISFJ"] },
  },
  8: {
    first: { question: "最接近你核心的本能的是？", a: "肯定赞美他人与验证复盘", b: "拆解逻辑与灵感涌现" },
    direct: { question: "符合你内心过程的描述是？", a: "验证复盘是为了与他人共情并建立联结", b: "肯定赞美他人与验证复盘", resultTypeIds: ["ESFJ", "ISFJ"] },
    fallback: { question: "下列哪一项符合你日常自发且能获得最深层满足感的心理状态？", a: "灵感涌现", b: "理解底层原理", c: "与与他人共情并建立联结", d: "验证复盘", resultTypeIds: ["ENTP", "INTP", "ESFJ", "ISFJ"] },
  },
};

const finalQuestions = ([1, 2, 3, 4, 5, 6, 7, 8] as const).flatMap((group) =>
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
