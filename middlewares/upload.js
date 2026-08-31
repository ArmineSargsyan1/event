import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { v4 as uuidV4 } from "uuid";

const { CLOUD_NAME, API_SECRET_MULTER, API_KEY } = process.env;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET_MULTER,
});

export default function createCloudinaryUpload(folder) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isVideo = file.mimetype.startsWith("video");

      return {
        folder: folder,
        resource_type: "auto",

        allowed_formats: isVideo ? ["mp4", "mov", "avi", "mkv"] : ["jpg", "jpeg", "png", "webp"],

        public_id: `${folder}_${Date.now()}_${uuidV4()}`,

        transformation: isVideo ? [] : [
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      };
    },
  });

  return multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }
  });
}

export { cloudinary };

