export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
export type RecipeSource = 'MANUAL' | 'EMAIL';
export type SortField = 'title' | 'createdAt' | 'updatedAt';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface CreateRecipeDto {
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  season?: Season[];
  favorite?: boolean;
  ingredients?: CreateIngredientDto[];
}

export interface CreateIngredientDto {
  name: string;
  quantity?: string;
  unit?: string;
  order?: number;
}

export interface RecipeFilters {
  search?: string;
  season?: Season;
  favorite?: string; // query param = toujours string
  ingredient?: string;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}