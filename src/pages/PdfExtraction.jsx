import { useState } from "react";
import { FileUp, Play, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ExerciseHeader from "../components/ExerciseHeader";
import ResultPanel from "../components/ResultPanel";
import PromptPreview from "../components/PromptPreview";
import AnimatedLoader from "../components/AnimatedLoader";
import { useLang } from "@/lib/LangContext";

const analysisTypes = {
  es: [
    { value: "summarize", label: "Resumen ejecutivo", prompt: "Analiza este documento PDF y genera un resumen ejecutivo estructurado con los puntos más importantes, conclusiones y datos relevantes." },
    { value: "extract_data", label: "Extraer datos y cifras", prompt: "Extrae todos los datos numéricos, estadísticas, fechas, nombres y cifras importantes que aparezcan en este documento." },
    { value: "key_points", label: "Puntos clave", prompt: "Identifica y lista los 10 puntos más importantes de este documento. Para cada uno incluye el contexto necesario para entenderlo." },
    { value: "qa", label: "Preguntas y respuestas", prompt: "Lee este documento y genera 5 preguntas importantes sobre su contenido junto con sus respuestas detalladas basadas en el texto." },
    { value: "table", label: "Extraer tablas/listas", prompt: "Extrae todas las tablas, listas y datos estructurados que aparezcan en el documento. Organízalos de forma clara." },
    { value: "custom", label: "Instrucción personalizada", prompt: "" },
  ],
  en: [
    { value: "summarize", label: "Executive summary", prompt: "Analyze this PDF document and generate a structured executive summary with the most important points, conclusions and relevant data." },
    { value: "extract_data", label: "Extract data & figures", prompt: "Extract all numerical data, statistics, dates, names and important figures that appear in this document." },
    { value: "key_points", label: "Key points", prompt: "Identify and list the 10 most important points from this document. For each include the necessary context to understand it." },
    { value: "qa", label: "Q&A", prompt: "Read this document and generate 5 important questions about its content along with detailed answers based on the text." },
    { value: "table", label: "Extract tables/lists", prompt: "Extract all tables, lists and structured data that appear in the document. Organize them clearly." },
    { value: "custom", label: "Custom instruction", prompt: "" },
  ],
};

const ui = {
  es: {
    title: "Extracción desde PDF",
    description: "Sube un archivo PDF y extrae información estructurada con el LLM",
    badge: "PDF",
    uploadLabel: "Archivo PDF",
    uploadClick: "Click para subir un PDF",
    uploading: "Subiendo...",
    analysisLabel: "Tipo de análisis",
    customLabel: "Instrucción personalizada",
    customPlaceholder: "¿Qué quieres extraer o analizar del PDF?",
    jsonLabel: "Respuesta JSON",
    run: "Analizar PDF",
    fileReady: "Listo para analizar",
  },
  en: {
    title: "PDF Extraction",
    description: "Upload a PDF file and extract structured information with the LLM",
    badge: "PDF",
    uploadLabel: "PDF File",
    uploadClick: "Click to upload a PDF",
    uploading: "Uploading...",
    analysisLabel: "Analysis type",
    customLabel: "Custom instruction",
    customPlaceholder: "What do you want to extract or analyze from the PDF?",
    jsonLabel: "JSON response",
    run: "Analyze PDF",
    fileReady: "Ready to analyze",
  },
};

export default function PdfExtraction() {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analysisType, setAnalysisType] = useState("summarize");
  const [customInstruction, setCustomInstruction] = useState("");
  const [useJson, setUseJson] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const { lang } = useLang();
  const t = ui[lang];

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setFileUrl(null);
    setFileName(file.name);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);
    setUploading(false);
  };

  const removeFile = () => { setFileUrl(null); setFileName(""); setResult(null); };

  const buildPrompt = () => {
    const selected = analysisTypes[lang].find(tp => tp.value === analysisType);
    return analysisType === "custom" ? customInstruction : selected.prompt;
  };

  const handleRun = async () => {
    if (!fileUrl) return;
    setIsLoading(true);
    setResult(null);
    const start = Date.now();
    const params = { prompt: buildPrompt(), file_urls: [fileUrl] };
    if (useJson) {
      params.response_json_schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          key_points: { type: "array", items: { type: "string" } },
          extracted_data: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } } } },
        },
      };
    }
    const res = await base44.integrations.Core.InvokeLLM(params);
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  const canRun = fileUrl && (analysisType !== "custom" || customInstruction.trim());

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={FileUp} title={t.title} description={t.description} badge={t.badge} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.uploadLabel}</label>
            {!fileUrl && !uploading ? (
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-secondary/30 cursor-pointer hover:border-primary/30 transition-colors">
                <FileUp className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">{t.uploadClick}</span>
                <span className="text-xs text-muted-foreground/60 mt-1">.pdf</span>
                <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} className="hidden" />
              </label>
            ) : uploading ? (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-secondary/30">
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">{t.uploading}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{fileName}</p>
                    <p className="text-xs text-success">{t.fileReady}</p>
                  </div>
                </div>
                <button onClick={removeFile} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
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
        <div>{isLoading ? <AnimatedLoader /> : <ResultPanel result={result} isLoading={false} elapsed={elapsed} />}</div>
      </div>
    </div>
  );
}