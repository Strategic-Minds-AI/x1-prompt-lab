import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Layers, FileText, Wand2, Link2, Globe, Image, Terminal, LayoutDashboard, LinkIcon, FileUp,
  AlertTriangle, Ghost, TrendingUp, Bot, Sparkles, Library, GitCompare, Target, Plug, Compass, Cpu, Rocket
} from "lucide-react";
import { useLang } from "@/lib/LangContext";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";
import ChatAgentPanel from "./ChatAgentPanel";

const navItems = {
  es: [
    { path: "/", icon: LayoutDashboard, label: "Command Center" },
    { path: "/prompt-studio", icon: Sparkles, label: "Prompt Studio" },
    { path: "/prompt-library", icon: Library, label: "Prompt Library" },
    { path: "/vision-studio", icon: Target, label: "Vision Studio" },
    { path: "/connections", icon: Plug, label: "Connections" },
    { path: "/terminal", icon: Terminal, label: "Terminal" },
    { path: "/ollama", icon: Cpu, label: "Ollama" },
    { path: "/bootstrap", icon: Rocket, label: "Bootstrap" },
    { path: "/discovery", icon: Compass, label: "Discovery" },
    { path: "/model-compare", icon: GitCompare, label: "Comparar Modelos" },
    { path: "/multi-source", icon: Layers, label: "Multi-Fuente" },
    { path: "/structured-extraction", icon: FileText, label: "Extracción" },
    { path: "/text-transform", icon: Wand2, label: "Transformación" },
    { path: "/chain-prompting", icon: Link2, label: "Cadenas" },
    { path: "/web-enriched", icon: Globe, label: "Web + LLM" },
    { path: "/image-analysis", icon: Image, label: "Imagen" },
    { path: "/web-scraper", icon: LinkIcon, label: "URL Scraping" },
    { path: "/pdf-extraction", icon: FileUp, label: "PDF" },
    { path: "/bias-detection", icon: AlertTriangle, label: "Sesgos" },
    { path: "/hallucination-lab", icon: Ghost, label: "Alucinaciones" },
    { path: "/overconfidence-lab", icon: TrendingUp, label: "Sobreconfianza" },
    { path: "/react-agent", icon: Bot, label: "Agente ReAct" },
    { path: "/playground", icon: Terminal, label: "Playground" },
  ],
  en: [
    { path: "/", icon: LayoutDashboard, label: "Command Center" },
    { path: "/vision-studio", icon: Target, label: "Vision Studio" },
    { path: "/connections", icon: Plug, label: "Connections" },
    { path: "/terminal", icon: Terminal, label: "Terminal" },
    { path: "/ollama", icon: Cpu, label: "Ollama" },
    { path: "/bootstrap", icon: Rocket, label: "Bootstrap" },
    { path: "/discovery", icon: Compass, label: "Discovery" },
    { path: "/prompt-studio", icon: Sparkles, label: "Prompt Studio" },
    { path: "/prompt-library", icon: Library, label: "Prompt Library" },
    { path: "/model-compare", icon: GitCompare, label: "Model Compare" },
    { path: "/multi-source", icon: Layers, label: "Multi-Source" },
    { path: "/structured-extraction", icon: FileText, label: "Extraction" },
    { path: "/text-transform", icon: Wand2, label: "Transform" },
    { path: "/chain-prompting", icon: Link2, label: "Chains" },
    { path: "/web-enriched", icon: Globe, label: "Web + LLM" },
    { path: "/image-analysis", icon: Image, label: "Image" },
    { path: "/web-scraper", icon: LinkIcon, label: "URL Scraping" },
    { path: "/pdf-extraction", icon: FileUp, label: "PDF" },
    { path: "/bias-detection", icon: AlertTriangle, label: "Bias" },
    { path: "/hallucination-lab", icon: Ghost, label: "Hallucinations" },
    { path: "/overconfidence-lab", icon: TrendingUp, label: "Overconfidence" },
    { path: "/react-agent", icon: Bot, label: "ReAct Agent" },
    { path: "/playground", icon: Terminal, label: "Playground" },
  ],
};

export default function Layout() {
  const location = useLocation();
  const { lang } = useLang();
  const items = navItems[lang];
  const [agentOpen, setAgentOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border bg-sidebar-background">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-mono font-semibold text-sm tracking-tight">LLM Lab</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {items.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Agent + lang + theme toggle */}
        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={() => setAgentOpen(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors w-full font-medium"
          >
            <Bot className="w-4 h-4" /> Autonomous Agent
          </button>
          <LangToggle />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ChatAgentPanel open={agentOpen} onClose={() => setAgentOpen(false)} />
    </div>
  );
}