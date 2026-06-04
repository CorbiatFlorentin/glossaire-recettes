import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export const getMyHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      household: {
        include: { users: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!user?.household) throw new AppError(404, 'Aucun foyer associé à ce compte');

  res.json({
    id: user.household.id,
    inviteCode: user.household.inviteCode,
    members: user.household.users,
  });
};

export const joinHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { inviteCode } = req.body as { inviteCode?: string };

  if (!inviteCode?.trim()) throw new AppError(400, 'Code d\'invitation requis');

  const household = await prisma.household.findUnique({ where: { inviteCode: inviteCode.trim() } });
  if (!household) throw new AppError(404, 'Code d\'invitation invalide');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.householdId === household.id) throw new AppError(400, 'Vous êtes déjà dans ce foyer');

  // Rattacher les recettes existantes de l'user au foyer
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { householdId: household.id } }),
    prisma.recipe.updateMany({ where: { userId, householdId: null }, data: { householdId: household.id } }),
    prisma.mealPlan.updateMany({ where: { userId, householdId: null }, data: { householdId: household.id } }),
  ]);

  res.json({ message: 'Foyer rejoint avec succès', householdId: household.id });
};
