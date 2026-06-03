import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { scrapeRecipeFromUrl } from '../services/scraper.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { MealType } from '@prisma/client';

const VALID_MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

function normalizeWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export const getWeekPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const weekStartStr = req.query.weekStart as string;

  if (!weekStartStr || isNaN(Date.parse(weekStartStr))) {
    throw new AppError(400, 'weekStart requis (format ISO: YYYY-MM-DD)');
  }

  const weekStart = normalizeWeekStart(new Date(weekStartStr));

  const plan = await prisma.mealPlan.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: { userId, weekStart },
    update: {},
    include: {
      entries: {
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              photos: { where: { isMain: true }, select: { path: true }, take: 1 },
            },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
      },
    },
  });

  res.json(plan);
};

export const upsertEntryValidation = [
  body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('dayOfWeek doit être entre 0 (lundi) et 6 (dimanche)'),
  body('mealType').isIn(VALID_MEAL_TYPES).withMessage('mealType invalide'),
  body('recipeId').optional({ nullable: true }).isUUID(),
  body('externalTitle').optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  body('externalUrl').optional({ nullable: true }).isURL(),
  body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
];

export const upsertEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(400, errors.array()[0].msg as string);

  const { mealPlanId } = req.params;
  const userId = req.user!.userId;
  const { dayOfWeek, mealType, recipeId, externalTitle, externalUrl, notes } = req.body as {
    dayOfWeek: number;
    mealType: MealType;
    recipeId?: string | null;
    externalTitle?: string | null;
    externalUrl?: string | null;
    notes?: string | null;
  };

  const plan = await prisma.mealPlan.findFirst({ where: { id: mealPlanId, userId } });
  if (!plan) throw new AppError(404, 'Planning introuvable');

  if (recipeId) {
    const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
    if (!recipe) throw new AppError(404, 'Recette introuvable');
  }

  const entry = await prisma.mealPlanEntry.upsert({
    where: { mealPlanId_dayOfWeek_mealType: { mealPlanId, dayOfWeek, mealType } },
    create: { mealPlanId, dayOfWeek, mealType, recipeId, externalTitle, externalUrl, notes },
    update: { recipeId, externalTitle, externalUrl, notes },
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          photos: { where: { isMain: true }, select: { path: true }, take: 1 },
        },
      },
    },
  });

  res.json(entry);
};

export const deleteEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const { mealPlanId, entryId } = req.params;
  const userId = req.user!.userId;

  const plan = await prisma.mealPlan.findFirst({ where: { id: mealPlanId, userId } });
  if (!plan) throw new AppError(404, 'Planning introuvable');

  const entry = await prisma.mealPlanEntry.findFirst({ where: { id: entryId, mealPlanId } });
  if (!entry) throw new AppError(404, 'Entrée introuvable');

  await prisma.mealPlanEntry.delete({ where: { id: entryId } });
  res.status(204).send();
};

export const scrapeUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  const { url } = req.body as { url?: string };

  if (!url || !/^https?:\/\/.+/.test(url)) {
    throw new AppError(400, 'URL invalide');
  }

  try {
    const recipe = await scrapeRecipeFromUrl(url);
    res.json(recipe);
  } catch {
    throw new AppError(422, 'Impossible d\'extraire la recette depuis cette URL');
  }
};
