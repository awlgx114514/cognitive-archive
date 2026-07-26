import { describe, expect, it } from "vitest";
import {
  getActiveDeityId,
  getFinalDeityPair,
  getSelectionDeityIds,
} from "./deityVisuals";
import type { HistoryEntry } from "../types/test";

describe("deity visual routing", () => {
  it("maps both direct-selection pages to the correct portrait sets", () => {
    expect(getSelectionDeityIds("Q_R1_GOD_SELECT")).toEqual([1, 2, 3, 4]);
    expect(getSelectionDeityIds("Q_R2_GOD_SELECT_F3")).toEqual([5, 6, 7, 8]);
  });

  it("follows the active bank after a deity switch", () => {
    expect(getActiveDeityId("Q_R1_G3_5")).toBe(3);
    expect(getActiveDeityId("Q_R2_F3_G7_5")).toBe(7);
    expect(getActiveDeityId("Q_R2_GOD_SELECT_F3")).toBeUndefined();
  });

  it("recovers the two final deities from the routed second-round bank", () => {
    const history: HistoryEntry[] = [
      {
        questionId: "Q_R1_GOD_SELECT",
        selectedOptionId: "A",
        nextQuestionId: "Q_R1_G1_1",
        transitionSceneId: "scene-q-r1-god-select",
        answeredAt: 1,
      },
      {
        questionId: "Q_R2_F3_G7_6",
        selectedOptionId: "B",
        nextQuestionId: "Q_FINAL_GROUP_4",
        transitionSceneId: "scene-q-r2-f3-g7-6",
        answeredAt: 2,
      },
    ];

    expect(getFinalDeityPair(history)).toEqual([3, 7]);
  });
});
