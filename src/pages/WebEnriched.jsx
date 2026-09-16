import { useState } from "react";
import { Globe, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseHeader from "../components/ExerciseHeader";
import ResultPanel from "../components/ResultPanel";
import PromptPreview from "../components/PromptPreview";
import { useLang } from "@/lib/LangContext";

const presets = {
  es: [
    { value: "custom", label: "Consulta libre", prompt: "" },
    { value: "company", label: "Investigar empresa", prompt: "Investiga la empresa {{topic}} y dame información sobre: fundación, productos principales, CEO, número de empleados, revenue aproximado, últimas noticias relevantes." },
    { value: "trend", label: "Analizar tendencia", prompt: "Analiza la tendencia actual sobre {{topic}}. Dame datos recientes, estadísticas, opiniones de expertos y predicciones futuras." },
    { value: "compare", label: "Comparar opciones", prompt: "Compara {{topic}} considerando pros, contras, precios, popularidad y casos de uso recomendados." },
    { value: "market", label: "Análisis de mercado", prompt: "Realiza un análisis de mercado sobre {{topic}}. Incluye tamaño del mercado, competidores principales, tendencias y oportunidades." },
  ],
  en: [
    { value: "custom", label: "Free query", prompt: "" },
    { value: "company", label: "Research company", prompt: "Research the company {{topic}} and give me information about: founding, main products, CEO, number of employees, approximate revenue, latest relevant news." },
    { value: "trend", label: "Analyze trend", prompt: "Analyze the current trend on {{topic}}. Give me recent data, statistics, expert opinions and future predictions." },
    { value: "compare", label: "Compare options", prompt: "Compare {{topic}} considering pros, cons, pricing, popularity and recommended use cases." },
    { value: "market", label: "Market analysis", prompt: "Perform a market analysis on {{topic}}. Include market size, main competitors, trends and opportunities." },
  ],
};

const PACKS = {
  es: [
    { label: "🏢 Investigar empresa", preset: "company", topic: "Mistral AI", customPrompt: "" },
    { label: "📈 Tendencia tech", preset: "trend", topic: "modelos de lenguaje open source en 2025", customPrompt: "" },
    { label: "⚔️ Comparar herramientas", preset: "compare", topic: "Cursor vs GitHub Copilot vs Windsurf para programadores", customPrompt: "" },
    { label: "💬 Consulta libre", preset: "custom", topic: "", customPrompt: "¿Cuáles son las noticias más importantes de tecnología e inteligencia artificial de esta semana? Dame un resumen con las 5 más relevantes." },
  ],
  en: [
    { label: "🏢 Research company", preset: "company", topic: "Mistral AI", customPrompt: "" },
    { label: "📈 Tech trend", preset: "trend", topic: "open source language models in 2025", customPrompt: "" },
    { label: "⚔️ Compare tools", preset: "compare", topic: "Cursor vs GitHub Copilot vs Windsurf for developers", customPrompt: "" },
    { label: "💬 Free query", preset: "custom", topic: "", customPrompt: "What are the most important technology and AI news this week? Give me a summary of the 5 most relevant." },
  ],
};

const ui = {
  es: { title: "Web + LLM", description: "Combina búsqueda en internet con análisis LLM para datos en tiempo real", queryLabel: "Tipo de consulta", topicLabel: "Tema / Tópico", topicPlaceholder: "Ej: Inteligencia Artificial en salud, Tesla vs Rivian, etc.", promptLabel: "Prompt con contexto web", promptPlaceholder: "Escribe tu consulta. El LLM buscará en internet para enriquecer la respuesta...", promptSent: "Prompt que se enviará", internetNote: "El LLM buscará información actualizada en internet.", jsonLabel: "Respuesta JSON", run: "Buscar y Analizar", examples: "Ejemplos:" },
  en: { title: "Web + LLM", description: "Combine internet search with LLM analysis for real-time data", queryLabel: "Query type", topicLabel: "Topic", topicPlaceholder: "E.g.: AI in healthcare, Tesla vs Rivian, etc.", promptLabel: "Prompt with web context", promptPlaceholder: "Write your query. The LLM will search the internet to enrich the response...", promptSent: "Prompt that will be sent", internetNote: "The LLM will search for updated information on the internet.", jsonLabel: "JSON response", run: "Search and Analyze", examples: "Examples:" },
};

export default function WebEnriched() {
  const [preset, setPreset] = useState("custom");
  const [topic, setTopic] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [useJson, setUseJson] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const { lang } = useLang();
  const t = ui[lang];

  const handleRun = async () => {
    setIsLoading(true);
    setResult(null);
    const start = Date.now();
    let prompt;
    if (preset === "custom") {
      prompt = customPrompt;
    } else {
      const selected = presets[lang].find(p => p.value === preset);
      prompt = selected.prompt.replace(/\{\{topic\}\}/g, topic);
    }
    const params = { prompt, add_context_from_internet: true };
    if (useJson) {
      params.response_json_schema = {
        type: "object",
        properties: {
          main_findings: { type: "array", items: { type: "object", properties: { finding: { type: "string" }, source: { type: "string" }, relevance: { type: "string" } } } },
          summary: { type: "string" },
          confidence: { type: "string" },
        },
      };
    }
    const res = await base44.integrations.Core.InvokeLLM(params);
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  const loadPack = (pack) => { setPreset(pack.preset); setTopic(pack.topic); setCustomPrompt(pack.customPrompt); setResult(null); };
  const canRun = preset === "custom" ? customPrompt.trim() : topic.trim();

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={Globe} title={t.title} description={t.description} badge="Internet" />

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
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.queryLabel}</label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {presets[lang].map(p => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {preset !== "custom" && (
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.topicLabel}</label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t.topicPlaceholder} className="bg-secondary/50" />
            </div>
          )}
          {preset === "custom" && (
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.promptLabel}</label>
              <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder={t.promptPlaceholder} className="min-h-[200px] bg-secondary/50" />
            </div>
          )}
          {preset !== "custom" && (
            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <label className="text-xs font-mono text-muted-foreground mb-1 block">{t.promptSent}</label>
              <p className="text-sm text-foreground/70">{presets[lang].find(p => p.value === preset)?.prompt.replace(/\{\{topic\}\}/g, topic || "[topic]")}</p>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Globe className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground"><code className="text-primary">add_context_from_internet: true</code> — {t.internetNote}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-muted-foreground">{t.jsonLabel}</label>
            <button onClick={() => setUseJson(!useJson)} className={`w-10 h-5 rounded-full transition-colors ${useJson ? 'bg-primary' : 'bg-secondary'} relative`}>
              <div className={`w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-transform ${useJson ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <PromptPreview buildPrompt={() => { if (preset === "custom") return customPrompt; const sel = presets[lang].find(p => p.value === preset); return sel.prompt.replace(/\{\{topic\}\}/g, topic || "[topic]"); }} label={lang === "es" ? "Ver prompt de InvokeLLM" : "View InvokeLLM prompt"} />
          <Button onClick={handleRun} disabled={!canRun || isLoading} className="w-full gap-2">
            <Play className="w-4 h-4" /> {t.run}
          </Button>
        </div>
        <div><ResultPanel result={result} isLoading={isLoading} elapsed={elapsed} /></div>
      </div>
    </div>
  );
}