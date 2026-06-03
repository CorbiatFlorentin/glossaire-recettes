import { Router, Request, Response, NextFunction } from 'express';
import {
  getWeekPlan,
  upsertEntry,
  upsertEntryValidation,
  deleteEntry,
  scrapeUrl,
} from '../controllers/mealplan.controller';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

const wrap =
  (fn: (req: AuthRequest, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req as AuthRequest, res).catch(next);

router.get('/week', wrap(getWeekPlan));
router.put('/:mealPlanId/entries', upsertEntryValidation, wrap(upsertEntry));
router.delete('/:mealPlanId/entries/:entryId', wrap(deleteEntry));
router.post('/scrape', wrap(scrapeUrl));

export default router;
