import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { finalBlessingGroups } from "../data/finalBlessings";
import FinalBlessingScreen from "./FinalBlessingScreen";

describe("FinalBlessingScreen", () => {
  it("renders the four public deity names and personality types without group codes", () => {
    const html = renderToStaticMarkup(
      <FinalBlessingScreen
        group={finalBlessingGroups[1]}
        onContinue={() => undefined}
      />,
    );

    expect(html).toContain("四神共佑");
    expect(html).toContain("现世主宰");
    expect(html).toContain("逍遥散人");
    expect(html).toContain("紫薇大帝");
    expect(html).toContain("太虚灵官");
    expect(html).toContain("ESFP、ISFP、ENTJ、INTJ亦如此。");
    expect(html).toContain("进入第三轮");
    expect(html).not.toContain("AE AH DE DH");
  });
});
