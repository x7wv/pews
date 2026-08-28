import { useEffect, useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("pews-theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable — theme just won't persist across reloads
    }
  }

  return { isDark, toggle };
}
