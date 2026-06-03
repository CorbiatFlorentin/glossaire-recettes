import { Router, Request, Response, NextFunction } from 'express';
import { shareRecipeByEmail, shareRecipeValidation } from '../controllers/share.controller';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

const wrap =
  (fn: (req: AuthRequest, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req as AuthRequest, res).catch(next);

router.post('/:id/share-email', shareRecipeValidation, wrap(shareRecipeByEmail));

export default router;
