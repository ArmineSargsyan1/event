import path from 'path';
import fs from 'fs';

export default class FileHelper {

  static getFilePath(file) {
    if (!file) return null;
    return path.normalize(file.path).replace(/\\/g, '/');
  }

  static deleteFile(filePath) {
    if (!filePath) return;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
