import { getResultTypeById } from "../data/resultTypes";
import type {
  HistoryEntry,
  QuestionNode,
  TestResult,
} from "../types/test";

type CalibrationResolution = {
  resultTypeId: string;
  calibrationMatched: boolean;
  needsRetest: boolean;
  retestReason?: string;
};

/**
 * Resolves the supplied branching tree without a points system. The terminal
 * calibration option names the intended type. For paired branches, the two
 * earlier type hints act as votes; a unique majority that conflicts with the
 * calibration is marked for retest.
 */
export function resolveCalibrationResult(
  history: readonly HistoryEntry[],
  questions: readonly QuestionNode[],
): CalibrationResolution | undefined {
  const lastEntry = history.at(-1);
  if (!lastEntry) return undefined;

  const questionsById = new Map(
    questions.map((question) => [question.id, question]),
  );
  const calibrationQuestion = questionsById.get(lastEntry.questionId);
  const calibrationOption =
    calibrationQuestion?.options[lastEntry.selectedOptionId];
  const resultTypeId = calibrationOption?.calibrationTypeId?.toUpperCase();
  if (
    !calibrationQuestion ||
    calibrationQuestion.stage !== "calibration" ||
    !calibrationOption ||
    calibrationOption.terminal !== true ||
    !resultTypeId
  ) {
    return undefined;
  }

  const voteCounts = new Map<string, number>();
  const groupId = calibrationQuestion.consistencyGroupId;
  if (groupId) {
    for (const entry of history.slice(0, -1)) {
      if (entry.selectedOptionId === "U") continue;
      const question = questionsById.get(entry.questionId);
      if (question?.consistencyGroupId !== groupId) continue;
      const hint = question.options[entry.selectedOptionId]?.typeHintId?.toUpperCase();
      if (!hint) continue;
      voteCounts.set(hint, (voteCounts.get(hint) ?? 0) + 1);
    }
  }

  const rankedVotes = [...voteCounts.entries()].sort(
    ([leftType, leftCount], [rightType, rightCount]) =>
      rightCount - leftCount || leftType.localeCompare(rightType),
  );
  const hasUniqueMajority =
    rankedVotes.length > 0 &&
    (rankedVotes.length === 1 || rankedVotes[0]![1] > rankedVotes[1]![1]);
  const tentativeTypeId = hasUniqueMajority ? rankedVotes[0]?.[0] : undefined;
  const explicitRejection = calibrationOption.requiresRetest === true;
  const conflictsWithVotes = Boolean(
    tentativeTypeId && tentativeTypeId !== resultTypeId,
  );
  const needsRetest = explicitRejection || conflictsWithVotes;

  return {
    resultTypeId,
    calibrationMatched: !needsRetest,
    needsRetest,
    retestReason: explicitRejection
      ? "最终校准未通过：这条深层欲望描述与你不符。"
      : conflictsWithVotes
        ? "最终校准与前两条候选线索不一致，建议按第一反应重新测试。"
        : undefined,
  };
}

/** Resolves a result from branch clues and the terminal calibration only. */
export function calculateResult(
  history: HistoryEntry[],
  questions: QuestionNode[],
): TestResult {
  const calibration = resolveCalibrationResult(history, questions);
  if (!calibration) {
    throw new Error("A completed path must end with a configured calibration result.");
  }
  if (!getResultTypeById(calibration.resultTypeId)) {
    throw new Error(
      `Calibration result type is not configured: ${calibration.resultTypeId}`,
    );
  }

  return {
    resultTypeId: calibration.resultTypeId,
    needsRetest: calibration.needsRetest,
    calibrationMatched: calibration.calibrationMatched,
    retestReason: calibration.retestReason,
    history: history.map((entry) => ({ ...entry })),
  };
}
