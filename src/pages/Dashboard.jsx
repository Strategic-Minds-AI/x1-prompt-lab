import { Link } from "react-router-dom";
import { 
  Layers, FileText, Wand2, Link2, Globe, Image, Terminal,
  ArrowRight, Sparkles, Zap, LinkIcon, FileUp, AlertTriangle, Ghost, TrendingUp, Bot
} from "lucide-react";
import { useLang } from "@/lib/LangContext";

const exercisesData = {
  es: [
    { path: "/multi-source", icon: Layers, title: "Análisis Multi-Fuente", description: "Alimenta múltiples textos y obtén conclusiones cruzadas, comparaciones y síntesis.", color: "primary", tags: ["Síntesis", "Comparación", "Conclusiones"] },
    { path: "/structured-extraction", icon: FileText, title: "Extracción Estructurada", description: "Convierte texto libre en datos JSON estructurados con schema personalizado.", color: "accent", tags: ["JSON", "Schema", "Parsing"] },
    { path: "/text-transform", icon: Wand2, title: "Transformación de Texto", description: "Resume, traduce, reformula en diferentes tonos y estilos.", color: "success", tags: ["Resumen", "Traducción", "Tono"] },
    { path: "/chain-prompting", icon: Link2, title: "Chain Prompting", description: "Encadena prompts secuenciales donde la salida de uno alimenta al siguiente.", color: "warning", tags: ["Secuencial", "Pipeline", "Iterativo"] },
    { path: "/web-enriched", icon: Globe, title: "Web + LLM", description: "Combina búsqueda en internet con análisis LLM para datos en tiempo real.", color: "chart-5", tags: ["Internet", "Tiempo Real", "Research"] },
    { path: "/image-analysis", icon: Image, title: "Análisis de Imagen", description: "Sube imágenes y obtén análisis detallado, extracción de datos y descripciones.", color: "chart-2", tags: ["Visión", "OCR", "Descripción"] },
    { path: "/web-scraper", icon: LinkIcon, title: "Extracción desde URL", description: "Pega un link y extrae información estructurada de cualquier página web.", color: "chart-5", tags: ["URL", "Web Scraping", "Extracción"] },
    { path: "/pdf-extraction", icon: FileUp, title: "Extracción desde PDF", description: "Sube un PDF y extrae resúmenes, datos y puntos clave con el LLM.", color: "accent", tags: ["PDF", "Documentos", "Extracción"] },
    { path: "/bias-detection", icon: AlertTriangle, title: "Laboratorio de Sesgos", description: "Observa cómo palabras, nombres o contextos sesgan las respuestas del LLM.", color: "warning", tags: ["Sesgo", "Palabras", "Contexto"] },
    { path: "/hallucination-lab", icon: Ghost, title: "Laboratorio de Alucinaciones", description: "Pide información específica y observa cómo el modelo inventa fuentes, links y datos.", color: "chart-5", tags: ["Alucinación", "Fuentes", "Links falsos"] },
    { path: "/overconfidence-lab", icon: TrendingUp, title: "Laboratorio de Sobreconfianza", description: "Observa cómo el LLM infiere conclusiones definitivas a partir de información mínima.", color: "chart-2", tags: ["Sobreconfianza", "Inferencia", "Datos insuficientes"] },
    { path: "/react-agent", icon: Bot, title: "Agente ReAct", description: "Un agente autónomo que piensa, busca información y decide cuándo responder usando el patrón ReAct.", color: "success", tags: ["Autónomo", "ReAct", "Bucle"] },
    { path: "/playground", icon: Terminal, title: "Playground Libre", description: "Control total sobre todos los parámetros de InvokeLLM en un entorno libre.", color: "primary", tags: ["Libre", "Avanzado", "Custom"] },
  ],
  en: [
    { path: "/multi-source", icon: Layers, title: "Multi-Source Analysis", description: "Feed multiple texts and get cross-conclusions, comparisons and synthesis.", color: "primary", tags: ["Synthesis", "Comparison", "Conclusions"] },
    { path: "/structured-extraction", icon: FileText, title: "Structured Extraction", description: "Convert free text into structured JSON data with custom schema.", color: "accent", tags: ["JSON", "Schema", "Parsing"] },
    { path: "/text-transform", icon: Wand2, title: "Text Transformation", description: "Summarize, translate, reformat in different tones and styles.", color: "success", tags: ["Summary", "Translation", "Tone"] },
    { path: "/chain-prompting", icon: Link2, title: "Chain Prompting", description: "Chain sequential prompts where the output of one feeds into the next.", color: "warning", tags: ["Sequential", "Pipeline", "Iterative"] },
    { path: "/web-enriched", icon: Globe, title: "Web + LLM", description: "Combine internet search with LLM analysis for real-time data.", color: "chart-5", tags: ["Internet", "Real-time", "Research"] },
    { path: "/image-analysis", icon: Image, title: "Image Analysis", description: "Upload images and get detailed analysis, data extraction and descriptions.", color: "chart-2", tags: ["Vision", "OCR", "Description"] },
    { path: "/web-scraper", icon: LinkIcon, title: "URL Extraction", description: "Paste a link and extract structured information from any web page.", color: "chart-5", tags: ["URL", "Web Scraping", "Extraction"] },
    { path: "/pdf-extraction", icon: FileUp, title: "PDF Extraction", description: "Upload a PDF and extract summaries, data and key points with the LLM.", color: "accent", tags: ["PDF", "Documents", "Extraction"] },
    { path: "/bias-detection", icon: AlertTriangle, title: "Bias Laboratory", description: "Observe how words, names or contexts bias the LLM's responses.", color: "warning", tags: ["Bias", "Words", "Context"] },
    { path: "/hallucination-lab", icon: Ghost, title: "Hallucination Laboratory", description: "Ask for specific information and observe how the model invents sources, links and data.", color: "chart-5", tags: ["Hallucination", "Sources", "Fake links"] },
    { path: "/overconfidence-lab", icon: TrendingUp, title: "Overconfidence Laboratory", description: "Observe how the LLM draws definitive conclusions from minimal information.", color: "chart-2", tags: ["Overconfidence", "Inference", "Insufficient data"] },
    { path: "/react-agent", icon: Bot, title: "ReAct Agent", description: "An autonomous agent that thinks, searches for information, and decides when to answer using the ReAct pattern.", color: "success", tags: ["Autonomous", "ReAct", "Loop"] },
    { path: "/playground", icon: Terminal, title: "Free Playground", description: "Full control over all InvokeLLM parameters in a free environment.", color: "primary", tags: ["Free", "Advanced", "Custom"] },
  ],
};

const ui = {
  es: { headline: "Plataforma de Experimentación", subtitle: "Explora las capacidades de", after: "con ejercicios prácticos. Descubre patrones, reglas y estructuras óptimas de uso.", exercises: "Ejercicios", statsRow: "Multi-fuente · Extracción · Transformación · Cadenas · Web · Imagen · URL · PDF · Sesgos · Alucinaciones · Sobreconfianza · Agente · Playground" },
  en: { headline: "Experimentation Platform", subtitle: "Explore the capabilities of", after: "with practical exercises. Discover patterns, rules and optimal usage structures.", exercises: "Exercises", statsRow: "Multi-source · Extraction · Transform · Chains · Web · Image · URL · PDF · Bias · Hallucinations · Overconfidence · Agent · Playground" },
};

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
  const { lang } = useLang();
  const t = ui[lang];
  const exercises = exercisesData[lang];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
          <span className="text-xs font-mono text-primary uppercase tracking-widest">LLM Lab</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-3">{t.headline}</h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
          {t.subtitle} <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-sm font-mono">InvokeLLM</code> {t.after}
        </p>
      </div>

      <div className="flex items-center gap-6 mb-10 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{exercises.length} {t.exercises}</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <span className="text-sm text-muted-foreground">{t.statsRow}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((ex) => (
          <Link key={ex.path} to={ex.path} className="group p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${colorMap[ex.color]} border flex items-center justify-center`}>
                <ex.icon className={`w-5 h-5 ${iconColorMap[ex.color]}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <h3 className="font-semibold mb-1.5">{ex.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{ex.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {ex.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}