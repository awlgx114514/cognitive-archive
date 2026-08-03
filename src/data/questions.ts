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
    question:
      "当团队遇到危机，进度严重滞后，成员们情绪低落，你作为负责人会？",
    a: "制定流程和标准重启效率",
    b: "解决人心和凝聚力重振士气",
  },
  {
    question: "你会把匿名票投给哪位演讲嘉宾？",
    a: "观点与我一致但似曾相识的陌生人",
    b: "观点与我矛盾但关系融洽的好友",
  },
  {
    question: "公司机构臃肿，上层勾心斗角，你会如何力挽狂澜？",
    a: "裁员，调研清楚后果断裁员，不惜把一整个部门裁撤",
    b: "替换，跨部门人员调整，把有能力有工作热情的人换上来，悄无声息地完成权力交接。",
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

type FinalBinarySeed = BinaryQuestionSeed & {
  resultTypeIds?: readonly [string, string];
};

type FinalGroupSeed = {
  first: FinalBinarySeed;
  second: FinalBinarySeed;
  directA: FinalBinarySeed;
  directB: FinalBinarySeed;
  mixed: FinalBinarySeed;
  mixedA: FinalBinarySeed;
  mixedB: FinalBinarySeed;
};

function makeFinalGroupQuestions(
  group: FinalGroup,
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
  const terminalQuestion = (
    suffix: "3_1" | "3_2" | "4_1" | "4_2",
    terminalSeed: FinalBinarySeed,
  ): QuestionNode => {
    const resultTypeIds = terminalSeed.resultTypeIds;
    if (!resultTypeIds) {
      throw new Error(`Final group ${group} ${suffix} is missing result mappings.`);
    }
    return makeQuestion({
      id: `${prefix}_${suffix}`,
      question: terminalSeed.question,
      a: terminalOption(terminalSeed.a, resultTypeIds[0]),
      b: terminalOption(terminalSeed.b, resultTypeIds[1]),
      ...common,
      internalNote: `Final group ${group}; terminal=${suffix}`,
    });
  };

  const first = makeQuestion({
    id: `Q_FINAL_GROUP_${group}_1`,
    question: seed.first.question,
    a: { title: seed.first.a, nextQuestionId: `${prefix}_2` },
    b: { title: seed.first.b, nextQuestionId: `${prefix}_2` },
    ...common,
    internalNote: `Final group ${group}; answer-pair=first`,
  });
  const second = makeQuestion({
    id: `${prefix}_2`,
    question: seed.second.question,
    a: { title: seed.second.a },
    b: { title: seed.second.b },
    dynamicRoute: "final-answer-pair",
    dynamicNextQuestionIds: [
      `${prefix}_3_1`,
      `${prefix}_3_2`,
      `${prefix}_3_3`,
    ],
    ...common,
    internalNote: `Final group ${group}; answer-pair=second; aa→3.1; bb→3.2; ab/ba→3.3`,
  });
  const mixed = makeQuestion({
    id: `${prefix}_3_3`,
    question: seed.mixed.question,
    a: { title: seed.mixed.a, nextQuestionId: `${prefix}_4_1` },
    b: { title: seed.mixed.b, nextQuestionId: `${prefix}_4_2` },
    ...common,
    internalNote: `Final group ${group}; mixed branch`,
  });

  return [
    first,
    second,
    terminalQuestion("3_1", seed.directA),
    terminalQuestion("3_2", seed.directB),
    mixed,
    terminalQuestion("4_1", seed.mixedA),
    terminalQuestion("4_2", seed.mixedB),
  ];
}

const firstRoundScoreQuestions = makeFirstRoundScoreQuestions();
const secondRoundNodes = firstRoundDeityIds.flatMap((firstWinnerId) => [
  makeSecondRoundSelection(firstWinnerId),
  ...makeSecondRoundScoreQuestions(firstWinnerId),
]);

const finalGroupSeeds: Readonly<Record<FinalGroup, FinalGroupSeed>> = {
  1: {
    first: { question: "最接近你最核心的本能的是？", a: "倾听内心与体验享乐", b: "执行规划与想象洞察" },
    second: { question: "令你更恐惧的一组是？", a: "未来噩运缠身＆工作重负到过载", b: "情绪崩溃失控＆嘈杂到大脑宕机" },
    directA: { question: "符合你内心过程的描述是？", a: "倾听内心是为了体验享乐", b: "参与体验是为了内心价值", resultTypeIds: ["ESFP", "ISFP"] },
    directB: { question: "符合你内心过程的描述是？", a: "想象洞察是为了完成任务", b: "规划工作是为了洞察预测", resultTypeIds: ["ENTJ", "INTJ"] },
    mixed: { question: "最接近你最核心的本能的是？", a: "体验享乐与执行规划", b: "倾听内心与想象洞察" },
    mixedA: { question: "令你更恐惧的是？", a: "未来噩运缠身", b: "情绪崩溃失控", resultTypeIds: ["ESFP", "ENTJ"] },
    mixedB: { question: "令你更恐惧的是？", a: "工作重负到过载", b: "嘈杂到大脑宕机", resultTypeIds: ["ISFP", "INTJ"] },
  },
  2: {
    first: { question: "最接近你最核心的本能的是？", a: "拆解逻辑与体验享乐", b: "想象洞察与肯定赞美他人" },
    second: { question: "令你更恐惧的一组是？", a: "未来噩运缠身＆社交过载", b: "说出伤害他人的真话＆嘈杂到大脑宕机" },
    directA: { question: "符合你内心过程的描述是？", a: "拆解逻辑是为了体验享受", b: "参与体验是为了理解底层原理", resultTypeIds: ["ESTP", "ISTP"] },
    directB: { question: "符合你内心过程的描述是？", a: "想象洞察是为了与他人联结", b: "肯定赞美他人是为了洞察预测", resultTypeIds: ["ENFJ", "INFJ"] },
    mixed: { question: "最接近你最核心的本能的是？", a: "体验享乐与肯定赞美他人", b: "拆解逻辑与想象洞察" },
    mixedA: { question: "令你更恐惧的是？", a: "未来噩运缠身", b: "说出伤害他人的真话", resultTypeIds: ["ESTP", "ENFJ"] },
    mixedB: { question: "令你更恐惧的是？", a: "社交过载", b: "嘈杂到大脑宕机", resultTypeIds: ["ISTP", "INFJ"] },
  },
  3: {
    first: { question: "最接近你最核心的本能的是？", a: "倾听内心与灵感涌现", b: "执行规划与验证复盘" },
    second: { question: "令你更恐惧的一组是？", a: "重复机械的日常工作＆工作重负到过载", b: "情绪崩溃失控＆混乱" },
    directA: { question: "符合你内心过程的描述是？", a: "倾听内心是为了灵感涌现", b: "灵感涌现是为了内心价值", resultTypeIds: ["ENFP", "INFP"] },
    directB: { question: "符合你内心过程的描述是？", a: "验证复盘是为了完成任务", b: "效率规划是为了验证复盘", resultTypeIds: ["ESTJ", "ISTJ"] },
    mixed: { question: "最接近你最核心的本能的是？", a: "灵感涌现与执行规划", b: "倾听内心与验证复盘" },
    mixedA: { question: "令你更恐惧的是？", a: "重复机械的日常工作", b: "情绪崩溃失控", resultTypeIds: ["ENFP", "ESTJ"] },
    mixedB: { question: "令你更恐惧的是？", a: "工作重负到过载", b: "混乱", resultTypeIds: ["INFP", "ISTJ"] },
  },
  4: {
    first: { question: "最接近你最核心的本能的是？", a: "拆解逻辑与灵感涌现", b: "肯定赞美他人与验证复盘" },
    second: { question: "令你更恐惧的一组是？", a: "重复机械的日常工作＆社交过载", b: "说出伤害他人的真话＆混乱" },
    directA: { question: "符合你内心过程的描述是？", a: "拆解逻辑是为了灵感涌现", b: "灵感涌现是为了理解底层原理", resultTypeIds: ["ENTP", "INTP"] },
    directB: { question: "符合你内心过程的描述是？", a: "验证复盘是为了联结他人", b: "赞美肯定他人是为了验证复盘", resultTypeIds: ["ESFJ", "ISFJ"] },
    mixed: { question: "最接近你最核心的本能的是？", a: "灵感涌现与赞美肯定他人", b: "拆解逻辑与验证复盘" },
    mixedA: { question: "令你更恐惧的是？", a: "重复机械的日常工作", b: "说出伤害他人的真话", resultTypeIds: ["ENTP", "ESFJ"] },
    mixedB: { question: "令你更恐惧的是？", a: "社交过载", b: "混乱", resultTypeIds: ["INTP", "ISFJ"] },
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
