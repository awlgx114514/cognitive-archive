import AppShell from "../components/AppShell";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  appRootClassName,
  mobileLayoutClassName,
  resolveMobileLayout,
} from "../themes/mobileLayout";
import {
  getVisualThemeName,
  resolveVisualTheme,
  visualThemeClassName,
} from "../themes/visualTheme";

export default function App() {
  const themeId = resolveVisualTheme(
    window.location.search,
    import.meta.env.VITE_VISUAL_THEME,
  );
  const mobileLayoutId = resolveMobileLayout(window.location.search);

  return (
    <div
      className={appRootClassName(
        visualThemeClassName(themeId),
        mobileLayoutClassName(mobileLayoutId),
      )}
      data-visual-theme={themeId}
      data-visual-theme-name={getVisualThemeName(themeId)}
      data-mobile-layout={mobileLayoutId}
    >
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </div>
  );
}
