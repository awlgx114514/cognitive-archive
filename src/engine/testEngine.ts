import { questions as demoQuestions } from "../data/questions";
import {
  testConfig as demoTestConfig,
  UNCERTAIN_LIMIT_MESSAGE,
} from "../data/testConfig";
import { getBlessingRound, resolveDynamicRoute } from "./deityScoring";
import type {
  AnswerAvailability,
  AnswerOption,
  AnswerOptionId,
  AnswerTransition,
  HistoryEntry,
  QuestionNode,
  TestConfig,
  TestSession,
} from "../types/test";

export type TestEngineErrorCode =
  | "QUESTION_NOT_FOUND"
  | "OPTION_NOT_FOUND"
  | "OPTION_NOT_AVAILABLE"
  | "MISSING_NEXT_QUESTION"
  | "TERMINAL_NEXT_CONFLICT"
  | "TRANSITION_IN_PROGRESS"
  | "INVALID_BACK_TARGET";

export class TestEngineError extends Error {
  readonly code: TestEngineErrorCode;

  constructor(code: TestEngineErrorCode, message: string) {
    super(message);
    this.name = "TestEngineError";
    this.code = code;
  }
}

export type AnswerQuestionOptions = {
  questions?: readonly QuestionNode[];
  config?: TestConfig;
  answeredAt?: number;
};

export type RecalculatedSessionState = {
  uncertainCount: number;
  answeredQuestionCount: number;
  explicitAnswerCount: number;
  terminal: boolean;
};

function createQuestionMap(
  questions: readonly QuestionNode[],
): ReadonlyMap<string, QuestionNode> {
  return new Map(questions.map((question) => [question.id, question]));
}

export function createTestSession(
  now = Date.now(),
  config: TestConfig = demoTestConfig,
): TestSession {
  return {
    version: config.storageVersion,
    status: "not-started",
    currentQuestionId: config.startQuestionId,
    history: [],
    startedAt: now,
  };
}

export const createInitialSession = createTestSession;

export function startTestSession(
  session: TestSession = createTestSession(),
  now = Date.now(),
): TestSession {
  return {
    ...session,
    status: "in-progress",
    startedAt: session.status === "not-started" ? now : session.startedAt,
    completedAt: undefined,
  };
}

export function countUncertainSelections(
  history: readonly HistoryEntry[],
): number {
  return history.reduce(
    (count, entry) => count + (entry.selectedOptionId === "U" ? 1 : 0),
    0,
  );
}

export function getAnswerAvailability(
  question: QuestionNode,
  optionId: AnswerOptionId,
  history: readonly HistoryEntry[],
  config: TestConfig = demoTestConfig,
): AnswerAvailability {
  const option = question.options[optionId];
  if (!option) {
    return { allowed: false, reason: "unknown-option" };
  }

  if (optionId !== "U") return { allowed: true };

  if (
    question.stage === "screening" ||
    question.allowUncertain !== true ||
    !question.options.U
  ) {
    return { allowed: false, reason: "uncertain-not-allowed" };
  }

  const existingIndex = history.findIndex(
    (entry) => entry.questionId === question.id,
  );
  const effectiveHistory =
    existingIndex >= 0 ? history.slice(0, existingIndex) : history;
  if (
    countUncertainSelections(effectiveHistory) >=
    config.maxUncertainSelections
  ) {
    return {
      allowed: false,
      reason: "uncertain-limit",
      message: UNCERTAIN_LIMIT_MESSAGE,
    };
  }

  return { allowed: true };
}

export function canSelectOption(
  question: QuestionNode,
  optionId: AnswerOptionId,
  history: readonly HistoryEntry[],
  config: TestConfig = demoTestConfig,
): boolean {
  return getAnswerAvailability(question, optionId, history, config).allowed;
}

export function getAvailableOptions(
  question: QuestionNode,
  history: readonly HistoryEntry[],
  config: TestConfig = demoTestConfig,
): AnswerOption[] {
  return (["A", "B", "C", "D", "U"] as const)
    .map((optionId) => question.options[optionId])
    .filter((option): option is AnswerOption => Boolean(option))
    .filter((option) => canSelectOption(question, option.id, history, config));
}

export function getAvailableOptionIds(
  question: QuestionNode,
  history: readonly HistoryEntry[],
  config: TestConfig = demoTestConfig,
): AnswerOptionId[] {
  return getAvailableOptions(question, history, config).map((option) => option.id);
}

export function resolveNextQuestionId(
  question: QuestionNode,
  option: AnswerOption,
  history: readonly HistoryEntry[],
): string | undefined {
  if (option.terminal) return undefined;
  if (question.dynamicRoute) {
    return resolveDynamicRoute(question.dynamicRoute, history, question.id);
  }
  return option.nextQuestionId;
}

/** Returns history before this question; changing it invalidates every later clue. */
export function truncateHistoryAtQuestion(
  history: readonly HistoryEntry[],
  questionId: string,
): HistoryEntry[] {
  const existingIndex = history.findIndex(
    (entry) => entry.questionId === questionId,
  );
  const effectiveHistory =
    existingIndex >= 0 ? history.slice(0, existingIndex) : history;
  return effectiveHistory.map((entry) => ({ ...entry }));
}

export function answerQuestion(
  session: TestSession,
  optionId: AnswerOptionId,
  options: AnswerQuestionOptions = {},
): AnswerTransition {
  const questions = options.questions ?? demoQuestions;
  const config = options.config ?? demoTestConfig;
  const answeredAt = options.answeredAt ?? Date.now();

  if (session.status === "transitioning") {
    throw new TestEngineError(
      "TRANSITION_IN_PROGRESS",
      "当前过场尚未结束，不能重复提交。",
    );
  }

  const questionMap = createQuestionMap(questions);
  const question = questionMap.get(session.currentQuestionId);
  if (!question) {
    throw new TestEngineError(
      "QUESTION_NOT_FOUND",
      `当前题目不存在：${session.currentQuestionId}`,
    );
  }

  const availability = getAnswerAvailability(
    question,
    optionId,
    session.history,
    config,
  );
  if (!availability.allowed) {
    if (availability.reason === "unknown-option") {
      throw new TestEngineError(
        "OPTION_NOT_FOUND",
        `题目 ${question.id} 不存在选项 ${optionId}。`,
      );
    }
    throw new TestEngineError(
      "OPTION_NOT_AVAILABLE",
      availability.message ?? "当前题目不能选择该选项。",
    );
  }

  const option = question.options[optionId];
  if (!option) {
    throw new TestEngineError(
      "OPTION_NOT_FOUND",
      `题目 ${question.id} 不存在选项 ${optionId}。`,
    );
  }
  if (option.terminal && (option.nextQuestionId || question.dynamicRoute)) {
    throw new TestEngineError(
      "TERMINAL_NEXT_CONFLICT",
      `题目 ${question.id} 的终止选项不能同时配置下一节点。`,
    );
  }
  if (!option.terminal && !option.nextQuestionId && !question.dynamicRoute) {
    throw new TestEngineError(
      "MISSING_NEXT_QUESTION",
      `题目 ${question.id} 的选项 ${optionId} 缺少下一节点。`,
    );
  }
  if (
    option.nextQuestionId &&
    !questionMap.has(option.nextQuestionId)
  ) {
    throw new TestEngineError(
      "MISSING_NEXT_QUESTION",
      `下一节点不存在：${option.nextQuestionId}`,
    );
  }

  const retainedHistory = truncateHistoryAtQuestion(
    session.history,
    question.id,
  );
  const unresolvedHistoryEntry: HistoryEntry = {
    questionId: question.id,
    selectedOptionId: optionId,
    transitionSceneId: question.transitionSceneId,
    answeredAt,
  };
  const unresolvedHistory = [...retainedHistory, unresolvedHistoryEntry];
  const nextQuestionId = resolveNextQuestionId(
    question,
    option,
    unresolvedHistory,
  );
  if (nextQuestionId && !questionMap.has(nextQuestionId)) {
    throw new TestEngineError(
      "MISSING_NEXT_QUESTION",
      `下一节点不存在：${nextQuestionId}`,
    );
  }
  const historyEntry: HistoryEntry = {
    ...unresolvedHistoryEntry,
    nextQuestionId,
  };
  const history = [...retainedHistory, historyEntry];
  const terminal = option.terminal === true;
  const nextSession: TestSession = {
    ...session,
    version: config.storageVersion,
    status: terminal ? "completed" : "transitioning",
    currentQuestionId: nextQuestionId ?? question.id,
    history,
    completedAt: terminal ? answeredAt : undefined,
  };

  return {
    session: nextSession,
    historyEntry,
    nextQuestionId,
    terminal,
    transitionSceneId: question.transitionSceneId,
  };
}

export function finishTransition(session: TestSession): TestSession {
  if (session.status !== "transitioning") return session;
  return { ...session, status: "in-progress" };
}

export function enterFinalBlessing(session: TestSession): TestSession {
  if (session.status !== "transitioning") return session;
  return { ...session, status: "final-blessing" };
}

export function finishFinalBlessing(session: TestSession): TestSession {
  if (session.status !== "final-blessing") return session;
  return { ...session, status: "in-progress" };
}

export function advancePastRoundBlessing(session: TestSession): TestSession {
  if (session.status !== "transitioning") return session;
  const blessingRound = getBlessingRound(session.history.at(-1)?.questionId);
  return blessingRound === 2
    ? enterFinalBlessing(session)
    : finishTransition(session);
}

export function getPreviousQuestionId(
  session: TestSession,
): string | undefined {
  const currentIndex = session.history.findIndex(
    (entry) => entry.questionId === session.currentQuestionId,
  );
  if (currentIndex > 0) {
    return session.history[currentIndex - 1]?.questionId;
  }
  if (currentIndex === 0) return undefined;
  return session.history.at(-1)?.questionId;
}

/**
 * Preview-style back navigation: history is retained until a revisited answer
 * is submitted, at which point answerQuestion truncates the stale suffix.
 */
export function goBackOneStep(session: TestSession): TestSession {
  const previousQuestionId = getPreviousQuestionId(session);
  if (!previousQuestionId) return session;
  return {
    ...session,
    status: "in-progress",
    currentQuestionId: previousQuestionId,
    completedAt: undefined,
  };
}

export function goBackToQuestion(
  session: TestSession,
  questionId: string,
): TestSession {
  if (!session.history.some((entry) => entry.questionId === questionId)) {
    throw new TestEngineError(
      "INVALID_BACK_TARGET",
      `目标题目不在当前有效路径中：${questionId}`,
    );
  }
  return {
    ...session,
    status: "in-progress",
    currentQuestionId: questionId,
    completedAt: undefined,
  };
}

/** Keeps both scored rounds and clears only the failed third-round choices. */
export function retryFinalRound(
  session: TestSession,
  questions: readonly QuestionNode[] = demoQuestions,
): TestSession {
  const questionMap = createQuestionMap(questions);
  const finalChoiceEntry = session.history.find((entry) => {
    const question = questionMap.get(entry.questionId);
    return Boolean(
      question?.stage === "calibration" &&
        /^Q_FINAL_GROUP_[1-4]_1$/.test(question.id),
    );
  });

  if (!finalChoiceEntry) {
    throw new TestEngineError(
      "INVALID_BACK_TARGET",
      "当前答题路径中不存在可重选的第三轮题目。",
    );
  }

  return {
    ...session,
    status: "in-progress",
    currentQuestionId: finalChoiceEntry.questionId,
    history: truncateHistoryAtQuestion(
      session.history,
      finalChoiceEntry.questionId,
    ),
    completedAt: undefined,
  };
}

export function getRecordedAnswer(
  session: TestSession,
  questionId: string = session.currentQuestionId,
): AnswerOptionId | undefined {
  return session.history.find((entry) => entry.questionId === questionId)
    ?.selectedOptionId;
}

export function isTerminalHistory(
  history: readonly HistoryEntry[],
  questions: readonly QuestionNode[] = demoQuestions,
): boolean {
  const lastEntry = history.at(-1);
  if (!lastEntry) return false;
  const question = createQuestionMap(questions).get(lastEntry.questionId);
  return question?.options[lastEntry.selectedOptionId]?.terminal === true;
}

export function recalculateSessionState(
  session: TestSession,
  questions: readonly QuestionNode[] = demoQuestions,
): RecalculatedSessionState {
  const uncertainCount = countUncertainSelections(session.history);
  return {
    uncertainCount,
    answeredQuestionCount: session.history.length,
    explicitAnswerCount: session.history.length - uncertainCount,
    terminal: isTerminalHistory(session.history, questions),
  };
}

export function restartTestSession(
  now = Date.now(),
  config: TestConfig = demoTestConfig,
): TestSession {
  return startTestSession(createTestSession(now, config), now);
}

export function isTestSessionSnapshot(value: unknown): value is TestSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TestSession>;
  return (
    typeof candidate.version === "string" &&
    typeof candidate.currentQuestionId === "string" &&
    typeof candidate.startedAt === "number" &&
    Array.isArray(candidate.history) &&
    [
      "not-started",
      "in-progress",
      "transitioning",
      "final-blessing",
      "completed",
    ].includes(candidate.status ?? "")
  );
}

/** Returns a safe cloned session or undefined for stale/corrupt local data. */
export function restoreTestSession(
  value: unknown,
  questions: readonly QuestionNode[] = demoQuestions,
  config: TestConfig = demoTestConfig,
): TestSession | undefined {
  if (!isTestSessionSnapshot(value) || value.version !== config.storageVersion) {
    return undefined;
  }

  const questionMap = createQuestionMap(questions);
  if (!questionMap.has(value.currentQuestionId)) return undefined;
  if (!value.history.every((entry, index) => {
    if (!entry || typeof entry !== "object") return false;
    const question = questionMap.get(entry.questionId);
    const option = question?.options[entry.selectedOptionId];
    const expectedNextQuestionId =
      question && option
        ? resolveNextQuestionId(
            question,
            option,
            value.history.slice(0, index + 1),
          )
        : undefined;
    return Boolean(
      question &&
        option &&
        entry.transitionSceneId === question.transitionSceneId &&
        entry.nextQuestionId === expectedNextQuestionId &&
        typeof entry.answeredAt === "number",
    );
  })) {
    return undefined;
  }

  for (let index = 0; index < value.history.length - 1; index += 1) {
    if (
      value.history[index]?.nextQuestionId !==
      value.history[index + 1]?.questionId
    ) {
      return undefined;
    }
  }
  if (
    value.history[0] &&
    value.history[0].questionId !== config.startQuestionId
  ) {
    return undefined;
  }
  if (countUncertainSelections(value.history) > config.maxUncertainSelections) {
    return undefined;
  }

  return {
    ...value,
    history: value.history.map((entry) => ({ ...entry })),
  };
}
