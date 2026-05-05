import { useT } from "@/i18n/useT";
import { gameStore, useGameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Logo } from "./Logo";
import "./Title.css";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function Title() {
  const sub = useGameStore((s) => (s.state.phase === "title" ? s.state.sub : null));
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
      <div className="title-menu">
        <button type="button" onClick={() => dispatch({ type: "startGame" })}>
          {t("title.menu.newGame")}
        </button>
        <button type="button" onClick={() => dispatch({ type: "openContinue" })}>
          {t("title.menu.continue")}
        </button>
        <button type="button" onClick={() => dispatch({ type: "openSettings" })}>
          {t("title.menu.settings")}
        </button>
      </div>
    </div>
  );
}

function TitleSettings() {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  return (
    <div className="title-screen">
      <Frame title={t("settings.title")}>
        <div className="settings-row">
          <span>{t("settings.language")}: </span>
          <button
            type="button"
            disabled={lang === "en"}
            onClick={() => dispatch({ type: "changeLanguage", lang: "en" })}
          >
            {t("settings.language.en")}
          </button>
          <button
            type="button"
            disabled={lang === "ja"}
            onClick={() => dispatch({ type: "changeLanguage", lang: "ja" })}
          >
            {t("settings.language.ja")}
          </button>
        </div>
        <button
          type="button"
          className="settings-back"
          onClick={() => dispatch({ type: "closeSettings" })}
        >
          {t("settings.back")}
        </button>
      </Frame>
    </div>
  );
}

function TitleContinue() {
  const t = useT();
  return (
    <div className="title-screen">
      <Frame title="CONTINUE">
        <p>{t("common.press.enter")}</p>
      </Frame>
    </div>
  );
}
