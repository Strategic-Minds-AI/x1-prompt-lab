import { useState } from "react";
import { Bot, Play, CheckCircle, Eraser } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseHeader from "../components/ExerciseHeader";
import ResultPanel from "../components/ResultPanel";
import AgentTimeline from "../components/AgentTimeline";
import PromptPreview from "../components/PromptPreview";
import { useLang } from "@/lib/LangContext";

const EXAMPLES = {
  es: [
    { label: "🌐 Regulación de IA en la UE", task: "Investiga el estado actual de la regulación de inteligencia artificial en la Unión Europea y resume los puntos clave de la AI Act." },
    { label: "⚽ Último Balón de Oro", task: "¿Quién ganó el último Balón de Oro, en qué club juega actualmente y cuántos goles tiene en la presente temporada?" },
    { label: "📚 Plan de estudio Python", task: "Diseña un plan de estudio de 4 semanas para aprender Python desde cero, sin experiencia previa de programación." },
    { label: "📱 iPhone vs Samsung", task: "Compara las características técnicas y precios del iPhone 16 Pro y el Samsung Galaxy S25 Ultra. ¿Cuál recomiendas y por qué?" },
  ],
  en: [
    { label: "🌐 EU AI Regulation", task: "Research the current state of AI regulation in the European Union and summarize the key points of the AI Act." },
    { label: "⚽ Last Ballon d'Or", task: "Who won the last Ballon d'Or, what club do they currently play for, and how many goals do they have this season?" },
    { label: "📚 Python Study Plan", task: "Design a 4-week study plan to learn Python from scratch, with no prior programming experience." },
    { label: "📱 iPhone vs Samsung", task: "Compare the technical features and prices of the iPhone 16 Pro and Samsung Galaxy S25 Ultra. Which do you recommend and why?" },
  ],
};

const ui = {
  es: {
    title: "Agente ReAct", description: "Un agente autónomo que piensa, busca información y decide cuándo tiene suficiente para responder", badge: "Autónomo",
    taskLabel: "Tarea", taskPlaceholder: "Describe la tarea o pregunta que el agente debe resolver...", maxIterLabel: "Iteraciones máx.",
    run: "Ejecutar Agente", running: "Ejecutando...", examples: "Ejemplos:", iterationLabel: "Iteración",
    howItWorks: "¿Cómo funciona?",
    howItWorksText: "El agente usa el patrón ReAct (Reasoning + Acting). En cada iteración: 1) Razona sobre qué hacer, 2) Decide una acción (buscar en web o razonar), 3) Ejecuta la acción, 4) Observa el resultado. Repite hasta decidir que tiene suficiente información o llegar al máximo de iteraciones.",
    finalAnswer: "Respuesta Final", noIterations: "El agente mostrará aquí su proceso de razonamiento paso a paso", clear: "Limpiar",
  },
  en: {
    title: "ReAct Agent", description: "An autonomous agent that thinks, searches for information, and decides when it has enough to answer", badge: "Autonomous",
    taskLabel: "Task", taskPlaceholder: "Describe the task or question the agent should solve...", maxIterLabel: "Max iterations",
    run: "Run Agent", running: "Running...", examples: "Examples:", iterationLabel: "Iteration",
    howItWorks: "How it works",
    howItWorksText: "The agent uses the ReAct (Reasoning + Acting) pattern. Each iteration: 1) Reasons about what to do, 2) Decides an action (search the web or reason), 3) Executes the action, 4) Observes the result. Repeats until it has enough information or reaches the max iterations.",
    finalAnswer: "Final Answer", noIterations: "The agent will show its step-by-step reasoning process here", clear: "Clear",
  },
};

const DECISION_SCHEMA = {
  type: "object",
  properties: {
    thought: { type: "string", description: "Your reasoning about the current state and what to do next" },
    observation_check: { type: "string", description: "Critically evaluate the observations from previous steps. Are they current? Do they contain specific dates? Is the information sufficient and verified, or could it be stale/incomplete? If something seems off, explain why." },
    action: { type: "string", enum: ["search", "reason", "done"], description: "search = search the web for info, reason = think without external data, done = provide final answer" },
    action_input: { type: "string", description: "The search query (if search) or reasoning question (if reason). If previous results were stale or insufficient, REFORMULATE your query to be more specific. Empty if done." },
    answer: { type: "string", description: "The final answer. Only fill this when action is 'done'." },
  },
  required: ["thought", "observation_check", "action", "action_input"],
};

const MAX_ITER_OPTIONS = [3, 5, 7];

export default function ReActAgent() {
  const [task, setTask] = useState("");
  const [maxIter, setMaxIter] = useState(5);
  const [iterations, setIterations] = useState([]);
  const [finalAnswer, setFinalAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIter, setCurrentIter] = useState(0);
  const [elapsed, setElapsed] = useState(null);
  const { lang } = useLang();
  const t = ui[lang];

  const buildDecisionPrompt = (taskText, history) =>
    `You are an autonomous agent using the ReAct (Reasoning + Acting) pattern to solve a task.\n\nTASK: ${taskText}\n\nYou have access to these actions:\n- "search": Search the internet for current/factual information. Use when you need real-world data, news, facts, or updated information you don't already have.\n- "reason": Think and analyze using your own knowledge. Use when you can reason about something or synthesize existing information without needing external data.\n- "done": You have enough information to provide the final answer. Include the answer in the "answer" field.\n\nPREVIOUS STEPS:\n${history || "(none — this is the first step)"}\n\nCRITICAL — VALIDATE YOUR OBSERVATIONS BEFORE ACTING:\n1. Check if your previous observations contain specific dates or time references. If the information references events from months/years ago and the task asks about something current, the data may be STALE — search again with a more specific query (e.g. include a year, "latest", "most recent").\n2. Check if the information actually answers the FULL task, or only part of it. If partial, search for the missing pieces.\n3. Do NOT rush to "done" just because you found something. If the answer seems incomplete, vague, or potentially outdated, do another search with a reformulated query.\n4. Only use "done" when you have verified, specific, and sufficient information.\n\nDecide your next action. In "observation_check" critically evaluate your previous observations for recency and completeness. In "thought" explain your plan. If your previous search returned stale or partial results, reformulate the query in "action_input".`;

  const handleRun = async () => {
    if (!task.trim()) return;
    setIsLoading(true);
    setIterations([]);
    setFinalAnswer(null);
    setElapsed(null);
    const start = Date.now();

    let history = "";
    const newIterations = [];
    let done = false;

    for (let i = 0; i < maxIter; i++) {
      setCurrentIter(i + 1);

      const decision = await base44.integrations.Core.InvokeLLM({
        prompt: buildDecisionPrompt(task, history),
        response_json_schema: DECISION_SCHEMA,
        model: "gemini_3_flash",
      });

      const dec = typeof decision === "object" && decision !== null ? decision : { thought: String(decision), action: "done", answer: String(decision) };
      const thought = dec.thought || "";
      const observationCheck = dec.observation_check || "";
      const action = dec.action || "done";
      const actionInput = dec.action_input || "";
      const answer = dec.answer || "";

      if (action === "done") {
        const finalText = answer || thought || "No answer provided.";
        newIterations.push({ thought, observationCheck, action, actionInput, answer: finalText });
        setIterations([...newIterations]);
        setFinalAnswer(finalText);
        done = true;
        break;
      }

      const params = { prompt: actionInput, model: "gemini_3_flash" };
      if (action === "search") params.add_context_from_internet = true;
      const observation = await base44.integrations.Core.InvokeLLM(params);
      const obsText = typeof observation === "string" ? observation : JSON.stringify(observation, null, 2);

      newIterations.push({ thought, observationCheck, action, actionInput, observation: obsText });
      setIterations([...newIterations]);
      history += `Step ${i + 1}:\n  Thought: ${thought}\n  Observation Check: ${observationCheck}\n  Action: ${action}\n  Action Input: ${actionInput}\n  Observation: ${obsText.slice(0, 2000)}\n\n`;
    }

    if (!done) {
      const synthesis = await base44.integrations.Core.InvokeLLM({
        prompt: `Task: ${task}\n\nBased on your research so far, provide a final comprehensive answer. If any observations contained outdated information, prioritize the most recent and verified data.\n\n${history}`,
        model: "gemini_3_flash",
      });
      setFinalAnswer(typeof synthesis === "string" ? synthesis : JSON.stringify(synthesis));
    }

    setElapsed(Date.now() - start);
    setCurrentIter(0);
    setIsLoading(false);
  };

  const loadExample = (ex) => { setTask(ex.task); setIterations([]); setFinalAnswer(null); setElapsed(null); };
  const handleClear = () => { setTask(""); setIterations([]); setFinalAnswer(null); setElapsed(null); };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={Bot} title={t.title} description={t.description} badge={t.badge} />

      <div className="mb-6 p-4 rounded-lg bg-accent/5 border border-accent/20 text-sm text-muted-foreground">
        <p className="font-mono text-accent text-xs mb-1">{t.howItWorks}</p>
        {t.howItWorksText}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs font-mono text-muted-foreground self-center">{t.examples}</span>
        {EXAMPLES[lang].map((ex, i) => (
          <button key={i} onClick={() => loadExample(ex)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/40 hover:border-accent/40 hover:text-accent transition-colors">
            {ex.label}
          </button>
        ))}
        <button onClick={handleClear} className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/40 hover:border-destructive/40 hover:text-destructive transition-colors flex items-center gap-1">
          <Eraser className="w-3 h-3" /> {t.clear}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.taskLabel}</label>
            <Textarea value={task} onChange={(e) => setTask(e.target.value)} placeholder={t.taskPlaceholder} className="min-h-[120px] bg-secondary/50" />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.maxIterLabel}</label>
            <Select value={String(maxIter)} onValueChange={(v) => setMaxIter(Number(v))}>
              <SelectTrigger className="bg-secondary/50 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MAX_ITER_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <PromptPreview buildPrompt={() => buildDecisionPrompt(task || "[your task]", "(previous steps history)")} label="View decision prompt" />
          <Button onClick={handleRun} disabled={!task.trim() || isLoading} className="w-full gap-2">
            <Play className="w-4 h-4" /> {isLoading ? t.running : t.run}
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading && currentIter > 0 && (
            <div className="flex items-center gap-2 text-sm text-accent">
              <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
              {t.iterationLabel} {currentIter}/{maxIter}...
            </div>
          )}
          {iterations.length === 0 && !isLoading && (
            <div className="border border-dashed border-border rounded-lg bg-card/50 p-8 flex items-center justify-center min-h-[200px]">
              <p className="text-sm text-muted-foreground text-center">{t.noIterations}</p>
            </div>
          )}
          {iterations.length > 0 && <AgentTimeline iterations={iterations} lang={lang} />}
          {finalAnswer && (
            <div>
              <p className="text-xs font-mono text-emerald-400 mb-1.5 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {t.finalAnswer}
              </p>
              <ResultPanel result={finalAnswer} isLoading={false} elapsed={elapsed} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}