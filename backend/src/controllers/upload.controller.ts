import { Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export const uploadPhoto = async (
  req: AuthRequest & { file?: Express.Multer.File },
  res: Response
): Promise<void> => {
  const { recipeId } = req.params;
  const userId = req.user!.userId;
  const file = req.file;

  if (!file) throw new AppError(400, 'Aucun fichier fourni');

  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
  if (!recipe) throw new AppError(404, 'Recette introuvable');

  // Optimize image with sharp
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const optimizedFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const optimizedPath = path.join(process.cwd(), uploadDir, optimizedFilename);

  await sharp(file.path)
    .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(optimizedPath);

  // Remove original upload
  await fs.unlink(file.path).catch(() => {});

  const isFirst = (await prisma.recipePhoto.count({ where: { recipeId } })) === 0;

  const photo = await prisma.recipePhoto.create({
    data: {
      recipeId,
      filename: optimizedFilename,
      path: `/uploads/${optimizedFilename}`,
      mimeType: 'image/webp',
      size: (await fs.stat(optimizedPath)).size,
      isMain: isFirst,
    },
  });

  res.status(201).json(photo);
};

export const deletePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  const { recipeId, photoId } = req.params;
  const userId = req.user!.userId;

  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
  if (!recipe) throw new AppError(404, 'Recette introuvable');

  const photo = await prisma.recipePhoto.findFirst({ where: { id: photoId, recipeId } });
  if (!photo) throw new AppError(404, 'Photo introuvable');

  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  await fs.unlink(path.join(process.cwd(), uploadDir, photo.filename)).catch(() => {});
  await prisma.recipePhoto.delete({ where: { id: photoId } });

  // If deleted photo was main, set next as main
  if (photo.isMain) {
    const next = await prisma.recipePhoto.findFirst({ where: { recipeId } });
    if (next) await prisma.recipePhoto.update({ where: { id: next.id }, data: { isMain: true } });
  }

  res.status(204).send();
};

export const setMainPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  const { recipeId, photoId } = req.params;
  const userId = req.user!.userId;

  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
  if (!recipe) throw new AppError(404, 'Recette introuvable');

  await prisma.recipePhoto.updateMany({ where: { recipeId }, data: { isMain: false } });
  await prisma.recipePhoto.update({ where: { id: photoId }, data: { isMain: true } });

  res.json({ success: true });
};