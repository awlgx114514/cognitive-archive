import { useEffect, useState } from "react";
import { questions } from "../data/questions";
import {
  getActiveDeityId,
  getFinalDeityPair,
} from "../data/deityVisuals";
import { getResultTypeById } from "../data/resultTypes";
import { getTransitionSceneById } from "../data/transitionScenes";
import {
  getBlessingRound,
  resolveRoundWinner,
} from "../engine/deityScoring";
import { analyzeConfiguredPaths } from "../engine/pathAnalysis";
import { validateDemoContent } from "../engine/validation";
import { useTestSession } from "../hooks/useTestSession";
import BlessingScreen from "./BlessingScreen";
import ConfirmDialog from "./ConfirmDialog";
import DevPanel from "./DevPanel";
import HomeScreen from "./HomeScreen";
import MysticBackground from "./MysticBackground";
import QuestionScreen from "./QuestionScreen";
import ResultScreen from "./ResultScreen";

type ConfirmIntent = "leave" | "restart" | null;

export function AppShell() {
  const {
    session,
    currentQuestion,
    result,
    uncertainCount,
    selectedOptionId,
    archiveCode,
    canGoBack,
    hasSavedSession,
    error,
    start,
    restart,
    retryFinalRound,
    answer,
    back,
    reset,
    complete,
    continueAfterBlessing,
    goToQuestion,
    clearError,
  } = useTestSession();
  const [showHome, setShowHome] = useState(
    () => session.status === "not-started",
  );
  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent>(null);

  useEffect(() => {
    if (session.status === "not-started") setShowHome(true);
  }, [session.status]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        session.status !== "in-progress" &&
        session.status !== "transitioning"
      ) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session.status]);

  const requestHome = () => {
    if (
      session.status === "in-progress" ||
      session.status === "transitioning"
    ) {
      setConfirmIntent("leave");
    } else {
      setShowHome(true);
    }
  };

  const requestRestart = () => setConfirmIntent("restart");

  const confirmAction = () => {
    if (confirmIntent === "leave") {
      setShowHome(true);
    } else if (confirmIntent === "restart") {
      restart();
      setShowHome(false);
    }
    setConfirmIntent(null);
  };

  const startNewTest = () => {
    start();
    setShowHome(false);
  };

  const resumeTest = () => setShowHome(false);

  const recoverToHome = () => {
    clearError();
    reset();
    setShowHome(true);
  };

  const currentHistoryIndex = session.history.findIndex(
    (entry) => entry.questionId === session.currentQuestionId,
  );
  const displayedDepth =
    currentHistoryIndex >= 0
      ? currentHistoryIndex + 1
      : session.history.length + 1;
  const effectiveQuestionHistory =
    currentHistoryIndex >= 0
      ? session.history.slice(0, currentHistoryIndex)
      : session.history;
  const effectiveQuestionUncertainCount = effectiveQuestionHistory.reduce(
    (count, entry) => count + Number(entry.selectedOptionId === "U"),
    0,
  );
  const blessingRound =
    session.status === "transitioning"
      ? getBlessingRound(session.history.at(-1)?.questionId)
      : undefined;
  const blessingResolution = blessingRound
    ? resolveRoundWinner(session.history, blessingRound)
    : undefined;
  const activeDeityId =
    blessingResolution?.winnerId ??
    (currentQuestion && session.status !== "completed"
      ? getActiveDeityId(currentQuestion.id, effectiveQuestionHistory)
      : undefined);
  const finalDeityPair =
    currentQuestion?.stage === "calibration" &&
    session.status !== "completed"
      ? getFinalDeityPair(effectiveQuestionHistory)
      : undefined;

  let content;
  if (error) {
    content = (
      <section className="error-screen" role="alert">
        <div className="error-panel">
          <span className="error-sigil" aria-hidden="true">
            ◇
          </span>
          <p className="error-kicker">ARCHIVE INTERRUPTION</p>
          <h1>档案路径出现异常</h1>
          <p>{error}</p>
          <div className="error-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={recoverToHome}
            >
              返回入口
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                clearError();
                restart();
                setShowHome(false);
              }}
            >
              重新开始
            </button>
          </div>
        </div>
      </section>
    );
  } else if (showHome || session.status === "not-started") {
    content = (
      <HomeScreen
        hasSavedSession={hasSavedSession}
        savedSessionCompleted={session.status === "completed"}
        savedClueCount={session.history.length}
        onStart={startNewTest}
        onResume={hasSavedSession ? resumeTest : undefined}
        onRestart={hasSavedSession ? requestRestart : undefined}
      />
    );
  } else if (session.status === "completed" && result) {
    if (result.needsRetest || result.calibrationMatched === false) {
      content = (
        <section className="error-screen" role="status">
          <div className="error-panel">
            <span className="error-sigil" aria-hidden="true">
              ◇
            </span>
            <p className="error-kicker">CALIBRATION NOT PASSED</p>
            <h1>本次路径未通过校准</h1>
            <p>
              {result.retestReason ??
                "你的校准答案与前面的路径不一致，本次不会生成错误的人格结果。请凭第一反应重新测试。"}
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                retryFinalRound();
                setShowHome(false);
              }}
            >
              返回第三轮重选
            </button>
          </div>
        </section>
      );
    } else {
      const resultType = getResultTypeById(result.resultTypeId);
      if (!resultType) {
        content = (
          <section className="error-screen" role="alert">
            <div className="error-panel">
              <h1>档案结果暂时无法读取</h1>
              <p>结果类型配置缺失，请返回入口后重新开始。</p>
              <button
                type="button"
                className="primary-button"
                onClick={recoverToHome}
              >
                返回入口
              </button>
            </div>
          </section>
        );
      } else {
        content = (
          <ResultScreen
            result={result}
            resultType={resultType}
            archiveCode={archiveCode}
            onRestart={requestRestart}
          />
        );
      }
    }
  } else if (blessingRound && blessingResolution) {
    content = (
      <BlessingScreen
        deityId={blessingResolution.winnerId}
        round={blessingRound}
        onContinue={continueAfterBlessing}
      />
    );
  } else if (currentQuestion) {
    content = (
      <QuestionScreen
        question={currentQuestion}
        depth={displayedDepth}
        clueCount={session.history.length}
        uncertainCount={effectiveQuestionUncertainCount}
        selectedOptionId={selectedOptionId}
        disabled={Boolean(confirmIntent)}
        canGoBack={canGoBack}
        onAnswer={answer}
        onBack={back}
      />
    );
  } else {
    content = (
      <section className="error-screen" role="alert">
        <div className="error-panel">
          <h1>档案路径出现异常</h1>
          <p>当前节点已经丢失，请返回入口后重新开始。</p>
          <button type="button" className="primary-button" onClick={recoverToHome}>
            返回入口
          </button>
        </div>
      </section>
    );
  }

  const currentDebugScene = currentQuestion
    ? getTransitionSceneById(currentQuestion.transitionSceneId)
    : undefined;
  const backgroundMode = finalDeityPair
    ? "split"
    : activeDeityId
      ? "deity"
      : "default";

  return (
    <div className={`app-shell app-shell--${backgroundMode}`}>
      <MysticBackground
        deityId={activeDeityId}
        splitDeityIds={finalDeityPair}
      />
      <header className="app-header">
        <button
          type="button"
          className="app-brand"
          onClick={requestHome}
          disabled={showHome}
          aria-label="返回认知之门入口"
        >
          认知之门
        </button>
        <div className="app-actions">
          <span className="local-only-badge">LOCAL ARCHIVE</span>
          {!showHome && session.status !== "not-started" ? (
            <button type="button" className="ghost-button" onClick={requestHome}>
              返回入口
            </button>
          ) : null}
        </div>
      </header>

      <main className="app-main" id="main-content">
        {content}
      </main>

      <ConfirmDialog
        open={confirmIntent !== null}
        title={
          confirmIntent === "restart" ? "开启一份新档案？" : "暂时离开当前档案？"
        }
        description={
          confirmIntent === "restart"
            ? "现有答题路径与解密结果将从本机清除，这项操作无法撤销。"
            : "当前认知档案尚未完成。离开后仍可从本机继续，但未完成的路径不会生成结果。"
        }
        confirmLabel={confirmIntent === "restart" ? "清除并重新开始" : "返回入口"}
        cancelLabel="继续当前探索"
        tone={confirmIntent === "restart" ? "danger" : "default"}
        onConfirm={confirmAction}
        onCancel={() => setConfirmIntent(null)}
      />

      <DevPanel
        session={session}
        currentQuestion={currentQuestion}
        uncertainCount={uncertainCount}
        transitionScene={currentDebugScene}
        questionIds={questions.map((question) => question.id)}
        onJump={(questionId) => {
          goToQuestion(questionId);
          setShowHome(false);
        }}
        onBack={back}
        onClear={() => {
          reset();
          setShowHome(true);
        }}
        onComplete={() => {
          complete();
          setShowHome(false);
        }}
        onValidate={validateDemoContent}
        onAnalyzePaths={analyzeConfiguredPaths}
      />
    </div>
  );
}

export default AppShell;
