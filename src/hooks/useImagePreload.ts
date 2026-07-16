import { useEffect, useMemo, useState } from "react";

export type ImagePreloadState = {
  loadedImages: ReadonlySet<string>;
  failedImages: ReadonlySet<string>;
  isLoading: boolean;
};

function uniqueSources(sources: readonly (string | null | undefined)[]): string[] {
  return [...new Set(sources.filter((source): source is string => Boolean(source)))];
}

/** Preloads only the explicitly supplied branch images; it never scans the full bank. */
export function useImagePreload(
  sources: readonly (string | null | undefined)[],
): ImagePreloadState {
  const stableSources = useMemo(() => uniqueSources(sources), [sources]);
  const sourceKey = stableSources.join("\u0000");
  const [loadedImages, setLoadedImages] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (stableSources.length === 0 || typeof Image === "undefined") {
      return;
    }

    let active = true;
    const images: HTMLImageElement[] = [];

    for (const source of stableSources) {
      const image = new Image();
      images.push(image);
      image.decoding = "async";
      image.onload = () => {
        if (!active) return;
        setLoadedImages((current) => new Set(current).add(source));
        setFailedImages((current) => {
          if (!current.has(source)) return current;
          const next = new Set(current);
          next.delete(source);
          return next;
        });
      };
      image.onerror = () => {
        if (!active) return;
        setFailedImages((current) => new Set(current).add(source));
      };
      image.src = source;
    }

    return () => {
      active = false;
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
    };
    // The joined key intentionally represents the set of requested branch assets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  const completedCount = stableSources.reduce(
    (count, source) =>
      count + Number(loadedImages.has(source) || failedImages.has(source)),
    0,
  );

  return {
    loadedImages,
    failedImages,
    isLoading: completedCount < stableSources.length,
  };
}

export default useImagePreload;
