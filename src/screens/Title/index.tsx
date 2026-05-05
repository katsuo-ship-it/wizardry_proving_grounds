import type { TitleSubState } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { Logo } from "./Logo";
import "./Title.css";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function Title() {
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
      return <Frame title="LOADING">…</Frame>;
    case "loadError":
      return <Frame title="LOAD ERROR">{sub.reason}</Frame>;
  }
}

function TitleMain() {
  const t = useT();
  return (
    <div className="title-screen">
      <Logo />
      <p className="title-subtitle">{t("title.subtitle")}</p>
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
  const mark = (active: boolean) => (active ? "* " : "  ");
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
              hotkey: "B",
              label: t("settings.back"),
              onSelect: () => dispatch({ type: "closeSettings" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}

function TitleContinue() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title="CONTINUE">
        <p>{t("common.press.enter")}</p>
        <Menu
          items={[
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
