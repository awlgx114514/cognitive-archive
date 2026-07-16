export const appViews = {
  home: "home",
  question: "question",
  transition: "transition",
  result: "result",
  error: "error",
} as const;

export type AppView = (typeof appViews)[keyof typeof appViews];
