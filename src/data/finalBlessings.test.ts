import { describe, expect, it } from "vitest";
import {
  buildFinalBlessingMessage,
  finalBlessingGroups,
} from "./finalBlessings";

describe("final blessing groups", () => {
  it.each([
    {
      groupId: 1 as const,
      deityIds: [1, 8, 5, 4],
      personalityIds: ["ESFP", "ISFP", "ENTJ", "INTJ"],
      message:
        "你得到了现世主宰、逍遥散人、紫薇大帝、太虚灵官四位神祇的祝福，ESFP、ISFP、ENTJ、INTJ亦如此。",
    },
    {
      groupId: 2 as const,
      deityIds: [1, 6, 7, 4],
      personalityIds: ["ESTP", "ISTP", "ENFJ", "INFJ"],
      message:
        "你得到了现世主宰、救苦天尊、洞真道君、太虚灵官四位神祇的祝福，ESTP、ISTP、ENFJ、INFJ亦如此。",
    },
    {
      groupId: 3 as const,
      deityIds: [2, 8, 5, 3],
      personalityIds: ["ENFP", "INFP", "ESTJ", "ISTJ"],
      message:
        "你得到了异界星君、逍遥散人、紫薇大帝、司岁帝君四位神祇的祝福，ENFP、INFP、ESTJ、ISTJ亦如此。",
    },
    {
      groupId: 4 as const,
      deityIds: [2, 6, 7, 3],
      personalityIds: ["ENTP", "INTP", "ESFJ", "ISFJ"],
      message:
        "你得到了异界星君、救苦天尊、洞真道君、司岁帝君四位神祇的祝福，ENTP、INTP、ESFJ、ISFJ亦如此。",
    },
  ])(
    "keeps group $groupId deity, personality, and public copy exact",
    ({ groupId, deityIds, personalityIds, message }) => {
      const group = finalBlessingGroups[groupId];

      expect(group.deityIds).toEqual(deityIds);
      expect(group.personalityIds).toEqual(personalityIds);
      expect(buildFinalBlessingMessage(group)).toBe(message);
    },
  );
});
