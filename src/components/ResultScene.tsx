import { useState } from "react";
import type { ResultType } from "../types/test";

export type ResultSceneProps = {
  resultType: ResultType;
};

export function ResultScene({ resultType }: ResultSceneProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const scene = resultType.classicScene;

  return (
    <figure
      className={`result-scene result-scene--${resultType.accent}${
        imageFailed ? " image-fallback" : ""
      }`}
    >
      {!imageFailed ? (
        <img
          className="result-scene-image"
          src={scene.image}
          alt={scene.alt}
          width={1600}
          height={1000}
          loading="eager"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="result-scene__fallback" role="img" aria-label={scene.alt}>
          <img
            src="images/ui/image_placeholder.webp"
            alt=""
            width={800}
            height={530}
            aria-hidden="true"
          />
          <p>经典画面暂由星图代替</p>
        </div>
      )}
      <div className="result-scene__veil" aria-hidden="true" />
      <figcaption className="result-scene__caption">
        <p>CLASSIC SCENE</p>
        <h2>{scene.title}</h2>
        <span>{scene.description}</span>
      </figcaption>
    </figure>
  );
}

export default ResultScene;
