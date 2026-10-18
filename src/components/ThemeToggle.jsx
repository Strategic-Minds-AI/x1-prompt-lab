import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground transition-colors w-full"
      title="Toggle light / dark"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="font-mono text-xs">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}