import { describe, expect, it } from "vitest";
import {
  appRootClassName,
  mobileLayoutClassName,
  resolveMobileLayout,
} from "./mobileLayout";

describe("mobile layout resolver", () => {
  it.each([
    ["?mobile=compact", "compact"],
    ["?mobile=a", "compact"],
    ["?mobile=cinematic", "cinematic"],
    ["?mobile=b", "cinematic"],
  ] as const)("maps %s to %s", (search, expected) => {
    expect(resolveMobileLayout(search)).toBe(expected);
  });

  it.each(["", "?mobile=unknown", "?theme=c"])(
    "falls back to cinematic for %s",
    (search) => {
      expect(resolveMobileLayout(search)).toBe("cinematic");
    },
  );

  it("creates a scoped root class", () => {
    expect(mobileLayoutClassName("compact")).toBe(
      "mobile-layout mobile-layout--compact",
    );
    expect(mobileLayoutClassName("cinematic")).toBe(
      "mobile-layout mobile-layout--cinematic",
    );
  });

  it("composes visual and mobile layout classes at the app root", () => {
    expect(
      appRootClassName(
        "visual-theme visual-theme--c",
        "mobile-layout mobile-layout--compact",
      ),
    ).toBe(
      "visual-theme visual-theme--c mobile-layout mobile-layout--compact",
    );
  });
});
