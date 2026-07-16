import { useEffect, useMemo, useRef } from "react";
import { testConfig } from "../data/testConfig";
import type {
  AnswerOption,
  AnswerOptionId,
  QuestionNode,
} from "../types/test";
import AnswerCard from "./AnswerCard";
import ProgressIndicator from "./ProgressIndicator";
import UncertainButton from "./UncertainButton";

export type QuestionScreenProps = {
  question: QuestionNode;
  archiveCode: string;
  depth: number;
  clueCount: number;
  uncertainCount: number;
  selectedOptionId?: AnswerOptionId;
  disabled?: boolean;
  canGoBack?: boolean;
  onAnswer: (optionId: AnswerOptionId) => void;
  onBack: () => void;
  onRequestHome?: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export function QuestionScreen({
  question,
  archiveCode,
  depth,
  clueCount,
  uncertainCount,
  selectedOptionId,
  disabled = false,
  canGoBack = false,
  onAnswer,
  onBack,
  onRequestHome,
}: QuestionScreenProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formalOptions = useMemo(() => {
    const options = question.options as Partial<Record<string, AnswerOption>>;
    return ["A", "B", "C"]
      .map((optionId) => options[optionId])
      .filter((option): option is AnswerOption => Boolean(option));
  }, [question.options]);
  const formalOptionIds = useMemo(
    () => formalOptions.map((option) => option.id),
    [formalOptions],
  );
  const uncertainRemaining = Math.max(
    0,
    testConfig.maxUncertainSelections - uncertainCount,
  );
  const canUseUncertain = Boolean(
    question.stage !== "screening" &&
      question.allowUncertain &&
      question.options.U &&
      (uncertainRemaining > 0 || selectedOptionId === "U"),
  );
  const showUncertain = Boolean(
    question.stage !== "screening" &&
      question.allowUncertain &&
      question.options.U,
  );

  useEffect(() => {
    titleRef.current?.focus();
  }, [question.id]);

  useEffect(() => {
    const handleKeyboardAnswer = (event: KeyboardEvent) => {
      if (
        disabled ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      const numericIndex = Number.parseInt(event.key, 10) - 1;
      const numericOptionId = Number.isInteger(numericIndex)
        ? formalOptions[numericIndex]?.id
        : undefined;
      const optionId = numericOptionId ??
        (event.key.toUpperCase() as AnswerOptionId);
      if (formalOptionIds.includes(optionId)) {
        event.preventDefault();
        onAnswer(optionId);
      } else if (optionId === "U" && canUseUncertain) {
        event.preventDefault();
        onAnswer("U");
      }
    };

    window.addEventListener("keydown", handleKeyboardAnswer);
    return () => window.removeEventListener("keydown", handleKeyboardAnswer);
  }, [canUseUncertain, disabled, formalOptionIds, formalOptions, onAnswer]);

  return (
    <section className="question-screen" aria-labelledby="question-title">
      <div className="question-panel">
        <header className="question-meta">
          <button
            type="button"
            className="archive-id-button"
            onClick={onRequestHome}
            disabled={!onRequestHome || disabled}
            aria-label="返回认知之门入口"
          >
            档案编号 {archiveCode}
          </button>
          <span className="question-trace">TRACE / {question.traceCode}</span>
        </header>

        <ProgressIndicator
          depth={depth}
          clueCount={clueCount}
          recommendedDepth={testConfig.recommendedPathLength}
        />

        <div className="question-copy">
          <p className="question-eyebrow">请选择更接近当下真实状态的一侧</p>
          <h1
            ref={titleRef}
            className="question-title"
            id="question-title"
            tabIndex={-1}
          >
            {question.shortQuestion ?? question.question}
          </h1>
          {question.shortQuestion ? (
            <p className="question-detail">{question.question}</p>
          ) : null}
        </div>

        <div className="answers-grid" aria-label="答案选项">
          {formalOptions.map((option) => (
            <AnswerCard
              key={option.id}
              option={option}
              selected={selectedOptionId === option.id}
              disabled={disabled}
              onSelect={onAnswer}
            />
          ))}
        </div>

        {showUncertain && question.options.U && canUseUncertain ? (
          <UncertainButton
            option={question.options.U}
            selected={selectedOptionId === "U"}
            disabled={disabled}
            remaining={uncertainRemaining}
            limitReached={false}
            onSelect={() => onAnswer("U")}
          />
        ) : null}

        {showUncertain && !canUseUncertain ? (
          <p className="uncertain-limit-note" role="status">
            当前线索需要你选择更接近自身状态的一侧。
          </p>
        ) : null}

        <footer className="question-footer">
          <button
            type="button"
            className="back-button"
            onClick={onBack}
            disabled={!canGoBack || disabled}
          >
            <span aria-hidden="true">←</span> 返回上一条线索
          </button>
          <p className="keyboard-hint" aria-hidden="true">
            键盘快捷键 {formalOptionIds.join(" / ")}
            {formalOptions.length ? ` · ${formalOptions.map((_, index) => index + 1).join(" / ")}` : ""}
            {canUseUncertain ? " / U" : ""}
          </p>
        </footer>
      </div>
    </section>
  );
}

export default QuestionScreen;
