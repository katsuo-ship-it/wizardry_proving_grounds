export type Yaw = number; // ラジアン、0 = 北、+π/2 = 東

export interface CameraTarget {
  pos: { x: number; y: number }; // ワールド座標 (= grid + 0.5)
  yaw: Yaw;
}
