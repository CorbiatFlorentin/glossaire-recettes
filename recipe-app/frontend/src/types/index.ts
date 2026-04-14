export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
export type RecipeSource = 'MANUAL' | 'EMAIL';
export type SortField = 'title' | 'createdAt' | 'updatedAt';
export type CourseCategory = 'STARTER' | 'MAIN' | 'DESSERT';

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
  cost?: number;
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
  category?: CourseCategory;
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
  category?: CourseCategory | '';
  favorite?: boolean;
  ingredient?: string;
  sortBy?: SortField | 'totalCost';
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
  cost?: number;
}

export interface CreateRecipeDto {
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  season?: Season[];
  category?: CourseCategory;
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

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  STARTER: 'Entrée',
  MAIN: 'Plat',
  DESSERT: 'Dessert',
};

export const CATEGORY_EMOJIS: Record<CourseCategory, string> = {
  STARTER: '🥗',
  MAIN: '🍽️',
  DESSERT: '🍰',
};

export const CATEGORY_COLORS: Record<CourseCategory, { bg: string; text: string; border: string; cardBg: string }> = {
  STARTER: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    cardBg: 'bg-green-50/40',
  },
  MAIN: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    cardBg: 'bg-red-50/40',
  },
  DESSERT: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    cardBg: 'bg-yellow-50/40',
  },
};

export const COST_LABELS: Record<number, string> = {
  1: '€',
  2: '€€',
  3: '€€€',
  4: '€€€€',
  5: '€€€€€',
};