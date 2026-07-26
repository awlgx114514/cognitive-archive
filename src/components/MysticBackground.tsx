import type { CSSProperties } from "react";
import {
  deityVisuals,
  type DeityId,
} from "../data/deityVisuals";

export type MysticBackgroundProps = {
  deityId?: DeityId;
  splitDeityIds?: readonly [DeityId, DeityId];
};

type MysticBackgroundStyle = CSSProperties & {
  "--mystic-scene"?: string;
};

/**
 * Purely decorative archive backdrop. It intentionally contains no canvas,
 * remote assets or runtime particle loop so it remains inexpensive and safe
 * when the test stays open for a long time.
 */
export function MysticBackground({
  deityId,
  splitDeityIds,
}: MysticBackgroundProps) {
  const mode = splitDeityIds ? "split" : deityId ? "deity" : "default";
  const style: MysticBackgroundStyle | undefined = deityId
    ? {
        "--mystic-scene": `url("${deityVisuals[deityId].background}")`,
      }
    : undefined;

  return (
    <div
      className={`mystic-background mystic-background--${mode}${deityId ? ` mystic-background--deity-${deityId}` : ""}`}
      style={style}
      aria-hidden="true"
    >
      {splitDeityIds ? (
        <div className="mystic-background__split">
          {splitDeityIds.map((splitDeityId, index) => (
            <span
              key={splitDeityId}
              className={`mystic-background__deity-half mystic-background__deity-half--${index === 0 ? "left" : "right"}`}
              style={{
                backgroundImage: `url("${deityVisuals[splitDeityId].portrait}")`,
              }}
            />
          ))}
        </div>
      ) : null}
      <div className="mystic-background__veil" />
      <div className="mystic-background__nebula mystic-background__nebula--violet" />
      <div className="mystic-background__nebula mystic-background__nebula--cyan" />
      <div className="mystic-background__grid" />
      <div className="mystic-background__stars mystic-background__stars--far" />
      <div className="mystic-background__stars mystic-background__stars--near" />
      <div className="mystic-background__orbital">
        <span className="mystic-background__ring mystic-background__ring--outer" />
        <span className="mystic-background__ring mystic-background__ring--middle" />
        <span className="mystic-background__ring mystic-background__ring--inner" />
        <span className="mystic-background__axis" />
        <span className="mystic-background__core" />
      </div>
      <div className="mystic-background__vignette" />
      <div className="mystic-background__noise" />
    </div>
  );
}

export default MysticBackground;
