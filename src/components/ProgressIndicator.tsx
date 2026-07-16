export type ProgressIndicatorProps = {
  depth: number;
  clueCount: number;
  recommendedDepth?: number;
};

export function ProgressIndicator({
  depth,
  clueCount,
  recommendedDepth = 15,
}: ProgressIndicatorProps) {
  const ritualProgress = Math.min(
    94,
    Math.max(5, (clueCount / Math.max(recommendedDepth, 1)) * 100),
  );

  return (
    <section className="progress-indicator" aria-label="探索进度">
      <div className="progress-indicator__labels">
        <span className="progress-depth">
          探索深度 {String(depth).padStart(2, "0")}
        </span>
        <span className="progress-clues">已记录 {clueCount} 条线索</span>
      </div>
      <div
        className="progress-track"
        aria-hidden="true"
      >
        <span
          className="progress-fill"
          style={{ width: `${ritualProgress}%` }}
        />
      </div>
      <p className="progress-copy">认知档案正在解锁</p>
    </section>
  );
}

export default ProgressIndicator;
