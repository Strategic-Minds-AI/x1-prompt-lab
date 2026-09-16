import { useState } from "react";
import { Terminal, Play, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseHeader from "../components/ExerciseHeader";
import ResultPanel from "../components/ResultPanel";
import PromptPreview from "../components/PromptPreview";
import { useLang } from "@/lib/LangContext";

const models = [
  { value: "automatic", label: { es: "Automático (por defecto)", en: "Automatic (default)" } },
  { value: "gpt_5_mini", label: { es: "GPT-5 Mini", en: "GPT-5 Mini" } },
  { value: "gemini_3_flash", label: { es: "Gemini 3 Flash (soporta web)", en: "Gemini 3 Flash (supports web)" } },
  { value: "gpt_5", label: { es: "GPT-5", en: "GPT-5" } },
  { value: "gemini_3_1_pro", label: { es: "Gemini 3.1 Pro (soporta web)", en: "Gemini 3.1 Pro (supports web)" } },
  { value: "claude_sonnet_4_6", label: { es: "Claude Sonnet 4.6", en: "Claude Sonnet 4.6" } },
  { value: "claude_opus_4_6", label: { es: "Claude Opus 4.6", en: "Claude Opus 4.6" } },
];

const PACKS = {
  es: [
    { label: "🤖 Claude - Análisis ético", model: "claude_sonnet_4_6", useWeb: false, useJson: false, prompt: "Analiza los dilemas éticos del uso de IA en el sistema judicial para predecir reincidencia criminal. Considera perspectivas de diferentes stakeholders: jueces, defensores, acusados, sociedad. Estructura tu respuesta con argumentos a favor, en contra y propuestas de salvaguardas." },
    { label: "🌐 Gemini + Web - Noticias", model: "gemini_3_flash", useWeb: true, useJson: false, prompt: "¿Cuáles son los últimos avances en computación cuántica de las últimas semanas? Dame un resumen ejecutivo con los 3 descubrimientos o anuncios más relevantes." },
    { label: "📊 JSON Schema complejo", model: "automatic", useWeb: false, useJson: true, prompt: "Analiza las siguientes tecnologías de IA y proporciona una comparativa estructurada: ChatGPT, Claude, Gemini, Llama. Para cada una incluye empresa creadora, modelo más reciente, precio aproximado por 1M tokens, casos de uso principales y una puntuación del 1-10 en razonamiento, creatividad y código." },
  ],
  en: [
    { label: "🤖 Claude - Ethical analysis", model: "claude_sonnet_4_6", useWeb: false, useJson: false, prompt: "Analyze the ethical dilemmas of using AI in the judicial system to predict criminal recidivism. Consider perspectives from different stakeholders: judges, defenders, defendants, society. Structure your response with arguments for, against and proposals for safeguards." },
    { label: "🌐 Gemini + Web - News", model: "gemini_3_flash", useWeb: true, useJson: false, prompt: "What are the latest advances in quantum computing from the past few weeks? Give me an executive summary with the 3 most relevant discoveries or announcements." },
    { label: "📊 Complex JSON Schema", model: "automatic", useWeb: false, useJson: true, prompt: "Analyze the following AI technologies and provide a structured comparison: ChatGPT, Claude, Gemini, Llama. For each include creator company, latest model, approximate price per 1M tokens, main use cases and a score from 1-10 in reasoning, creativity and code." },
  ],
};

const ui = {
  es: { title: "Playground Libre", description: "Control total sobre InvokeLLM — todos los parámetros disponibles", badge: "Avanzado", modelLabel: "Modelo", promptLabel: "Prompt", promptPlaceholder: "Escribe tu prompt...", internetLabel: "Internet", geminiOnly: "Solo Gemini", jsonLabel: "JSON Schema", filesLabel: "Archivos adjuntos", uploading: "Subiendo...", filesClick: "archivo(s) — Click para agregar", paramsLabel: "Parámetros que se enviarán", run: "Ejecutar", examples: "Ejemplos:", creditsWarning: "⚡ Los modelos no-default consumen más créditos." },
  en: { title: "Free Playground", description: "Full control over InvokeLLM — all parameters available", badge: "Advanced", modelLabel: "Model", promptLabel: "Prompt", promptPlaceholder: "Write your prompt...", internetLabel: "Internet", geminiOnly: "Gemini only", jsonLabel: "JSON Schema", filesLabel: "Attached files", uploading: "Uploading...", filesClick: "file(s) — Click to add", paramsLabel: "Parameters to be sent", run: "Run", examples: "Examples:", creditsWarning: "⚡ Non-default models use more credits." },
};

export default function Playground() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("automatic");
  const [useWeb, setUseWeb] = useState(false);
  const [useJson, setUseJson] = useState(false);
  const [jsonSchema, setJsonSchema] = useState('{\n  "type": "object",\n  "properties": {\n    "result": { "type": "string" }\n  }\n}');
  const [fileUrls, setFileUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const { lang } = useLang();
  const t = ui[lang];

  const webModels = ["gemini_3_flash", "gemini_3_1_pro"];
  const canUseWeb = webModels.includes(model) || model === "automatic";

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setFileUrls(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResult(null);
    const start = Date.now();
    const params = { prompt };
    if (model !== "automatic") params.model = model;
    if (useWeb && canUseWeb) params.add_context_from_internet = true;
    if (useJson) params.response_json_schema = JSON.parse(jsonSchema);
    if (fileUrls.length > 0) params.file_urls = fileUrls;
    const res = await base44.integrations.Core.InvokeLLM(params);
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  const loadPack = (pack) => { setPrompt(pack.prompt); setModel(pack.model); setUseWeb(pack.useWeb); setUseJson(pack.useJson); setResult(null); };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={Terminal} title={t.title} description={t.description} badge={t.badge} />

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
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.modelLabel}</label>
            <Select value={model} onValueChange={(v) => { setModel(v); if (!webModels.includes(v) && v !== "automatic") setUseWeb(false); }}>
              <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {models.map(m => (<SelectItem key={m.value} value={m.value}>{m.label[lang]}</SelectItem>))}
              </SelectContent>
            </Select>
            {model !== "automatic" && (<p className="text-[10px] text-warning mt-1">{t.creditsWarning}</p>)}
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.promptLabel}</label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t.promptPlaceholder} className="min-h-[200px] bg-secondary/50 font-mono text-sm" />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-muted-foreground">{t.internetLabel}</label>
              <button onClick={() => canUseWeb && setUseWeb(!useWeb)} className={`w-10 h-5 rounded-full transition-colors relative ${!canUseWeb ? 'opacity-40' : ''} ${useWeb ? 'bg-primary' : 'bg-secondary'}`} disabled={!canUseWeb}>
                <div className={`w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-transform ${useWeb ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
              {!canUseWeb && <span className="text-[10px] text-muted-foreground">{t.geminiOnly}</span>}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-muted-foreground">{t.jsonLabel}</label>
              <button onClick={() => setUseJson(!useJson)} className={`w-10 h-5 rounded-full transition-colors ${useJson ? 'bg-primary' : 'bg-secondary'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-transform ${useJson ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
          {useJson && (
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.jsonLabel}</label>
              <Textarea value={jsonSchema} onChange={(e) => setJsonSchema(e.target.value)} className="min-h-[120px] bg-secondary/50 font-mono text-xs" />
            </div>
          )}
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.filesLabel}</label>
            <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg bg-secondary/30 cursor-pointer hover:border-primary/30 transition-colors text-sm text-muted-foreground">
              <Upload className="w-4 h-4" />
              {uploading ? t.uploading : `${fileUrls.length} ${t.filesClick}`}
              <input type="file" multiple onChange={handleUpload} className="hidden" />
            </label>
            {fileUrls.length > 0 && (
              <div className="mt-2 space-y-1">
                {fileUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate flex-1 font-mono">{url.split('/').pop()}</span>
                    <button onClick={() => setFileUrls(fileUrls.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.paramsLabel}</label>
            <pre className="text-xs font-mono text-foreground/60 overflow-auto max-h-[100px]">
{JSON.stringify({
  prompt: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
  ...(model !== "automatic" && { model }),
  ...(useWeb && { add_context_from_internet: true }),
  ...(useJson && { response_json_schema: "..." }),
  ...(fileUrls.length > 0 && { file_urls: `[${fileUrls.length} files]` }),
}, null, 2)}
            </pre>
          </div>
          <PromptPreview buildPrompt={() => prompt} label={lang === "es" ? "Ver prompt de InvokeLLM" : "View InvokeLLM prompt"} />
          <Button onClick={handleRun} disabled={!prompt.trim() || isLoading} className="w-full gap-2">
            <Play className="w-4 h-4" /> {t.run}
          </Button>
        </div>
        <div><ResultPanel result={result} isLoading={isLoading} elapsed={elapsed} /></div>
      </div>
    </div>
  );
}