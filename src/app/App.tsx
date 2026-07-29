import AppShell from "../components/AppShell";
import ErrorBoundary from "../components/ErrorBoundary";
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

  return (
    <div
      className={visualThemeClassName(themeId)}
      data-visual-theme={themeId}
      data-visual-theme-name={getVisualThemeName(themeId)}
    >
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </div>
  );
}
