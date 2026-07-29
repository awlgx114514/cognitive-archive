export type MobileLayoutId = "compact" | "cinematic";

const mobileLayoutAliases: Record<string, MobileLayoutId> = {
  a: "compact",
  compact: "compact",
  b: "cinematic",
  cinematic: "cinematic",
};

export function resolveMobileLayout(search: string): MobileLayoutId {
  const requested = new URLSearchParams(search).get("mobile")?.toLowerCase();
  return mobileLayoutAliases[requested ?? ""] ?? "cinematic";
}

export function mobileLayoutClassName(layoutId: MobileLayoutId): string {
  return `mobile-layout mobile-layout--${layoutId}`;
}

export function appRootClassName(
  themeClassName: string,
  layoutClassName: string,
): string {
  return `${themeClassName} ${layoutClassName}`;
}
