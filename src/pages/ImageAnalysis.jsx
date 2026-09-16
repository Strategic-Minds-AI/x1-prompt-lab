import { useState } from "react";
import { Image, Play, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseHeader from "../components/ExerciseHeader";
import ResultPanel from "../components/ResultPanel";
import PromptPreview from "../components/PromptPreview";
import { useLang } from "@/lib/LangContext";

const analysisTypes = {
  es: [
    { value: "describe", label: "Descripción detallada", prompt: "Describe esta imagen en detalle. Incluye: objetos, personas, colores, composición, contexto y cualquier texto visible." },
    { value: "extract_text", label: "Extraer texto (OCR)", prompt: "Extrae todo el texto visible en esta imagen. Organiza el texto de forma lógica manteniendo la estructura original." },
    { value: "extract_data", label: "Extraer datos", prompt: "Extrae datos estructurados de esta imagen (tablas, listas, formularios, etc). Organiza la información de forma clara." },
    { value: "analyze", label: "Análisis técnico", prompt: "Realiza un análisis técnico de esta imagen: calidad, composición, paleta de colores, y elementos técnicos relevantes." },
    { value: "custom", label: "Instrucción personalizada", prompt: "" },
  ],
  en: [
    { value: "describe", label: "Detailed description", prompt: "Describe this image in detail. Include: objects, people, colors, composition, context and any visible text." },
    { value: "extract_text", label: "Extract text (OCR)", prompt: "Extract all visible text in this image. Organize the text logically maintaining the original structure." },
    { value: "extract_data", label: "Extract data", prompt: "Extract structured data from this image (tables, lists, forms, etc). Organize the information clearly." },
    { value: "analyze", label: "Technical analysis", prompt: "Perform a technical analysis of this image: quality, composition, color palette, and relevant technical elements." },
    { value: "custom", label: "Custom instruction", prompt: "" },
  ],
};

const ui = {
  es: { title: "Análisis de Imagen", description: "Sube imágenes para análisis, extracción de texto y datos", badge: "Visión", imagesLabel: "Imágenes", uploading: "Subiendo...", uploadClick: "Click para subir imágenes", analysisLabel: "Tipo de análisis", instructionLabel: "Instrucción", instructionPlaceholder: "¿Qué quieres analizar en la imagen?", jsonLabel: "Respuesta JSON", run: "Analizar Imagen" },
  en: { title: "Image Analysis", description: "Upload images for analysis, text and data extraction", badge: "Vision", imagesLabel: "Images", uploading: "Uploading...", uploadClick: "Click to upload images", analysisLabel: "Analysis type", instructionLabel: "Instruction", instructionPlaceholder: "What do you want to analyze in the image?", jsonLabel: "JSON response", run: "Analyze Image" },
};

export default function ImageAnalysis() {
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analysisType, setAnalysisType] = useState("describe");
  const [customPrompt, setCustomPrompt] = useState("");
  const [useJson, setUseJson] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const { lang } = useLang();
  const t = ui[lang];

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setImageUrls(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const removeImage = (idx) => setImageUrls(imageUrls.filter((_, i) => i !== idx));

  const handleRun = async () => {
    if (!imageUrls.length) return;
    setIsLoading(true);
    setResult(null);
    const start = Date.now();
    const selected = analysisTypes[lang].find(tp => tp.value === analysisType);
    const prompt = analysisType === "custom" ? customPrompt : selected.prompt;
    const params = { prompt, file_urls: imageUrls };
    if (useJson) {
      params.response_json_schema = {
        type: "object",
        properties: {
          analysis: { type: "string" },
          elements_found: { type: "array", items: { type: "object", properties: { element: { type: "string" }, description: { type: "string" }, location: { type: "string" } } } },
          text_extracted: { type: "string" },
          metadata: { type: "object", properties: { dominant_colors: { type: "array", items: { type: "string" } }, mood: { type: "string" }, category: { type: "string" } } },
        },
      };
    }
    const res = await base44.integrations.Core.InvokeLLM(params);
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={Image} title={t.title} description={t.description} badge={t.badge} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.imagesLabel}</label>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg bg-secondary/30 cursor-pointer hover:border-primary/30 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{uploading ? t.uploading : t.uploadClick}</span>
              <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            </label>
          </div>
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.instructionLabel}</label>
              <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder={t.instructionPlaceholder} className="min-h-[100px] bg-secondary/50" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-muted-foreground">{t.jsonLabel}</label>
            <button onClick={() => setUseJson(!useJson)} className={`w-10 h-5 rounded-full transition-colors ${useJson ? 'bg-primary' : 'bg-secondary'} relative`}>
              <div className={`w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-transform ${useJson ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <PromptPreview buildPrompt={() => { const sel = analysisTypes[lang].find(tp => tp.value === analysisType); return analysisType === "custom" ? customPrompt : sel.prompt; }} label={lang === "es" ? "Ver prompt de InvokeLLM" : "View InvokeLLM prompt"} />
          <Button onClick={handleRun} disabled={!imageUrls.length || isLoading} className="w-full gap-2">
            <Play className="w-4 h-4" /> {t.run}
          </Button>
        </div>
        <div><ResultPanel result={result} isLoading={isLoading} elapsed={elapsed} /></div>
      </div>
    </div>
  );
}