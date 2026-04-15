import { Router, Request, Response, NextFunction } from 'express';
import {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
} from '../controllers/recipe.controller';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

const wrap =
  (fn: (req: AuthRequest, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req as AuthRequest, res).catch(next);

router.get('/', wrap(getRecipes));
router.get('/:id', wrap(getRecipe));
router.post('/', wrap(createRecipe));
router.put('/:id', wrap(updateRecipe));
router.delete('/:id', wrap(deleteRecipe));
router.patch('/:id/favorite', wrap(toggleFavorite));

export default router;