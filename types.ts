
export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  macros: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  tips: string;
  imageUrl?: string;
}

export interface UsageData {
  count: number;
  lastDate: string;
}
