import { Router, Request, Response, NextFunction } from 'express';
import { getMyHousehold, joinHousehold } from '../controllers/household.controller';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

const wrap =
  (fn: (req: AuthRequest, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req as AuthRequest, res).catch(next);

router.get('/', wrap(getMyHousehold));
router.post('/join', wrap(joinHousehold));

export default router;
