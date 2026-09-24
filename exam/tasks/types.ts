/** 試験で使う型。tasks と solutions の両方から使う */
export interface Answer {
  department: string;
  confidence: number;
  probabilities: Record<string, number>;
  urgency: number;
  complaint: number;
}

export type Lane = "auto" | "confirm" | "human";
