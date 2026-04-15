import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Prisma errors (détectés par nom pour éviter l'import direct)
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ error: 'Cette valeur existe déjà' });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ error: 'Ressource introuvable' });
      return;
    }
  }

  res.status(500).json({ error: 'Erreur interne du serveur' });
};