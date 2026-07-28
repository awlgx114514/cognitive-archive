import type { FunctionKey } from "../types/test";

export type DeityId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type FirstRoundDeityId = 1 | 2 | 3 | 4;
export type SecondRoundDeityId = 5 | 6 | 7 | 8;

export type DeityProfile = {
  id: DeityId;
  name: string;
  description: string;
  desire: string;
  functionKey: FunctionKey;
};

export const deityProfiles: Readonly<Record<DeityId, DeityProfile>> = {
  1: {
    id: 1,
    name: "现世主宰",
    description: "主宰即时体验与享乐之神",
    desire: "体验享乐",
    functionKey: "Se",
  },
  2: {
    id: 2,
    name: "异界星君",
    description: "操纵奇思妙想与灵感之神",
    desire: "分享创意",
    functionKey: "Ne",
  },
  3: {
    id: 3,
    name: "太史文官",
    description: "管理历史记录与记忆之神",
    desire: "验证复盘",
    functionKey: "Si",
  },
  4: {
    id: 4,
    name: "太虚灵官",
    description: "冥想命运未来与预言之神",
    desire: "想象预测",
    functionKey: "Ni",
  },
  5: {
    id: 5,
    name: "紫薇大帝",
    description: "统辖协调规划与资源管理之神",
    desire: "从协调规划到完成任务",
    functionKey: "Te",
  },
  6: {
    id: 6,
    name: "闻苦天尊",
    description: "执掌伦理和谐与团结互助之神",
    desire: "肯定他人建立深层联结",
    functionKey: "Fe",
  },
  7: {
    id: 7,
    name: "空悟道人",
    description: "主导鉴真破妄与真理思辨之神",
    desire: "通过定义概念达成深度理解",
    functionKey: "Ti",
  },
  8: {
    id: 8,
    name: "逍遥散人",
    description: "专司谛听内心与善恶明辨之神",
    desire: "通过喜好和感受建立专属自己的价值体系",
    functionKey: "Fi",
  },
};

export const firstRoundDeityIds = [1, 2, 3, 4] as const;
export const secondRoundDeityIds = [5, 6, 7, 8] as const;
