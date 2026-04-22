"use client";

import { useEffect, useState } from "react";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem("rvscas-theme");

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => getInitialTheme() as "light" | "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("rvscas-theme", theme);
  }, [theme]);

  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="group inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-white"
      aria-pressed={dark}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      <span className="relative h-5 w-9 rounded-full bg-slate-200 transition dark:bg-slate-700">
        <span
          className={`absolute top-0.5 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] shadow-sm transition-transform dark:bg-slate-950 ${
            dark ? "translate-x-4 text-emerald-300" : "translate-x-0.5 text-amber-600"
          }`}
        >
          {dark ? "M" : "S"}
        </span>
      </span>
      <span className="hidden sm:inline">{dark ? "Dark" : "Light"}</span>
    </button>
  );
}
