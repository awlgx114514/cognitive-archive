import type { TestConfig } from "../types/test";

export const testConfig: TestConfig = {
  startQuestionId: "Q_START",
  maxUncertainSelections: 3,
  minimumPathLength: 17,
  recommendedPathLength: 17,
  maximumPathLength: 17,
  storageVersion: "4.0.0",
};

export const TEST_STORAGE_KEY = "cognitive-archive:test-session";

export const UNCERTAIN_LIMIT_MESSAGE =
  "当前线索需要你选择更接近自身状态的一侧。";
