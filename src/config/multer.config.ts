import { diskStorage } from 'multer';

export const articleStorage = diskStorage({
  destination: './tmp',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${Date.now()}${file.originalname}`);
  },
});

export const avatarStorage = diskStorage({
  destination: './tmp',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${Date.now()}${file.originalname}`);
  },
});
