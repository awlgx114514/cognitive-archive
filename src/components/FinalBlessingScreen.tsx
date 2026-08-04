import { deityProfiles } from "../data/deities";
import {
  buildFinalBlessingMessage,
  type FinalBlessingGroup,
} from "../data/finalBlessings";
import { deityVisuals } from "../data/deityVisuals";

export type FinalBlessingScreenProps = {
  group: FinalBlessingGroup;
  onContinue: () => void;
};

export function FinalBlessingScreen({
  group,
  onContinue,
}: FinalBlessingScreenProps) {
  return (
    <section
      className="final-blessing-screen"
      aria-labelledby="final-blessing-title"
    >
      <div className="final-blessing-panel">
        <div className="final-blessing-heading">
          <p className="final-blessing-kicker">两轮神祇定位完成</p>
          <h1 id="final-blessing-title">四神共佑</h1>
        </div>

        <div className="final-blessing-deities" role="list">
          {group.deityIds.map((deityId) => {
            const deity = deityProfiles[deityId];
            const visual = deityVisuals[deityId];

            return (
              <figure
                className="final-blessing-deity"
                role="listitem"
                key={deityId}
              >
                <div className="final-blessing-deity__portrait">
                  <img src={visual.portrait} alt="" draggable={false} />
                  <span aria-hidden="true" />
                </div>
                <figcaption>{deity.name}</figcaption>
              </figure>
            );
          })}
        </div>

        <p className="final-blessing-message">
          {buildFinalBlessingMessage(group)}
        </p>

        <button
          type="button"
          className="primary-button final-blessing-continue"
          onClick={onContinue}
        >
          进入第三轮
        </button>
      </div>
    </section>
  );
}

export default FinalBlessingScreen;
