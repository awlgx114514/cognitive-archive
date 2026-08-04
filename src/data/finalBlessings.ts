import { deityProfiles, type DeityId } from "./deities";

export type FinalBlessingGroupId = 1 | 2 | 3 | 4;

export type FinalBlessingGroup = {
  id: FinalBlessingGroupId;
  deityIds: readonly [DeityId, DeityId, DeityId, DeityId];
  personalityIds: readonly [string, string, string, string];
};

export const finalBlessingGroups: Readonly<
  Record<FinalBlessingGroupId, FinalBlessingGroup>
> = {
  1: {
    id: 1,
    deityIds: [1, 8, 5, 4],
    personalityIds: ["ESFP", "ISFP", "ENTJ", "INTJ"],
  },
  2: {
    id: 2,
    deityIds: [1, 6, 7, 4],
    personalityIds: ["ESTP", "ISTP", "ENFJ", "INFJ"],
  },
  3: {
    id: 3,
    deityIds: [2, 8, 5, 3],
    personalityIds: ["ENFP", "INFP", "ESTJ", "ISTJ"],
  },
  4: {
    id: 4,
    deityIds: [2, 6, 7, 3],
    personalityIds: ["ENTP", "INTP", "ESFJ", "ISFJ"],
  },
};

export function buildFinalBlessingMessage(
  group: FinalBlessingGroup,
): string {
  const deityNames = group.deityIds.map((id) => deityProfiles[id].name);
  return `你得到了${deityNames.join("、")}四位神祇的祝福，${group.personalityIds.join("、")}亦如此。`;
}
