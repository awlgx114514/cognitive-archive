import { useState } from "react";
import type { TransitionScene } from "../types/test";

export type TransitionScreenProps = {
  scene: TransitionScene;
  selectedLabel?: string;
};

export function TransitionScreen({
  scene,
  selectedLabel,
}: TransitionScreenProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      className={`transition-screen transition-screen--${scene.overlay ?? "violet"}`}
      aria-live="polite"
      aria-label="档案路径正在转写"
    >
      <div
        className={`transition-visual${imageFailed ? " image-fallback" : ""}`}
        role={imageFailed ? "img" : undefined}
        aria-label={imageFailed ? scene.alt : undefined}
      >
        {!imageFailed ? (
          <picture>
            {scene.mobileImage ? (
              <source media="(max-width: 680px)" srcSet={scene.mobileImage} />
            ) : null}
            <img
              className="transition-image"
              src={scene.image}
              alt={scene.alt}
              width={1600}
              height={900}
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          </picture>
        ) : null}
        <div className="transition-overlay" aria-hidden="true" />
      </div>
      <div className="transition-copy">
        {selectedLabel ? (
          <p className="transition-selection">已记录线索 · {selectedLabel}</p>
        ) : null}
        <p>{scene.line}</p>
        <span className="transition-sigil" aria-hidden="true">
          ◇
        </span>
      </div>
    </section>
  );
}

export default TransitionScreen;
