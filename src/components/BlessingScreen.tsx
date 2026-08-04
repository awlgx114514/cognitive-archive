import { deityProfiles, type DeityId } from "../data/deities";
import { deityVisuals } from "../data/deityVisuals";

export type BlessingScreenProps = {
  deityId: DeityId;
  round: 1 | 2;
  onContinue: () => void;
};

export function BlessingScreen({
  deityId,
  round,
  onContinue,
}: BlessingScreenProps) {
  const deity = deityProfiles[deityId];
  const visual = deityVisuals[deityId];

  return (
    <section className="blessing-screen" aria-labelledby="blessing-title">
      <div className="blessing-card">
        <div className="blessing-card__portrait" aria-hidden="true">
          <img src={visual.portrait} alt="" draggable={false} />
          <span className="blessing-card__portrait-veil" />
        </div>
        <div className="blessing-card__copy">
          <p className="blessing-kicker">
            {round === 1 ? "第一步 · 神祇定位" : "第二步 · 神祇定位"}
          </p>
          <h1 id="blessing-title">{deity.name}</h1>
          <p className="blessing-description">{deity.description}</p>
          <p className="blessing-message">你得到该神祇的祝福</p>
          <button
            type="button"
            className="primary-button"
            onClick={onContinue}
          >
            {round === 1 ? "进入第二步" : "查看共同祝福"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default BlessingScreen;
