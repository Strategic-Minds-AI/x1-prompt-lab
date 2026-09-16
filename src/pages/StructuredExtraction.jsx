import { useState } from "react";
import { FileText, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseHeader from "../components/ExerciseHeader";
import ResultPanel from "../components/ResultPanel";
import PromptPreview from "../components/PromptPreview";
import { useLang } from "@/lib/LangContext";

const presetSchemas = {
  contacts: {
    label: { es: "Contactos / Personas", en: "Contacts / People" },
    schema: { type: "object", properties: { people: { type: "array", items: { type: "object", properties: { name: { type: "string" }, role: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, company: { type: "string" } } } } } },
  },
  events: {
    label: { es: "Eventos / Fechas", en: "Events / Dates" },
    schema: { type: "object", properties: { events: { type: "array", items: { type: "object", properties: { event_name: { type: "string" }, date: { type: "string" }, location: { type: "string" }, description: { type: "string" } } } } } },
  },
  products: {
    label: { es: "Productos / Precios", en: "Products / Prices" },
    schema: { type: "object", properties: { products: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "number" }, currency: { type: "string" }, description: { type: "string" }, category: { type: "string" } } } } } },
  },
  custom: {
    label: { es: "Schema Personalizado (JSON)", en: "Custom Schema (JSON)" },
    schema: null,
  },
};

const PACKS = {
  es: [
    { label: "👤 Tarjeta de visita", preset: "contacts", text: "Hola, soy María García, Directora de Marketing en TechCorp S.L. Puedes contactarme en maria.garcia@techcorp.es o al +34 612 345 678. También trabajo con Juan López (CTO, juan.lopez@techcorp.es, +34 698 765 432) y Ana Martínez, nuestra CEO (ana.martinez@techcorp.es)." },
    { label: "📅 Email con eventos", preset: "events", text: "Te confirmo las reuniones: el lunes 20 de enero a las 10:00 tenemos el kickoff del proyecto Alpha en la Sala A (Madrid). El miércoles 22 a las 16:00 hay una demo con el cliente en remoto (Zoom). El viernes 24 de enero a las 9:30 es la revisión de sprint en las oficinas de Barcelona." },
    { label: "🛒 Catálogo de productos", preset: "products", text: "Ofrecemos los siguientes productos: Laptop Pro X1 por 1.299€ (categoría: electrónica, procesador i9, 32GB RAM), Ratón Inalámbrico MX por 79.99€ (categoría: periféricos, 6 botones, batería 2 años), Monitor UltraWide 34\" por 549€ (categoría: monitores, resolución 3440x1440, panel IPS) y Teclado Mecánico K95 por 189€ (categoría: periféricos, switches Cherry MX Red)." },
  ],
  en: [
    { label: "👤 Business card", preset: "contacts", text: "Hi, I'm Sarah Johnson, Marketing Director at TechCorp Inc. You can reach me at sarah.johnson@techcorp.com or +1 (555) 234-5678. I also work with Mark Chen (CTO, mark.chen@techcorp.com, +1 (555) 876-5432) and Lisa Park, our CEO (lisa.park@techcorp.com)." },
    { label: "📅 Email with events", preset: "events", text: "Confirming the meetings: on Monday January 20 at 10:00 we have the Alpha project kickoff in Room A (New York). On Wednesday the 22nd at 4:00 PM there's a client demo remotely (Zoom). On Friday January 24 at 9:30 is the sprint review at the Boston office." },
    { label: "🛒 Product catalog", preset: "products", text: "We offer the following products: Laptop Pro X1 for $1,299 (category: electronics, i9 processor, 32GB RAM), Wireless Mouse MX for $79.99 (category: peripherals, 6 buttons, 2-year battery), UltraWide 34\" Monitor for $549 (category: monitors, 3440x1440 resolution, IPS panel) and Mechanical Keyboard K95 for $189 (category: peripherals, Cherry MX Red switches)." },
  ],
};

const ui = {
  es: { title: "Extracción Estructurada", description: "Convierte texto libre en datos JSON con schema definido", schemaLabel: "Schema de extracción", customSchemaLabel: "JSON Schema personalizado", activeSchema: "Schema activo", textLabel: "Texto a procesar", placeholder: "Pega aquí el texto del que quieres extraer datos estructurados...", run: "Extraer Datos", examples: "Ejemplos:", promptPrefix: "Extrae datos estructurados del siguiente texto. Sé exhaustivo y preciso.\n\nTEXTO:" },
  en: { title: "Structured Extraction", description: "Convert free text into JSON data with defined schema", schemaLabel: "Extraction schema", customSchemaLabel: "Custom JSON Schema", activeSchema: "Active schema", textLabel: "Text to process", placeholder: "Paste here the text you want to extract structured data from...", run: "Extract Data", examples: "Examples:", promptPrefix: "Extract structured data from the following text. Be exhaustive and precise.\n\nTEXT:" },
};

export default function StructuredExtraction() {
  const [text, setText] = useState("");
  const [preset, setPreset] = useState("contacts");
  const [customSchema, setCustomSchema] = useState('{\n  "type": "object",\n  "properties": {\n    "items": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "field1": { "type": "string" },\n          "field2": { "type": "number" }\n        }\n      }\n    }\n  }\n}');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const { lang } = useLang();
  const t = ui[lang];

  const handleRun = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setResult(null);
    const start = Date.now();
    const schema = preset === "custom" ? JSON.parse(customSchema) : presetSchemas[preset].schema;
    const res = await base44.integrations.Core.InvokeLLM({ prompt: `${t.promptPrefix}\n${text}`, response_json_schema: schema });
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  const loadPack = (pack) => { setText(pack.text); setPreset(pack.preset); setResult(null); };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={FileText} title={t.title} description={t.description} badge="JSON Schema" />

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
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.schemaLabel}</label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(presetSchemas).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label[lang]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {preset === "custom" && (
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.customSchemaLabel}</label>
              <Textarea value={customSchema} onChange={(e) => setCustomSchema(e.target.value)} className="min-h-[150px] bg-secondary/50 font-mono text-xs" />
            </div>
          )}
          {preset !== "custom" && (
            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.activeSchema}</label>
              <pre className="text-xs font-mono text-muted-foreground overflow-auto max-h-[120px]">{JSON.stringify(presetSchemas[preset].schema, null, 2)}</pre>
            </div>
          )}
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.textLabel}</label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.placeholder} className="min-h-[200px] bg-secondary/50" />
          </div>
          <PromptPreview buildPrompt={() => `${t.promptPrefix}\n${text}`} label={lang === "es" ? "Ver prompt de InvokeLLM" : "View InvokeLLM prompt"} />
          <Button onClick={handleRun} disabled={!text.trim() || isLoading} className="w-full gap-2">
            <Play className="w-4 h-4" /> {t.run}
          </Button>
        </div>
        <div><ResultPanel result={result} isLoading={isLoading} elapsed={elapsed} /></div>
      </div>
    </div>
  );
}