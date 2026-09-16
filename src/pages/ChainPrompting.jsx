import { useState } from "react";
import { Link2, Plus, Play, Trash2, ArrowDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ExerciseHeader from "../components/ExerciseHeader";
import ResultPanel from "../components/ResultPanel";
import PromptPreview from "../components/PromptPreview";
import { useLang } from "@/lib/LangContext";

const PACKS = {
  es: [
    {
      label: "✍️ Idea → Post de blog",
      initialInput: "La importancia del sueño en la productividad laboral",
      steps: [
        { label: "1. Crear esquema", prompt: "Crea un esquema detallado para un artículo de blog sobre: {{previous}}. Define título, introducción, 4-5 secciones principales con subtítulos y conclusión." },
        { label: "2. Desarrollar intro", prompt: "Escribe una introducción enganchante de 3 párrafos para un artículo de blog basado en este esquema: {{previous}}" },
        { label: "3. Optimizar para SEO", prompt: "Analiza el siguiente texto y mejóralo para SEO: sugiere una meta description de 160 caracteres, 5 keywords principales, y reescribe el texto con esas keywords integradas naturalmente: {{previous}}" },
      ],
    },
    {
      label: "🧪 Texto → Análisis → Acción",
      initialInput: "Las ventas del Q3 cayeron un 15% respecto al Q2. Los productos de la categoría A bajaron un 30% mientras que la categoría B subió un 10%. El feedback de clientes indica problemas con los tiempos de entrega.",
      steps: [
        { label: "1. Identificar causas", prompt: "Analiza el siguiente reporte de ventas e identifica las 3 causas principales del problema descripto: {{previous}}" },
        { label: "2. Proponer soluciones", prompt: "Basándote en estas causas identificadas, propón 5 acciones concretas y medibles para resolver el problema: {{previous}}" },
        { label: "3. Plan de 30 días", prompt: "Convierte estas soluciones en un plan de acción de 30 días con semanas, responsables y métricas de éxito: {{previous}}" },
      ],
    },
    {
      label: "🌍 Inglés → Adaptar → Formal",
      initialInput: "AI is not just a tool anymore. It's becoming a collaborator. The way we work, create, and solve problems is fundamentally changing. Companies that don't adapt will be left behind.",
      steps: [
        { label: "1. Traducir", prompt: "Traduce el siguiente texto al español de forma natural y fluida: {{previous}}" },
        { label: "2. Adaptar al contexto latinoam.", prompt: "Adapta el siguiente texto para una audiencia latinoamericana, usando referencias y ejemplos locales relevantes: {{previous}}" },
        { label: "3. Versión formal/ejecutiva", prompt: "Reescribe el siguiente texto en un tono ejecutivo y formal, apropiado para una presentación a directivos: {{previous}}" },
      ],
    },
  ],
  en: [
    {
      label: "✍️ Idea → Blog post",
      initialInput: "The importance of sleep for workplace productivity",
      steps: [
        { label: "1. Create outline", prompt: "Create a detailed outline for a blog article about: {{previous}}. Define title, introduction, 4-5 main sections with subtitles and conclusion." },
        { label: "2. Develop intro", prompt: "Write a compelling 3-paragraph introduction for a blog article based on this outline: {{previous}}" },
        { label: "3. Optimize for SEO", prompt: "Analyze the following text and improve it for SEO: suggest a 160-character meta description, 5 main keywords, and rewrite the text with those keywords naturally integrated: {{previous}}" },
      ],
    },
    {
      label: "🧪 Text → Analysis → Action",
      initialInput: "Q3 sales dropped 15% compared to Q2. Category A products fell 30% while category B rose 10%. Customer feedback indicates issues with delivery times.",
      steps: [
        { label: "1. Identify causes", prompt: "Analyze the following sales report and identify the 3 main causes of the described problem: {{previous}}" },
        { label: "2. Propose solutions", prompt: "Based on these identified causes, propose 5 concrete and measurable actions to solve the problem: {{previous}}" },
        { label: "3. 30-day plan", prompt: "Convert these solutions into a 30-day action plan with weeks, owners and success metrics: {{previous}}" },
      ],
    },
    {
      label: "🌍 Spanish → Adapt → Formal",
      initialInput: "La inteligencia artificial ya no es solo una herramienta. Se está convirtiendo en un colaborador. La forma en que trabajamos, creamos y resolvemos problemas está cambiando fundamentalmente.",
      steps: [
        { label: "1. Translate", prompt: "Translate the following text to English naturally and fluently: {{previous}}" },
        { label: "2. Adapt for US audience", prompt: "Adapt the following text for a US audience, using relevant local references and examples: {{previous}}" },
        { label: "3. Executive version", prompt: "Rewrite the following text in an executive and formal tone, appropriate for a C-suite presentation: {{previous}}" },
      ],
    },
  ],
};

const ui = {
  es: { title: "Chain Prompting", description: "Encadena prompts donde la salida de uno alimenta al siguiente. Usa {{previous}} para referenciar el output anterior.", initialInput: "Input inicial", initialPlaceholder: "El texto o dato inicial que alimentará la cadena...", stepPlaceholder: "Prompt para este paso. Usa {{previous}} para el output anterior.", addStep: "Agregar Paso", run: "Ejecutar Cadena", processing: "Procesando...", examples: "Ejemplos:", stepDefault: "Paso" },
  en: { title: "Chain Prompting", description: "Chain prompts where the output of one feeds the next. Use {{previous}} to reference the previous output.", initialInput: "Initial input", initialPlaceholder: "The initial text or data that will feed the chain...", stepPlaceholder: "Prompt for this step. Use {{previous}} for the previous output.", addStep: "Add Step", run: "Run Chain", processing: "Processing...", examples: "Examples:", stepDefault: "Step" },
};

export default function ChainPrompting() {
  const [steps, setSteps] = useState([{ label: "Paso 1", prompt: "" }, { label: "Paso 2", prompt: "" }]);
  const [initialInput, setInitialInput] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [elapsed, setElapsed] = useState(null);
  const { lang } = useLang();
  const t = ui[lang];

  const updateStep = (idx, field, val) => { const updated = [...steps]; updated[idx] = { ...updated[idx], [field]: val }; setSteps(updated); };
  const addStep = () => setSteps([...steps, { label: `${t.stepDefault} ${steps.length + 1}`, prompt: "" }]);
  const removeStep = (idx) => { if (steps.length <= 2) return; setSteps(steps.filter((_, i) => i !== idx)); };

  const handleRun = async () => {
    setIsLoading(true);
    setResults([]);
    const start = Date.now();
    let previousOutput = initialInput;
    const newResults = [];
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      const step = steps[i];
      const prompt = step.prompt.replace("{{input}}", previousOutput).replace("{{previous}}", previousOutput);
      const fullPrompt = `${prompt}\n\nINPUT:\n${previousOutput}`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt });
      previousOutput = typeof res === "string" ? res : JSON.stringify(res);
      newResults.push({ step: step.label, result: res });
      setResults([...newResults]);
    }
    setElapsed(Date.now() - start);
    setCurrentStep(-1);
    setIsLoading(false);
  };

  const loadPack = (pack) => { setSteps(pack.steps); setInitialInput(pack.initialInput); setResults([]); };
  const canRun = initialInput.trim() && steps.every(s => s.prompt.trim());

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={Link2} title={t.title} description={t.description} badge={`${steps.length} steps`} />

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
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.initialInput}</label>
            <Textarea value={initialInput} onChange={(e) => setInitialInput(e.target.value)} placeholder={t.initialPlaceholder} className="min-h-[100px] bg-secondary/50" />
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i}>
                {i > 0 && <div className="flex justify-center py-1"><ArrowDown className="w-4 h-4 text-primary/50" /></div>}
                <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <Input value={step.label} onChange={(e) => updateStep(i, "label", e.target.value)} className="bg-transparent border-none text-sm font-medium p-0 h-auto w-auto" />
                    {steps.length > 2 && (
                      <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Textarea value={step.prompt} onChange={(e) => updateStep(i, "prompt", e.target.value)} placeholder={t.stepPlaceholder} className="min-h-[80px] bg-secondary/50 text-sm" />
                  {i === currentStep && (
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />{t.processing}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <PromptPreview buildPrompt={() => steps.map((step, i) => `--- ${step.label} ---\n${step.prompt.replace("{{previous}}", i === 0 ? initialInput : "[output anterior]")}`).join("\n\n")} label={lang === "es" ? "Ver prompts de InvokeLLM" : "View InvokeLLM prompts"} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={addStep} className="flex-1 gap-2"><Plus className="w-4 h-4" /> {t.addStep}</Button>
            <Button onClick={handleRun} disabled={!canRun || isLoading} className="flex-1 gap-2"><Play className="w-4 h-4" /> {t.run}</Button>
          </div>
        </div>
        <div className="space-y-4">
          {results.length === 0 && !isLoading && <ResultPanel result={null} isLoading={false} />}
          {isLoading && results.length === 0 && <ResultPanel result={null} isLoading={true} />}
          {results.map((r, i) => (
            <div key={i}>
              <div className="text-xs font-mono text-muted-foreground mb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">{i + 1}</span>
                {r.step}
              </div>
              <ResultPanel result={r.result} isLoading={false} elapsed={i === results.length - 1 ? elapsed : null} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}