import { useState } from "react";
import { Layers, Plus, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ExerciseHeader from "../components/ExerciseHeader";
import SourceInput from "../components/SourceInput";
import ResultPanel from "../components/ResultPanel";
import PromptPreview from "../components/PromptPreview";
import { useLang } from "@/lib/LangContext";

const analysisTypes = {
  es: [
    { value: "conclusions", label: "Conclusiones cruzadas" },
    { value: "comparison", label: "Comparación de fuentes" },
    { value: "key_phrases", label: "Frases clave" },
    { value: "contradictions", label: "Contradicciones" },
    { value: "synthesis", label: "Síntesis unificada" },
    { value: "custom", label: "Instrucción personalizada" },
  ],
  en: [
    { value: "conclusions", label: "Cross conclusions" },
    { value: "comparison", label: "Source comparison" },
    { value: "key_phrases", label: "Key phrases" },
    { value: "contradictions", label: "Contradictions" },
    { value: "synthesis", label: "Unified synthesis" },
    { value: "custom", label: "Custom instruction" },
  ],
};

const PACKS = {
  es: [
    {
      label: "🗞️ Noticias sobre IA",
      analysisType: "contradictions",
      sources: [
        "OpenAI publicó hoy que GPT-5 reduce los errores de razonamiento en un 40% respecto a GPT-4. Los benchmarks internos muestran que supera a humanos expertos en matemáticas y programación. La empresa planea lanzarlo al público en Q3 2025.",
        "Investigadores de la Universidad de Stanford publican un paper criticando los benchmarks de OpenAI por no ser reproducibles de forma independiente. Según el estudio, los modelos actuales siguen fallando en tareas de razonamiento causal básico.",
        "Google DeepMind anuncia Gemini Ultra 2, que según sus pruebas supera a GPT-5 en 7 de 10 categorías de evaluación. Ambas empresas reclaman ser líderes del sector usando métricas diferentes.",
      ],
    },
    {
      label: "📊 Reviews de producto",
      analysisType: "synthesis",
      sources: [
        "Compré el iPhone 16 Pro hace un mes y la cámara es increíble. El modo nocturno supera por mucho a cualquier Android que he probado. La batería dura todo el día con uso moderado. El precio es elevado pero vale la pena.",
        "Decepcionado con el iPhone 16 Pro. Sí, la cámara es buena, pero Android lleva años con esas funciones. La batería me dura hasta las 8pm con uso normal. Para el precio que tiene esperaba más innovación.",
        "Como fotógrafo profesional el iPhone 16 Pro cambió mi flujo de trabajo. Las fotos RAW son excepcionales. Sin embargo, el calentamiento al grabar video 4K es un problema real que Apple debería resolver.",
      ],
    },
    {
      label: "📚 Perspectivas históricas",
      analysisType: "comparison",
      sources: [
        "La Revolución Industrial (1760-1840) transformó la economía agrícola en industrial. Millones de trabajadores rurales migraron a ciudades. Las condiciones laborales eran deplorables: jornadas de 16 horas, trabajo infantil, salarios de subsistencia.",
        "La Revolución Digital (1990-2010) transformó la economía industrial en informacional. A diferencia de la industrial, no masificó el trabajo duro sino el trabajo cognitivo. Creó nuevas clases de trabajadores: programadores, diseñadores UX, data scientists.",
        "La Revolución de la IA (2020-presente) está transformando el trabajo cognitivo. Los primeros impactos se ven en tareas repetitivas de oficina. A diferencia de revoluciones anteriores, la velocidad del cambio es órdenes de magnitud mayor.",
      ],
    },
  ],
  en: [
    {
      label: "🗞️ AI News",
      analysisType: "contradictions",
      sources: [
        "OpenAI announced today that GPT-5 reduces reasoning errors by 40% compared to GPT-4. Internal benchmarks show it surpasses human experts in math and coding. The company plans to release it publicly in Q3 2025.",
        "Stanford University researchers publish a paper criticizing OpenAI's benchmarks for not being independently reproducible. According to the study, current models still fail at basic causal reasoning tasks.",
        "Google DeepMind announces Gemini Ultra 2, which according to their tests outperforms GPT-5 in 7 out of 10 evaluation categories. Both companies claim market leadership using different metrics.",
      ],
    },
    {
      label: "📊 Product Reviews",
      analysisType: "synthesis",
      sources: [
        "I bought the iPhone 16 Pro a month ago and the camera is incredible. Night mode far surpasses any Android I've tried. Battery lasts all day with moderate use. The price is high but worth it.",
        "Disappointed with the iPhone 16 Pro. Sure, the camera is good, but Android has had these features for years. My battery dies by 8pm with normal use. For the price, I expected more innovation.",
        "As a professional photographer, the iPhone 16 Pro changed my workflow. RAW photos are exceptional. However, the overheating when recording 4K video is a real problem Apple should fix.",
      ],
    },
    {
      label: "📚 Historical Perspectives",
      analysisType: "comparison",
      sources: [
        "The Industrial Revolution (1760-1840) transformed the agricultural economy into an industrial one. Millions of rural workers migrated to cities. Working conditions were deplorable: 16-hour days, child labor, subsistence wages.",
        "The Digital Revolution (1990-2010) transformed the industrial economy into an informational one. Unlike the industrial, it didn't mass-produce hard labor but cognitive work. It created new worker classes: programmers, UX designers, data scientists.",
        "The AI Revolution (2020-present) is transforming cognitive work. First impacts are seen in repetitive office tasks. Unlike previous revolutions, the pace of change is orders of magnitude faster.",
      ],
    },
  ],
};

const ui = {
  es: {
    title: "Análisis Multi-Fuente", description: "Alimenta múltiples fuentes de texto y obtén análisis cruzados",
    analysisLabel: "Tipo de análisis", customPlaceholder: "Escribe tu instrucción personalizada...",
    addSource: "Agregar Fuente", run: "Ejecutar", examples: "Ejemplos:",
    instructions: {
      conclusions: "Analiza todas las fuentes y extrae las 5-10 conclusiones principales que se pueden derivar al cruzar la información de todas ellas.",
      comparison: "Compara las fuentes entre sí. Identifica puntos en común, diferencias clave y perspectivas únicas de cada una.",
      key_phrases: "Extrae las frases clave, datos importantes y citas relevantes de cada fuente. Agrúpalas por tema.",
      contradictions: "Identifica contradicciones, inconsistencias o información conflictiva entre las fuentes. Explica cada contradicción encontrada.",
      synthesis: "Crea una síntesis unificada que combine la información de todas las fuentes en un texto coherente y completo.",
    },
    promptPrefix: "Tienes las siguientes fuentes de información:",
    promptInstruction: "INSTRUCCIÓN:",
    sourceLabel: "FUENTE",
  },
  en: {
    title: "Multi-Source Analysis", description: "Feed multiple text sources and get cross-analyses",
    analysisLabel: "Analysis type", customPlaceholder: "Write your custom instruction...",
    addSource: "Add Source", run: "Run", examples: "Examples:",
    instructions: {
      conclusions: "Analyze all sources and extract the 5-10 main conclusions that can be derived from cross-referencing all of them.",
      comparison: "Compare the sources with each other. Identify common points, key differences and unique perspectives from each.",
      key_phrases: "Extract key phrases, important data and relevant quotes from each source. Group them by topic.",
      contradictions: "Identify contradictions, inconsistencies or conflicting information between sources. Explain each contradiction found.",
      synthesis: "Create a unified synthesis that combines the information from all sources into a coherent and complete text.",
    },
    promptPrefix: "You have the following information sources:",
    promptInstruction: "INSTRUCTION:",
    sourceLabel: "SOURCE",
  },
};

export default function MultiSource() {
  const [sources, setSources] = useState(["", "", ""]);
  const [analysisType, setAnalysisType] = useState("conclusions");
  const [customInstruction, setCustomInstruction] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const [useJson, setUseJson] = useState(false);
  const { lang } = useLang();
  const t = ui[lang];

  const updateSource = (idx, val) => { const updated = [...sources]; updated[idx] = val; setSources(updated); };
  const addSource = () => setSources([...sources, ""]);
  const removeSource = (idx) => setSources(sources.filter((_, i) => i !== idx));

  const buildPrompt = () => {
    const sourcesText = sources.map((s, i) => `--- ${t.sourceLabel} ${i + 1} ---\n${s}`).join("\n\n");
    const instructions = { ...t.instructions, custom: customInstruction };
    return `${t.promptPrefix}\n\n${sourcesText}\n\n${t.promptInstruction} ${instructions[analysisType]}`;
  };

  const handleRun = async () => {
    const filledSources = sources.filter(s => s.trim());
    if (filledSources.length < 2) return;
    setIsLoading(true);
    setResult(null);
    const start = Date.now();
    const params = { prompt: buildPrompt() };
    if (useJson) {
      params.response_json_schema = {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, sources_referenced: { type: "array", items: { type: "string" } } } } },
          summary: { type: "string" },
        },
      };
    }
    const res = await base44.integrations.Core.InvokeLLM(params);
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  const loadPack = (pack) => { setSources(pack.sources); setAnalysisType(pack.analysisType); setResult(null); };
  const filledCount = sources.filter(s => s.trim()).length;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={Layers} title={t.title} description={t.description} badge={`${filledCount}/${sources.length}`} />

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
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.analysisLabel}</label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {analysisTypes[lang].map(tp => (<SelectItem key={tp.value} value={tp.value}>{tp.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <label className="text-xs font-mono text-muted-foreground">JSON</label>
              <button onClick={() => setUseJson(!useJson)} className={`w-10 h-5 rounded-full transition-colors ${useJson ? 'bg-primary' : 'bg-secondary'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-transform ${useJson ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {analysisType === "custom" && (
            <Input value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder={t.customPlaceholder} className="bg-secondary/50" />
          )}

          <div className="space-y-3">
            {sources.map((src, i) => (
              <SourceInput key={i} index={i} value={src} onChange={(val) => updateSource(i, val)} onRemove={() => removeSource(i)} canRemove={sources.length > 2} />
            ))}
          </div>

          <PromptPreview buildPrompt={buildPrompt} label={lang === "es" ? "Ver prompt de InvokeLLM" : "View InvokeLLM prompt"} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={addSource} className="flex-1 gap-2">
              <Plus className="w-4 h-4" /> {t.addSource}
            </Button>
            <Button onClick={handleRun} disabled={filledCount < 2 || isLoading} className="flex-1 gap-2">
              <Play className="w-4 h-4" /> {t.run}
            </Button>
          </div>
        </div>
        <div><ResultPanel result={result} isLoading={isLoading} elapsed={elapsed} /></div>
      </div>
    </div>
  );
}