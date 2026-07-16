export type HomeScreenProps = {
  hasSavedSession?: boolean;
  savedSessionCompleted?: boolean;
  savedClueCount?: number;
  onStart: () => void;
  onResume?: () => void;
  onRestart?: () => void;
};

export function HomeScreen({
  hasSavedSession = false,
  savedSessionCompleted = false,
  savedClueCount = 0,
  onStart,
  onResume,
  onRestart,
}: HomeScreenProps) {
  return (
    <section className="home-screen" aria-labelledby="home-title">
      <div className="home-hero">
        <img
          className="home-logo-mark"
          src="images/ui/logo_mark.webp"
          alt=""
          width={560}
          height={560}
          aria-hidden="true"
        />
        <p className="home-kicker">Cognitive Archive · 认知之门</p>
        <p className="home-file-number">ARCHIVE / ARC-∞</p>
        <h1 className="home-title" id="home-title">
          探索你的隐秘认知档案
        </h1>
        <p className="home-lead">
          进入意识深处，
          <br />
          发现你尚未命名的认知轨迹。
        </p>
        <p className="home-copy">
          你将穿过记忆、直觉、判断与感知的线索，
          <br />
          逐步拼出一份只属于你的认知档案。
        </p>

        {hasSavedSession ? (
          <aside className="resume-panel" aria-label="未完成档案">
            <span className="resume-panel__mark" aria-hidden="true">
              ◌
            </span>
            <div>
              <strong>
                {savedSessionCompleted
                  ? "发现一份已经解密的档案"
                  : "发现一份尚未完成的档案"}
              </strong>
              <p>
                本机已保存 {savedClueCount} 条线索，
                {savedSessionCompleted ? "可以重新查看结果。" : "可以从原处继续。"}
              </p>
            </div>
          </aside>
        ) : null}

        <div className="home-actions">
          {hasSavedSession && onResume ? (
            <button className="primary-button" type="button" onClick={onResume}>
              {savedSessionCompleted ? "查看档案" : "继续解密"}
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={onStart}>
              开启探索
            </button>
          )}
          {hasSavedSession && onRestart ? (
            <button className="text-button" type="button" onClick={onRestart}>
              开启新档案
            </button>
          ) : null}
        </div>
      </div>

      <div className="home-disclaimer">
        <p>本测试用于认知倾向探索，不构成心理诊断。</p>
        <p>测试结果会受到当前状态、题目理解和答题路径影响。</p>
        <p>你的答题记录仅保存在当前浏览器中。</p>
      </div>
    </section>
  );
}

export default HomeScreen;
