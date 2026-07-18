export const FUNCTION_KEYS = [
  "Ni",
  "Ne",
  "Si",
  "Se",
  "Ti",
  "Te",
  "Fi",
  "Fe",
] as const;

export type FunctionKey = (typeof FUNCTION_KEYS)[number];

export const ANSWER_OPTION_IDS = ["A", "B", "C", "U"] as const;

export type AnswerOptionId = (typeof ANSWER_OPTION_IDS)[number];

export type AnswerOption = {
  id: AnswerOptionId;
  title: string;
  text: string;
  nextQuestionId?: string;
  terminal?: boolean;
  /** Candidate clue used by the branch consistency check. */
  typeHintId?: string;
  /** Concrete result selected by a terminal calibration answer. */
  calibrationTypeId?: string;
  /** Marks an explicit calibration rejection that should offer a retest. */
  requiresRetest?: boolean;
  internalNote?: string;
};

export type QuestionOptions = {
  A: AnswerOption;
  B: AnswerOption;
  C?: AnswerOption;
  U?: AnswerOption;
};

export type QuestionStage =
  | "screening"
  | "core"
  | "verification"
  | "calibration";

export type QuestionNode = {
  id: string;
  traceCode: string;
  question: string;
  shortQuestion?: string;
  /** Optional pause before answer choices are revealed. */
  optionRevealDelayMs?: number;
  options: QuestionOptions;
  allowUncertain?: boolean;
  transitionSceneId: string;
  dimensionTags?: FunctionKey[];
  stage?: QuestionStage;
  /** Links different situations that revisit the same tentative distinction. */
  consistencyGroupId?: string;
  internalNote?: string;
};

export type TransitionScene = {
  id: string;
  image: string;
  mobileImage?: string;
  alt: string;
  line: string;
  durationMs?: number;
  overlay?: "violet" | "blue" | "silver" | "gold";
};

export type ResultAccent = "violet" | "blue" | "silver" | "gold";

export type ResultType = {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  summary: string;
  functionOrder: FunctionKey[];
  strengths: string[];
  tensions: string[];
  classicScene: {
    title: string;
    description: string;
    image: string;
    alt: string;
  };
  accent: ResultAccent;
};

export type HistoryEntry = {
  questionId: string;
  selectedOptionId: AnswerOptionId;
  nextQuestionId?: string;
  transitionSceneId: string;
  answeredAt: number;
};

export type TestResult = {
  resultTypeId: string;
  /** True when the final calibration conflicts with earlier candidate clues. */
  needsRetest: boolean;
  calibrationMatched: boolean;
  retestReason?: string;
  history: HistoryEntry[];
};

export type SessionStatus =
  | "not-started"
  | "in-progress"
  | "transitioning"
  | "completed";

export type TestSession = {
  version: string;
  status: SessionStatus;
  currentQuestionId: string;
  history: HistoryEntry[];
  startedAt: number;
  completedAt?: number;
};

export type TestConfig = {
  startQuestionId: string;
  maxUncertainSelections: number;
  minimumPathLength?: number;
  recommendedPathLength?: number;
  maximumPathLength?: number;
  storageVersion: string;
};

export type AnswerAvailability = {
  allowed: boolean;
  reason?: "unknown-option" | "uncertain-not-allowed" | "uncertain-limit";
  message?: string;
};

export type AnswerTransition = {
  session: TestSession;
  historyEntry: HistoryEntry;
  nextQuestionId?: string;
  terminal: boolean;
  transitionSceneId: string;
};

export type PathTerminationReason =
  | "terminal"
  | "dead-end"
  | "missing-node"
  | "cycle"
  | "depth-limit";

export type PathStep = {
  questionId: string;
  /** Options with identical routing are grouped into one structural path step. */
  optionIds: AnswerOptionId[];
  nextQuestionId?: string;
  terminal: boolean;
};

export type TestPath = {
  questionIds: string[];
  steps: PathStep[];
  length: number;
  complete: boolean;
  terminationReason: PathTerminationReason;
  problemId?: string;
};

export type PathAnalysis = {
  paths: TestPath[];
  completePaths: TestPath[];
  incompletePaths: TestPath[];
  shortestPathLength?: number;
  longestPathLength?: number;
  nodePathCounts: Record<string, number>;
  unreachableQuestionIds: string[];
  cyclePaths: string[][];
};

export type ValidationSeverity = "error" | "warning";

export type ValidationIssueCode =
  | "DUPLICATE_QUESTION_ID"
  | "MISSING_START_QUESTION"
  | "MISSING_OPTION_A"
  | "MISSING_OPTION_B"
  | "SCREENING_HAS_UNCERTAIN"
  | "UNCERTAIN_FLAG_MISMATCH"
  | "INVALID_OPTION_ID"
  | "MISSING_NEXT_QUESTION"
  | "NO_EXIT"
  | "UNREACHABLE_QUESTION"
  | "CYCLE"
  | "NO_REACHABLE_TERMINAL"
  | "MISSING_TRANSITION_SCENE"
  | "DUPLICATE_TRANSITION_SCENE_ID"
  | "DUPLICATE_QUESTION_SCENE"
  | "TERMINAL_NEXT_CONFLICT"
  | "MISSING_IMAGE_PATH"
  | "PATH_TOO_SHORT"
  | "PATH_TOO_LONG"
  | "INCOMPLETE_PATH"
  | "INVALID_RESULT_REFERENCE"
  | "INVALID_CALIBRATION_OPTION"
  | "RESULT_GENERATION_FAILED";

export type ValidationIssue = {
  code: ValidationIssueCode;
  severity: ValidationSeverity;
  message: string;
  questionId?: string;
  optionId?: AnswerOptionId;
  relatedId?: string;
  path?: string[];
};

export type ValidationReport = {
  valid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: {
    questionCount: number;
    transitionSceneCount: number;
    reachableQuestionCount: number;
    completePathCount: number;
    incompletePathCount: number;
    shortestPathLength?: number;
    longestPathLength?: number;
  };
  pathAnalysis: PathAnalysis;
};
