import { useGameStore } from "@/store/gameStore";
import { BoltacMenu } from "./BoltacMenu";
import { BuyList } from "./BuyList";
import { BuyerPick } from "./BuyerPick";
import { SellList } from "./SellList";

export function Boltac() {
  const sub = useGameStore((s) => (s.state.phase === "boltac" ? s.state.sub : null));
  if (!sub) return null;
  switch (sub.kind) {
    case "menu":
      return <BoltacMenu />;
    case "pickBuyer":
      return <BuyerPick mode={sub.mode} />;
    case "buyList":
      return <BuyList buyerId={sub.buyer} />;
    case "sellList":
      return <SellList sellerId={sub.seller} />;
  }
}
