import { useLang } from "@/lib/LangContext";

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-secondary/50 hover:border-primary/40 hover:text-primary transition-colors text-xs font-mono"
      title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <span className={lang === "es" ? "text-primary font-semibold" : "text-muted-foreground"}>ES</span>
      <span className="text-muted-foreground">/</span>
      <span className={lang === "en" ? "text-primary font-semibold" : "text-muted-foreground"}>EN</span>
    </button>
  );
}