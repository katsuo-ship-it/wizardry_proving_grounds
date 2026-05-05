/**
 * mulberry32: シード固定可能な 32bit pseudo-random number generator。
 * Tomas Wang による軽量実装で、ゲームの決定論的テストに十分な品質。
 * 戻り値は [0, 1) の float。
 */
export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** 1..n の整数を返す（dice roll 用）。 */
export function rollDie(rng: RNG, sides: number): number {
  return 1 + Math.floor(rng() * sides);
}

/** [min, max] の整数を返す。 */
export function rollIntInclusive(rng: RNG, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
