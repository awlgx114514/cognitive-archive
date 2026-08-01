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
type FinalCandidateOptionId = "A" | "B" | "C" | "D";
type FinalCalibrationOptionId = "A" | "B";

type FinalCandidateSeed = {
  title: string;
  text: string;
  resultTypeId: string;
  calibrationAnswer: FinalCalibrationOptionId;
};

type FinalGroupSeed = {
  candidates: Readonly<Record<FinalCandidateOptionId, FinalCandidateSeed>>;
  calibrationOptions: Readonly<
    Record<FinalCalibrationOptionId, string>
  >;
};

function makeFinalGroupQuestions(
  group: FinalGroup,
  seed: FinalGroupSeed,
): QuestionNode[] {
  const consistencyGroupId = `FINAL_GROUP_${group}`;
  const candidateOption = (candidateId: FinalCandidateOptionId): OptionSeed => {
    const candidate = seed.candidates[candidateId];
    return {
      title: candidate.title,
      text: candidate.text,
      nextQuestionId: `Q_FINAL_GROUP_${group}_CAL_${candidateId}`,
      typeHintId: candidate.resultTypeId,
      internalNote: `candidate=${candidate.resultTypeId}`,
    };
  };
  const candidateQuestion = makeQuestion({
    id: `Q_FINAL_GROUP_${group}_1`,
    question:
      "在日常生活中，下列哪一种状态最能代表你最核心、最不假思索的心理本能与安全感来源？",
    a: candidateOption("A"),
    b: candidateOption("B"),
    c: candidateOption("C"),
    d: candidateOption("D"),
    stage: "calibration",
    consistencyGroupId,
    internalNote: `Final group ${group}; candidate question`,
  });

  const calibrationQuestions = (
    ["A", "B", "C", "D"] as const
  ).map((candidateId) => {
    const candidate = seed.candidates[candidateId];
    const calibrationOption = (
      optionId: FinalCalibrationOptionId,
    ): OptionSeed => ({
      title: seed.calibrationOptions[optionId],
      terminal: true,
      calibrationTypeId: candidate.resultTypeId,
      requiresRetest: optionId !== candidate.calibrationAnswer,
      internalNote:
        optionId === candidate.calibrationAnswer
          ? `calibration-pass=${candidate.resultTypeId}`
          : `calibration-retest=${candidate.resultTypeId}`,
    });
    return makeQuestion({
      id: `Q_FINAL_GROUP_${group}_CAL_${candidateId}`,
      question: "【潜意识校对】下列哪一组更令你不适？",
      a: calibrationOption("A"),
      b: calibrationOption("B"),
      stage: "calibration",
      consistencyGroupId,
      internalNote: `Final group ${group}; candidate=${candidate.resultTypeId}; calibration=${candidate.calibrationAnswer}`,
    });
  });

  return [candidateQuestion, ...calibrationQuestions];
}

const firstRoundScoreQuestions = makeFirstRoundScoreQuestions();
const secondRoundNodes = firstRoundDeityIds.flatMap((firstWinnerId) => [
  makeSecondRoundSelection(firstWinnerId),
  ...makeSecondRoundScoreQuestions(firstWinnerId),
]);

const finalGroupSeeds: Readonly<Record<FinalGroup, FinalGroupSeed>> = {
  1: {
    candidates: {
      A: {
        title: "追求行动与体验享乐",
        text: "极度看重当下的真实感知、刺激与回应，本能地拥抱现实与行动。",
        resultTypeId: "ESFP",
        calibrationAnswer: "A",
      },
      B: {
        title: "追求价值与真我契合",
        text: "极度看重内心的真实喜恶、道德与情感纯粹，本能地坚守个人领地。",
        resultTypeId: "ISFP",
        calibrationAnswer: "A",
      },
      C: {
        title: "追求规划与任务完成",
        text: "极度看重效率、秩序与结果，本能地想去掌控事态、解决问题。",
        resultTypeId: "ENTJ",
        calibrationAnswer: "B",
      },
      D: {
        title: "追求想象与洞察预测",
        text: "极度看重趋势与终极意义，本能地在脑海里捕捉事物的抽象规律与未来演化。",
        resultTypeId: "INTJ",
        calibrationAnswer: "B",
      },
    },
    calibrationOptions: {
      A: "噩运缠身/加班到没有个人生活",
      B: "情绪崩溃失控/喧闹嘈杂到无法思考",
    },
  },
  2: {
    candidates: {
      A: {
        title: "追求行动与体验享乐",
        text: "极度看重当下的真实感知与快速反应，本能地拥抱现实、解决眼前的危机。",
        resultTypeId: "ESTP",
        calibrationAnswer: "A",
      },
      B: {
        title: "追求解构与逻辑自洽",
        text: "极度看重逻辑的严密与精确，本能地想要把事物的底层运作机制拆解明白。",
        resultTypeId: "ISTP",
        calibrationAnswer: "A",
      },
      C: {
        title: "追求道德与他人共情",
        text: "极度看重群体氛围与他人感受，本能地去体贴、照顾周围人的需求。",
        resultTypeId: "ENFJ",
        calibrationAnswer: "B",
      },
      D: {
        title: "追求想象与洞察预测",
        text: "极度看重趋势与终极意义，本能地在脑海里捕捉事物的抽象规律与未来演化。",
        resultTypeId: "INFJ",
        calibrationAnswer: "B",
      },
    },
    calibrationOptions: {
      A: "噩运缠身/高强度令人窒息的社交",
      B: "被指责或质疑“逻辑不通”/喧闹嘈杂到无法思考",
    },
  },
  3: {
    candidates: {
      A: {
        title: "追求创意与奇思妙想",
        text: "极度看重可能性与头脑风暴，本能地用新奇想法去挑战固有观念、打破常规。",
        resultTypeId: "ENFP",
        calibrationAnswer: "A",
      },
      B: {
        title: "追求价值与真我契合",
        text: "极度看重内心的真实喜恶、道德与情感纯粹，本能地坚守个人领地。",
        resultTypeId: "INFP",
        calibrationAnswer: "A",
      },
      C: {
        title: "追求规划与任务完成",
        text: "极度看重效率、秩序与结果，本能地想去掌控事态、解决问题。",
        resultTypeId: "ESTJ",
        calibrationAnswer: "B",
      },
      D: {
        title: "追求安全与验证复盘",
        text: "极度看重细节、既有经验与责任，本能地在熟悉、有秩序的框架里默默守护。",
        resultTypeId: "ISTJ",
        calibrationAnswer: "B",
      },
    },
    calibrationOptions: {
      A: "机械重复的日常工作/加班到没有个人生活",
      B: "情绪崩溃失控/混乱",
    },
  },
  4: {
    candidates: {
      A: {
        title: "追求创意与奇思妙想",
        text: "极度看重可能性与头脑风暴，本能地用新奇想法去挑战固有观念、打破常规。",
        resultTypeId: "ENTP",
        calibrationAnswer: "A",
      },
      B: {
        title: "追求解构与逻辑自洽",
        text: "极度看重逻辑的严密与精确，本能地想要把事物的底层运作机制拆解明白。",
        resultTypeId: "INTP",
        calibrationAnswer: "A",
      },
      C: {
        title: "追求道德与他人共情",
        text: "极度看重群体氛围与他人感受，本能地去体贴、照顾周围人的需求。",
        resultTypeId: "ESFJ",
        calibrationAnswer: "B",
      },
      D: {
        title: "追求安全与验证复盘",
        text: "极度看重细节、既有经验与责任，本能地在熟悉、有秩序的框架里默默守护。",
        resultTypeId: "ISFJ",
        calibrationAnswer: "B",
      },
    },
    calibrationOptions: {
      A: "机械重复的日常工作/高强度令人窒息的社交",
      B: "被指责或质疑“逻辑不通”/混乱",
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
