import type { PredictionCategory } from "../types";

export const predictionCategories: Array<{
  id: PredictionCategory;
  label: string;
  shortLabel: string;
  sample: string;
}> = [{ id: "highest_scoring_team", label: "Highest-scoring team", shortLabel: "Bonus", sample: "Brazil" }];
