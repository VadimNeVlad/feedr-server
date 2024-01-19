import { diskStorage } from 'multer';

export const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${Date.now()}${file.originalname}`);
  },
});
