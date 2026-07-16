import { questions as demoQuestions } from "../data/questions";
import { testConfig } from "../data/testConfig";
import type {
  AnswerOption,
  AnswerOptionId,
  PathAnalysis,
  PathStep,
  QuestionNode,
  TestPath,
} from "../types/test";

export type EnumeratePathOptions = {
  maxDepth?: number;
};

type StructuralRoute = {
  optionIds: AnswerOptionId[];
  nextQuestionId?: string;
  terminal: boolean;
};

function structuralRoutes(question: QuestionNode): StructuralRoute[] {
  const options: AnswerOption[] = [
    question.options.A,
    question.options.B,
    ...(question.options.C ? [question.options.C] : []),
    ...(question.options.U ? [question.options.U] : []),
  ].filter(Boolean);
  const grouped = new Map<string, StructuralRoute>();

  for (const option of options) {
    const key = option.terminal
      ? "terminal"
      : option.nextQuestionId
        ? `next:${option.nextQuestionId}`
        : "dead-end";
    const existing = grouped.get(key);
    if (existing) {
      existing.optionIds.push(option.id);
    } else {
      grouped.set(key, {
        optionIds: [option.id],
        nextQuestionId: option.nextQuestionId,
        terminal: option.terminal === true,
      });
    }
  }

  return [...grouped.values()];
}

/**
 * Enumerates structural routes. A/B/C/U options that lead to the same next node
 * are grouped, preventing equivalent choices from creating 2ⁿ duplicate paths.
 */
export function enumerateAllPaths(
  questions: readonly QuestionNode[],
  startQuestionId: string,
  options: EnumeratePathOptions = {},
): TestPath[] {
  const questionMap = new Map(
    questions.map((question) => [question.id, question]),
  );
  const maxDepth = options.maxDepth ?? Math.max(questions.length + 1, 1);
  const paths: TestPath[] = [];

  function addPath(
    questionIds: string[],
    steps: PathStep[],
    complete: boolean,
    terminationReason: TestPath["terminationReason"],
    problemId?: string,
  ): void {
    paths.push({
      questionIds,
      steps,
      length: questionIds.length,
      complete,
      terminationReason,
      problemId,
    });
  }

  function walk(
    questionId: string,
    visitedQuestionIds: string[],
    steps: PathStep[],
    activeIds: Set<string>,
  ): void {
    const question = questionMap.get(questionId);
    if (!question) {
      addPath(
        visitedQuestionIds,
        steps,
        false,
        "missing-node",
        questionId,
      );
      return;
    }

    const questionIds = [...visitedQuestionIds, questionId];
    if (questionIds.length > maxDepth) {
      addPath(questionIds, steps, false, "depth-limit", questionId);
      return;
    }

    const routes = structuralRoutes(question);
    if (routes.length === 0) {
      addPath(questionIds, steps, false, "dead-end", questionId);
      return;
    }

    const nextActiveIds = new Set(activeIds);
    nextActiveIds.add(questionId);

    for (const route of routes) {
      const step: PathStep = {
        questionId,
        optionIds: [...route.optionIds],
        nextQuestionId: route.nextQuestionId,
        terminal: route.terminal,
      };
      const nextSteps = [...steps, step];

      if (route.terminal) {
        addPath(questionIds, nextSteps, true, "terminal");
        continue;
      }

      if (!route.nextQuestionId) {
        addPath(questionIds, nextSteps, false, "dead-end", questionId);
        continue;
      }

      if (nextActiveIds.has(route.nextQuestionId)) {
        addPath(
          questionIds,
          nextSteps,
          false,
          "cycle",
          route.nextQuestionId,
        );
        continue;
      }

      walk(route.nextQuestionId, questionIds, nextSteps, nextActiveIds);
    }
  }

  walk(startQuestionId, [], [], new Set());
  return paths;
}

function findReachableQuestionIds(
  questions: readonly QuestionNode[],
  startQuestionId: string,
): Set<string> {
  const questionMap = new Map(
    questions.map((question) => [question.id, question]),
  );
  const reachable = new Set<string>();
  const pending = [startQuestionId];

  while (pending.length > 0) {
    const questionId = pending.pop();
    if (!questionId || reachable.has(questionId)) continue;
    const question = questionMap.get(questionId);
    if (!question) continue;

    reachable.add(questionId);
    for (const route of structuralRoutes(question)) {
      if (!route.terminal && route.nextQuestionId) {
        pending.push(route.nextQuestionId);
      }
    }
  }

  return reachable;
}

export function analyzePaths(
  questions: readonly QuestionNode[],
  startQuestionId: string,
  options: EnumeratePathOptions = {},
): PathAnalysis {
  const paths = enumerateAllPaths(questions, startQuestionId, options);
  const completePaths = paths.filter((path) => path.complete);
  const incompletePaths = paths.filter((path) => !path.complete);
  const completeLengths = completePaths.map((path) => path.length);
  const reachable = findReachableQuestionIds(questions, startQuestionId);
  const nodePathCounts: Record<string, number> = Object.fromEntries(
    questions.map((question) => [question.id, 0]),
  );

  for (const path of paths) {
    for (const questionId of new Set(path.questionIds)) {
      nodePathCounts[questionId] = (nodePathCounts[questionId] ?? 0) + 1;
    }
  }

  const cyclePaths = incompletePaths
    .filter((path) => path.terminationReason === "cycle")
    .map((path) => [
      ...path.questionIds,
      ...(path.problemId ? [path.problemId] : []),
    ]);

  return {
    paths,
    completePaths,
    incompletePaths,
    shortestPathLength:
      completeLengths.length > 0 ? Math.min(...completeLengths) : undefined,
    longestPathLength:
      completeLengths.length > 0 ? Math.max(...completeLengths) : undefined,
    nodePathCounts,
    unreachableQuestionIds: questions
      .map((question) => question.id)
      .filter((questionId) => !reachable.has(questionId)),
    cyclePaths,
  };
}

export function analyzeConfiguredPaths(
  questions: readonly QuestionNode[] = demoQuestions,
): PathAnalysis {
  return analyzePaths(questions, testConfig.startQuestionId);
}
