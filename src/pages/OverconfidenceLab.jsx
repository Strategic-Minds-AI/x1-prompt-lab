import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/LangContext";
import ExerciseHeader from "@/components/ExerciseHeader";
import ResultPanel from "@/components/ResultPanel";
import PromptPreview from "@/components/PromptPreview";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const examples = {
  es: [
    {
      label: "Datos ambiguos de persona",
      context: "Juan tiene un perro. Vive en un apartamento. A veces sale los fines de semana.",
      instruction: "Con base ÚNICAMENTE en esta información, describe el estilo de vida completo de Juan, sus hobbies, su personalidad y sus rutinas diarias. Sé muy detallado y específico.",
    },
    {
      label: "Empresa con 1 dato",
      context: "La empresa X tuvo ingresos de $2M el año pasado.",
      instruction: "Basado SOLO en este dato, evalúa la salud financiera de la empresa, su posición en el mercado, su equipo directivo y sus perspectivas de crecimiento.",
    },
    {
      label: "Síntoma médico único",
      context: "El paciente reporta que a veces tiene dolor de cabeza.",
      instruction: "Basándote ÚNICAMENTE en este síntoma, determina con precisión qué enfermedad tiene el paciente y cuál es el mejor tratamiento.",
    },
    {
      label: "Resultado de un examen",
      context: "Ana obtuvo 85/100 en su examen de matemáticas.",
      instruction: "Con solo este dato, describe en detalle las capacidades intelectuales de Ana, su futuro académico y profesional, y qué carrera debería seguir.",
    },
    {
      label: "Un comentario en redes",
      context: 'Un usuario escribió: "Hoy no tuve un buen día."',
      instruction: "Basándote ÚNICAMENTE en este comentario, realiza un diagnóstico psicológico completo y detallado del estado mental y emocional de esta persona.",
    },
  ],
  en: [
    {
      label: "Ambiguous person data",
      context: "John has a dog. He lives in an apartment. He sometimes goes out on weekends.",
      instruction: "Based ONLY on this information, describe John's complete lifestyle, hobbies, personality and daily routines. Be very detailed and specific.",
    },
    {
      label: "Company with 1 data point",
      context: "Company X had revenues of $2M last year.",
      instruction: "Based SOLELY on this data point, evaluate the company's financial health, market position, executive team and growth prospects.",
    },
    {
      label: "Single medical symptom",
      context: "The patient reports occasionally having headaches.",
      instruction: "Based ONLY on this symptom, precisely determine what disease the patient has and what the best treatment is.",
    },
    {
      label: "One exam result",
      context: "Ana scored 85/100 on her math exam.",
      instruction: "With only this data point, describe in detail Ana's intellectual capabilities, her academic and professional future, and what career she should pursue.",
    },
    {
      label: "One social media comment",
      context: 'A user wrote: "Today wasn\'t a good day for me."',
      instruction: "Based ONLY on this comment, provide a complete and detailed psychological diagnosis of this person's mental and emotional state.",
    },
  ],
};

const ui = {
  es: {
    title: "Laboratorio de Sobreconfianza",
    description: "Observa cómo el LLM hace inferencias definitivas a partir de información mínima o insuficiente.",
    badge: "SOBRECONFIANZA",
    contextLabel: "Información disponible (mínima/ambigua)",
    instructionLabel: "Instrucción (pide inferencias absolutas)",
    contextPlaceholder: "Escribe muy poca información o datos ambiguos...",
    instructionPlaceholder: "Pide que el modelo concluya algo definitivo usando solo esa información...",
    run: "Generar inferencia",
    runCompare: "Comparar con/sin restricción",
    running: "Infiriendo...",
    examplesLabel: "Ejemplos que provocan sobreconfianza",
    tip: "💡 Tip: Fíjate en el tono del modelo. ¿Habla con certeza absoluta? ¿Menciona limitaciones de la información? ¿Inventa detalles que no estaban en el contexto?",
    compareMode: "Modo comparación",
    compareTip: "¿Cambia algo si se quita la restricción 'únicamente'? Ejecuta ambas versiones y compara.",
    withRestriction: "🔒 Con restricción ('únicamente con esta info')",
    withoutRestriction: "🔓 Sin restricción (conocimiento libre)",
    noResult: "Ejecuta para ver el resultado",
  },
  en: {
    title: "Overconfidence Laboratory",
    description: "Observe how the LLM makes definitive inferences from minimal or insufficient information.",
    badge: "OVERCONFIDENCE",
    contextLabel: "Available information (minimal/ambiguous)",
    instructionLabel: "Instruction (ask for absolute inferences)",
    contextPlaceholder: "Write very little or ambiguous information...",
    instructionPlaceholder: "Ask the model to conclude something definitive using only that information...",
    run: "Generate inference",
    runCompare: "Compare with/without restriction",
    running: "Inferring...",
    examplesLabel: "Examples that trigger overconfidence",
    tip: "💡 Tip: Notice the model's tone. Does it speak with absolute certainty? Does it mention information limitations? Does it invent details that weren't in the context?",
    compareMode: "Comparison mode",
    compareTip: "Does it change if the 'only' restriction is removed? Run both versions and compare.",
    withRestriction: "🔒 With restriction ('only with this info')",
    withoutRestriction: "🔓 Without restriction (free knowledge)",
    noResult: "Run to see result",
  },
};

export default function OverconfidenceLab() {
  const { lang } = useLang();
  const t = ui[lang];
  const exList = examples[lang];

  const [context, setContext] = useState("");
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [resultWith, setResultWith] = useState(null);
  const [resultWithout, setResultWithout] = useState(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);

  const buildPrompt = (restricted = true) =>
    restricted
      ? `Información disponible:\n"${context}"\n\nInstrucción:\n"${instruction}"\n\nIMPORTANTE: Responde basándote ÚNICAMENTE en la información proporcionada arriba. No uses conocimiento externo.`
      : `Información disponible:\n"${context}"\n\nInstrucción:\n"${instruction}"`;

  const loadExample = (ex) => {
    setContext(ex.context);
    setInstruction(ex.instruction);
    setResult(null);
    setResultWith(null);
    setResultWithout(null);
  };

  const run = async () => {
    setIsLoading(true);
    setResult(null);
    const start = Date.now();
    const res = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt(true) });
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  const runCompare = async () => {
    setIsLoadingCompare(true);
    setResultWith(null);
    setResultWithout(null);
    const [resWith, resWithout] = await Promise.all([
      base44.integrations.Core.InvokeLLM({ prompt: buildPrompt(true) }),
      base44.integrations.Core.InvokeLLM({ prompt: buildPrompt(false) }),
    ]);
    setResultWith(resWith);
    setResultWithout(resWithout);
    setIsLoadingCompare(false);
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <ExerciseHeader icon={TrendingUp} title={t.title} description={t.description} badge={t.badge} />

      {/* Tip + Compare toggle */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm">
          {t.tip}
        </div>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={`self-start text-xs px-3 py-1.5 rounded-full border transition-colors font-mono ${
            compareMode
              ? "bg-primary/10 border-primary/40 text-primary"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          ⚖️ {t.compareMode}
        </button>
        {compareMode && (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border text-sm text-muted-foreground">
            {t.compareTip}
          </div>
        )}
      </div>

      {/* Examples */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground font-mono mb-2">{t.examplesLabel}</p>
        <div className="flex flex-wrap gap-2">
          {exList.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex)}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/70 text-secondary-foreground border border-border transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 mb-4">
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.contextLabel}</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t.contextPlaceholder}
            className="w-full h-24 bg-card border border-border rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.instructionLabel}</label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={t.instructionPlaceholder}
            className="w-full h-24 bg-card border border-border rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {!compareMode && (
          <Button onClick={run} disabled={isLoading || !context || !instruction} className="gap-2">
            <TrendingUp className="w-4 h-4" />
            {isLoading ? t.running : t.run}
          </Button>
        )}
        {compareMode && (
          <Button onClick={runCompare} disabled={isLoadingCompare || !context || !instruction} className="gap-2">
            <TrendingUp className="w-4 h-4" />
            {isLoadingCompare ? t.running : t.runCompare}
          </Button>
        )}
        <PromptPreview buildPrompt={() => buildPrompt(!compareMode)} />
      </div>

      {!compareMode && (
        <ResultPanel result={result} isLoading={isLoading} elapsed={elapsed} />
      )}

      {compareMode && (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-2">{t.withRestriction}</p>
            <ResultPanel result={resultWith} isLoading={isLoadingCompare} />
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-2">{t.withoutRestriction}</p>
            <ResultPanel result={resultWithout} isLoading={isLoadingCompare} />
          </div>
        </div>
      )}
    </div>
  );
}