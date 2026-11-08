import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemePref = "light" | "dark" | "system";
type Resolved = "light" | "dark";
const Ctx = createContext<{
  theme: Resolved;
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
  toggle: () => void;
}>({ theme: "light", pref: "system", setPref: () => {}, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [sysDark, setSysDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ats_theme") as ThemePref | null;
    if (saved) setPrefState(saved);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    setSysDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const theme: Resolved = pref === "system" ? (sysDark ? "dark" : "light") : pref;
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setPref = (p: ThemePref) => {
    localStorage.setItem("ats_theme", p);
    setPrefState(p);
  };
  const toggle = () => setPref(theme === "dark" ? "light" : "dark");
  return <Ctx.Provider value={{ theme, pref, setPref, toggle }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
