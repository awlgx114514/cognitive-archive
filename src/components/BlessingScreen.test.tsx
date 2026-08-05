import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BlessingScreen from "./BlessingScreen";

describe("BlessingScreen", () => {
  it("uses the eleventh-edition two-deity blessing copy after round two", () => {
    const firstRoundHtml = renderToStaticMarkup(
      <BlessingScreen deityId={1} round={1} onContinue={() => undefined} />,
    );
    const secondRoundHtml = renderToStaticMarkup(
      <BlessingScreen deityId={5} round={2} onContinue={() => undefined} />,
    );

    expect(firstRoundHtml).toContain("你得到该神祇的祝福");
    expect(secondRoundHtml).toContain("你得到两位神祇的祝福");
  });
});
