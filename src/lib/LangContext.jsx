import { createContext, useContext, useState } from "react";

export const LangContext = createContext({ lang: "es", setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState("es");
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}