import { describe, expect, it } from "vitest";
import {
  getVisualThemeName,
  resolveVisualTheme,
  visualThemeClassName,
} from "./visualTheme";

describe("visual theme resolver", () => {
  it.each([
    ["?theme=a", "a"],
    ["?theme=refined", "a"],
    ["?theme=b", "b"],
    ["?theme=oracle", "b"],
    ["?theme=c", "c"],
    ["?theme=immersive", "c"],
  ] as const)("maps %s to theme %s", (search, expected) => {
    expect(resolveVisualTheme(search)).toBe(expected);
  });

  it("uses the configured theme when the URL has no theme", () => {
    expect(resolveVisualTheme("", "c")).toBe("c");
  });

  it("falls back to the immersive theme for invalid values", () => {
    expect(resolveVisualTheme("?theme=unknown", "unknown")).toBe("c");
  });

  it("provides stable Chinese names", () => {
    expect(getVisualThemeName("a")).toBe("档案精修");
    expect(getVisualThemeName("b")).toBe("神谕仪式");
    expect(getVisualThemeName("c")).toBe("无界沉浸");
  });

  it("creates a scoped root class for each visual theme", () => {
    expect(visualThemeClassName("a")).toBe("visual-theme visual-theme--a");
    expect(visualThemeClassName("b")).toBe("visual-theme visual-theme--b");
    expect(visualThemeClassName("c")).toBe("visual-theme visual-theme--c");
  });
});
