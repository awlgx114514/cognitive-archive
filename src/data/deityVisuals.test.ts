import { describe, expect, it } from "vitest";
import {
  getActiveDeityId,
  getFinalDeityPair,
  getSelectionDeityIds,
} from "./deityVisuals";
import type { AnswerOptionId, HistoryEntry } from "../types/test";

function entry(
  questionId: string,
  selectedOptionId: AnswerOptionId,
  answeredAt: number,
): HistoryEntry {
  return {
    questionId,
    selectedOptionId,
    transitionSceneId: `scene-${questionId.toLowerCase().replaceAll("_", "-")}`,
    answeredAt,
  };
}

describe("deity visual routing", () => {
  it("maps both deity-selection pages to the existing portrait sets", () => {
    expect(getSelectionDeityIds("Q_R1_GOD_SELECT")).toEqual([1, 2, 3, 4]);
    expect(getSelectionDeityIds("Q_R2_GOD_SELECT_F3")).toEqual([5, 6, 7, 8]);
  });

  it("keeps the initially selected deity background during each score round", () => {
    const history = [
      entry("Q_R1_GOD_SELECT", "C", 1),
      entry("Q_R2_GOD_SELECT_F3", "C", 2),
    ];

    expect(getActiveDeityId("Q_R1_SCORE_5", history)).toBe(3);
    expect(getActiveDeityId("Q_R2_F3_SCORE_5", history)).toBe(7);
    expect(getActiveDeityId("Q_R2_GOD_SELECT_F3", history)).toBeUndefined();
  });

  it("derives the final split background from both scored winners", () => {
    const history: HistoryEntry[] = [
      entry("Q_R1_GOD_SELECT", "C", 1),
      ...(["A", "A", "A", "A", "B", "A", "B", "A"] as const).map(
        (answer, index) => entry(`Q_R1_SCORE_${index + 1}`, answer, index + 2),
      ),
      entry("Q_R2_GOD_SELECT_F3", "C", 10),
      ...(["A", "A", "A", "A", "B", "A", "B", "A"] as const).map(
        (answer, index) =>
          entry(`Q_R2_F3_SCORE_${index + 1}`, answer, index + 11),
      ),
    ];

    expect(getFinalDeityPair(history)).toEqual([3, 7]);
  });
});
