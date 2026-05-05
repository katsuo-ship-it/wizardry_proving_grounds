export const ALIGNMENTS = ["good", "neutral", "evil"] as const;
export type Alignment = (typeof ALIGNMENTS)[number];
