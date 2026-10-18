import { createContext, useContext, useState } from "react";

/** @type {import("react").Dispatch<import("react").SetStateAction<string>>} */
const noopSetLang = () => {};

export const LangContext = createContext({ lang: "en", setLang: noopSetLang });

export function LangProvider({ children }) {
  const [lang, setLang] = useState("en");
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
