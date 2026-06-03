import multer from 'multer';

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.'));
  }
};

const maxSize = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

// Always use memory storage — Sharp processes the buffer, then we route to Cloudinary or disk
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: maxSize },
});
