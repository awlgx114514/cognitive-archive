import type {
  AnswerOption,
  AnswerOptionId,
  QuestionNode,
  QuestionStage,
} from "../types/test";

type OptionSeed = {
  title: string;
  text: string;
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
  optionRevealDelayMs?: number;
  a: OptionSeed;
  b: OptionSeed;
  c?: OptionSeed;
  stage?: QuestionStage;
  dimensionTags?: QuestionNode["dimensionTags"];
  consistencyGroupId?: string;
  internalNote?: string;
};

export function transitionSceneIdForQuestion(questionId: string): string {
  return `scene-${questionId.toLowerCase().replaceAll("_", "-")}`;
}

function makeOption(id: AnswerOptionId, seed: OptionSeed): AnswerOption {
  return {
    id,
    title: seed.title,
    text: seed.text,
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
    question:
      seed.detail ?? "请按第一反应作答；这里没有更体面或更正确的选项。",
    optionRevealDelayMs: seed.optionRevealDelayMs,
    options: {
      A: makeOption("A", seed.a),
      B: makeOption("B", seed.b),
      ...(seed.c ? { C: makeOption("C", seed.c) } : {}),
    },
    allowUncertain: false,
    transitionSceneId: transitionSceneIdForQuestion(seed.id),
    dimensionTags: seed.dimensionTags,
    stage: seed.stage ?? "core",
    consistencyGroupId: seed.consistencyGroupId,
    internalNote: seed.internalNote,
  };
}

function vote(
  typeHintId: string,
  title: string,
  text: string,
  nextQuestionId: string,
): OptionSeed {
  return {
    title,
    text,
    nextQuestionId,
    typeHintId,
  };
}

function calibrated(
  typeHintId: string,
  title: string,
  text: string,
): OptionSeed {
  return {
    title,
    text,
    terminal: true,
    calibrationTypeId: typeHintId,
  };
}

function directCalibration(
  id: string,
  typeHintId: string,
  desire: string,
  dimensionTags: QuestionNode["dimensionTags"],
): QuestionNode {
  return makeQuestion({
    id,
    question: `“${desire}”，接近你内心最深层的心理欲望吗？`,
    detail: "这是一道校准题。若答案是否定的，本次路径将被标记为需要重测。",
    stage: "calibration",
    dimensionTags,
    a: calibrated(typeHintId, "是", "这句话准确触及了我的深层驱动力。"),
    b: {
      ...calibrated(typeHintId, "否", "这并不符合我的深层驱动力。"),
      requiresRetest: true,
      internalNote: "Q_RETEST: explicit calibration rejection.",
    },
  });
}

function makeStoneQuestion(
  id: "Q_STONE_A" | "Q_STONE_B" | "Q_STONE_C",
  nextA: string,
  nextB: string,
): QuestionNode {
  return makeQuestion({
    id,
    stage: "screening",
    question:
      "请想象：你在河边突然发现一块颜色、形状都很奇异的石头。写下第一反应后，你的念头更接近哪一类？",
    detail: "请先写下或记住第一反应，不要提前推敲一个理想答案。",
    optionRevealDelayMs: 3000,
    a: {
      title: "思考如何使用这块石头",
      text: "例如拍卖、收藏，或设想它能被怎样使用。",
      nextQuestionId: nextA,
    },
    b: {
      title: "思考这块石头的本质",
      text: "例如它是什么、从哪里来、是否有辐射或价值，也可能想到赠送他人。",
      nextQuestionId: nextB,
    },
    internalNote: `Second screening node for prefix ${id.at(-1)?.toLowerCase()}.`,
  });
}

/**
 * Static DEMO bank implementing the supplied decision tree.
 *
 * The first two answers produce exactly one prefix: aa / ab / ba / bb / ca / cb.
 * Later A/B choices add candidate votes. Pair calibration is compared with those
 * votes by calculateResult; a disagreement is returned as needsRetest=true.
 */
export const questions: QuestionNode[] = [
  makeQuestion({
    id: "Q_START",
    stage: "screening",
    question:
      "请闭上双眼，你脑海中的记忆片段像静态的相片？还是动态的电影（或音频），仿佛重新置身其中？",
    detail: "选择最接近你自然回忆状态的一项。",
    a: {
      title: "相片",
      text: "记忆更像一幅静止画面。",
      nextQuestionId: "Q_STONE_A",
    },
    b: {
      title: "电影",
      text: "记忆会连续展开，像电影片段或一段声音。",
      nextQuestionId: "Q_STONE_B",
    },
    c: {
      title: "能动，太短点，就几秒。",
      text: "片段会动，却通常只有几秒。",
      nextQuestionId: "Q_STONE_C",
    },
    internalNote: "First screening answer contributes the first path letter.",
  }),

  makeStoneQuestion("Q_STONE_A", "Q_AA_3", "Q_AB_3"),
  makeStoneQuestion("Q_STONE_B", "Q_BA_3", "Q_BB_3"),
  makeStoneQuestion("Q_STONE_C", "Q_CA_CAL", "Q_CB_CAL"),

  // aa → ESFP / ISFP / ENTJ / INTJ
  makeQuestion({
    id: "Q_AA_3",
    question: "你更重视亲身体验、活在当下，还是更重视未来与长远规划？",
    a: {
      title: "体验当下",
      text: "我更自然地进入眼前可感知的生活。",
      nextQuestionId: "Q_AA_SE_4",
    },
    b: {
      title: "规划未来",
      text: "我更自然地将注意力放到未来方向与长远安排。",
      nextQuestionId: "Q_AA_NT_4",
    },
  }),
  makeQuestion({
    id: "Q_AA_SE_4",
    question: "你是否害怕细菌或病毒？",
    consistencyGroupId: "CAL-AA-SE",
    a: vote("ESFP", "是", "我会本能地担心细菌或病毒。", "Q_AA_SE_5"),
    b: vote("ISFP", "否", "我通常不会因此害怕。", "Q_AA_SE_5"),
    dimensionTags: ["Se", "Fi"],
  }),
  makeQuestion({
    id: "Q_AA_SE_5",
    question: "工作的挑战和重担会让你感到害怕吗？",
    consistencyGroupId: "CAL-AA-SE",
    a: vote("ESFP", "不会", "挑战和重担通常不会令我害怕。", "Q_AA_SE_CAL"),
    b: vote("ISFP", "会", "挑战和重担容易让我产生压力或畏惧。", "Q_AA_SE_CAL"),
    dimensionTags: ["Se", "Fi"],
  }),
  makeQuestion({
    id: "Q_AA_SE_CAL",
    question: "哪一个更符合你内心最深层的欲望？",
    detail: "请用这道校准题复核前面的选择。",
    stage: "calibration",
    consistencyGroupId: "CAL-AA-SE",
    a: calibrated("ESFP", "物质享受", "真实、可感的享受与体验。"),
    b: calibrated("ISFP", "找寻内心所爱之物", "忠于真正热爱的事物。"),
    dimensionTags: ["Se", "Fi"],
  }),
  makeQuestion({
    id: "Q_AA_NT_4",
    question: "演唱会和艺术展，哪一个更令你意动？",
    consistencyGroupId: "CAL-AA-NT",
    a: vote("ENTJ", "演唱会", "我更容易被现场演唱会吸引。", "Q_AA_NT_5"),
    b: vote("INTJ", "艺术展", "我更容易被艺术展吸引。", "Q_AA_NT_5"),
    dimensionTags: ["Te", "Ni"],
  }),
  makeQuestion({
    id: "Q_AA_NT_5",
    question: "你容易感到身体疲劳，还是经常不知疲倦地投入工作？",
    consistencyGroupId: "CAL-AA-NT",
    a: vote("ENTJ", "经常不知疲倦", "投入目标后，我常常感觉不到疲倦。", "Q_AA_NT_CAL"),
    b: vote("INTJ", "容易疲劳", "我的身体比较容易出现疲劳感。", "Q_AA_NT_CAL"),
    dimensionTags: ["Te", "Ni"],
  }),
  makeQuestion({
    id: "Q_AA_NT_CAL",
    question: "哪一个更符合你内心最深层的欲望？",
    detail: "请用这道校准题复核前面的选择。",
    stage: "calibration",
    consistencyGroupId: "CAL-AA-NT",
    a: calibrated("ENTJ", "完成工作", "推动任务完成并看见成果。"),
    b: calibrated("INTJ", "预测未来", "洞察未来趋势与可能走向。"),
    dimensionTags: ["Te", "Ni"],
  }),

  // ab → ESTP / ISTP / ENFJ / INFJ
  makeQuestion({
    id: "Q_AB_3",
    question: "你更重视亲身体验、活在当下，还是更重视未来与长远规划？",
    a: {
      title: "体验当下",
      text: "我更自然地进入眼前可感知的生活。",
      nextQuestionId: "Q_AB_ST_4",
    },
    b: {
      title: "规划未来",
      text: "我更自然地将注意力放到未来方向与长远安排。",
      nextQuestionId: "Q_AB_NF_4",
    },
  }),
  makeQuestion({
    id: "Q_AB_ST_4",
    question: "过度社交会令你担心，还是觉得人多热闹很好玩？",
    consistencyGroupId: "CAL-AB-ST",
    a: vote("ESTP", "人多热闹，很好玩", "热闹场合通常让我更兴奋。", "Q_AB_ST_5"),
    b: vote("ISTP", "会担心", "过度社交会让我警惕或消耗。", "Q_AB_ST_5"),
    dimensionTags: ["Se", "Ti"],
  }),
  makeQuestion({
    id: "Q_AB_ST_5",
    question: "你对自己的负面情绪敏感，还是往往无感、后知后觉？",
    consistencyGroupId: "CAL-AB-ST",
    a: vote("ESTP", "往往无感", "负面情绪常在很久之后才被我察觉。", "Q_AB_ST_CAL"),
    b: vote("ISTP", "比较敏感", "我能较快觉察自己的负面情绪。", "Q_AB_ST_CAL"),
    dimensionTags: ["Se", "Ti"],
  }),
  makeQuestion({
    id: "Q_AB_ST_CAL",
    question: "哪一个更符合你内心最深层的心理欲望？",
    detail: "请用这道校准题复核前面的选择。",
    stage: "calibration",
    consistencyGroupId: "CAL-AB-ST",
    a: calibrated("ESTP", "物质享受", "进入真实、直接、可感的体验。"),
    b: calibrated("ISTP", "理解本质", "拆开表象，弄懂事物如何运作。"),
    dimensionTags: ["Se", "Ti"],
  }),
  makeQuestion({
    id: "Q_AB_NF_4",
    question: "下属办事不利，会令你难以忍受吗？",
    consistencyGroupId: "CAL-AB-NF",
    a: vote("ENFJ", "会", "这种情况容易让我难以忍受。", "Q_AB_NF_5"),
    b: vote("INFJ", "不会", "我通常仍能容纳并理解这种情况。", "Q_AB_NF_5"),
    dimensionTags: ["Fe", "Ni"],
  }),
  makeQuestion({
    id: "Q_AB_NF_5",
    question: "想象自己距离悬崖仍有三四米，你会感到恐惧吗？",
    consistencyGroupId: "CAL-AB-NF",
    a: vote("ENFJ", "不会", "保持这个距离时，我不会明显恐惧。", "Q_AB_NF_CAL"),
    b: vote("INFJ", "会", "即使仍有距离，我也会感到恐惧。", "Q_AB_NF_CAL"),
    dimensionTags: ["Fe", "Ni"],
  }),
  makeQuestion({
    id: "Q_AB_NF_CAL",
    question: "哪一个更符合你内心最深层的心理欲望？",
    detail: "请用这道校准题复核前面的选择。",
    stage: "calibration",
    consistencyGroupId: "CAL-AB-NF",
    a: calibrated("ENFJ", "与他人产生联系", "建立并维持人与人之间的联结。"),
    b: calibrated("INFJ", "洞悉人心", "看见他人行为背后的深层动机。"),
    dimensionTags: ["Fe", "Ni"],
  }),

  // ba → ESTJ / ISTJ / INFP
  makeQuestion({
    id: "Q_BA_3",
    question: "你心中是否有一个包含“自由”“平等”等理念的明确价值观框架？",
    a: {
      title: "没有，或不好说",
      text: "我很难确认自己有这样一套清晰框架。",
      nextQuestionId: "Q_BA_ST_4",
    },
    b: {
      title: "明确有",
      text: "我清楚知道这套价值框架存在。",
      nextQuestionId: "Q_BA_INFP_CAL",
    },
    dimensionTags: ["Te", "Si", "Fi"],
  }),
  makeQuestion({
    id: "Q_BA_ST_4",
    question: "道德绑架会令你难以忍受吗？",
    consistencyGroupId: "CAL-BA-ST",
    a: vote("ESTJ", "会", "被道德理由强行要求时，我会难以忍受。", "Q_BA_ST_5"),
    b: vote("ISTJ", "不会", "这通常不会令我强烈难受。", "Q_BA_ST_5"),
    dimensionTags: ["Te", "Si"],
  }),
  makeQuestion({
    id: "Q_BA_ST_5",
    question: "混乱会让你害怕吗？",
    consistencyGroupId: "CAL-BA-ST",
    a: vote("ESTJ", "不会", "面对混乱，我通常不会害怕。", "Q_BA_ST_CAL"),
    b: vote("ISTJ", "会", "混乱会明显触发我的不安。", "Q_BA_ST_CAL"),
    dimensionTags: ["Te", "Si"],
  }),
  makeQuestion({
    id: "Q_BA_ST_CAL",
    question: "哪一个更符合你内心最深层的心理欲望？",
    detail: "请用这道校准题复核前面的选择。",
    stage: "calibration",
    consistencyGroupId: "CAL-BA-ST",
    a: calibrated("ESTJ", "完成任务", "组织行动，确保任务被完成。"),
    b: calibrated("ISTJ", "验证复盘", "核对经验，确认过程可靠可复现。"),
    dimensionTags: ["Te", "Si"],
  }),
  directCalibration(
    "Q_BA_INFP_CAL",
    "INFP",
    "建立心中的理想之塔",
    ["Fi", "Ne"],
  ),

  // bb → ESFJ / ISFJ / INTP
  makeQuestion({
    id: "Q_BB_3",
    question: "你平时能记住与其他人在一起时的氛围吗？",
    a: {
      title: "能",
      text: "当时的关系氛围通常会留在我的记忆里。",
      nextQuestionId: "Q_BB_SF_4",
    },
    b: {
      title: "偶尔，或不能",
      text: "我不总能留意或记住那种氛围。",
      nextQuestionId: "Q_BB_INTP_CAL",
    },
    dimensionTags: ["Si", "Fe", "Ti"],
  }),
  makeQuestion({
    id: "Q_BB_SF_4",
    question: "下属办事不利，会令你难以忍受吗？",
    consistencyGroupId: "CAL-BB-SF",
    a: vote("ESFJ", "会", "这种情况容易让我难以忍受。", "Q_BB_SF_5"),
    b: vote("ISFJ", "不会", "我通常仍能容纳并理解这种情况。", "Q_BB_SF_5"),
    dimensionTags: ["Fe", "Si"],
  }),
  makeQuestion({
    id: "Q_BB_SF_5",
    question: "混乱会让你害怕吗？",
    consistencyGroupId: "CAL-BB-SF",
    a: vote("ESFJ", "不会", "面对混乱，我通常不会害怕。", "Q_BB_SF_CAL"),
    b: vote("ISFJ", "会", "混乱会明显触发我的不安。", "Q_BB_SF_CAL"),
    dimensionTags: ["Fe", "Si"],
  }),
  makeQuestion({
    id: "Q_BB_SF_CAL",
    question: "哪一个更符合你内心最深层的心理欲望？",
    detail: "请用这道校准题复核前面的选择。",
    stage: "calibration",
    consistencyGroupId: "CAL-BB-SF",
    a: calibrated("ESFJ", "与他人产生联系", "建立并照料人与人之间的联结。"),
    b: calibrated("ISFJ", "验证复盘", "核对经验，确认过程可靠可复现。"),
    dimensionTags: ["Fe", "Si"],
  }),
  directCalibration("Q_BB_INTP_CAL", "INTP", "深度理解", ["Ti", "Ne"]),

  // ca / cb → direct single-type calibration
  directCalibration("Q_CA_CAL", "ENFP", "激发创意灵感", ["Ne", "Fi"]),
  directCalibration("Q_CB_CAL", "ENTP", "激发创意灵感", ["Ne", "Ti"]),
];

export const questionMap: ReadonlyMap<string, QuestionNode> = new Map(
  questions.map((question) => [question.id, question]),
);

export function getQuestionById(questionId: string): QuestionNode | undefined {
  return questionMap.get(questionId);
}
