import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Layers, FileText, Wand2, Link2, Globe, Image, Terminal,
  ArrowRight, Sparkles, Zap, LinkIcon, FileUp, AlertTriangle, Ghost, TrendingUp, Bot, Target, Library
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import ModelPerformance from "@/components/ModelPerformance";

const tools = [
  { path: "/chain-prompting", icon: Link2, title: "Chain Prompting", description: "Chain sequential prompts where each output feeds the next.", color: "warning" },
  { path: "/hallucination-lab", icon: Ghost, title: "Hallucination Lab", description: "Observe how the model invents sources, links and data.", color: "chart-5" },
  { path: "/overconfidence-lab", icon: TrendingUp, title: "Overconfidence Lab", description: "See how the LLM draws definitive conclusions from minimal info.", color: "chart-2" },
  { path: "/bias-detection", icon: AlertTriangle, title: "Bias Detection", description: "Observe how words, names or contexts bias responses.", color: "warning" },
  { path: "/react-agent", icon: Bot, title: "ReAct Agent", description: "An autonomous agent that thinks, searches, and decides.", color: "success" },
  { path: "/multi-source", icon: Layers, title: "Multi-Source Analysis", description: "Feed multiple texts and get cross-conclusions and synthesis.", color: "primary" },
  { path: "/structured-extraction", icon: FileText, title: "Structured Extraction", description: "Convert free text into structured JSON with custom schema.", color: "accent" },
  { path: "/text-transform", icon: Wand2, title: "Text Transformation", description: "Summarize, translate, reformat in different tones.", color: "success" },
  { path: "/web-enriched", icon: Globe, title: "Web + LLM", description: "Combine internet search with LLM analysis for real-time data.", color: "chart-5" },
  { path: "/image-analysis", icon: Image, title: "Image Analysis", description: "Upload images for analysis, text and data extraction.", color: "chart-2" },
  { path: "/web-scraper", icon: LinkIcon, title: "URL Extraction", description: "Paste a link and extract structured information from any page.", color: "chart-5" },
  { path: "/pdf-extraction", icon: FileUp, title: "PDF Extraction", description: "Upload a PDF and extract summaries, data and key points.", color: "accent" },
  { path: "/playground", icon: Terminal, title: "Free Playground", description: "Full control over all InvokeLLM parameters.", color: "primary" },
];

const colorMap = {
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "chart-5": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "chart-2": "bg-violet-500/10 text-violet-400 border-violet-500/20",
};
const iconColorMap = {
  primary: "text-primary", accent: "text-accent", success: "text-emerald-400",
  warning: "text-amber-400", "chart-5": "text-rose-400", "chart-2": "text-violet-400",
};

export default function Dashboard() {
  const [stats, setStats] = useState({ templates: 0, runs: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [templates, runs] = await Promise.all([
          base44.entities.PromptTemplate.count(),
          base44.entities.PromptRun.count(),
        ]);
        setStats({ templates, runs });
      } catch (e) { /* ignore */ }
    })();
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Prompt Engineering System</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-3">Turn anyone into a prompt engineer.</h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
          A deterministic system to construct, audit, enhance, evolve, simulate, and score prompts — and to reverse-engineer the best prompts from any goal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Link to="/prompt-studio" className="group p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-semibold text-lg mb-1.5 flex items-center gap-2">Optimize a Prompt <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /></h2>
          <p className="text-sm text-muted-foreground">Audit failure points, hallucination and overconfidence risk, then enhance, simulate, and score any prompt.</p>
        </Link>
        <Link to="/prompt-studio?mode=goal" className="group p-6 rounded-xl bg-card border border-border hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
          <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <h2 className="font-semibold text-lg mb-1.5 flex items-center gap-2">Goal Mode <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /></h2>
          <p className="text-sm text-muted-foreground">State what you want to achieve. The system reverse-engineers the best prompts and chains to reach it.</p>
        </Link>
      </div>

      <div className="flex items-center gap-6 mb-8 p-4 rounded-xl bg-card border border-border">
        <Link to="/prompt-library" className="flex items-center gap-2 hover:text-primary transition-colors">
          <Library className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{stats.templates} templates in library</span>
        </Link>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-sm text-muted-foreground">{stats.runs} engineering runs</span>
        </div>
      </div>

      <ModelPerformance />

      <div className="mb-4">
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-1">Tools</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((ex) => (
          <Link key={ex.path} to={ex.path} className="group p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${colorMap[ex.color]} border flex items-center justify-center`}>
                <ex.icon className={`w-5 h-5 ${iconColorMap[ex.color]}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <h3 className="font-semibold mb-1.5 text-sm">{ex.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{ex.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}