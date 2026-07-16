import type { AnswerOption } from "../types/test";

export type UncertainButtonProps = {
  option: AnswerOption;
  selected?: boolean;
  disabled?: boolean;
  remaining: number;
  limitReached?: boolean;
  onSelect: () => void;
};

export function UncertainButton({
  option,
  selected = false,
  disabled = false,
  remaining,
  limitReached = false,
  onSelect,
}: UncertainButtonProps) {
  return (
    <div className="uncertain-wrap">
      <button
        type="button"
        className={`uncertain-button${selected ? " is-selected" : ""}`}
        aria-label={`不确定：${option.title}`}
        aria-pressed={selected}
        disabled={disabled || limitReached}
        onClick={onSelect}
        data-option-id="U"
      >
        <span className="uncertain-button__key" aria-hidden="true">
          U
        </span>
        <span className="uncertain-button__copy">
          <strong>{option.title || "暂时无法确定"}</strong>
          <small>{option.text}</small>
        </span>
        <span className="uncertain-button__status">
          {selected ? "已记录 ✓" : `还可选择 ${remaining} 次`}
        </span>
      </button>
      {limitReached ? (
        <p className="uncertain-limit-note" role="status">
          当前线索需要你选择更接近自身状态的一侧。
        </p>
      ) : null}
    </div>
  );
}

export default UncertainButton;
