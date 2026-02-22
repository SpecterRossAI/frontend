export interface JudgementEntry {
  id: string;
  text: string;
  /** Context from preceding speech (e.g. objection, motion) */
  context?: string;
  /** When the ruling was received */
  timestamp: number;
  /** Judge message stage: opening (who's present), start, or ruling */
  stage?: "opening" | "start" | "ruling";
}
