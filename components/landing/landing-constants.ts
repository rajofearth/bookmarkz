/** Gradient overlay for landing sections with background image (mockup, pricing). */
export const LANDING_GRADIENT =
  "linear-gradient(to bottom, var(--background) 0%, color-mix(in oklch, var(--background) 96%, transparent) 4%, color-mix(in oklch, var(--background) 88%, transparent) 10%, color-mix(in oklch, var(--background) 70%, transparent) 16%, color-mix(in oklch, var(--background) 45%, transparent) 24%, color-mix(in oklch, var(--background) 20%, transparent) 32%, transparent 40%, transparent 60%, color-mix(in oklch, var(--background) 20%, transparent) 68%, color-mix(in oklch, var(--background) 45%, transparent) 76%, color-mix(in oklch, var(--background) 70%, transparent) 84%, color-mix(in oklch, var(--background) 88%, transparent) 90%, color-mix(in oklch, var(--background) 96%, transparent) 96%, var(--background) 100%)";

/** Shared filter so white sketch assets read like ink in light mode. */
export const LANDING_ARTWORK_CLASS =
  "object-contain invert contrast-125 opacity-85 dark:invert-0 dark:contrast-100 dark:opacity-90";

/** Elevated landing surfaces need more separation in light mode than dark mode. */
export const LANDING_SURFACE_CLASS =
  "border border-border/70 bg-gradient-to-br from-muted/95 via-background to-muted/70 shadow-sm shadow-black/[0.05] dark:from-muted/60 dark:via-card/80 dark:to-muted/35 dark:shadow-black/20";

/** Scenic backgrounds should stay atmospheric without making light mode look dark. */
export const LANDING_SCENIC_IMAGE_CLASS =
  "object-cover object-center opacity-45 saturate-70 brightness-130 dark:opacity-100 dark:saturate-100 dark:brightness-100";
