import {
  getSelectedDeityId,
  resolveRoundWinner,
} from "../engine/deityScoring";
import type { HistoryEntry } from "../types/test";
import type { DeityId } from "./deities";

export type { DeityId } from "./deities";

export type DeityVisual = {
  id: DeityId;
  portrait: string;
  background: string;
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const deityVisuals: Readonly<Record<DeityId, DeityVisual>> = {
  1: {
    id: 1,
    portrait: assetUrl("images/deities/portraits/01-se-lite.webp"),
    background: assetUrl("images/deities/backgrounds/01-se.webp"),
  },
  2: {
    id: 2,
    portrait: assetUrl("images/deities/portraits/02-ne-lite.webp"),
    background: assetUrl("images/deities/backgrounds/02-ne.webp"),
  },
  3: {
    id: 3,
    portrait: assetUrl("images/deities/portraits/03-si-lite.webp"),
    background: assetUrl("images/deities/backgrounds/03-si.webp"),
  },
  4: {
    id: 4,
    portrait: assetUrl("images/deities/portraits/04-ni-lite.webp"),
    background: assetUrl("images/deities/backgrounds/04-ni.webp"),
  },
  5: {
    id: 5,
    portrait: assetUrl("images/deities/portraits/05-te-lite.webp"),
    background: assetUrl("images/deities/backgrounds/05-te.webp"),
  },
  6: {
    id: 6,
    portrait: assetUrl("images/deities/portraits/06-fe-lite.webp"),
    background: assetUrl("images/deities/backgrounds/06-fe.webp"),
  },
  7: {
    id: 7,
    portrait: assetUrl("images/deities/portraits/07-ti-lite.webp"),
    background: assetUrl("images/deities/backgrounds/07-ti.webp"),
  },
  8: {
    id: 8,
    portrait: assetUrl("images/deities/portraits/08-fi-lite.webp"),
    background: assetUrl("images/deities/backgrounds/08-fi.webp"),
  },
};

const firstRoundSelection = [1, 2, 3, 4] as const;
const secondRoundSelection = [5, 6, 7, 8] as const;

export function getSelectionDeityIds(
  questionId: string,
): readonly DeityId[] | undefined {
  if (questionId === "Q_R1_GOD_SELECT") return firstRoundSelection;
  if (/^Q_R2_GOD_SELECT_F[1-4]$/.test(questionId)) {
    return secondRoundSelection;
  }
  return undefined;
}

export function getActiveDeityId(
  questionId: string,
  history: readonly HistoryEntry[] = [],
): DeityId | undefined {
  if (/^Q_R1_SCORE_[1-8]$/.test(questionId)) {
    return getSelectedDeityId(history, 1);
  }

  if (/^Q_R2_F[1-4]_SCORE_[1-8]$/.test(questionId)) {
    return getSelectedDeityId(history, 2);
  }

  return undefined;
}

export function getFinalDeityPair(
  history: readonly HistoryEntry[],
): readonly [DeityId, DeityId] | undefined {
  if (!getSelectedDeityId(history, 1) || !getSelectedDeityId(history, 2)) {
    return undefined;
  }

  return [
    resolveRoundWinner(history, 1).winnerId,
    resolveRoundWinner(history, 2).winnerId,
  ];
}
