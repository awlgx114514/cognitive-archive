export type VisualThemeId = "a" | "b" | "c";

const visualThemeAliases: Record<string, VisualThemeId> = {
  a: "a",
  refined: "a",
  b: "b",
  oracle: "b",
  c: "c",
  immersive: "c",
};

export function resolveVisualTheme(
  search: string,
  configuredTheme?: string,
): VisualThemeId {
  const queryTheme = new URLSearchParams(search).get("theme")?.toLowerCase();

  return (
    visualThemeAliases[queryTheme ?? ""] ??
    visualThemeAliases[configuredTheme?.toLowerCase() ?? ""] ??
    "c"
  );
}

export function getVisualThemeName(themeId: VisualThemeId): string {
  return {
    a: "档案精修",
    b: "神谕仪式",
    c: "无界沉浸",
  }[themeId];
}

export function visualThemeClassName(themeId: VisualThemeId): string {
  return `visual-theme visual-theme--${themeId}`;
}
