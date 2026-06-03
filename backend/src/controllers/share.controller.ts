import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { sendRecipeEmail } from '../services/email.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export const shareRecipeValidation = [
  body('to').isEmail().withMessage('Adresse email invalide'),
  body('message').optional().isString().trim().isLength({ max: 500 }),
];

export const shareRecipeByEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(400, errors.array()[0].msg as string);

  const { id } = req.params;
  const userId = req.user!.userId;
  const { to, message } = req.body as { to: string; message?: string };

  const [recipe, user] = await Promise.all([
    prisma.recipe.findFirst({
      where: { id, userId },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
        photos: { where: { isMain: true }, take: 1 },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
  ]);

  if (!recipe) throw new AppError(404, 'Recette introuvable');
  if (!user) throw new AppError(404, 'Utilisateur introuvable');

  await sendRecipeEmail({
    to,
    fromName: user.name,
    fromEmail: user.email,
    personalMessage: message,
    recipe: {
      title: recipe.title,
      description: recipe.description ?? undefined,
      prepTime: recipe.prepTime ?? undefined,
      cookTime: recipe.cookTime ?? undefined,
      servings: recipe.servings ?? undefined,
      season: recipe.season,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity ?? undefined,
          unit: i.unit ?? undefined,
        })),
      photoUrl: recipe.photos[0]?.path,
    },
  });

  res.json({ success: true });
};
