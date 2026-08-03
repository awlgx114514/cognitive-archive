import {
  firstRoundDeityIds,
  secondRoundDeityIds,
  type DeityId,
  type FirstRoundDeityId,
  type SecondRoundDeityId,
} from "../data/deities";
import type {
  AnswerOptionId,
  DynamicRouteKind,
  HistoryEntry,
} from "../types/test";

export type ScoreRound = 1 | 2;

export type RoundScoreResolution = {
  round: ScoreRound;
  winnerId: DeityId;
  scores: Readonly<Record<DeityId, number>>;
  highestScore: number;
  tiedWinnerIds: readonly DeityId[];
  tieBreakUsed: boolean;
};

const firstSelectionTargets: Readonly<
  Record<"A" | "B" | "C" | "D", FirstRoundDeityId>
> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
};

const secondSelectionTargets: Readonly<
  Record<"A" | "B" | "C" | "D", SecondRoundDeityId>
> = {
  A: 5,
  B: 6,
  C: 7,
  D: 8,
};

/**
 * Each tuple is [A target, B target]. It is a direct transcription of the
 * 第七版 score table supplied by the user.
 */
const firstRoundScoreTargets = [
  [1, 2],
  [3, 4],
  [1, 2],
  [3, 4],
  [1, 3],
  [2, 4],
  [1, 3],
  [2, 4],
] as const satisfies readonly (readonly [FirstRoundDeityId, FirstRoundDeityId])[];

const secondRoundScoreTargets = [
  [5, 6],
  [7, 8],
  [5, 6],
  [7, 8],
  [5, 7],
  [6, 8],
  [5, 7],
  [6, 8],
] as const satisfies readonly (readonly [SecondRoundDeityId, SecondRoundDeityId])[];

function formalOptionIndex(optionId: AnswerOptionId): 0 | 1 | undefined {
  if (optionId === "A") return 0;
  if (optionId === "B") return 1;
  return undefined;
}

export function getSelectedDeityId(
  history: readonly HistoryEntry[],
  round: ScoreRound,
): DeityId | undefined {
  const entry =
    round === 1
      ? history.find((item) => item.questionId === "Q_R1_GOD_SELECT")
      : history.find((item) => /^Q_R2_GOD_SELECT_F[1-4]$/.test(item.questionId));
  if (!entry || !["A", "B", "C", "D"].includes(entry.selectedOptionId)) {
    return undefined;
  }

  return round === 1
    ? firstSelectionTargets[
        entry.selectedOptionId as keyof typeof firstSelectionTargets
      ]
    : secondSelectionTargets[
        entry.selectedOptionId as keyof typeof secondSelectionTargets
      ];
}

export function scoreTargetForAnswer(
  round: ScoreRound,
  ordinal: number,
  optionId: AnswerOptionId,
): DeityId | undefined {
  const optionIndex = formalOptionIndex(optionId);
  if (optionIndex === undefined || ordinal < 1 || ordinal > 8) return undefined;
  const targets =
    round === 1 ? firstRoundScoreTargets : secondRoundScoreTargets;
  return targets[ordinal - 1]?.[optionIndex];
}

function scoreOrdinal(questionId: string, round: ScoreRound): number | undefined {
  const match =
    round === 1
      ? /^Q_R1_SCORE_([1-8])$/.exec(questionId)
      : /^Q_R2_F[1-4]_SCORE_([1-8])$/.exec(questionId);
  return match?.[1] ? Number(match[1]) : undefined;
}

export function calculateRoundScores(
  history: readonly HistoryEntry[],
  round: ScoreRound,
): Readonly<Record<DeityId, number>> {
  const scores: Record<DeityId, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
  };
  const selectedDeityId = getSelectedDeityId(history, round);
  if (selectedDeityId) scores[selectedDeityId] += 1;

  for (const entry of history) {
    const ordinal = scoreOrdinal(entry.questionId, round);
    if (!ordinal) continue;
    const target = scoreTargetForAnswer(round, ordinal, entry.selectedOptionId);
    if (target) scores[target] += 1;
  }

  return scores;
}

/**
 * A tie is not specified in the source bank. The selected deity wins when it
 * shares the highest score; otherwise the visible A→D / E→H order is stable.
 */
export function resolveRoundWinner(
  history: readonly HistoryEntry[],
  round: ScoreRound,
): RoundScoreResolution {
  const deityIds =
    round === 1 ? firstRoundDeityIds : secondRoundDeityIds;
  const scores = calculateRoundScores(history, round);
  const highestScore = Math.max(...deityIds.map((id) => scores[id]));
  const tiedWinnerIds = deityIds.filter(
    (id) => scores[id] === highestScore,
  ) as readonly DeityId[];
  const selectedDeityId = getSelectedDeityId(history, round);
  const winnerId =
    selectedDeityId && tiedWinnerIds.includes(selectedDeityId)
      ? selectedDeityId
      : tiedWinnerIds[0]!;

  return {
    round,
    winnerId,
    scores,
    highestScore,
    tiedWinnerIds,
    tieBreakUsed: tiedWinnerIds.length > 1,
  };
}

export function finalGroupForDeities(
  firstDeityId: FirstRoundDeityId,
  secondDeityId: SecondRoundDeityId,
): 1 | 2 | 3 | 4 {
  const firstIsSeNi = firstDeityId === 1 || firstDeityId === 4;
  const secondIsTeFi = secondDeityId === 5 || secondDeityId === 8;
  if (firstIsSeNi && secondIsTeFi) return 1;
  if (firstIsSeNi) return 2;
  if (secondIsTeFi) return 3;
  return 4;
}

function resolveFinalBranch(
  history: readonly HistoryEntry[],
  group: 1 | 2 | 3 | 4,
): "A" | "B" {
  const finalAnswers = history.filter((entry) =>
    new RegExp(`^Q_FINAL_GROUP_${group}_[1-4]$`).test(entry.questionId),
  );
  if (finalAnswers.length !== 4) {
    throw new Error(
      `Final group ${group} requires exactly four scored answers.`,
    );
  }

  const aCount = finalAnswers.filter(
    (entry) => entry.selectedOptionId === "A",
  ).length;
  const bCount = finalAnswers.filter(
    (entry) => entry.selectedOptionId === "B",
  ).length;
  if (aCount > bCount) return "A";
  if (bCount > aCount) return "B";

  const firstWinner = resolveRoundWinner(history, 1)
    .winnerId as FirstRoundDeityId;
  return firstWinner === 1 || firstWinner === 2 ? "A" : "B";
}

function resolveFinalAnswerPair(
  history: readonly HistoryEntry[],
  group: 1 | 2 | 3 | 4,
): string {
  const prefix = `Q_FINAL_GROUP_${group}`;
  const firstAnswer = history.find(
    (entry) => entry.questionId === `${prefix}_1`,
  )?.selectedOptionId;
  const secondAnswer = history.find(
    (entry) => entry.questionId === `${prefix}_2`,
  )?.selectedOptionId;

  if (
    (firstAnswer !== "A" && firstAnswer !== "B") ||
    (secondAnswer !== "A" && secondAnswer !== "B")
  ) {
    throw new Error(`Final group ${group} requires two A/B answers.`);
  }
  if (firstAnswer === "A" && secondAnswer === "A") return `${prefix}_3_1`;
  if (firstAnswer === "B" && secondAnswer === "B") return `${prefix}_3_2`;
  return `${prefix}_3_3`;
}

export function resolveDynamicRoute(
  route: DynamicRouteKind,
  history: readonly HistoryEntry[],
  currentQuestionId: string,
): string {
  if (route === "first-round-score") {
    const firstWinner = resolveRoundWinner(history, 1)
      .winnerId as FirstRoundDeityId;
    return `Q_R2_GOD_SELECT_F${firstWinner}`;
  }

  if (route === "second-round-score") {
    const firstMatch = /^Q_R2_F([1-4])_SCORE_8$/.exec(currentQuestionId);
    if (!firstMatch?.[1]) {
      throw new Error(
        `Cannot resolve second-round route from ${currentQuestionId}.`,
      );
    }
    const firstWinner = Number(firstMatch[1]) as FirstRoundDeityId;
    const secondWinner = resolveRoundWinner(history, 2)
      .winnerId as SecondRoundDeityId;
    return `Q_FINAL_GROUP_${finalGroupForDeities(firstWinner, secondWinner)}_1`;
  }

  if (route === "final-answer-pair") {
    const finalMatch = /^Q_FINAL_GROUP_([1-4])_2$/.exec(currentQuestionId);
    if (!finalMatch?.[1]) {
      throw new Error(`Cannot resolve final answer pair from ${currentQuestionId}.`);
    }
    const group = Number(finalMatch[1]) as 1 | 2 | 3 | 4;
    return resolveFinalAnswerPair(history, group);
  }

  const finalMatch = /^Q_FINAL_GROUP_([1-4])_4$/.exec(currentQuestionId);
  if (!finalMatch?.[1]) {
    throw new Error(`Cannot resolve final route from ${currentQuestionId}.`);
  }
  const group = Number(finalMatch[1]) as 1 | 2 | 3 | 4;
  return `Q_FINAL_GROUP_${group}_ORDER_${resolveFinalBranch(history, group)}`;
}

export function getBlessingRound(
  questionId: string | undefined,
): ScoreRound | undefined {
  if (questionId === "Q_R1_SCORE_8") return 1;
  if (/^Q_R2_F[1-4]_SCORE_8$/.test(questionId ?? "")) return 2;
  return undefined;
}
