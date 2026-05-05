import type { Character } from "@/engine/state/types";
import { useT } from "@/i18n/useT";
import { db } from "@/persist/db";
import { gameStore } from "@/store/gameStore";
import { Frame } from "@/ui/components/Frame";
import { Menu } from "@/ui/components/Menu";
import { useEffect, useState } from "react";

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>["dispatch"]>[0]) =>
  gameStore.getState().dispatch(e);

export function RestStables({ guest }: { guest: number }) {
  const t = useT();
  const [c, setC] = useState<Character | undefined>();
  useEffect(() => {
    db.getCharacter(guest).then(setC);
  }, [guest]);
  if (!c) return null;

  return (
    <div className="menu-screen">
      <Frame title={t("inn.rest.title", { name: c.name })}>
        <p>{t("inn.rest.body")}</p>
        <Menu
          items={[
            {
              hotkey: "S",
              label: t("inn.rest.stables"),
              onSelect: async () => {
                // 1981 原典: Stables は HP 回復なし、restCount のみ加算
                // (Chapter 2 で年齢加算判定が意味を持つ)
                const updated: Character = {
                  ...c,
                  status: { ...c.status, restCount: c.status.restCount + 1 },
                };
                await db.updateCharacter(updated);
                dispatch({ type: "restStables" });
              },
            },
            {
              hotkey: "C",
              label: t("inn.rest.cot"),
              onSelect: () => {},
              disabled: true,
            },
            {
              hotkey: "E",
              label: t("inn.rest.economy"),
              onSelect: () => {},
              disabled: true,
            },
            {
              hotkey: "M",
              label: t("inn.rest.merchant"),
              onSelect: () => {},
              disabled: true,
            },
            {
              hotkey: "R",
              label: t("inn.rest.royal"),
              onSelect: () => {},
              disabled: true,
            },
            {
              hotkey: "B",
              label: t("common.back"),
              onSelect: () => dispatch({ type: "leaveInn" }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
