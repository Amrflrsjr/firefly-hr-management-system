export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary)";

// Rows are flex-wrap cards on mobile and a CSS grid from md up.
export const ROW_BASE =
  "flex flex-wrap items-center gap-x-3 gap-y-2 md:grid md:gap-x-4";

/** Display text for a status value (the API value stays untouched). */
export const statusLabel = (s: string) => (s === "In Review" ? "In review" : s);
