import type { TransitionScene } from "../types/test";
import { questions } from "./questions";

const DEMO_LINES = [
  "一段记忆正在重新显影。",
  "新的路径从黑暗中分岔。",
  "某种尚未命名的倾向正在形成。",
  "档案深处传来一阵回声。",
  "你正在接近一条更隐秘的线索。",
  "新的认知轨迹已经被记录。",
] as const;

const DEMO_OVERLAYS = ["violet", "blue", "silver", "gold"] as const;

const AVAILABLE_TRANSITION_IMAGES = [
  "trans_01.webp",
  "trans_02.webp",
  "trans_03.webp",
  "trans_04.webp",
  "trans_05.webp",
  "trans_07.webp",
  "trans_08.webp",
  "trans_09.webp",
  "trans_10.webp",
  "trans_11.webp",
  "trans_12.webp",
  "trans_13.webp",
  "trans_14.webp",
  "trans_15.webp",
] as const;

/**
 * Transition metadata is retained for a future animated version. The current
 * static DEMO skips transition rendering and moves directly to the next node.
 * Only user-supplied local assets are referenced; trans_06.webp was not supplied.
 */
export const transitionScenes: TransitionScene[] = questions.map(
  (question, index) => ({
    id: question.transitionSceneId,
    image: `images/transitions/${AVAILABLE_TRANSITION_IMAGES[index % AVAILABLE_TRANSITION_IMAGES.length]}`,
    alt: `DEMO 认知档案过场画面：${question.traceCode}`,
    line: DEMO_LINES[index % DEMO_LINES.length],
    durationMs: 900,
    overlay: DEMO_OVERLAYS[index % DEMO_OVERLAYS.length],
  }),
);

export const transitionSceneMap: ReadonlyMap<string, TransitionScene> = new Map(
  transitionScenes.map((scene) => [scene.id, scene]),
);

export function getTransitionSceneById(
  sceneId: string,
): TransitionScene | undefined {
  return transitionSceneMap.get(sceneId);
}
