import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sparkles, Target, Play, Copy, Check, Save, AlertTriangle, Ghost, TrendingUp, Link2, Lightbulb, Compass } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import DriveConnect from "@/components/DriveConnect";

const OPTIMIZE_SCHEMA = {
  type: "object",
  properties: {
    audit: {
      type: "object",
      properties: {
        issues: { type: "array", items: { type: "string" } },
        failure_points: { type: "array", items: { type: "string" } },
        hallucination_risk: { type: "string" },
        overconfidence_risk: { type: "string" },
      },
    },
    optimized_prompt: { type: "string" },
    quality_score: { type: "number" },
    simulation: {
      type: "object",
      properties: {
        sample_input: { type: "string" },
        sample_output: { type: "string" },
      },
    },
    recommendations: { type: "array", items: { type: "string" } },
  },
};

const GOAL_SCHEMA = {
  type: "object",
  properties: {
    goal_analysis: { type: "string" },
    recommended_prompts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          purpose: { type: "string" },
          prompt_text: { type: "string" },
        },
      },
    },
    prompt_chain: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step: { type: "string" },
          prompt: { type: "string" },
        },
      },
    },
    strategy: { type: "string" },
    expected_quality: { type: "string" },
  },
};

const ROUTER_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string" },
    suggested_approach: { type: "string" },
    why: { type: "string" },
    missing_inputs: { type: "array", items: { type: "string" } },
  },
};

const OPTIMIZE_META = `You are an elite prompt engineer. Run a full engineering pipeline on the prompt below to produce the best possible version.

PROMPT TO OPTIMIZE:
"""
{PROMPT}
"""

Pipeline:
1. AUDIT — Identify failure points, ambiguity, hallucination risk, overconfidence risk, missing constraints, weak structure.
2. ENHANCE — Rewrite into the strongest version: clear role, explicit constraints, output format, edge-case handling, few-shot framing where helpful.
3. SIMULATE — Show how the optimized prompt responds to a representative sample input.
4. SCORE — Rate the optimized prompt 0-100 on clarity, specificity, robustness, and expected output quality.

Return JSON only.`;

const GOAL_META = `You are an elite prompt engineer and strategist. The user states a goal. Reverse-engineer the best prompts and prompt chains to achieve the highest quality result.

GOAL:
"""
{GOAL}
"""

1. Analyze the goal and what excellence looks like.
2. Identify the best prompts to achieve it (title, purpose, full prompt text).
3. Design a prompt chain if sequencing adds value (step, prompt).
4. Recommend a strategy and expected quality.

Return JSON only.`;

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function ScoreBadge({ score }) {
  if (score == null) return null;
  const color = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full bg-secondary ${color}`}>{score}/100</span>;
}

export default function PromptStudio() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "goal" ? "goal" : params.get("mode") === "route" ? "route" : "optimize");
  const [input, setInput] = useState(params.get("prompt") || "");
  const [result, setResult] = useState(null);
  const [routeMatches, setRouteMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const [categories, setCategories] = useState([]);
  const [driveConnected, setDriveConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.PromptTemplate.list({ distinct: "category" }).then((c) => setCategories(c.items || []));
  }, []);

  const switchMode = (m) => {
    setMode(m);
    setResult(null);
    setRouteMatches([]);
    setParams(m === "optimize" ? {} : { mode: m });
  };

  const backupToDrive = async (title, content) => {
    if (!driveConnected) return;
    try {
      await base44.functions.invoke("syncPromptToDrive", { title, content, mode });
      toast({ title: "Backed up to Google Drive" });
    } catch (e) {
      setDriveConnected(false);
      toast({ title: "Drive backup skipped", description: "Connect Google Drive to enable backups.", variant: "destructive" });
    }
  };

  const run = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    setRouteMatches([]);
    const start = Date.now();
    try {
      if (mode === "route") {
        const catList = categories.join(", ");
        const meta = `You are the Master Prompt Router for the PromptLab library of 1,300+ strategic prompts across these categories: ${catList}

Given the user's task, classify the intent and select the single best matching category from the list above, then describe the narrowest approach. Do not invent missing facts; list them in missing_inputs.

TASK:
"""
${input}
"""

Return JSON only.`;
        const raw = await base44.integrations.Core.InvokeLLM({ prompt: meta, response_json_schema: ROUTER_SCHEMA });
        const res = typeof raw === "string" ? JSON.parse(raw) : raw;
        setResult(res);
        setElapsed(Date.now() - start);
        if (res?.category) {
          const { items } = await base44.entities.PromptTemplate.filter({ category: res.category }, { sort: "-created_date", limit: 6 });
          setRouteMatches(items);
        }
        await base44.entities.PromptRun.create({ mode: "route", input, output: JSON.stringify(res), model: "automatic" });
        backupToDrive("route-" + Date.now(), `# Route\n\n## Task\n${input}\n\n## Result\n${JSON.stringify(res, null, 2)}`);
      } else {
        const meta = mode === "optimize" ? OPTIMIZE_META.replace("{PROMPT}", input) : GOAL_META.replace("{GOAL}", input);
        const schema = mode === "optimize" ? OPTIMIZE_SCHEMA : GOAL_SCHEMA;
        const raw = await base44.integrations.Core.InvokeLLM({ prompt: meta, response_json_schema: schema });
        const res = typeof raw === "string" ? JSON.parse(raw) : raw;
        setResult(res);
        setElapsed(Date.now() - start);
        await base44.entities.PromptRun.create({
          mode,
          input,
          output: JSON.stringify(res),
          quality_score: res?.quality_score ?? null,
          model: "automatic",
        });
        backupToDrive(mode + "-" + Date.now(), `# ${mode}\n\n## Input\n${input}\n\n## Output\n${JSON.stringify(res, null, 2)}`);
      }
    } catch (e) {
      toast({ title: "Error", description: String(e.message || e), variant: "destructive" });
    }
    setIsLoading(false);
  };

  const saveToLibrary = async () => {
    if (mode === "optimize" && result?.optimized_prompt) {
      await base44.entities.PromptTemplate.create({
        title: "Optimized: " + input.slice(0, 40),
        category: "Optimized",
        goal: input.slice(0, 200),
        prompt_text: result.optimized_prompt,
        quality_score: result.quality_score,
        tags: ["optimized", "studio"],
      });
      toast({ title: "Saved to library" });
      backupToDrive("optimized-" + Date.now(), result.optimized_prompt);
    }
  };

  const loadMatchIntoStudio = (t) => {
    setInput(t.prompt_text);
    setMode("optimize");
    setResult(null);
    setParams({ prompt: t.prompt_text });
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Prompt Studio</h1>
            <p className="text-sm text-muted-foreground">Audit, optimize, simulate, score — or route a task to the best library prompt.</p>
          </div>
        </div>
        <DriveConnect connected={driveConnected} onConnected={() => setDriveConnected(true)} />
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => switchMode("optimize")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "optimize" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Sparkles className="w-4 h-4" /> Optimize
        </button>
        <button onClick={() => switchMode("goal")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "goal" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Target className="w-4 h-4" /> Goal Mode
        </button>
        <button onClick={() => switchMode("route")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "route" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Compass className="w-4 h-4" /> Router
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">
              {mode === "optimize" ? "Prompt to engineer" : mode === "goal" ? "Your goal — what do you want to achieve?" : "Task — describe what you want to accomplish"}
            </label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "optimize" ? "Paste a prompt to audit, fix, and enhance..." : mode === "goal" ? "e.g. Build the best website generation system in existence" : "e.g. Build a lead-gen site for a plumber in Miami"}
              className="min-h-[220px] bg-secondary/50 font-mono text-sm"
            />
          </div>
          <Button onClick={run} disabled={!input.trim() || isLoading} className="w-full gap-2">
            <Play className="w-4 h-4" /> {isLoading ? "Working..." : mode === "optimize" ? "Run Engineering Pipeline" : mode === "goal" ? "Reverse-Engineer Prompts" : "Route Task"}
          </Button>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              {mode === "route" ? "Classifying intent, matching library category..." : mode === "optimize" ? "Auditing, enhancing, simulating, scoring..." : "Analyzing goal, identifying best prompts and chains..."}
            </div>
          )}
          {elapsed && !isLoading && <p className="text-xs text-muted-foreground">Completed in {elapsed}ms</p>}
        </div>

        <div className="space-y-4">
          {!result && !isLoading && (
            <div className="border border-dashed border-border rounded-lg bg-card/50 p-8 flex items-center justify-center min-h-[300px]">
              <p className="text-sm text-muted-foreground text-center">
                {mode === "optimize" ? "Run the pipeline to get an audit, optimized prompt, simulation, and score." : mode === "goal" ? "State your goal to get reverse-engineered prompts and chains." : "Paste a task and the router will match it to the best category and prompts in your library."}
              </p>
            </div>
          )}
          {result && mode === "optimize" && <OptimizeResult result={result} onSave={saveToLibrary} />}
          {result && mode === "goal" && <GoalResult result={result} />}
          {result && mode === "route" && <RouterResult result={result} matches={routeMatches} onLoad={loadMatchIntoStudio} />}
        </div>
      </div>
    </div>
  );
}

function RouterResult({ result, matches, onLoad }) {
  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card p-4">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-primary" /> Routed Category
        </p>
        <p className="text-sm font-semibold text-primary mb-2">{result.category || "—"}</p>
        {result.why && <p className="text-sm text-foreground/80 mb-2">{result.why}</p>}
        {result.suggested_approach && (
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{result.suggested_approach}</p>
        )}
        {result.missing_inputs?.length > 0 && (
          <div className="mt-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] font-mono text-amber-500 mb-0.5">Missing inputs</p>
            <ul className="text-xs text-foreground/80 list-disc list-inside">{result.missing_inputs.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </div>
        )}
      </div>
      {matches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Matching Library Prompts ({matches.length})
          </p>
          {matches.map((t) => (
            <div key={t.id} className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{t.goal || t.category}</p>
                </div>
                <Button onClick={() => onLoad(t)} size="sm" variant="outline" className="gap-1.5 flex-shrink-0 ml-2"><Play className="w-3 h-3" /> Load</Button>
              </div>
              <pre className="p-3 text-xs font-mono text-foreground/70 whitespace-pre-wrap break-words max-h-[120px] overflow-y-auto">{t.prompt_text}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OptimizeResult({ result, onSave }) {
  const audit = result.audit || {};
  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-mono text-muted-foreground">Optimized Prompt</span>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBadge score={result.quality_score} />
            <CopyButton text={result.optimized_prompt || ""} />
            <button onClick={onSave} className="text-muted-foreground hover:text-primary transition-colors" title="Save to library">
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 max-h-[260px] overflow-y-auto">
          <pre className="text-sm font-mono text-foreground/90 whitespace-pre-wrap break-words">{result.optimized_prompt}</pre>
        </div>
      </div>

      {(audit.issues?.length > 0 || audit.failure_points?.length > 0) && (
        <div className="border border-border rounded-lg bg-card p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Audit
          </p>
          {audit.issues?.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-mono text-muted-foreground mb-1">Issues</p>
              <ul className="text-sm text-foreground/80 list-disc list-inside space-y-0.5">
                {audit.issues.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
          )}
          {audit.failure_points?.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-muted-foreground mb-1">Failure points</p>
              <ul className="text-sm text-foreground/80 list-disc list-inside space-y-0.5">
                {audit.failure_points.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
              <p className="text-[10px] font-mono text-amber-500 mb-0.5 flex items-center gap-1"><Ghost className="w-3 h-3" /> Hallucination risk</p>
              <p className="text-xs text-foreground/80">{audit.hallucination_risk || "—"}</p>
            </div>
            <div className="p-2 rounded-md bg-violet-500/10 border border-violet-500/20">
              <p className="text-[10px] font-mono text-violet-500 mb-0.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Overconfidence risk</p>
              <p className="text-xs text-foreground/80">{audit.overconfidence_risk || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {result.simulation && (result.simulation.sample_input || result.simulation.sample_output) && (
        <div className="border border-border rounded-lg bg-card p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-primary" /> Simulation
          </p>
          {result.simulation.sample_input && (
            <div className="mb-2">
              <p className="text-[10px] font-mono text-muted-foreground mb-0.5">Sample input</p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.simulation.sample_input}</p>
            </div>
          )}
          {result.simulation.sample_output && (
            <div>
              <p className="text-[10px] font-mono text-muted-foreground mb-0.5">Sample output</p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.simulation.sample_output}</p>
            </div>
          )}
        </div>
      )}

      {result.recommendations?.length > 0 && (
        <div className="border border-border rounded-lg bg-card p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-accent" /> Recommendations
          </p>
          <ul className="text-sm text-foreground/80 list-disc list-inside space-y-0.5">
            {result.recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function GoalResult({ result }) {
  return (
    <div className="space-y-4">
      {result.goal_analysis && (
        <div className="border border-border rounded-lg bg-card p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1.5">Goal Analysis</p>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.goal_analysis}</p>
        </div>
      )}
      {result.recommended_prompts?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Recommended Prompts
          </p>
          {result.recommended_prompts.map((p, idx) => (
            <div key={idx} className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground">{p.purpose}</p>
                </div>
                <CopyButton text={p.prompt_text || ""} />
              </div>
              <pre className="p-3 text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words max-h-[160px] overflow-y-auto">{p.prompt_text}</pre>
            </div>
          ))}
        </div>
      )}
      {result.prompt_chain?.length > 0 && (
        <div className="border border-border rounded-lg bg-card p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-accent" /> Prompt Chain
          </p>
          <div className="space-y-2">
            {result.prompt_chain.map((c, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-[10px] font-mono text-primary flex-shrink-0 mt-0.5">{idx + 1}.</span>
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{c.step}</p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{c.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {result.strategy && (
        <div className="border border-border rounded-lg bg-card p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1.5">Strategy</p>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.strategy}</p>
          {result.expected_quality && <p className="text-xs text-success mt-2">Expected quality: {result.expected_quality}</p>}
        </div>
      )}
    </div>
  );
}
