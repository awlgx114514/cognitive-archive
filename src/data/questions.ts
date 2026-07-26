import type {
  AnswerOption,
  AnswerOptionId,
  FunctionKey,
  QuestionNode,
  QuestionStage,
} from "../types/test";

type OptionSeed = {
  title: string;
  text: string;
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
  dimensionTags?: FunctionKey[];
  internalNote?: string;
};

type BinaryOptionId = "A" | "B";
type FirstGodId = 1 | 2 | 3 | 4;
type SecondGodId = 5 | 6 | 7 | 8;
type GodId = FirstGodId | SecondGodId;

type BankQuestion = {
  prompt: string;
  a: {
    title: string;
    text: string;
  };
  b: {
    title: string;
    text: string;
  };
  correct: BinaryOptionId;
};

type GodDefinition = {
  id: GodId;
  name: string;
  description: string;
  functionKey: FunctionKey;
  questions: readonly [
    BankQuestion,
    BankQuestion,
    BankQuestion,
    BankQuestion,
    BankQuestion,
    BankQuestion,
  ];
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
    calibrationTypeId: seed.calibrationTypeId,
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
    options: {
      A: makeOption("A", seed.a),
      B: makeOption("B", seed.b),
      ...(seed.c ? { C: makeOption("C", seed.c) } : {}),
      ...(seed.d ? { D: makeOption("D", seed.d) } : {}),
    },
    allowUncertain: false,
    transitionSceneId: transitionSceneIdForQuestion(seed.id),
    dimensionTags: seed.dimensionTags,
    stage: seed.stage ?? "core",
    internalNote: seed.internalNote,
  };
}

function routedOption(
  option: BankQuestion["a"],
  nextQuestionId: string,
): OptionSeed {
  return {
    title: option.title,
    text: option.text,
    nextQuestionId,
  };
}

function godSelectionOption(
  godId: GodId,
  nextQuestionId: string,
): OptionSeed {
  const god = gods[godId];
  return {
    title: god.name,
    text: god.description,
    nextQuestionId,
  };
}

function secondRoundSelectionId(firstGodId: FirstGodId): string {
  return `Q_R2_GOD_SELECT_F${firstGodId}`;
}

function makeRoutedBankQuestion({
  id,
  god,
  ordinal,
  question,
  correctNext,
  wrongNext,
  round,
}: {
  id: string;
  god: GodDefinition;
  ordinal: number;
  question: BankQuestion;
  correctNext: string;
  wrongNext: string;
  round: "第一阶 · 目门位" | "第二阶 · 黄庭位";
}): QuestionNode {
  return makeQuestion({
    id,
    question: question.prompt,
    detail: `${round} · ${god.name}（${god.functionKey}）· 第 ${ordinal} 题`,
    a: routedOption(
      question.a,
      question.correct === "A" ? correctNext : wrongNext,
    ),
    b: routedOption(
      question.b,
      question.correct === "B" ? correctNext : wrongNext,
    ),
    dimensionTags: [god.functionKey],
    internalNote: `${god.name}/${god.functionKey}; expected=${question.correct}; ordinal=${ordinal}`,
  });
}

const gods: Record<GodId, GodDefinition> = {
  1: {
    id: 1,
    name: "现世主宰",
    description: "主宰即时体验与享乐之神",
    functionKey: "Se",
    questions: [
      {
        prompt: "身体舒适和脑嗨，你更喜欢哪一种？",
        a: { title: "身体舒适", text: "更享受身体层面的舒适与满足。" },
        b: { title: "脑嗨", text: "更享受头脑被想法激发的兴奋感。" },
        correct: "A",
      },
      {
        prompt:
          "近处美轮美奂的东西与遥远新奇古怪的事物，哪一个更吸引你？",
        a: { title: "眼前", text: "眼前可见、可感的美更吸引我。" },
        b: { title: "遥远", text: "遥远而新奇古怪的事物更吸引我。" },
        correct: "A",
      },
      {
        prompt: "陌生刺激的环境与熟悉安全的环境，你更愿意待在哪里？",
        a: { title: "陌生刺激", text: "我更愿意进入陌生而有刺激感的环境。" },
        b: { title: "熟悉安全", text: "我更愿意留在熟悉而安全的环境。" },
        correct: "A",
      },
      {
        prompt:
          "质感丰富、崭新出炉的摆件与质地朴素、沉淀着历史的文物，哪一件更吸引你？",
        a: { title: "崭新摆件", text: "我更容易被质感丰富的新摆件吸引。" },
        b: { title: "历史文物", text: "我更容易被朴素而有历史感的文物吸引。" },
        correct: "A",
      },
      {
        prompt:
          "上了一天课、精神疲惫时，安静冥想和跑步运动，哪一个更让你放松？",
        a: { title: "安静冥想", text: "我会通过安静冥想恢复状态。" },
        b: { title: "跑步运动", text: "我会通过跑步或运动恢复状态。" },
        correct: "B",
      },
      {
        prompt:
          "一本是刺激精彩的冒险故事，一本是形而上学的哲学书，哪一本更吸引你翻阅？",
        a: { title: "冒险故事", text: "我更想翻开刺激精彩的冒险故事。" },
        b: { title: "哲学书", text: "我更想翻开讨论形而上学的哲学书。" },
        correct: "A",
      },
    ],
  },
  2: {
    id: 2,
    name: "异界星君",
    description: "操纵创意灵感与混沌之神",
    functionKey: "Ne",
    questions: [
      {
        prompt: "身体舒适和脑嗨，你更喜欢哪一种？",
        a: { title: "身体舒适", text: "更享受身体层面的舒适与满足。" },
        b: { title: "脑嗨", text: "更享受头脑被想法激发的兴奋感。" },
        correct: "B",
      },
      {
        prompt:
          "眼前美轮美奂的东西与遥远新奇古怪的事物，哪一个更吸引你？",
        a: { title: "眼前", text: "眼前可见、可感的美更吸引我。" },
        b: { title: "遥远", text: "遥远而新奇古怪的事物更吸引我。" },
        correct: "B",
      },
      {
        prompt:
          "喧嚣的头脑风暴与寂静的无意识冥想，哪一个更容易让你专注、忘我并投入其中？",
        a: { title: "喧嚣的头脑风暴", text: "大量想法碰撞时，我更容易投入。" },
        b: { title: "寂静的无意识冥想", text: "进入寂静冥想时，我更容易投入。" },
        correct: "A",
      },
      {
        prompt: "你更喜欢确定的结果和答案，还是保持开放的多种可能？",
        a: { title: "确定结果", text: "我更希望得到明确的结果与答案。" },
        b: { title: "多种可能", text: "我更希望保留开放的多种可能。" },
        correct: "B",
      },
      {
        prompt:
          "在你看来，外部环境是“充满无限可能性的游乐场”，还是“需要建立秩序和安全感的空间”？",
        a: { title: "可能性的游乐场", text: "外部世界像可以探索的无限游乐场。" },
        b: { title: "秩序与安全空间", text: "外部世界需要建立秩序和安全感。" },
        correct: "A",
      },
      {
        prompt:
          "当你情绪稳定、独自沉思时，大脑更像飞速闪过奇思妙想的时空穿梭机，还是反刍过去细节的高清放映机？",
        a: { title: "时空穿梭机", text: "各种奇思妙想会在脑中飞速闪过。" },
        b: { title: "高清放映机", text: "过去的细节会在脑中反复放映。" },
        correct: "A",
      },
    ],
  },
  3: {
    id: 3,
    name: "太史文官",
    description: "管理历史记录与记忆之神",
    functionKey: "Si",
    questions: [
      {
        prompt:
          "复盘或重温擅长领域的知识，与跨领域学习新知识，哪一个更容易让你专注、忘我并投入其中？",
        a: { title: "复盘旧知", text: "复盘或重温熟悉领域时，我更容易投入。" },
        b: { title: "跨域新知", text: "跨领域学习新知识时，我更容易投入。" },
        correct: "A",
      },
      {
        prompt:
          "你反复记忆过的内容会在几天内褪色，只留下模糊轮廓吗？包括现实细节、日期甚至别人的名字。",
        a: { title: "会", text: "即使反复记忆，细节也容易很快褪色。" },
        b: { title: "不会", text: "反复记忆后，我通常能保留具体细节。" },
        correct: "B",
      },
      {
        prompt: "陌生刺激的环境与熟悉安全的环境，你更愿意待在哪里？",
        a: { title: "陌生刺激", text: "我更愿意进入陌生而有刺激感的环境。" },
        b: { title: "熟悉安全", text: "我更愿意留在熟悉而安全的环境。" },
        correct: "B",
      },
      {
        prompt:
          "质感丰富、崭新出炉的摆件与质地朴素、沉淀着历史的文物，哪一件更吸引你？",
        a: { title: "崭新摆件", text: "我更容易被质感丰富的新摆件吸引。" },
        b: { title: "历史文物", text: "我更容易被朴素而有历史感的文物吸引。" },
        correct: "B",
      },
      {
        prompt:
          "在你看来，外部环境是“充满无限可能性的游乐场”，还是“需要建立秩序和安全感的空间”？",
        a: { title: "可能性的游乐场", text: "外部世界像可以探索的无限游乐场。" },
        b: { title: "秩序与安全空间", text: "外部世界需要建立秩序和安全感。" },
        correct: "B",
      },
      {
        prompt:
          "当你情绪稳定、独自沉思时，大脑更像飞速闪过奇思妙想的时空穿梭机，还是反刍过去细节的高清放映机？",
        a: { title: "时空穿梭机", text: "各种奇思妙想会在脑中飞速闪过。" },
        b: { title: "高清放映机", text: "过去的细节会在脑中反复放映。" },
        correct: "B",
      },
    ],
  },
  4: {
    id: 4,
    name: "太虚灵官",
    description: "窥视命运长河与冥思之神",
    functionKey: "Ni",
    questions: [
      {
        prompt:
          "复盘或重温擅长领域的知识，与跨领域学习新知识，哪一个更容易让你专注、忘我并投入其中？",
        a: { title: "复盘旧知", text: "复盘或重温熟悉领域时，我更容易投入。" },
        b: { title: "跨域新知", text: "跨领域学习新知识时，我更容易投入。" },
        correct: "A",
      },
      {
        prompt:
          "你反复记忆过的内容会在几天内褪色，只留下模糊轮廓吗？包括现实细节、日期甚至别人的名字。",
        a: { title: "会", text: "即使反复记忆，细节也容易很快褪色。" },
        b: { title: "不会", text: "反复记忆后，我通常能保留具体细节。" },
        correct: "A",
      },
      {
        prompt:
          "喧嚣的头脑风暴与寂静的无意识冥想，哪一个更容易让你专注、忘我并投入其中？",
        a: { title: "喧嚣的头脑风暴", text: "大量想法碰撞时，我更容易投入。" },
        b: { title: "寂静的无意识冥想", text: "进入寂静冥想时，我更容易投入。" },
        correct: "B",
      },
      {
        prompt: "你更喜欢确定的结果和答案，还是保持开放的多种可能？",
        a: { title: "确定结果", text: "我更希望得到明确的结果与答案。" },
        b: { title: "多种可能", text: "我更希望保留开放的多种可能。" },
        correct: "A",
      },
      {
        prompt:
          "上了一天课、精神疲惫时，安静冥想和跑步运动，哪一个更让你放松？",
        a: { title: "安静冥想", text: "我会通过安静冥想恢复状态。" },
        b: { title: "跑步运动", text: "我会通过跑步或运动恢复状态。" },
        correct: "A",
      },
      {
        prompt:
          "一本是刺激精彩的冒险故事，一本是形而上学的哲学书，哪一本更吸引你翻阅？",
        a: { title: "冒险故事", text: "我更想翻开刺激精彩的冒险故事。" },
        b: { title: "哲学书", text: "我更想翻开讨论形而上学的哲学书。" },
        correct: "B",
      },
    ],
  },
  5: {
    id: 5,
    name: "紫薇大帝",
    description: "统辖组织协调与效率之神",
    functionKey: "Te",
    questions: [
      {
        prompt:
          "初次见面的同学或同事皱眉或面露不悦时，你会难免留意，甚至感到尴尬、内疚或羞耻，还是鲜少留意、懒得理会？",
        a: { title: "难免留意", text: "我会注意对方的不悦，并受到情绪影响。" },
        b: { title: "鲜少留意", text: "我很少在意这种表情，甚至懒得理会。" },
        correct: "B",
      },
      {
        prompt: "你平时的决策更多为了资源高效管理，还是为了他人或社会责任？",
        a: { title: "资源高效管理", text: "我首先考虑资源、效率与成果。" },
        b: { title: "他人与社会责任", text: "我首先考虑他人需要与社会责任。" },
        correct: "A",
      },
      {
        prompt:
          "学习数学时，你更依赖定义概念，还是依赖解题流程，认为能解题就基本学会了？",
        a: { title: "定义概念", text: "没有清晰定义和概念，我很难真正掌握。" },
        b: { title: "解题流程", text: "能按流程解题，我就认为自己基本学会了。" },
        correct: "B",
      },
      {
        prompt: "别人有价值的论述与自己推演出的见解，哪一个记得更牢？",
        a: { title: "别人的论述", text: "他人有价值的论述更容易留在我脑中。" },
        b: { title: "自己的推演", text: "自己推演出来的见解更容易留在我脑中。" },
        correct: "A",
      },
      {
        prompt: "文艺题材电影与战争题材电影，哪一个更吸引你？",
        a: { title: "文艺题材", text: "我更容易被文艺题材电影吸引。" },
        b: { title: "战争题材", text: "我更容易被战争题材电影吸引。" },
        correct: "B",
      },
      {
        prompt: "在家虚度光阴与加班卷工作，哪一个更令你感到愉悦？",
        a: { title: "在家虚度光阴", text: "自由地待在家里更令我愉悦。" },
        b: { title: "加班卷工作", text: "投入工作、推进任务更令我愉悦。" },
        correct: "B",
      },
    ],
  },
  6: {
    id: 6,
    name: "闻苦天尊",
    description: "执掌众生伦理与和谐之神",
    functionKey: "Fe",
    questions: [
      {
        prompt:
          "初次见面的同学或同事皱眉或面露不悦时，你会难免留意，甚至感到尴尬、内疚或羞耻，还是鲜少留意、懒得理会？",
        a: { title: "难免留意", text: "我会注意对方的不悦，并受到情绪影响。" },
        b: { title: "鲜少留意", text: "我很少在意这种表情，甚至懒得理会。" },
        correct: "A",
      },
      {
        prompt: "你平时的决策更多为了资源高效管理，还是为了他人或社会责任？",
        a: { title: "资源高效管理", text: "我首先考虑资源、效率与成果。" },
        b: { title: "他人与社会责任", text: "我首先考虑他人需要与社会责任。" },
        correct: "B",
      },
      {
        prompt:
          "难过受委屈时，你会找人倾诉、寻找安慰，还是在情绪崩溃时彻底切断与外界的联系？",
        a: { title: "找人倾诉", text: "我会通过倾诉和他人的安慰消化情绪。" },
        b: { title: "切断联系", text: "我会退回自己的空间，切断外界联系。" },
        correct: "A",
      },
      {
        prompt:
          "如果你的个人爱好不被大家乃至亲友理解，你会感到不好受，还是认为“孤芳自赏，更好、更纯粹”？",
        a: { title: "内心难受", text: "不被身边的人理解会让我感到难受。" },
        b: { title: "孤芳自赏", text: "即使不被理解，我也觉得这样更纯粹。" },
        correct: "A",
      },
      {
        prompt:
          "剧情和爱情题材电影，与套着科幻外壳的哲学题材电影，哪一个更吸引你？",
        a: { title: "剧情与爱情", text: "人物关系、情感和剧情更吸引我。" },
        b: { title: "科幻与哲学", text: "科幻设定背后的哲学思考更吸引我。" },
        correct: "A",
      },
      {
        prompt:
          "交游广阔、与陌生人打交道，与深居简出、主动选择一个人生活，你更倾向哪一种？",
        a: { title: "交游广阔", text: "我更愿意认识不同的人并保持广泛交往。" },
        b: { title: "深居简出", text: "我更愿意减少社交并独自生活。" },
        correct: "A",
      },
    ],
  },
  7: {
    id: 7,
    name: "空悟道人",
    description: "主导鉴真破妄与思辨之神",
    functionKey: "Ti",
    questions: [
      {
        prompt:
          "与一个陌生但投缘的人交流时，自己论述和倾听他人，哪一个更容易让你专注、忘我并投入其中？",
        a: { title: "自己论述", text: "表达和展开自己的论述时，我更容易投入。" },
        b: { title: "倾听他人", text: "认真倾听对方时，我更容易投入。" },
        correct: "A",
      },
      {
        prompt:
          "脱离自身感受的思考，更接近“剥离主观干扰，方能照见表象下的客观真实”，还是“自身感受才是真实经验，剥离感受仍难逃虚妄”？",
        a: { title: "照见真实", text: "剥离主观干扰有助于逼近客观真实。" },
        b: { title: "难逃虚妄", text: "自身感受不可被剥离，否则仍难逃虚妄。" },
        correct: "A",
      },
      {
        prompt:
          "学习数学时，你更依赖定义概念，还是依赖解题流程，认为能解题就基本学会了？",
        a: { title: "定义概念", text: "没有清晰定义和概念，我很难真正掌握。" },
        b: { title: "解题流程", text: "能按流程解题，我就认为自己基本学会了。" },
        correct: "A",
      },
      {
        prompt: "别人有价值的论述与自己推演领悟的见解，哪一个记得更牢？",
        a: { title: "别人的论述", text: "他人有价值的论述更容易留在我脑中。" },
        b: { title: "自己的推演", text: "自己推演领悟的见解更容易留在我脑中。" },
        correct: "B",
      },
      {
        prompt:
          "剧情和爱情题材电影，与套着科幻外壳的哲学题材电影，哪一个更吸引你？",
        a: { title: "剧情与爱情", text: "人物关系、情感和剧情更吸引我。" },
        b: { title: "科幻与哲学", text: "科幻设定背后的哲学思考更吸引我。" },
        correct: "B",
      },
      {
        prompt:
          "交游广阔、与陌生人打交道，与深居简出、主动选择一个人生活，你更倾向哪一种？",
        a: { title: "交游广阔", text: "我更愿意认识不同的人并保持广泛交往。" },
        b: { title: "深居简出", text: "我更愿意减少社交并独自生活。" },
        correct: "B",
      },
    ],
  },
  8: {
    id: 8,
    name: "逍遥散人",
    description: "专司情愫人性与谛听之神",
    functionKey: "Fi",
    questions: [
      {
        prompt:
          "与一个陌生但投缘的人交流时，自己论述和倾听他人，哪一个更容易让你专注、忘我并投入其中？",
        a: { title: "自己论述", text: "表达和展开自己的论述时，我更容易投入。" },
        b: { title: "倾听他人", text: "认真倾听对方时，我更容易投入。" },
        correct: "B",
      },
      {
        prompt:
          "脱离自身感受的思考，更接近“剥离主观干扰，方能照见表象下的客观真实”，还是“自身感受才是真实经验，剥离感受仍难逃虚妄”？",
        a: { title: "照见真实", text: "剥离主观干扰有助于逼近客观真实。" },
        b: { title: "难逃虚妄", text: "自身感受不可被剥离，否则仍难逃虚妄。" },
        correct: "B",
      },
      {
        prompt:
          "难过受委屈时，你会找人倾诉、寻找安慰，还是在情绪崩溃时彻底切断与外界的联系？",
        a: { title: "找人倾诉", text: "我会通过倾诉和他人的安慰消化情绪。" },
        b: { title: "切断联系", text: "我会退回自己的空间，切断外界联系。" },
        correct: "B",
      },
      {
        prompt:
          "如果你的个人爱好不被大家乃至亲友理解，你会感到不好受，还是认为“孤芳自赏，更好、更纯粹”？",
        a: { title: "内心难受", text: "不被身边的人理解会让我感到难受。" },
        b: { title: "孤芳自赏", text: "即使不被理解，我也觉得这样更纯粹。" },
        correct: "B",
      },
      {
        prompt: "文艺题材电影与战争题材电影，哪一个更吸引你？",
        a: { title: "文艺题材", text: "我更容易被文艺题材电影吸引。" },
        b: { title: "战争题材", text: "我更容易被战争题材电影吸引。" },
        correct: "B",
      },
      {
        prompt: "在家虚度光阴与加班卷工作，哪一个更令你感到愉悦？",
        a: { title: "在家虚度光阴", text: "自由地待在家里更令我愉悦。" },
        b: { title: "加班卷工作", text: "投入工作、推进任务更令我愉悦。" },
        correct: "A",
      },
    ],
  },
};

function firstRoundQuestionId(
  godId: FirstGodId,
  ordinal: number,
  state?: "C" | "W",
): string {
  return `Q_R1_G${godId}_${ordinal}${state ? `_${state}` : ""}`;
}

function secondRoundQuestionId(
  firstGodId: FirstGodId,
  godId: SecondGodId,
  ordinal: number,
  state?: "C" | "W",
): string {
  return `Q_R2_F${firstGodId}_G${godId}_${ordinal}${state ? `_${state}` : ""}`;
}

function earlyPair(godId: GodId): GodId {
  const pairs: Record<GodId, GodId> = {
    1: 2,
    2: 1,
    3: 4,
    4: 3,
    5: 6,
    6: 5,
    7: 8,
    8: 7,
  };
  return pairs[godId];
}

function middlePair(godId: GodId): GodId {
  const pairs: Record<GodId, GodId> = {
    1: 3,
    2: 4,
    3: 1,
    4: 2,
    5: 7,
    6: 8,
    7: 5,
    8: 6,
  };
  return pairs[godId];
}

function makeFirstRoundGodQuestions(godId: FirstGodId): QuestionNode[] {
  const god = gods[godId];
  const switchedAfterTwo = earlyPair(godId) as FirstGodId;
  const switchedAfterFour = middlePair(godId) as FirstGodId;
  const id = (ordinal: number, state?: "C" | "W") =>
    firstRoundQuestionId(godId, ordinal, state);

  return [
    makeRoutedBankQuestion({
      id: id(1),
      god,
      ordinal: 1,
      question: god.questions[0],
      correctNext: id(2, "C"),
      wrongNext: id(2, "W"),
      round: "第一阶 · 目门位",
    }),
    makeRoutedBankQuestion({
      id: id(2, "C"),
      god,
      ordinal: 2,
      question: god.questions[1],
      correctNext: id(3),
      wrongNext: firstRoundQuestionId(switchedAfterTwo, 3),
      round: "第一阶 · 目门位",
    }),
    makeRoutedBankQuestion({
      id: id(2, "W"),
      god,
      ordinal: 2,
      question: god.questions[1],
      correctNext: firstRoundQuestionId(switchedAfterTwo, 3),
      wrongNext: firstRoundQuestionId(switchedAfterTwo, 3),
      round: "第一阶 · 目门位",
    }),
    makeRoutedBankQuestion({
      id: id(3),
      god,
      ordinal: 3,
      question: god.questions[2],
      correctNext: id(4, "C"),
      wrongNext: id(4, "W"),
      round: "第一阶 · 目门位",
    }),
    makeRoutedBankQuestion({
      id: id(4, "C"),
      god,
      ordinal: 4,
      question: god.questions[3],
      correctNext: id(5),
      wrongNext: id(5),
      round: "第一阶 · 目门位",
    }),
    makeRoutedBankQuestion({
      id: id(4, "W"),
      god,
      ordinal: 4,
      question: god.questions[3],
      correctNext: id(5),
      wrongNext: firstRoundQuestionId(switchedAfterFour, 5),
      round: "第一阶 · 目门位",
    }),
    makeRoutedBankQuestion({
      id: id(5),
      god,
      ordinal: 5,
      question: god.questions[4],
      correctNext: id(6),
      wrongNext: id(6),
      round: "第一阶 · 目门位",
    }),
    makeRoutedBankQuestion({
      id: id(6),
      god,
      ordinal: 6,
      question: god.questions[5],
      correctNext: secondRoundSelectionId(godId),
      wrongNext: secondRoundSelectionId(godId),
      round: "第一阶 · 目门位",
    }),
  ];
}

function finalGroup(firstGodId: FirstGodId, secondGodId: SecondGodId): 1 | 2 | 3 | 4 {
  const firstIsSeNi = firstGodId === 1 || firstGodId === 4;
  const secondIsTeFi = secondGodId === 5 || secondGodId === 8;
  if (firstIsSeNi && secondIsTeFi) return 1;
  if (firstIsSeNi && !secondIsTeFi) return 2;
  if (!firstIsSeNi && secondIsTeFi) return 3;
  return 4;
}

function makeSecondRoundGodQuestions(
  firstGodId: FirstGodId,
  godId: SecondGodId,
): QuestionNode[] {
  const god = gods[godId];
  const switchedAfterTwo = earlyPair(godId) as SecondGodId;
  const switchedAfterFour = middlePair(godId) as SecondGodId;
  const id = (ordinal: number, state?: "C" | "W") =>
    secondRoundQuestionId(firstGodId, godId, ordinal, state);
  const finalId = `Q_FINAL_GROUP_${finalGroup(firstGodId, godId)}`;

  return [
    makeRoutedBankQuestion({
      id: id(1),
      god,
      ordinal: 1,
      question: god.questions[0],
      correctNext: id(2, "C"),
      wrongNext: id(2, "W"),
      round: "第二阶 · 黄庭位",
    }),
    makeRoutedBankQuestion({
      id: id(2, "C"),
      god,
      ordinal: 2,
      question: god.questions[1],
      correctNext: id(3),
      wrongNext: secondRoundQuestionId(firstGodId, switchedAfterTwo, 3),
      round: "第二阶 · 黄庭位",
    }),
    makeRoutedBankQuestion({
      id: id(2, "W"),
      god,
      ordinal: 2,
      question: god.questions[1],
      correctNext: secondRoundQuestionId(firstGodId, switchedAfterTwo, 3),
      wrongNext: secondRoundQuestionId(firstGodId, switchedAfterTwo, 3),
      round: "第二阶 · 黄庭位",
    }),
    makeRoutedBankQuestion({
      id: id(3),
      god,
      ordinal: 3,
      question: god.questions[2],
      correctNext: id(4, "C"),
      wrongNext: id(4, "W"),
      round: "第二阶 · 黄庭位",
    }),
    makeRoutedBankQuestion({
      id: id(4, "C"),
      god,
      ordinal: 4,
      question: god.questions[3],
      correctNext: id(5),
      wrongNext: id(5),
      round: "第二阶 · 黄庭位",
    }),
    makeRoutedBankQuestion({
      id: id(4, "W"),
      god,
      ordinal: 4,
      question: god.questions[3],
      correctNext: id(5),
      wrongNext: secondRoundQuestionId(firstGodId, switchedAfterFour, 5),
      round: "第二阶 · 黄庭位",
    }),
    makeRoutedBankQuestion({
      id: id(5),
      god,
      ordinal: 5,
      question: god.questions[4],
      correctNext: id(6),
      wrongNext: id(6),
      round: "第二阶 · 黄庭位",
    }),
    makeRoutedBankQuestion({
      id: id(6),
      god,
      ordinal: 6,
      question: god.questions[5],
      correctNext: finalId,
      wrongNext: finalId,
      round: "第二阶 · 黄庭位",
    }),
  ];
}

function makeSecondRoundSelection(
  firstGodId: FirstGodId,
): QuestionNode {
  return makeQuestion({
    id: secondRoundSelectionId(firstGodId),
    question: "第二轮：请选择最吸引你的神祇。",
    detail:
      "第二阶 · 黄庭位：从四位神祇中选择一位，进入对应题库。",
    a: godSelectionOption(
      5,
      secondRoundQuestionId(firstGodId, 5, 1),
    ),
    b: godSelectionOption(
      6,
      secondRoundQuestionId(firstGodId, 6, 1),
    ),
    c: godSelectionOption(
      7,
      secondRoundQuestionId(firstGodId, 7, 1),
    ),
    d: godSelectionOption(
      8,
      secondRoundQuestionId(firstGodId, 8, 1),
    ),
  });
}

function terminalOption(
  id: AnswerOptionId,
  title: string,
  text: string,
  calibrationTypeId: string,
): AnswerOption {
  return makeOption(id, {
    title,
    text,
    terminal: true,
    calibrationTypeId,
  });
}

function makeFinalQuestion(
  group: 1 | 2 | 3 | 4,
  options: readonly [
    [string, string, string],
    [string, string, string],
    [string, string, string],
    [string, string, string],
  ],
): QuestionNode {
  const [a, b, c, d] = options;
  const id = `Q_FINAL_GROUP_${group}`;
  return {
    id,
    traceCode: `ARC-FINAL-GROUP-${group}`,
    shortQuestion: "请选出你最深层的心理欲望，它将指引你走向主神位。",
    question: "第三阶 · 神格位：请选择最贴近内在驱动力的一项。",
    options: {
      A: terminalOption("A", a[0], a[1], a[2]),
      B: terminalOption("B", b[0], b[1], b[2]),
      C: terminalOption("C", c[0], c[1], c[2]),
      D: terminalOption("D", d[0], d[1], d[2]),
    },
    allowUncertain: false,
    transitionSceneId: transitionSceneIdForQuestion(id),
    stage: "calibration",
    internalNote: `Final group ${group}`,
  };
}

const firstRoundSelection = makeQuestion({
  id: "Q_R1_GOD_SELECT",
  question: "第一轮：请选择最吸引你的神祇。",
  detail: "第一阶 · 目门位：从四位神祇中选择一位，进入对应题库。",
  a: godSelectionOption(1, firstRoundQuestionId(1, 1)),
  b: godSelectionOption(2, firstRoundQuestionId(2, 1)),
  c: godSelectionOption(3, firstRoundQuestionId(3, 1)),
  d: godSelectionOption(4, firstRoundQuestionId(4, 1)),
});

const firstRoundQuestions = ([1, 2, 3, 4] as const).flatMap(
  makeFirstRoundGodQuestions,
);

const secondRoundQuestions = ([1, 2, 3, 4] as const).flatMap((firstGodId) => [
  makeSecondRoundSelection(firstGodId),
  ...([5, 6, 7, 8] as const).flatMap((secondGodId) =>
    makeSecondRoundGodQuestions(firstGodId, secondGodId),
  ),
]);

const finalQuestions: QuestionNode[] = [
  makeFinalQuestion(1, [
    ["体验享乐", "投入真实、直接、可感的当下体验。", "ESFP"],
    ["调节规划并完成任务", "组织资源、推动计划并完成目标。", "ENTJ"],
    ["想象预测", "洞察未来趋势，并形成内在预判。", "INTJ"],
    [
      "通过喜好和感受建立价值体系",
      "忠于个人感受，形成专属于自己的价值判断。",
      "ISFP",
    ],
  ]),
  makeFinalQuestion(2, [
    ["体验享乐", "投入真实、直接、可感的当下体验。", "ESTP"],
    [
      "肯定他人并建立深层联结",
      "理解、肯定他人，并建立有意义的关系。",
      "ENFJ",
    ],
    ["想象预测", "洞察未来趋势，并形成内在预判。", "INFJ"],
    [
      "通过定义概念达成深度理解",
      "厘清定义与逻辑结构，理解事物本质。",
      "ISTP",
    ],
  ]),
  makeFinalQuestion(3, [
    ["创意赋能", "不断联结新想法，打开新的可能性。", "ENFP"],
    ["调节规划并完成任务", "组织资源、推动计划并完成目标。", "ESTJ"],
    ["验证复盘", "用已有经验复核细节，并沉淀可靠方法。", "ISTJ"],
    [
      "通过喜好和感受建立价值体系",
      "忠于个人感受，形成专属于自己的价值判断。",
      "INFP",
    ],
  ]),
  makeFinalQuestion(4, [
    ["创意赋能", "不断联结新想法，打开新的可能性。", "ENTP"],
    [
      "肯定他人并建立深层联结",
      "理解、肯定他人，并建立有意义的关系。",
      "ESFJ",
    ],
    ["验证复盘", "用已有经验复核细节，并沉淀可靠方法。", "ISFJ"],
    [
      "通过定义概念达成深度理解",
      "厘清定义与逻辑结构，理解事物本质。",
      "INTP",
    ],
  ]),
];

export const questions: QuestionNode[] = [
  firstRoundSelection,
  ...firstRoundQuestions,
  ...secondRoundQuestions,
  ...finalQuestions,
];

export const questionMap: ReadonlyMap<string, QuestionNode> = new Map(
  questions.map((question) => [question.id, question]),
);

export function getQuestionById(questionId: string): QuestionNode | undefined {
  return questionMap.get(questionId);
}
