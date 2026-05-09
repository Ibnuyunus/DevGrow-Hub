export const CATEGORIES = [
  "Web App",
  "Landing Page",
  "Game",
  "Portfolio",
  "Tool",
  "Animation",
  "UI Component",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
