import type { SaveSlotInfo, TitleSubState } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import "./Title.css";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function Title() {
  const t = useT();
  const sub = useGameStore((s) => {
    const st = s.state;
    return st.phase === "title" ? st.sub : null;
  }) as TitleSubState | null;

  if (!sub) return null;

  switch (sub.kind) {
    case "main":
      return <TitleMain />;
    case "settings":
      return <TitleSettings />;
    case "continueMenu":
      return <TitleContinue />;
    case "loading":
      return (
        <div className="menu-screen">
          <Frame title={t("common.loading")}>
            <p>{t("title.loading.body")}</p>
          </Frame>
        </div>
      );
    case "loadError":
      return (
        <div className="menu-screen">
          <Frame title={t("title.loadError.title")}>
            <p>{sub.reason}</p>
            <Menu
              items={[
                {
                  hotkey: "O",
                  label: t("common.ok"),
                  onSelect: () => dispatch({ type: "closeContinueMenu" }),
                },
              ]}
            />
          </Frame>
        </div>
      );
  }
}

function TitleMain() {
  const t = useT();
  const isHealthy = useGameStore((s) => s.isStorageHealthy);
  return (
    <div className="title-screen">
      <Logo />
      <p className="title-subtitle">{t("title.subtitle")}</p>
      {!isHealthy && <p className="title-warning">{t("storage.unavailable")}</p>}
      <div className="title-main-menu">
        <Menu
          items={[
            {
              hotkey: "N",
              label: t("title.menu.newGame"),
              onSelect: () => dispatch({ type: "startGame" }),
            },
            {
              hotkey: "C",
              label: t("title.menu.continue"),
              onSelect: () => dispatch({ type: "openContinue" }),
            },
            {
              hotkey: "S",
              label: t("title.menu.settings"),
              onSelect: () => dispatch({ type: "openSettings" }),
            },
          ]}
        />
      </div>
    </div>
  );
}

function TitleSettings() {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mark = (active: boolean) => (active ? "* " : "  ");

  const onExport = async (): Promise<void> => {
    const blob = await db.exportAll();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wizardry-save-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(t("settings.import.confirm"))) return;
    await db.importAll(file, "replace");
    location.reload();
  };

  return (
    <div className="menu-screen">
      <Frame title={t("settings.title")}>
        <p className="settings-heading">{t("settings.language")}</p>
        <Menu
          items={[
            {
              hotkey: "E",
              label: `${mark(lang === "en")}${t("settings.language.en")}`,
              onSelect: () => dispatch({ type: "changeLanguage", lang: "en" }),
            },
            {
              hotkey: "J",
              label: `${mark(lang === "ja")}${t("settings.language.ja")}`,
              onSelect: () => dispatch({ type: "changeLanguage", lang: "ja" }),
            },
            {
              hotkey: "X",
              label: t("settings.export"),
              onSelect: () => void onExport(),
            },
            {
              hotkey: "I",
              label: t("settings.import"),
              onSelect: () => fileInputRef.current?.click(),
            },
            {
              hotkey: "B",
              label: t("settings.back"),
              onSelect: () => dispatch({ type: "closeSettings" }),
            },
          ]}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden-file-input"
          aria-label={t("settings.import")}
          onChange={(e) => void onImport(e)}
        />
      </Frame>
    </div>
  );
}

function TitleContinue() {
  const t = useT();
  const isHealthy = useGameStore((s) => s.isStorageHealthy);
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);

  useEffect(() => {
    if (!isHealthy) return;
    db.listSlots()
      .then(setSlots)
      .catch(() => {});
  }, [isHealthy]);

  return (
    <div className="menu-screen">
      <Frame title={t("title.continue.title")}>
        {!isHealthy && <p className="title-warning">{t("storage.unavailable")}</p>}
        {isHealthy && slots.length === 0 && <p>{t("title.continue.noSaves")}</p>}
        <Menu
          items={[
            ...slots.map((slot, i) => ({
              hotkey: String(i + 1),
              label: `${slot.name}  (${new Date(slot.updatedAt).toLocaleString()})`,
              onSelect: () => dispatch({ type: "continueGame", slotId: slot.id }),
            })),
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "closeContinueMenu" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
