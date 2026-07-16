import { useMemo, useState } from "react";
import type {
  PathAnalysis,
  QuestionNode,
  TestSession,
  TransitionScene,
  ValidationReport,
} from "../types/test";

export type DevPanelProps = {
  session: TestSession;
  currentQuestion?: QuestionNode;
  uncertainCount: number;
  transitionScene?: TransitionScene;
  questionIds: readonly string[];
  onJump: (questionId: string) => void;
  onBack: () => void;
  onClear: () => void;
  onComplete: () => void;
  onValidate: () => ValidationReport;
  onAnalyzePaths: () => PathAnalysis;
};

function stringifyForPanel(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "无法序列化调试输出。";
  }
}

function exportJson(value: unknown, filename: string) {
  const blob = new Blob([stringifyForPanel(value)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function DevPanel({
  session,
  currentQuestion,
  uncertainCount,
  transitionScene,
  questionIds,
  onJump,
  onBack,
  onClear,
  onComplete,
  onValidate,
  onAnalyzePaths,
}: DevPanelProps) {
  const [open, setOpen] = useState(false);
  const [jumpTarget, setJumpTarget] = useState(session.currentQuestionId);
  const [output, setOutput] = useState("");
  const nextQuestionIds = useMemo(
    () =>
      currentQuestion
        ? Object.values(currentQuestion.options)
            .map((option) => option?.nextQuestionId)
            .filter((id): id is string => Boolean(id))
        : [],
    [currentQuestion],
  );

  if (!import.meta.env.DEV) return null;

  return (
    <aside className={`dev-panel${open ? " is-open" : ""}`} aria-label="开发调试面板">
      <button
        type="button"
        className="dev-panel__toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        DEV
      </button>
      {open ? (
        <div className="dev-panel__body">
          <div className="dev-panel__heading">
            <strong>档案调试面板</strong>
            <span>仅开发环境</span>
          </div>
          <dl className="dev-grid">
            <div>
              <dt>questionId</dt>
              <dd>{session.currentQuestionId || "—"}</dd>
            </div>
            <div>
              <dt>traceCode</dt>
              <dd>{currentQuestion?.traceCode ?? "—"}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{session.status}</dd>
            </div>
            <div>
              <dt>不确定</dt>
              <dd>{uncertainCount}</dd>
            </div>
            <div>
              <dt>下一节点</dt>
              <dd>{nextQuestionIds.join(" / ") || "terminal"}</dd>
            </div>
            <div>
              <dt>过场图</dt>
              <dd>{transitionScene?.image ?? "—"}</dd>
            </div>
          </dl>

          <details>
            <summary>当前答题路径</summary>
            <pre>
              {stringifyForPanel({
                path: session.history.map((entry) => entry.questionId),
              })}
            </pre>
          </details>

          <label className="dev-jump-field">
            <span>直接跳转节点</span>
            <select
              value={jumpTarget}
              onChange={(event) => setJumpTarget(event.target.value)}
            >
              {questionIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>

          <div className="dev-actions">
            <button type="button" onClick={() => onJump(jumpTarget)}>
              跳转
            </button>
            <button type="button" onClick={onBack}>
              返回上一节点
            </button>
            <button type="button" onClick={onClear}>
              清空进度
            </button>
            <button type="button" onClick={onComplete}>
              标记完成
            </button>
            <button
              type="button"
              onClick={() => {
                const report = onValidate();
                setOutput(stringifyForPanel(report));
                console.info("Question bank validation", report);
              }}
            >
              执行题库校验
            </button>
            <button
              type="button"
              onClick={() => {
                const analysis = onAnalyzePaths();
                setOutput(stringifyForPanel(analysis));
                console.info("Reachable path analysis", analysis);
              }}
            >
              分析全部路径
            </button>
            <button
              type="button"
              onClick={() =>
                exportJson(session.history, "cognitive-archive-history.json")
              }
            >
              导出历史 JSON
            </button>
          </div>
          {output ? (
            <details open className="dev-output">
              <summary>工具输出</summary>
              <pre>{output}</pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

export default DevPanel;
