"use client";

import { Chrome, Download, Flame, Puzzle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BukmarksLogo } from "@/components/bukmarks-logo";
import { Button } from "@/components/ui/button";
import {
  CHROME_EXTENSION_ZIP_URL,
  FIREFOX_EXTENSION_ZIP_URL,
} from "@/lib/extension-config";
import { LandingFooter } from "./landing-footer";

type BrowserTarget = "chrome" | "firefox";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const INSTALL_STEPS: Record<
  BrowserTarget,
  { title: string; description: string }[]
> = {
  chrome: [
    {
      title: "Download the extension ZIP",
      description:
        "Use the download button above and save the file anywhere on your computer.",
    },
    {
      title: "Unzip the file",
      description:
        "Extract the ZIP so you have a folder containing manifest.json, popup files, and icons.",
    },
    {
      title: "Open chrome://extensions",
      description: "Go to chrome://extensions (or edge://extensions in Edge).",
    },
    {
      title: "Enable Developer mode",
      description: "Turn on the Developer mode toggle in the top-right corner.",
    },
    {
      title: "Load unpacked",
      description:
        "Click Load unpacked, then select the unzipped extension folder.",
    },
    {
      title: "Pin and start saving",
      description:
        "Pin Bukmarks from the puzzle menu and use it to save current page or import bookmarks.",
    },
  ],
  firefox: [
    {
      title: "Download the extension ZIP",
      description:
        "Use the download button above and save the file anywhere on your computer.",
    },
    {
      title: "Unzip the file",
      description:
        "Extract the ZIP so you can access manifest.json in the unzipped folder.",
    },
    {
      title: "Open about:addons",
      description: "Navigate to about:addons in Firefox.",
    },
    {
      title: "Open temporary add-on debug",
      description: "Click the gear icon and choose Debug Add-ons.",
    },
    {
      title: "Load Temporary Add-on",
      description:
        "Choose Load Temporary Add-on and select manifest.json from the unzipped folder.",
    },
    {
      title: "Use extension (session-only)",
      description:
        "Firefox temporary add-ons are removed after restart, so re-load when needed.",
    },
  ],
};

interface ExtensionPageProps {
  isAuthenticated: boolean;
}

export function ExtensionPage({ isAuthenticated }: ExtensionPageProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [target, setTarget] = useState<BrowserTarget>("chrome");

  const downloadHref = useMemo(() => {
    return target === "chrome"
      ? CHROME_EXTENSION_ZIP_URL
      : FIREFOX_EXTENSION_ZIP_URL;
  }, [target]);

  const downloadLabel =
    target === "chrome" ? "Download for Chrome" : "Download for Firefox";

  const steps = INSTALL_STEPS[target];

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <motion.nav
        className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: EASE }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <BukmarksLogo href="/" showLabel />
          <Button asChild variant="outline" size="sm">
            <Link href={isAuthenticated ? "/bookmarks" : "/auth"}>
              {isAuthenticated ? "Open app" : "Get started"}
            </Link>
          </Button>
        </div>
      </motion.nav>

      <main className="flex-1 px-6 py-10 lg:py-14">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                <Puzzle className="size-7 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Bukmarks Extension
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Save the current page or import browser bookmarks directly
                  into Bukmarks.
                </p>

                <div className="mt-4 inline-flex rounded-lg border border-border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => setTarget("chrome")}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                      target === "chrome"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Chrome className="size-3.5" /> Chrome
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget("firefox")}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                      target === "firefox"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Flame className="size-3.5" /> Firefox
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <a
                href={downloadHref}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Download className="size-4" />
                {downloadLabel}
              </a>
              <p className="text-xs text-muted-foreground">
                Manual install required (unpacked extension)
              </p>
            </div>

            <div className="h-px w-full bg-border" />

            <section>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Installation Guide
              </p>
              <ol className="space-y-4">
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-lg border border-border p-4"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {String(index + 1).padStart(2, "0")} {step.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
