import { useState } from "react";
import { Link as LinkIcon, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseHeader from "../components/ExerciseHeader";
import ResultPanel from "../components/ResultPanel";
import PromptPreview from "../components/PromptPreview";
import { useLang } from "@/lib/LangContext";

const analysisTypes = {
  es: [
    { value: "summarize", label: "Resumir contenido", prompt: "Extrae el contenido principal de esta página web y haz un resumen claro y estructurado de los puntos más importantes." },
    { value: "extract_data", label: "Extraer datos clave", prompt: "Extrae todos los datos relevantes de esta página web: estadísticas, cifras, nombres, fechas, precios o cualquier información estructurada que encuentres." },
    { value: "contacts", label: "Extraer contactos", prompt: "Extrae toda la información de contacto de esta página web: nombres, emails, teléfonos, direcciones, redes sociales." },
    { value: "products", label: "Extraer productos/precios", prompt: "Extrae todos los productos, servicios o planes con sus precios, características y descripciones que aparezcan en esta página web." },
    { value: "seo", label: "Análisis SEO/contenido", prompt: "Analiza el contenido de esta página web desde una perspectiva SEO: tema principal, keywords presentes, propuesta de valor, audiencia objetivo y calidad del contenido." },
    { value: "custom", label: "Instrucción personalizada", prompt: "" },
  ],
  en: [
    { value: "summarize", label: "Summarize content", prompt: "Extract the main content from this web page and create a clear, structured summary of the most important points." },
    { value: "extract_data", label: "Extract key data", prompt: "Extract all relevant data from this web page: statistics, figures, names, dates, prices or any structured information you find." },
    { value: "contacts", label: "Extract contacts", prompt: "Extract all contact information from this web page: names, emails, phones, addresses, social media." },
    { value: "products", label: "Extract products/prices", prompt: "Extract all products, services or plans with their prices, features and descriptions that appear on this web page." },
    { value: "seo", label: "SEO/content analysis", prompt: "Analyze the content of this web page from an SEO perspective: main topic, present keywords, value proposition, target audience and content quality." },
    { value: "custom", label: "Custom instruction", prompt: "" },
  ],
};

const PACKS = {
  es: [
    { label: "🏢 Empresa tech", url: "https://mistral.ai", type: "summarize" },
    { label: "📰 Artículo Wikipedia", url: "https://es.wikipedia.org/wiki/Inteligencia_artificial", type: "extract_data" },
    { label: "💰 Precios SaaS", url: "https://openai.com/api/pricing", type: "products" },
  ],
  en: [
    { label: "🏢 Tech company", url: "https://mistral.ai", type: "summarize" },
    { label: "📰 Wikipedia article", url: "https://en.wikipedia.org/wiki/Artificial_intelligence", type: "extract_data" },
    { label: "💰 SaaS pricing", url: "https://openai.com/api/pricing", type: "products" },
  ],
};

const ui = {
  es: { title: "Extracción desde URL", description: "Pega un link y extrae información estructurada de cualquier página web", badge: "Web Scraping", urlLabel: "URL de la página", urlPlaceholder: "https://...", analysisLabel: "Tipo de análisis", customLabel: "Instrucción personalizada", customPlaceholder: "¿Qué información quieres extraer de la página?", jsonLabel: "Respuesta JSON", run: "Analizar URL", examples: "Ejemplos:", urlNote: "El LLM accederá al contenido de la URL usando búsqueda web." },
  en: { title: "URL Extraction", description: "Paste a link and extract structured information from any web page", badge: "Web Scraping", urlLabel: "Page URL", urlPlaceholder: "https://...", analysisLabel: "Analysis type", customLabel: "Custom instruction", customPlaceholder: "What information do you want to extract from the page?", jsonLabel: "JSON response", run: "Analyze URL", examples: "Examples:", urlNote: "The LLM will access the URL content using web search." },
};

export default function WebScraper() {
  const [url, setUrl] = useState("");
  const [analysisType, setAnalysisType] = useState("summarize");
  const [customInstruction, setCustomInstruction] = useState("");
  const [useJson, setUseJson] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const { lang } = useLang();
  const t = ui[lang];

  const buildPrompt = () => {
    const selected = analysisTypes[lang].find(tp => tp.value === analysisType);
    const instruction = analysisType === "custom" ? customInstruction : selected.prompt;
    return `URL to analyze: ${url}\n\n${instruction}`;
  };

  const handleRun = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setResult(null);
    const start = Date.now();
    const params = { prompt: buildPrompt(), add_context_from_internet: true };
    if (useJson) {
      params.response_json_schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          main_content: { type: "string" },
          key_data: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } } } },
          summary: { type: "string" },
        },
      };
    }
    const res = await base44.integrations.Core.InvokeLLM(params);
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  const loadPack = (pack) => { setUrl(pack.url); setAnalysisType(pack.type); setResult(null); };
  const canRun = url.trim() && (analysisType !== "custom" || customInstruction.trim());

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={LinkIcon} title={t.title} description={t.description} badge={t.badge} />

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs font-mono text-muted-foreground self-center">{t.examples}</span>
        {PACKS[lang].map((pack, i) => (
          <button key={i} onClick={() => loadPack(pack)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/40 hover:border-primary/40 hover:text-primary transition-colors">
            {pack.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.urlLabel}</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.urlPlaceholder}
              className="bg-secondary/50 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.analysisLabel}</label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {analysisTypes[lang].map(tp => (<SelectItem key={tp.value} value={tp.value}>{tp.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {analysisType === "custom" && (
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.customLabel}</label>
              <Input value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder={t.customPlaceholder} className="bg-secondary/50" />
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground"><code className="text-primary">add_context_from_internet: true</code> — {t.urlNote}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-muted-foreground">{t.jsonLabel}</label>
            <button onClick={() => setUseJson(!useJson)} className={`w-10 h-5 rounded-full transition-colors ${useJson ? 'bg-primary' : 'bg-secondary'} relative`}>
              <div className={`w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-transform ${useJson ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <PromptPreview buildPrompt={buildPrompt} label={lang === "es" ? "Ver prompt de InvokeLLM" : "View InvokeLLM prompt"} />
          <Button onClick={handleRun} disabled={!canRun || isLoading} className="w-full gap-2">
            <Play className="w-4 h-4" /> {t.run}
          </Button>
        </div>
        <div><ResultPanel result={result} isLoading={isLoading} elapsed={elapsed} /></div>
      </div>
    </div>
  );
}