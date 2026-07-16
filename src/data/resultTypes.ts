import type {
  FunctionKey,
  ResultAccent,
  ResultType,
} from "../types/test";

type DemoResultSeed = {
  code: string;
  name: string;
  subtitle: string;
  summary: string;
  functionOrder: FunctionKey[];
  strengths: string[];
  tensions: string[];
  sceneTitle: string;
  sceneDescription: string;
  accent: ResultAccent;
};

function makeDemoResult(seed: DemoResultSeed): ResultType {
  const lowerCode = seed.code.toLowerCase();

  return {
    id: seed.code,
    code: seed.code,
    name: `DEMO · ${seed.name}`,
    subtitle: `DEMO 占位描述｜${seed.subtitle}`,
    summary: `DEMO：${seed.summary} 这一结果只描述本次示例路径呈现出的主要倾向。`,
    functionOrder: seed.functionOrder,
    strengths: seed.strengths.map((item) => `你可能更倾向于${item}`),
    tensions: seed.tensions.map(
      (item) => `在某些情况下，你可能需要留意${item}`,
    ),
    classicScene: {
      title: `DEMO · ${seed.sceneTitle}`,
      description: seed.sceneDescription,
      image: `images/results/${lowerCode}.webp`,
      alt: `DEMO ${seed.code} 象征画面：${seed.sceneTitle}`,
    },
    accent: seed.accent,
  };
}

/**
 * DEMO RESULT DATA ONLY.
 * Names, prose and function-order notes are replaceable placeholders.
 */
export const resultTypes: ResultType[] = [
  makeDemoResult({
    code: "INTJ",
    name: "远景构架倾向",
    subtitle: "从隐约方向到可执行结构",
    summary: "你可能更倾向于先凝聚长期方向，再组织实现它的外部步骤。",
    functionOrder: ["Ni", "Te", "Fi", "Se", "Ne", "Ti", "Fe", "Si"],
    strengths: ["在复杂线索中寻找主线。", "把长期判断转化为可检验计划。"],
    tensions: ["方向过早收束时遗漏现场变化。", "为效率压缩沟通空间。"],
    sceneTitle: "高处的星图室",
    sceneDescription: "孤静天文台中，星图与长期计划在冷光下逐层展开。",
    accent: "violet",
  }),
  makeDemoResult({
    code: "INTP",
    name: "模型探究倾向",
    subtitle: "以结构解释不断扩展的可能",
    summary: "你可能更倾向于拆解概念规则，并让新的解释保持开放。",
    functionOrder: ["Ti", "Ne", "Si", "Fe", "Te", "Ni", "Se", "Fi"],
    strengths: ["发现解释中的缺口与例外。", "建立能够继续修订的内部模型。"],
    tensions: ["持续推演延后实际试验。", "表达关切时显得过于抽离。"],
    sceneTitle: "悬浮模型书房",
    sceneDescription: "昏暗书房里，透明结构和未完成公式围绕工作台缓慢悬浮。",
    accent: "silver",
  }),
  makeDemoResult({
    code: "ENTJ",
    name: "系统推进倾向",
    subtitle: "重组资源以抵达远期目标",
    summary: "你可能更倾向于确认目标、调度系统，并用进展校准方向。",
    functionOrder: ["Te", "Ni", "Se", "Fi", "Ti", "Ne", "Si", "Fe"],
    strengths: ["把复杂任务组织成行动网络。", "在压力下维持方向与决断。"],
    tensions: ["推进速度快于他人的理解节奏。", "较晚察觉个人价值上的犹豫。"],
    sceneTitle: "黎明前的指挥室",
    sceneDescription: "城市尚未苏醒，多层系统在一座冷光指挥室里重新排列。",
    accent: "gold",
  }),
  makeDemoResult({
    code: "ENTP",
    name: "可能性实验倾向",
    subtitle: "让观点碰撞并生成新路线",
    summary: "你可能更倾向于快速发现替代解释，并以推理测试它们。",
    functionOrder: ["Ne", "Ti", "Fe", "Si", "Ni", "Te", "Fi", "Se"],
    strengths: ["连接看似无关的线索。", "用问题打开停滞局面。"],
    tensions: ["新可能不断出现而难以收束。", "辩证过程压过他人的情绪节奏。"],
    sceneTitle: "多线原型工坊",
    sceneDescription: "草图、器件与奇异原型在深色工作室中沿多条轨道展开。",
    accent: "blue",
  }),
  makeDemoResult({
    code: "INFJ",
    name: "意义联结倾向",
    subtitle: "洞察隐线并照料关系方向",
    summary: "你可能更倾向于感受事件背后的方向，并考虑它对人的长远影响。",
    functionOrder: ["Ni", "Fe", "Ti", "Se", "Ne", "Fi", "Te", "Si"],
    strengths: ["觉察未被说出的关系线索。", "为共同处境形成连贯叙事。"],
    tensions: ["承担过多他人的隐性期待。", "内在判断难以及时转成现场行动。"],
    sceneTitle: "夜间温室",
    sceneDescription: "安静温室里，微光沿植物尚未显露的生长方向延伸。",
    accent: "violet",
  }),
  makeDemoResult({
    code: "INFP",
    name: "内在罗盘倾向",
    subtitle: "守护真实价值并想象别种可能",
    summary: "你可能更倾向于以内在价值辨认方向，并为它寻找新的表达。",
    functionOrder: ["Fi", "Ne", "Si", "Te", "Fe", "Ni", "Se", "Ti"],
    strengths: ["分辨体验中细微而真实的差别。", "为重要事物保留独特可能。"],
    tensions: ["现实结构与内在标准难以同时满足。", "等待完全认同后才开始推进。"],
    sceneTitle: "旧森林中的灯",
    sceneDescription: "一盏被守护的微光照亮旧森林，个人记忆像尘埃般环绕。",
    accent: "silver",
  }),
  makeDemoResult({
    code: "ENFJ",
    name: "共鸣引导倾向",
    subtitle: "连接人群并凝聚共同方向",
    summary: "你可能更倾向于读取群体需要，并帮助彼此走向可共享的愿景。",
    functionOrder: ["Fe", "Ni", "Se", "Ti", "Fi", "Ne", "Si", "Te"],
    strengths: ["让不同立场找到共同语言。", "把关系动能引向长期方向。"],
    tensions: ["将自己的需求放到过晚。", "为了关系连贯而弱化必要分歧。"],
    sceneTitle: "回声圆厅",
    sceneDescription: "圆形大厅中央，分离的人群被柔和光线重新连接。",
    accent: "gold",
  }),
  makeDemoResult({
    code: "ENFP",
    name: "灵感联结倾向",
    subtitle: "从人与可能性之间打开新门",
    summary: "你可能更倾向于发现尚未尝试的方向，并用个人热情赋予它意义。",
    functionOrder: ["Ne", "Fi", "Te", "Si", "Ni", "Fe", "Ti", "Se"],
    strengths: ["为熟悉情境打开新的解释。", "用真实投入感染周围的人。"],
    tensions: ["多个方向争夺持续注意力。", "日常维护跟不上灵感扩张。"],
    sceneTitle: "夜市尽头的彩门",
    sceneDescription: "夜色集市尽头，一扇彩色门通向尚未命名的远方。",
    accent: "blue",
  }),
  makeDemoResult({
    code: "ISTJ",
    name: "秩序存档倾向",
    subtitle: "以可靠经验维护清晰结构",
    summary: "你可能更倾向于保存可验证记录，并让责任沿稳定流程持续。",
    functionOrder: ["Si", "Te", "Fi", "Ne", "Se", "Ti", "Fe", "Ni"],
    strengths: ["维护细节、顺序与承诺。", "把经验整理成可复用方法。"],
    tensions: ["新情境缺少先例时谨慎过久。", "变化速度冲击既有节奏。"],
    sceneTitle: "时间档案馆",
    sceneDescription: "古老档案馆中，被打乱的时间记录在冷银灯下逐页复位。",
    accent: "silver",
  }),
  makeDemoResult({
    code: "ISFJ",
    name: "细节守护倾向",
    subtitle: "用记忆和照料维持安全连接",
    summary: "你可能更倾向于记住具体需要，并通过持续行动守护关系。",
    functionOrder: ["Si", "Fe", "Ti", "Ne", "Se", "Fi", "Te", "Ni"],
    strengths: ["察觉日常中容易被忽略的需要。", "让重要经验稳定延续。"],
    tensions: ["承接过多责任而忽略自身边界。", "未知变化带来额外消耗。"],
    sceneTitle: "暴雨中的守灯屋",
    sceneDescription: "暴雨覆盖夜色，一座被守护的房屋仍有暖光穿过窗棂。",
    accent: "blue",
  }),
  makeDemoResult({
    code: "ESTJ",
    name: "流程校准倾向",
    subtitle: "以标准和行动恢复系统运转",
    summary: "你可能更倾向于明确规则、分配资源，并确保目标被完成。",
    functionOrder: ["Te", "Si", "Ne", "Fi", "Ti", "Se", "Ni", "Fe"],
    strengths: ["快速建立可执行的责任结构。", "用经验发现流程偏差。"],
    tensions: ["有效标准未必覆盖个体处境。", "突发可能性打乱既定安排。"],
    sceneTitle: "齿轮校准站",
    sceneDescription: "大型机械站里，失序齿轮在晨光到来前逐一归位。",
    accent: "gold",
  }),
  makeDemoResult({
    code: "ESFJ",
    name: "共同体照料倾向",
    subtitle: "让具体需要在关系中被看见",
    summary: "你可能更倾向于维护互动秩序，并让每个人获得恰当回应。",
    functionOrder: ["Fe", "Si", "Ne", "Ti", "Fi", "Se", "Ni", "Te"],
    strengths: ["记住人与承诺的具体细节。", "营造可参与、可依靠的氛围。"],
    tensions: ["外部期待挤压个人判断空间。", "关系变化被体验为秩序中断。"],
    sceneTitle: "长桌前的灯火",
    sceneDescription: "长桌宴会尚未开始，每个位置与需要都在灯火下被确认。",
    accent: "gold",
  }),
  makeDemoResult({
    code: "ISTP",
    name: "机制应变倾向",
    subtitle: "理解原理并在现场精准行动",
    summary: "你可能更倾向于看清事物怎样运作，并用直接试验解决问题。",
    functionOrder: ["Ti", "Se", "Ni", "Fe", "Te", "Si", "Ne", "Fi"],
    strengths: ["快速定位机制中的失效点。", "在变化现场保持冷静操作。"],
    tensions: ["简洁处理被误解为情感距离。", "长期维护不如即时挑战有吸引力。"],
    sceneTitle: "废弃精密工坊",
    sceneDescription: "废弃工坊深处，一台精密机器被拆解、理解并重新点亮。",
    accent: "silver",
  }),
  makeDemoResult({
    code: "ISFP",
    name: "感受捕捉倾向",
    subtitle: "在当下质感中守住真实价值",
    summary: "你可能更倾向于感受现场细节，并以个人标准回应它们。",
    functionOrder: ["Fi", "Se", "Ni", "Te", "Fe", "Si", "Ne", "Ti"],
    strengths: ["捕捉短暂而细腻的感官变化。", "以不夸张的方式表达个人价值。"],
    tensions: ["外部量化要求削弱内在动机。", "避免冲突使重要界限表达过晚。"],
    sceneTitle: "清晨光线山谷",
    sceneDescription: "清晨山谷中，人物安静记录短暂光线与正在消散的色彩。",
    accent: "blue",
  }),
  makeDemoResult({
    code: "ESTP",
    name: "现场决断倾向",
    subtitle: "读取当下并以清晰机制行动",
    summary: "你可能更倾向于抓住现实窗口，并在反馈中快速修正动作。",
    functionOrder: ["Se", "Ti", "Fe", "Ni", "Si", "Te", "Fi", "Ne"],
    strengths: ["在高变化场景中发现可行动点。", "用即时反馈校准判断。"],
    tensions: ["快速行动压缩长期影响评估。", "持续重复的维护消耗注意力。"],
    sceneTitle: "风暴前的高塔",
    sceneDescription: "风暴压近，一道身影在高塔边缘读取风向并判断下一步。",
    accent: "violet",
  }),
  makeDemoResult({
    code: "ESFP",
    name: "体验点亮倾向",
    subtitle: "用真实投入唤醒共同现场",
    summary: "你可能更倾向于进入当下体验，并让个人热情与他人发生连接。",
    functionOrder: ["Se", "Fi", "Te", "Ni", "Si", "Fe", "Ti", "Ne"],
    strengths: ["为沉寂现场带来可感知的活力。", "对真实体验作出直接回应。"],
    tensions: ["眼前吸引力盖过远期安排。", "外部效率要求与个人节奏摩擦。"],
    sceneTitle: "黑暗剧场的初灯",
    sceneDescription: "黑暗剧场中，第一束舞台光让沉默的人群重新显出轮廓。",
    accent: "violet",
  }),
];

export const resultTypeMap: ReadonlyMap<string, ResultType> = new Map(
  resultTypes.map((resultType) => [resultType.id, resultType]),
);

export function getResultTypeById(resultTypeId: string): ResultType | undefined {
  return resultTypeMap.get(resultTypeId.toUpperCase());
}
