import type { AnswerOption, AnswerOptionId } from "../types/test";

export type AnswerCardProps = {
  option: AnswerOption;
  selected?: boolean;
  disabled?: boolean;
  onSelect: (optionId: AnswerOptionId) => void;
};

export function AnswerCard({
  option,
  selected = false,
  disabled = false,
  onSelect,
}: AnswerCardProps) {
  return (
    <button
      type="button"
      className={`answer-card${selected ? " is-selected" : ""}`}
      aria-label={`${option.id}：${option.title}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      data-option-id={option.id}
    >
      <span className="answer-card__header">
        <span className="answer-key" aria-hidden="true">
          {option.id}
        </span>
        <span className="answer-card__selection" aria-hidden="true">
          {selected ? "已记录 ✓" : "选择此线索"}
        </span>
      </span>
      <span className="answer-title">{option.title}</span>
      <span className="answer-text">{option.text}</span>
    </button>
  );
}

export default AnswerCard;
