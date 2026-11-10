"use client";
import { useEffect, useState } from "react";
const KEY = "copydrink-theme";
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    let saved: "light" | "dark" = "light";
    try {
      saved = localStorage.getItem(KEY) === "dark" ? "dark" : "light";
    } catch {}
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
    const sync = (e: StorageEvent) => {
      if (e.key === KEY) {
        const value = e.newValue === "dark" ? "dark" : "light";
        setTheme(value);
        document.documentElement.dataset.theme = value;
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function change(value: "light" | "dark") {
    setTheme(value);
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem(KEY, value);
    } catch {}
  }
  return (
    <div className="theme-toggle" role="group" aria-label="外觀模式">
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => change("light")}
        aria-label="淺色模式"
      >
        ☼
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => change("dark")}
        aria-label="深色模式"
      >
        ☾
      </button>
    </div>
  );
}
