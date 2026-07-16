import { useEffect, useRef, useState } from "react";
import type { ResultType, TestResult } from "../types/test";
import ResultScene from "./ResultScene";

export type ResultScreenProps = {
  result: TestResult;
  resultType: ResultType;
  archiveCode: string;
  onRestart: () => void;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const characters = [...text];
  const lines: string[] = [];
  let currentLine = "";

  for (const character of characters) {
    const candidate = currentLine + character;
    if (context.measureText(candidate).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = character;
      if (lines.length === maxLines - 1) break;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine && lines.length < maxLines) lines.push(currentLine);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
}

function loadCanvasImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("result image failed to load"));
    image.src = source;
  });
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

async function createShareCard(
  resultType: ResultType,
  archiveCode: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");

  const background = context.createLinearGradient(0, 0, 1080, 1440);
  background.addColorStop(0, "#080817");
  background.addColorStop(0.55, "#121027");
  background.addColorStop(1, "#070713");
  context.fillStyle = background;
  context.fillRect(0, 0, 1080, 1440);

  context.strokeStyle = "rgba(184, 183, 199, 0.14)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(870, 170, 250, 0, Math.PI * 2);
  context.arc(870, 170, 172, 0, Math.PI * 2);
  context.stroke();

  const imageX = 54;
  const imageY = 86;
  const imageWidth = 972;
  const imageHeight = 560;
  context.save();
  roundedRect(context, imageX, imageY, imageWidth, imageHeight, 28);
  context.clip();
  try {
    const image = await loadCanvasImage(resultType.classicScene.image);
    drawImageCover(context, image, imageX, imageY, imageWidth, imageHeight);
  } catch {
    const fallback = context.createRadialGradient(540, 330, 30, 540, 330, 570);
    fallback.addColorStop(0, "#453b75");
    fallback.addColorStop(0.48, "#1a1836");
    fallback.addColorStop(1, "#080817");
    context.fillStyle = fallback;
    context.fillRect(imageX, imageY, imageWidth, imageHeight);
  }
  const veil = context.createLinearGradient(0, imageY, 0, imageY + imageHeight);
  veil.addColorStop(0, "rgba(7, 7, 19, 0.06)");
  veil.addColorStop(1, "rgba(7, 7, 19, 0.78)");
  context.fillStyle = veil;
  context.fillRect(imageX, imageY, imageWidth, imageHeight);
  context.restore();

  context.fillStyle = "#b8b7c7";
  context.font = '500 25px Inter, "Microsoft YaHei", sans-serif';
  context.fillText("认知之门  ·  COGNITIVE ARCHIVE", 78, 705);
  context.fillStyle = "#edeaf5";
  context.font = '600 122px Georgia, "Noto Serif SC", serif';
  context.fillText(resultType.code, 72, 842);
  context.fillStyle = "#a99bdd";
  context.font = '600 42px "Noto Serif SC", "Songti SC", serif';
  context.fillText(resultType.name, 78, 904);

  context.fillStyle = "#c9c5d5";
  context.font = '400 28px Inter, "Microsoft YaHei", sans-serif';
  drawWrappedText(context, resultType.subtitle, 78, 964, 910, 44, 2);

  context.fillStyle = "#a99bdd";
  context.font = '600 23px Inter, "Microsoft YaHei", sans-serif';
  context.fillText("本次认知档案", 78, 1054);
  context.fillStyle = "#d8d4e2";
  context.font = '400 27px Inter, "Microsoft YaHei", sans-serif';
  drawWrappedText(context, resultType.summary, 78, 1104, 910, 42, 3);

  context.fillStyle = "#b8b7c7";
  context.font = '400 24px Inter, "Microsoft YaHei", sans-serif';
  resultType.strengths.slice(0, 2).forEach((strength, index) => {
    context.fillText(`◇ ${strength}`, 78, 1246 + index * 42);
  });

  context.strokeStyle = "rgba(184, 183, 199, 0.2)";
  context.beginPath();
  context.moveTo(78, 1350);
  context.lineTo(1002, 1350);
  context.stroke();
  context.fillStyle = "#aaa5bc";
  context.font = '400 21px Inter, "Microsoft YaHei", sans-serif';
  context.fillText(`档案编号 ${archiveCode}`, 78, 1393);
  context.textAlign = "right";
  context.fillText("结果依据本次答题分支与最终校准生成", 1002, 1393);
  context.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to encode share card"));
    }, "image/png");
  });
}

export function ResultScreen({
  result,
  resultType,
  archiveCode,
  onRestart,
}: ResultScreenProps) {
  const resultTitleRef = useRef<HTMLHeadingElement>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    resultTitleRef.current?.focus();
  }, [resultType.id]);

  const saveShareImage = async () => {
    if (saveState === "saving") return;
    setSaveState("saving");
    try {
      const blob = await createShareCard(resultType, archiveCode);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${archiveCode}-${resultType.code}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      setSaveState("saved");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to save result card", error);
      setSaveState("error");
    }
  };

  return (
    <section className="result-screen" aria-labelledby="result-code">
      <header className="result-header">
        <p className="result-kicker">档案解密完成</p>
        <p className="archive-code">档案编号：{archiveCode}</p>
        <h1 ref={resultTitleRef} id="result-code" tabIndex={-1}>
          {resultType.code}
        </h1>
        <p className="result-name">{resultType.name}</p>
        <p className="result-subtitle">{resultType.subtitle}</p>
      </header>

      <ResultScene resultType={resultType} />

      <div className="result-grid">
        <section className="result-section result-summary">
          <p className="section-kicker">PRIMARY TENDENCY</p>
          <h2>主要认知倾向</h2>
          <p>{resultType.summary}</p>
          <ul>
            {resultType.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </section>

        <section className="result-section result-path-summary">
          <p className="section-kicker">ARCHIVE STATUS</p>
          <h2>本次路径摘要</h2>
          <dl>
            <div>
              <dt>校准状态</dt>
              <dd>{result.calibrationMatched === true ? "已通过" : "未记录"}</dd>
            </div>
            <div>
              <dt>记录线索</dt>
              <dd>{result.history.length} 条</dd>
            </div>
            <div>
              <dt>结果依据</dt>
              <dd>答题分支与最终校准</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="result-section result-tensions result-tensions--wide">
        <p className="section-kicker">POSSIBLE TENSIONS</p>
        <h2>可能的认知张力</h2>
        <ul>
          {resultType.tensions.map((tension) => (
            <li key={tension}>{tension}</li>
          ))}
        </ul>
      </section>

      <section className="result-disclaimer">
        <p>本测试用于认知倾向探索，不构成心理诊断。</p>
        <p>
          这一结果描述的是你在本次测试中呈现出的主要倾向，会受到当前状态、题目理解和答题路径影响。
        </p>
      </section>

      <div className="result-actions">
        <button
          type="button"
          className="primary-button"
          onClick={saveShareImage}
          disabled={saveState === "saving"}
        >
          {saveState === "saving" ? "正在生成…" : "保存结果图"}
        </button>
        <button type="button" className="secondary-button" onClick={onRestart}>
          重新测试
        </button>
      </div>
      <p className="save-status" role="status" aria-live="polite">
        {saveState === "saved" ? "1080 × 1440 结果图已生成。" : null}
        {saveState === "error"
          ? "结果图生成失败，请确认浏览器允许保存后重试。"
          : null}
      </p>
    </section>
  );
}

export default ResultScreen;
