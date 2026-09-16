import { useState, useEffect } from "react";
import { useLang } from "@/lib/LangContext";

const phrases = {
  es: [
    "Extrayendo información...",
    "Sintetizando datos...",
    "Identificando palabras clave...",
    "Analizando estructura del documento...",
    "Procesando contenido...",
    "Detectando entidades relevantes...",
    "Generando resumen...",
    "Cruzando referencias...",
    "Organizando la información...",
    "Construyendo la respuesta...",
  ],
  en: [
    "Extracting information...",
    "Synthesizing data...",
    "Identifying key words...",
    "Analyzing document structure...",
    "Processing content...",
    "Detecting relevant entities...",
    "Generating summary...",
    "Cross-referencing data...",
    "Organizing information...",
    "Building the response...",
  ],
};

export default function AnimatedLoader() {
  const { lang } = useLang();
  const list = phrases[lang];
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % list.length);
        setVisible(true);
      }, 400);
    }, 2200);
    return () => clearInterval(interval);
  }, [list.length]);

  return (
    <div className="border border-border rounded-lg bg-card p-8 flex flex-col items-center justify-center min-h-[200px] gap-5">
      <div className="relative">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div
          className="absolute inset-0 w-10 h-10 border-2 border-accent/10 border-b-accent rounded-full animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
      </div>
      <p
        className="text-sm font-mono text-primary transition-opacity duration-400"
        style={{ opacity: visible ? 1 : 0, minHeight: "1.25rem" }}
      >
        {list[index]}
      </p>
    </div>
  );
}