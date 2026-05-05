import { useT } from "@/i18n/useT";
import { gameStore } from "@/store/gameStore";
import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

function Sample() {
  const t = useT();
  return <span>{t("title.menu.newGame")}</span>;
}

describe("useT", () => {
  beforeEach(() => {
    cleanup();
  });

  it("returns English by default", () => {
    gameStore.setState({ lang: "en" });
    render(<Sample />);
    expect(screen.getByText("New Game")).toBeInTheDocument();
  });

  it("switches to Japanese when lang changes", () => {
    gameStore.setState({ lang: "ja" });
    render(<Sample />);
    expect(screen.getByText("はじめから")).toBeInTheDocument();
  });
});
