import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { TEST_STORAGE_KEY } from "../data/testConfig";

export type ErrorBoundaryProps = {
  children: ReactNode;
  onReturnHome?: () => void;
  onRestart?: () => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Cognitive Archive render error", error, info);
    }
  }

  private returnHome = () => {
    this.setState({ error: null });
    if (this.props.onReturnHome) {
      this.props.onReturnHome();
      return;
    }
    try {
      window.localStorage.removeItem(TEST_STORAGE_KEY);
    } catch {
      // Storage may be unavailable; reloading still recovers the render tree.
    }
    window.location.reload();
  };

  private restart = () => {
    this.setState({ error: null });
    try {
      window.localStorage.removeItem(TEST_STORAGE_KEY);
    } catch {
      // Storage may be unavailable; the in-memory tree can still restart.
    }
    if (this.props.onRestart) {
      this.props.onRestart();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="error-screen" role="alert">
        <div className="error-panel">
          <span className="error-sigil" aria-hidden="true">
            ◇
          </span>
          <p className="error-kicker">ARCHIVE INTERRUPTION</p>
          <h1>档案路径出现异常</h1>
          <p>
            当前线索无法继续读取。你的浏览器没有向服务器上传任何答题记录。
          </p>
          <div className="error-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={this.returnHome}
            >
              返回入口
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={this.restart}
            >
              重新开始
            </button>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
