export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
export type RecipeSource = 'MANUAL' | 'EMAIL';
export type SortField = 'title' | 'createdAt' | 'updatedAt';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  order: number;
}

export interface Photo {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  isMain: boolean;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  season: Season[];
  favorite: boolean;
  source: RecipeSource;
  emailFrom?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  ingredients: Ingredient[];
  photos: Photo[];
}

export interface RecipeFilters {
  search?: string;
  season?: Season | '';
  favorite?: boolean;
  ingredient?: string;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateIngredientDto {
  name: string;
  quantity?: string;
  unit?: string;
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

export const SEASON_LABELS: Record<Season, string> = {
  SPRING: 'Printemps',
  SUMMER: 'Été',
  AUTUMN: 'Automne',
  WINTER: 'Hiver',
};

export const SEASON_EMOJIS: Record<Season, string> = {
  SPRING: '🌸',
  SUMMER: '☀️',
  AUTUMN: '🍂',
  WINTER: '❄️',
};