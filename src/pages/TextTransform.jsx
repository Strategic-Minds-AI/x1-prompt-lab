import { useState } from "react";
import { Wand2, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseHeader from "../components/ExerciseHeader";
import ResultPanel from "../components/ResultPanel";
import PromptPreview from "../components/PromptPreview";
import { useLang } from "@/lib/LangContext";

const transformations = {
  es: [
    { value: "summarize", label: "Resumir", prompt: "Resume el siguiente texto en un resumen conciso manteniendo los puntos clave:" },
    { value: "bullet_points", label: "Puntos clave", prompt: "Extrae los puntos clave del siguiente texto en formato de lista:" },
    { value: "formal", label: "Tono formal", prompt: "Reescribe el siguiente texto en un tono formal y profesional:" },
    { value: "casual", label: "Tono casual", prompt: "Reescribe el siguiente texto en un tono casual y amigable:" },
    { value: "technical", label: "Tono técnico", prompt: "Reescribe el siguiente texto en un tono técnico y preciso:" },
    { value: "simplify", label: "Simplificar", prompt: "Simplifica el siguiente texto para que sea entendido por un niño de 10 años:" },
    { value: "expand", label: "Expandir", prompt: "Expande y elabora el siguiente texto agregando más detalle y contexto:" },
    { value: "translate_en", label: "Traducir a inglés", prompt: "Traduce el siguiente texto al inglés manteniendo el tono original:" },
    { value: "translate_es", label: "Traducir a español", prompt: "Traduce el siguiente texto al español manteniendo el tono original:" },
    { value: "email", label: "Formato email", prompt: "Convierte el siguiente texto en un email profesional bien estructurado:" },
    { value: "social", label: "Post para redes", prompt: "Convierte el siguiente texto en un post atractivo para redes sociales (máximo 280 caracteres):" },
  ],
  en: [
    { value: "summarize", label: "Summarize", prompt: "Summarize the following text concisely keeping the key points:" },
    { value: "bullet_points", label: "Key points", prompt: "Extract the key points from the following text in list format:" },
    { value: "formal", label: "Formal tone", prompt: "Rewrite the following text in a formal and professional tone:" },
    { value: "casual", label: "Casual tone", prompt: "Rewrite the following text in a casual and friendly tone:" },
    { value: "technical", label: "Technical tone", prompt: "Rewrite the following text in a technical and precise tone:" },
    { value: "simplify", label: "Simplify", prompt: "Simplify the following text so it can be understood by a 10-year-old:" },
    { value: "expand", label: "Expand", prompt: "Expand and elaborate the following text adding more detail and context:" },
    { value: "translate_en", label: "Translate to English", prompt: "Translate the following text to English keeping the original tone:" },
    { value: "translate_es", label: "Translate to Spanish", prompt: "Translate the following text to Spanish keeping the original tone:" },
    { value: "email", label: "Email format", prompt: "Convert the following text into a well-structured professional email:" },
    { value: "social", label: "Social media post", prompt: "Convert the following text into an attractive social media post (max 280 characters):" },
  ],
};

const PACKS = {
  es: [
    { label: "📝 Resumir noticia", transform: "summarize", text: "La inteligencia artificial está transformando rápidamente el sector sanitario. Los algoritmos de aprendizaje profundo ya son capaces de detectar ciertos tipos de cáncer con una precisión superior a la de los radiólogos humanos en condiciones controladas. Hospitales en Europa y América del Norte están implementando sistemas de IA para el triaje de urgencias, reduciendo los tiempos de espera en un promedio del 30%. Sin embargo, los expertos advierten que la adopción masiva presenta desafíos éticos significativos: ¿Quién es responsable cuando una IA comete un error médico? La regulación avanza más lento que la tecnología, creando zonas grises legales que preocupan tanto a médicos como a pacientes." },
    { label: "📧 Convertir a email", transform: "email", text: "necesito reunirme con el equipo de producto la semana que viene para revisar el roadmap del Q2 quiero que vengan todos los leads y que preparen un estado actualizado de sus proyectos también hay que decidir si aplazamos el lanzamiento de la feature de notificaciones que tiene muchos bugs" },
    { label: "🌐 Traducir al inglés", transform: "translate_en", text: "El aprendizaje automático es una rama de la inteligencia artificial que permite a los sistemas aprender y mejorar automáticamente a partir de la experiencia sin ser programados explícitamente. Se centra en el desarrollo de programas informáticos que pueden acceder a datos y utilizarlos para aprender por sí mismos." },
    { label: "📱 Post para redes", transform: "social", text: "Hemos lanzado una nueva funcionalidad en nuestra plataforma que permite a los usuarios exportar sus datos en tiempo real a cualquier sistema externo mediante webhooks configurables. Esta integración reduce el tiempo de configuración de horas a minutos y elimina la necesidad de desarrolladores para conectar sistemas." },
  ],
  en: [
    { label: "📝 Summarize article", transform: "summarize", text: "Artificial intelligence is rapidly transforming the healthcare sector. Deep learning algorithms are already capable of detecting certain types of cancer with greater accuracy than human radiologists under controlled conditions. Hospitals in Europe and North America are implementing AI systems for emergency triage, reducing wait times by an average of 30%. However, experts warn that mass adoption presents significant ethical challenges: Who is responsible when an AI makes a medical error? Regulation advances more slowly than technology, creating legal grey areas that concern both doctors and patients." },
    { label: "📧 Convert to email", transform: "email", text: "need to meet with the product team next week to review the Q2 roadmap want all leads to come and prepare an updated status of their projects also need to decide whether to delay the launch of the notifications feature which has many bugs" },
    { label: "🌐 Translate to Spanish", transform: "translate_es", text: "Machine learning is a branch of artificial intelligence that enables systems to automatically learn and improve from experience without being explicitly programmed. It focuses on developing computer programs that can access data and use it to learn for themselves." },
    { label: "📱 Social media post", transform: "social", text: "We have launched a new feature on our platform that allows users to export their data in real time to any external system via configurable webhooks. This integration reduces setup time from hours to minutes and eliminates the need for developers to connect systems." },
  ],
};

const ui = {
  es: { title: "Transformación de Texto", description: "Resume, traduce, cambia el tono y reformula textos", badge: "11 modos", transformLabel: "Transformación", textLabel: "Texto original", placeholder: "Pega aquí el texto que quieres transformar...", run: "Transformar", examples: "Ejemplos:" },
  en: { title: "Text Transformation", description: "Summarize, translate, change tone and reformat texts", badge: "11 modes", transformLabel: "Transformation", textLabel: "Original text", placeholder: "Paste here the text you want to transform...", run: "Transform", examples: "Examples:" },
};

export default function TextTransform() {
  const [text, setText] = useState("");
  const [transform, setTransform] = useState("summarize");
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
    const selected = transformations[lang].find(tp => tp.value === transform);
    const res = await base44.integrations.Core.InvokeLLM({ prompt: `${selected.prompt}\n\nTEXT:\n${text}` });
    setElapsed(Date.now() - start);
    setResult(res);
    setIsLoading(false);
  };

  const loadPack = (pack) => { setText(pack.text); setTransform(pack.transform); setResult(null); };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <ExerciseHeader icon={Wand2} title={t.title} description={t.description} badge={t.badge} />

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
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.transformLabel}</label>
            <Select value={transform} onValueChange={setTransform}>
              <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {transformations[lang].map(tp => (<SelectItem key={tp.value} value={tp.value}>{tp.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{t.textLabel}</label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.placeholder} className="min-h-[300px] bg-secondary/50" />
          </div>
          <PromptPreview buildPrompt={() => { const sel = transformations[lang].find(tp => tp.value === transform); return `${sel.prompt}\n\nTEXT:\n${text}`; }} label={lang === "es" ? "Ver prompt de InvokeLLM" : "View InvokeLLM prompt"} />
          <Button onClick={handleRun} disabled={!text.trim() || isLoading} className="w-full gap-2">
            <Play className="w-4 h-4" /> {t.run}
          </Button>
        </div>
        <div><ResultPanel result={result} isLoading={isLoading} elapsed={elapsed} /></div>
      </div>
    </div>
  );
}