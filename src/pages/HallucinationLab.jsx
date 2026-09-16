import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/LangContext";
import ExerciseHeader from "@/components/ExerciseHeader";
import ResultPanel from "@/components/ResultPanel";
import PromptPreview from "@/components/PromptPreview";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

const examples = {
  es: [
    {
      label: "Noticias nicho 2024",
      query: "Dame 5 noticias recientes con sus URLs sobre el festival de música underground de Tbilisi en octubre 2024",
    },
    {
      label: "Papers académicos",
      query: "Necesito 3 papers académicos publicados en 2023 sobre el uso de hongos para fabricar baterías. Incluye autores, revista y DOI.",
    },
    {
      label: "Tweets virales",
      query: "¿Cuáles fueron los tweets más virales del CEO de Tesla en enero 2025? Dame los enlaces directos.",
    },
    {
      label: "Videos YouTube",
      query: "Dame 4 videos de YouTube con sus URLs sobre cómo entrenar iguanas como mascotas, publicados este año.",
    },
    {
      label: "Estadísticas muy específicas",
      query: "¿Cuántas personas en Kazajistán usan aplicaciones de meditación con realidad aumentada? Dame la fuente.",
    },
  ],
  en: [
    {
      label: "Niche 2024 news",
      query: "Give me 5 recent news articles with URLs about the underground music festival in Tbilisi in October 2024",
    },
    {
      label: "Academic papers",
      query: "I need 3 academic papers published in 2023 about using fungi to manufacture batteries. Include authors, journal and DOI.",
    },
    {
      label: "Viral tweets",
      query: "What were the most viral tweets from Tesla's CEO in January 2025? Give me direct links.",
    },
    {
      label: "YouTube videos",
      query: "Give me 4 YouTube videos with URLs about training iguanas as pets, published this year.",
    },
    {
      label: "Very specific statistics",
      query: "How many people in Kazakhstan use augmented reality meditation apps? Give me the source.",
    },
  ],
};

const ui = {
  es: {
    title: "Laboratorio de Alucinaciones",
    description: "Pide información muy específica o difícil de encontrar y observa cómo el modelo inventa fuentes, links y datos.",
    badge: "ALUCINACIÓN",
    queryLabel: "Consulta al modelo",
    queryPlaceholder: "Pide algo muy específico: noticias nicho, papers, videos, estadísticas...",
    run: "Ejecutar y observar",
    running: "Generando respuesta...",
    examplesLabel: "Ejemplos diseñados para provocar alucinaciones",
    tip: "💡 Tip: Copia uno de los links que el modelo genere e intenta abrirlo en tu navegador. Probablemente no exista.",
    useWeb: "Usar búsqueda web",
  },
  en: {
    title: "Hallucination Laboratory",
    description: "Ask for very specific or hard-to-find information and observe how the model invents sources, links and data.",
    badge: "HALLUCINATION",
    queryLabel: "Query to the model",
    queryPlaceholder: "Ask for something very specific: niche news, papers, videos, statistics...",
    run: "Run and observe",
    running: "Generating response...",
    examplesLabel: "Examples designed to trigger hallucinations",
    tip: "💡 Tip: Copy one of the links the model generates and try to open it in your browser. It probably doesn't exist.",
    useWeb: "Use web search",
  },
};

export default function HallucinationLab() {
  const { lang } = useLang();
  const t = ui[lang];
  const exList = examples[lang];

  const [query, setQuery] = useState("");
  const [useWeb, setUseWeb] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);

  const buildPrompt = () =>
    `${query}\n\nIMPORTANTE: Proporciona información específica y detallada. Si incluyes enlaces, deben ser URLs completas y reales. Si no tienes la información exacta, de todas formas intenta darme los datos lo más precisos posible.`;

  const run = async () => {
    setIsLoading(true);
    setResult(null);
    const start = Date.now();
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(),
      add_context_from_internet: useWeb,
      model: useWeb ? "gemini_3_flash" : undefined,
    });
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <ExerciseHeader icon={Ghost} title={t.title} description={t.description} badge={t.badge} />

      {/* Tip */}
      <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
        {t.tip}
      </div>

      {/* Examples */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground font-mono mb-2">{t.examplesLabel}</p>
        <div className="flex flex-wrap gap-2">
          {exList.map((ex) => (
            <button
              key={ex.label}
              onClick={() => { setQuery(ex.query); setResult(null); }}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/70 text-secondary-foreground border border-border transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.queryLabel}</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.queryPlaceholder}
          className="w-full h-32 bg-card border border-border rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Button onClick={run} disabled={isLoading || !query} className="gap-2">
          <Ghost className="w-4 h-4" />
          {isLoading ? t.running : t.run}
        </Button>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={useWeb}
            onChange={(e) => setUseWeb(e.target.checked)}
            className="rounded"
          />
          {t.useWeb}
        </label>
        <PromptPreview buildPrompt={buildPrompt} />
      </div>

      <ResultPanel result={result} isLoading={isLoading} elapsed={elapsed} />
    </div>
  );
}