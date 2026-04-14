import { Router } from 'express';
import { uploadPhoto, deletePhoto, setMainPhoto } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/:recipeId/photos', upload.single('photo'), (req, res, next) =>
  uploadPhoto(req as Parameters<typeof uploadPhoto>[0], res).catch(next)
);
router.delete('/:recipeId/photos/:photoId', (req, res, next) =>
  deletePhoto(req, res).catch(next)
);
router.patch('/:recipeId/photos/:photoId/main', (req, res, next) =>
  setMainPhoto(req, res).catch(next)
);

export default router;