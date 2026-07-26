import { questions as demoQuestions } from "../data/questions";
import { resultTypes as demoResultTypes } from "../data/resultTypes";
import { testConfig as demoTestConfig } from "../data/testConfig";
import { transitionScenes as demoTransitionScenes } from "../data/transitionScenes";
import type {
  AnswerOption,
  AnswerOptionId,
  HistoryEntry,
  QuestionNode,
  ResultType,
  TestConfig,
  TransitionScene,
  ValidationIssue,
  ValidationReport,
} from "../types/test";
import { analyzePaths } from "./pathAnalysis";
import { calculateResult } from "./resultResolver";

type ValidationInput = {
  questions: readonly QuestionNode[];
  transitionScenes: readonly TransitionScene[];
  resultTypes?: readonly ResultType[];
  config: TestConfig;
};

function allRuntimeOptions(
  question: QuestionNode,
): Array<[AnswerOptionId, AnswerOption]> {
  const optionRecord = question.options as Partial<
    Record<AnswerOptionId, AnswerOption>
  >;
  return (["A", "B", "C", "D", "U"] as const).flatMap(
    (optionId): Array<[AnswerOptionId, AnswerOption]> => {
      const option = optionRecord[optionId];
      return option ? [[optionId, option]] : [];
    },
  );
}

function addIssue(
  issues: ValidationIssue[],
  issue: Omit<ValidationIssue, "severity"> & {
    severity?: ValidationIssue["severity"];
  },
): void {
  issues.push({ severity: issue.severity ?? "error", ...issue });
}

function historyForPath(
  path: ValidationReport["pathAnalysis"]["completePaths"][number],
  questionMap: ReadonlyMap<string, QuestionNode>,
): HistoryEntry[] {
  return path.steps.map((step, index) => {
    const question = questionMap.get(step.questionId);
    const optionId = step.optionIds[0];
    const option = question?.options[optionId];

    if (!question || !option) {
      throw new Error(`Path references unavailable option at ${step.questionId}.`);
    }

    return {
      questionId: question.id,
      selectedOptionId: optionId,
      nextQuestionId: option.nextQuestionId,
      transitionSceneId: question.transitionSceneId,
      answeredAt: index + 1,
    };
  });
}

/** Returns a structured report and never relies on console-only diagnostics. */
export function validateQuestionBank({
  questions,
  transitionScenes,
  resultTypes = demoResultTypes,
  config,
}: ValidationInput): ValidationReport {
  const issues: ValidationIssue[] = [];
  const resultTypeIds = new Set(
    resultTypes.map((resultType) => resultType.id.toUpperCase()),
  );
  const questionIds = new Set<string>();
  const duplicateQuestionIds = new Set<string>();

  for (const question of questions) {
    if (questionIds.has(question.id)) duplicateQuestionIds.add(question.id);
    questionIds.add(question.id);
  }
  for (const questionId of duplicateQuestionIds) {
    addIssue(issues, {
      code: "DUPLICATE_QUESTION_ID",
      message: `题目 ID 重复：${questionId}`,
      questionId,
    });
  }

  if (!questionIds.has(config.startQuestionId)) {
    addIssue(issues, {
      code: "MISSING_START_QUESTION",
      message: `起始题目不存在：${config.startQuestionId}`,
      relatedId: config.startQuestionId,
    });
  }

  const sceneIds = new Set<string>();
  const duplicateSceneIds = new Set<string>();
  for (const scene of transitionScenes) {
    if (sceneIds.has(scene.id)) duplicateSceneIds.add(scene.id);
    sceneIds.add(scene.id);
    if (!scene.image.trim()) {
      addIssue(issues, {
        code: "MISSING_IMAGE_PATH",
        message: `过场画面缺少图片路径：${scene.id}`,
        relatedId: scene.id,
      });
    }
  }
  for (const sceneId of duplicateSceneIds) {
    addIssue(issues, {
      code: "DUPLICATE_TRANSITION_SCENE_ID",
      message: `过场画面 ID 重复：${sceneId}`,
      relatedId: sceneId,
    });
  }

  for (const resultType of resultTypes) {
    if (!resultType.classicScene.image.trim()) {
      addIssue(issues, {
        code: "MISSING_IMAGE_PATH",
        message: `结果类型缺少经典画面路径：${resultType.id}`,
        relatedId: resultType.id,
      });
    }
  }

  const sceneOwners = new Map<string, string>();
  for (const question of questions) {
    const optionRecord = question.options as Partial<
      Record<AnswerOptionId, AnswerOption>
    >;
    if (!optionRecord.A) {
      addIssue(issues, {
        code: "MISSING_OPTION_A",
        message: "题目缺少 A 选项。",
        questionId: question.id,
      });
    }
    if (!optionRecord.B) {
      addIssue(issues, {
        code: "MISSING_OPTION_B",
        message: "题目缺少 B 选项。",
        questionId: question.id,
      });
    }

    const hasUncertain = Boolean(optionRecord.U);
    if (question.stage === "screening" && (hasUncertain || question.allowUncertain)) {
      addIssue(issues, {
        code: "SCREENING_HAS_UNCERTAIN",
        message: "初筛题不得提供 U 选项。",
        questionId: question.id,
        optionId: hasUncertain ? "U" : undefined,
      });
    }
    if (question.allowUncertain === true && !hasUncertain) {
      addIssue(issues, {
        code: "UNCERTAIN_FLAG_MISMATCH",
        message: "allowUncertain 为 true，但题目缺少 U 选项。",
        questionId: question.id,
      });
    }
    if (hasUncertain && question.allowUncertain !== true) {
      addIssue(issues, {
        code: "UNCERTAIN_FLAG_MISMATCH",
        message: "题目配置了 U 选项，但 allowUncertain 未启用。",
        questionId: question.id,
        optionId: "U",
      });
    }

    const options = allRuntimeOptions(question);
    for (const [expectedOptionId, option] of options) {
      if (option.id !== expectedOptionId) {
        addIssue(issues, {
          code: "INVALID_OPTION_ID",
          message: `选项键 ${expectedOptionId} 与内部 ID ${option.id} 不一致。`,
          questionId: question.id,
          optionId: expectedOptionId,
        });
      }
      if (option.terminal && option.nextQuestionId) {
        addIssue(issues, {
          code: "TERMINAL_NEXT_CONFLICT",
          message: "terminal 与 nextQuestionId 不能同时存在。",
          questionId: question.id,
          optionId: expectedOptionId,
          relatedId: option.nextQuestionId,
        });
      }
      if (!option.terminal && option.nextQuestionId && !questionIds.has(option.nextQuestionId)) {
        addIssue(issues, {
          code: "MISSING_NEXT_QUESTION",
          message: `下一节点不存在：${option.nextQuestionId}`,
          questionId: question.id,
          optionId: expectedOptionId,
          relatedId: option.nextQuestionId,
        });
      }
      for (const resultReference of [option.typeHintId, option.calibrationTypeId]) {
        if (resultReference && !resultTypeIds.has(resultReference.toUpperCase())) {
          addIssue(issues, {
            code: "INVALID_RESULT_REFERENCE",
            message: `选项引用了不存在的结果类型：${resultReference}`,
            questionId: question.id,
            optionId: expectedOptionId,
            relatedId: resultReference,
          });
        }
      }
      if (option.typeHintId && option.calibrationTypeId) {
        addIssue(issues, {
          code: "INVALID_CALIBRATION_OPTION",
          message: "同一选项不能同时作为候选线索和最终校准结果。",
          questionId: question.id,
          optionId: expectedOptionId,
        });
      }
      if (
        option.terminal &&
        (question.stage !== "calibration" || !option.calibrationTypeId)
      ) {
        addIssue(issues, {
          code: "INVALID_CALIBRATION_OPTION",
          message: "终点必须是带有 calibrationTypeId 的校准题选项。",
          questionId: question.id,
          optionId: expectedOptionId,
        });
      }
      if (!option.terminal && option.calibrationTypeId) {
        addIssue(issues, {
          code: "INVALID_CALIBRATION_OPTION",
          message: "非终点选项不能直接指定最终校准结果。",
          questionId: question.id,
          optionId: expectedOptionId,
        });
      }
    }
    if (
      options.length === 0 ||
      options.every(([, option]) => !option.terminal && !option.nextQuestionId)
    ) {
      addIssue(issues, {
        code: "NO_EXIT",
        message: "题目没有任何可用出口。",
        questionId: question.id,
      });
    }

    if (!sceneIds.has(question.transitionSceneId)) {
      addIssue(issues, {
        code: "MISSING_TRANSITION_SCENE",
        message: `题目引用的过场画面不存在：${question.transitionSceneId}`,
        questionId: question.id,
        relatedId: question.transitionSceneId,
      });
    }
    const existingOwner = sceneOwners.get(question.transitionSceneId);
    if (existingOwner && existingOwner !== question.id) {
      addIssue(issues, {
        code: "DUPLICATE_QUESTION_SCENE",
        message: `题目必须拥有唯一过场画面；该画面已由 ${existingOwner} 使用。`,
        questionId: question.id,
        relatedId: question.transitionSceneId,
      });
    } else {
      sceneOwners.set(question.transitionSceneId, question.id);
    }
  }

  const pathAnalysis = analyzePaths(questions, config.startQuestionId);
  for (const questionId of pathAnalysis.unreachableQuestionIds) {
    addIssue(issues, {
      code: "UNREACHABLE_QUESTION",
      message: "题目无法从起始节点到达。",
      questionId,
    });
  }
  for (const cyclePath of pathAnalysis.cyclePaths) {
    addIssue(issues, {
      code: "CYCLE",
      message: `检测到意外循环：${cyclePath.join(" → ")}`,
      path: cyclePath,
    });
  }
  if (pathAnalysis.completePaths.length === 0) {
    addIssue(issues, {
      code: "NO_REACHABLE_TERMINAL",
      message: "从起始节点无法到达任何终点。",
    });
  }
  for (const path of pathAnalysis.incompletePaths) {
    addIssue(issues, {
      code: "INCOMPLETE_PATH",
      message: `路径未能生成结果：${path.terminationReason}`,
      path: path.questionIds,
      relatedId: path.problemId,
    });
  }
  for (const path of pathAnalysis.completePaths) {
    if (
      config.minimumPathLength !== undefined &&
      path.length < config.minimumPathLength
    ) {
      addIssue(issues, {
        code: "PATH_TOO_SHORT",
        message: `完整路径长度 ${path.length} 小于配置下限 ${config.minimumPathLength}。`,
        path: path.questionIds,
      });
    }
    if (
      config.maximumPathLength !== undefined &&
      path.length > config.maximumPathLength
    ) {
      addIssue(issues, {
        code: "PATH_TOO_LONG",
        message: `完整路径长度 ${path.length} 超过配置上限 ${config.maximumPathLength}。`,
        path: path.questionIds,
      });
    }
  }

  const uniqueQuestionMap = new Map(
    questions.map((question) => [question.id, question]),
  );
  for (const path of pathAnalysis.completePaths) {
    try {
      calculateResult(
        historyForPath(path, uniqueQuestionMap),
        [...questions],
      );
    } catch (error) {
      addIssue(issues, {
        code: "RESULT_GENERATION_FAILED",
        message: `完整路径无法生成结果：${
          error instanceof Error ? error.message : "未知结果解析错误"
        }`,
        path: path.questionIds,
      });
    }
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
    stats: {
      questionCount: questions.length,
      transitionSceneCount: transitionScenes.length,
      reachableQuestionCount:
        questions.length - pathAnalysis.unreachableQuestionIds.length,
      completePathCount: pathAnalysis.completePaths.length,
      incompletePathCount: pathAnalysis.incompletePaths.length,
      shortestPathLength: pathAnalysis.shortestPathLength,
      longestPathLength: pathAnalysis.longestPathLength,
    },
    pathAnalysis,
  };
}

export function validateDemoContent(): ValidationReport {
  return validateQuestionBank({
    questions: demoQuestions,
    transitionScenes: demoTransitionScenes,
    resultTypes: demoResultTypes,
    config: demoTestConfig,
  });
}

/** Backward-friendly alias for development panels and scripts. */
export const validateContent = validateDemoContent;
