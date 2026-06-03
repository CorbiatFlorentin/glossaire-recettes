import { Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import prisma from '../lib/prisma';
import { uploadBuffer, deleteImage, isCloudinaryConfigured } from '../lib/cloudinary';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

async function saveImage(buffer: Buffer, publicId: string): Promise<{ path: string; filename: string; size: number }> {
  const webpBuffer = await sharp(buffer)
    .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  if (isCloudinaryConfigured()) {
    const result = await uploadBuffer(webpBuffer, publicId);
    return { path: result.secure_url, filename: result.public_id, size: result.bytes };
  }

  // Local disk fallback for development
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  await fs.mkdir(path.join(process.cwd(), uploadDir), { recursive: true });
  const filename = `${publicId}.webp`;
  const filePath = path.join(process.cwd(), uploadDir, filename);
  await fs.writeFile(filePath, webpBuffer);
  return { path: `/uploads/${filename}`, filename, size: webpBuffer.length };
}

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

  const publicId = `recipe-photos/${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { path: filePath, filename, size } = await saveImage(file.buffer, publicId);

  const isFirst = (await prisma.recipePhoto.count({ where: { recipeId } })) === 0;

  const photo = await prisma.recipePhoto.create({
    data: {
      recipeId,
      filename,
      path: filePath,
      mimeType: 'image/webp',
      size,
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

  if (isCloudinaryConfigured() && !photo.path.startsWith('/uploads')) {
    await deleteImage(photo.filename).catch(() => {});
  } else {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    await fs.unlink(path.join(process.cwd(), uploadDir, photo.filename)).catch(() => {});
  }

  await prisma.recipePhoto.delete({ where: { id: photoId } });

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
