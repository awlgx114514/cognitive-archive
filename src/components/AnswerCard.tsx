import type { AnswerOption, AnswerOptionId } from "../types/test";

export type AnswerCardProps = {
  option: AnswerOption;
  imageSrc?: string;
  variant?: "default" | "deity";
  selected?: boolean;
  disabled?: boolean;
  onSelect: (optionId: AnswerOptionId) => void;
};

export function AnswerCard({
  option,
  imageSrc,
  variant = "default",
  selected = false,
  disabled = false,
  onSelect,
}: AnswerCardProps) {
  return (
    <button
      type="button"
      className={`answer-card answer-card--${variant}${selected ? " is-selected" : ""}`}
      aria-label={`${option.id}：${option.title}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      data-option-id={option.id}
    >
      {imageSrc ? (
        <span className="answer-card__image-wrap" aria-hidden="true">
          <img
            className="answer-card__image"
            src={imageSrc}
            alt=""
            loading="eager"
            draggable={false}
          />
        </span>
      ) : null}
      <span className="answer-card__body">
        <span className="answer-key" aria-hidden="true">
          {option.id}
        </span>
        <span className="answer-title">{option.title}</span>
        {option.text ? (
          <span className="answer-text">{option.text}</span>
        ) : null}
      </span>
    </button>
  );
}

export default AnswerCard;
