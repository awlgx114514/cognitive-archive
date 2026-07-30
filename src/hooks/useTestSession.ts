import { useCallback, useMemo, useRef, useState } from "react";
import { questions, getQuestionById } from "../data/questions";
import {
  TEST_STORAGE_KEY,
  testConfig,
} from "../data/testConfig";
import { getBlessingRound } from "../engine/deityScoring";
import { calculateResult } from "../engine/resultResolver";
import {
  answerQuestion,
  countUncertainSelections,
  createTestSession,
  finishTransition,
  getPreviousQuestionId,
  getRecordedAnswer,
  goBackOneStep,
  restartTestSession,
  restoreTestSession,
  startTestSession,
  truncateHistoryAtQuestion,
} from "../engine/testEngine";
import type {
  AnswerOptionId,
  QuestionNode,
  TestResult,
  TestSession,
} from "../types/test";

export type UseTestSessionValue = {
  session: TestSession;
  currentQuestion?: QuestionNode;
  result: TestResult | null;
  uncertainCount: number;
  selectedOptionId?: AnswerOptionId;
  archiveCode: string;
  canGoBack: boolean;
  hasSavedSession: boolean;
  error: string | null;
  start: () => void;
  restart: () => void;
  answer: (optionId: AnswerOptionId) => boolean;
  back: () => void;
  reset: () => void;
  complete: () => void;
  continueAfterBlessing: () => void;
  goToQuestion: (questionId: string) => void;
  clearError: () => void;
};

function removeStoredSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TEST_STORAGE_KEY);
  } catch {
    // The experience remains usable in memory when storage is blocked.
  }
}

function saveStoredSession(session: TestSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage access can be denied in privacy modes; do not block the test.
  }
}

function readInitialSession(): TestSession {
  const fallback = createTestSession();
  if (typeof window === "undefined") return fallback;

  try {
    const serialized = window.localStorage.getItem(TEST_STORAGE_KEY);
    if (!serialized) return fallback;
    const restored = restoreTestSession(JSON.parse(serialized), questions, testConfig);
    if (!restored) {
      removeStoredSession();
      return fallback;
    }

    const lastAnsweredQuestionId = restored.history.at(-1)?.questionId;
    // Ordinary short transitions resume immediately. Round blessings remain
    // visible after refresh until the user continues.
    const normalized =
      restored.status === "transitioning" &&
      !getBlessingRound(lastAnsweredQuestionId)
        ? finishTransition(restored)
        : restored;
    if (normalized !== restored) saveStoredSession(normalized);
    return normalized;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Discarding corrupt local test session", error);
    }
    removeStoredSession();
    return fallback;
  }
}

function createArchiveCode(startedAt: number): string {
  const source = Math.max(0, Math.floor(startedAt)).toString(36).toUpperCase();
  return `ARC-${source.slice(-6).padStart(6, "0")}`;
}

export function useTestSession(): UseTestSessionValue {
  const [session, setSession] = useState<TestSession>(readInitialSession);
  const sessionRef = useRef(session);
  const [error, setError] = useState<string | null>(null);
  const submissionLockedRef = useRef(false);

  const commitSession = useCallback((nextSession: TestSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    saveStoredSession(nextSession);
  }, []);

  const start = useCallback(() => {
    const current = sessionRef.current;
    if (current.status !== "not-started") return;
    const next = startTestSession(current);
    setError(null);
    commitSession(next);
  }, [commitSession]);

  const restart = useCallback(() => {
    submissionLockedRef.current = false;
    setError(null);
    commitSession(restartTestSession());
  }, [commitSession]);

  const answer = useCallback(
    (optionId: AnswerOptionId): boolean => {
      if (submissionLockedRef.current) return false;
      submissionLockedRef.current = true;

      try {
        const current = sessionRef.current;
        const question = getQuestionById(current.currentQuestionId);
        if (!question) throw new Error("Current question is missing");
        const option = question.options[optionId];
        if (!option) throw new Error("Selected option is missing");

        // Re-answering an upstream question validates availability against only
        // the retained path. This also makes a previously selected U editable at
        // the global limit and invalidates its old downstream branch atomically.
        const retainedHistory = truncateHistoryAtQuestion(
          current.history,
          question.id,
        );
        const effectiveSession: TestSession = {
          ...current,
          status: "in-progress",
          history: retainedHistory,
          completedAt: undefined,
        };
        const transition = answerQuestion(effectiveSession, optionId, {
          questions,
          config: testConfig,
        });

        const nextSession = getBlessingRound(question.id)
          ? transition.session
          : finishTransition(transition.session);
        commitSession(nextSession);
        setError(null);
        submissionLockedRef.current = false;
        return true;
      } catch (caughtError) {
        if (import.meta.env.DEV) {
          console.error("Failed to record answer", caughtError);
        }
        setError("档案路径出现异常。当前选择尚未写入，请返回入口或重新开始。");
        submissionLockedRef.current = false;
        return false;
      }
    },
    [commitSession],
  );

  const back = useCallback(() => {
    if (submissionLockedRef.current) return;
    const current = sessionRef.current;
    const next = goBackOneStep(current);
    if (next === current) return;
    setError(null);
    commitSession(next);
  }, [commitSession]);

  const reset = useCallback(() => {
    submissionLockedRef.current = false;
    setError(null);
    removeStoredSession();
    const next = createTestSession();
    sessionRef.current = next;
    setSession(next);
  }, []);

  const complete = useCallback(() => {
    const current = sessionRef.current;
    const next: TestSession = {
      ...current,
      status: "completed",
      completedAt: Date.now(),
    };
    submissionLockedRef.current = false;
    setError(null);
    commitSession(next);
  }, [commitSession]);

  const continueAfterBlessing = useCallback(() => {
    const current = sessionRef.current;
    if (current.status !== "transitioning") return;
    submissionLockedRef.current = false;
    setError(null);
    commitSession(finishTransition(current));
  }, [commitSession]);

  const goToQuestion = useCallback(
    (questionId: string) => {
      if (!getQuestionById(questionId)) {
        setError("调试跳转的目标节点不存在。");
        return;
      }
      const next: TestSession = {
        ...sessionRef.current,
        status: "in-progress",
        currentQuestionId: questionId,
        completedAt: undefined,
      };
      submissionLockedRef.current = false;
      setError(null);
      commitSession(next);
    },
    [commitSession],
  );

  const currentQuestion = getQuestionById(session.currentQuestionId);
  const uncertainCount = useMemo(
    () => countUncertainSelections(session.history),
    [session.history],
  );
  const selectedOptionId = getRecordedAnswer(session);
  const canGoBack = Boolean(getPreviousQuestionId(session));
  const archiveCode = createArchiveCode(session.startedAt);

  let result: TestResult | null = null;
  let resultError: string | null = null;
  if (session.status === "completed") {
    try {
      result = calculateResult(session.history, questions);
    } catch (caughtError) {
      if (import.meta.env.DEV) {
        console.error("Failed to calculate test result", caughtError);
      }
      resultError = "档案结果暂时无法解密，请返回入口或重新开始。";
    }
  }

  return {
    session,
    currentQuestion,
    result,
    uncertainCount,
    selectedOptionId,
    archiveCode,
    canGoBack,
    hasSavedSession: session.status !== "not-started",
    error: error ?? resultError,
    start,
    restart,
    answer,
    back,
    reset,
    complete,
    continueAfterBlessing,
    goToQuestion,
    clearError: () => setError(null),
  };
}

export default useTestSession;
