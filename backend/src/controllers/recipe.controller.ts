import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { Season, CourseCategory, SortField } from '../types';

const VALID_SEASONS: Season[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
const VALID_CATEGORIES: CourseCategory[] = ['STARTER', 'MAIN', 'DESSERT'];

type RecipeWithIngredients = {
  id: string;
  ingredients: { cost: number | null; order: number }[];
  [key: string]: unknown;
};

async function getHouseholdFilter(userId: string): Promise<Record<string, unknown>> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { householdId: true } });
  return user?.householdId ? { householdId: user.householdId } : { userId };
}

export const getRecipes = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const query = req.query as Record<string, string>;

  const search = query.search;
  const season = query.season as Season | undefined;
  const category = query.category as CourseCategory | undefined;
  const favorite = query.favorite;
  const ingredient = query.ingredient;
  const sortBy = (query.sortBy as SortField | 'totalCost') || 'createdAt';
  const sortOrder: 'asc' | 'desc' = (query.sortOrder as 'asc' | 'desc') || 'desc';
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = await getHouseholdFilter(userId);

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (season && VALID_SEASONS.includes(season)) where.season = { has: season };
  if (category && VALID_CATEGORIES.includes(category)) where.category = category;
  if (favorite === 'true' || favorite === 'false') where.favorite = favorite === 'true';
  if (ingredient) where.ingredients = { some: { name: { contains: ingredient, mode: 'insensitive' } } };

  if (sortBy === 'totalCost') {
    const [all, total] = await Promise.all([
      prisma.recipe.findMany({ where, include: { ingredients: { orderBy: { order: 'asc' } }, photos: { orderBy: { isMain: 'desc' } } } }),
      prisma.recipe.count({ where }),
    ]);
    const withCost = (all as RecipeWithIngredients[]).map((r) => ({
      ...r,
      totalCost: r.ingredients.reduce((sum: number, i: { cost: number | null }) => sum + (i.cost ?? 0), 0),
    }));
    withCost.sort((a, b) => sortOrder === 'asc' ? a.totalCost - b.totalCost : b.totalCost - a.totalCost);
    res.json({ data: withCost.slice(skip, skip + limit), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    return;
  }

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      include: { ingredients: { orderBy: { order: 'asc' } }, photos: { orderBy: { isMain: 'desc' } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.recipe.count({ where }),
  ]);

  res.json({ data: recipes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
};

export const getRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const filter = await getHouseholdFilter(userId);

  const recipe = await prisma.recipe.findFirst({
    where: { id, ...filter },
    include: { ingredients: { orderBy: { order: 'asc' } }, photos: { orderBy: { isMain: 'desc' } } },
  });

  if (!recipe) throw new AppError(404, 'Recette introuvable');
  res.json(recipe);
};

export const createRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { householdId: true } });
  const { ingredients, ...recipeData } = req.body;

  const recipe = await prisma.recipe.create({
    data: {
      ...recipeData,
      userId,
      householdId: user?.householdId ?? null,
      ingredients: ingredients
        ? { create: ingredients.map((ing: Record<string, unknown>, i: number) => ({ ...ing, order: i })) }
        : undefined,
    },
    include: { ingredients: { orderBy: { order: 'asc' } }, photos: true },
  });

  res.status(201).json(recipe);
};

export const updateRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const filter = await getHouseholdFilter(userId);
  const { ingredients, ...recipeData } = req.body;

  const existing = await prisma.recipe.findFirst({ where: { id, ...filter } });
  if (!existing) throw new AppError(404, 'Recette introuvable');

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...recipeData,
      ingredients: ingredients
        ? { deleteMany: {}, create: ingredients.map((ing: Record<string, unknown>, i: number) => ({ ...ing, order: i })) }
        : undefined,
    },
    include: { ingredients: { orderBy: { order: 'asc' } }, photos: true },
  });

  res.json(recipe);
};

export const deleteRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const filter = await getHouseholdFilter(userId);

  const existing = await prisma.recipe.findFirst({ where: { id, ...filter } });
  if (!existing) throw new AppError(404, 'Recette introuvable');

  await prisma.recipe.delete({ where: { id } });
  res.status(204).send();
};

export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const filter = await getHouseholdFilter(userId);

  const recipe = await prisma.recipe.findFirst({ where: { id, ...filter } });
  if (!recipe) throw new AppError(404, 'Recette introuvable');

  const updated = await prisma.recipe.update({
    where: { id },
    data: { favorite: !recipe.favorite },
    select: { id: true, favorite: true },
  });

  res.json(updated);
};
