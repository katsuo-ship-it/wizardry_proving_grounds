import { useGameStore } from "@/store/gameStore";
import { MESSAGES, type MessageKey } from "./messages";

export function useT(): (key: MessageKey, vars?: Record<string, string | number>) => string {
  const lang = useGameStore((s) => s.lang);
  return (key, vars) => {
    let str: string = MESSAGES[lang][key] ?? MESSAGES.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };
}
