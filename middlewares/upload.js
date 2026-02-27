import multer from 'multer';
import mime from 'mime-types';
import path from 'path';
import fs from 'fs';
import { v4 as uuidV4 } from 'uuid';

const __dirname = import.meta.dirname;

const allowedMimeTypes = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

export const createStorage = (folderName) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', 'public', 'uploads', folderName);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = mime.extension(file.mimetype);
    cb(null, `${uuidV4()}-${Date.now()}.${ext}`);
  }
});

export default (folderName, limits = { fileSize: 2 * 1024 * 1024 }) =>
  multer({
    storage: createStorage(folderName),
    fileFilter,
    limits
  });
