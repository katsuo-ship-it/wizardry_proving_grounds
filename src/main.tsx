import { initLanguage } from "@/i18n/init";
import { checkStorageHealth } from "@/persist/health";
import { gameStore } from "@/store/gameStore";
import { subscribeScaleToWindow, waitForPixelFontsReady } from "@/ui/scale";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./ui/global.css";

async function bootstrap(): Promise<void> {
  await Promise.all([waitForPixelFontsReady(), initLanguage()]);
  subscribeScaleToWindow();

  const healthy = await checkStorageHealth();
  gameStore.setState({ isStorageHealthy: healthy });

  const root = document.getElementById("root");
  if (!root) throw new Error("#root not found");
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
