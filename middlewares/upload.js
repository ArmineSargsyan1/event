// import multer from 'multer';
// import mime from 'mime-types';
// import path from 'path';
// import fs from 'fs';
// import { v4 as uuidV4 } from 'uuid';
//
// const __dirname = import.meta.dirname;
//
// const allowedMimeTypes = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
//
// const fileFilter = (req, file, cb) => {
//   if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
//   else cb(new Error('Only image files are allowed'), false);
// };
//
// export const createStorage = (folderName) => multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dest = path.join(__dirname, '..', 'public', 'uploads', folderName);
//     fs.mkdirSync(dest, { recursive: true });
//     cb(null, dest);
//   },
//   filename: (req, file, cb) => {
//     const ext = mime.extension(file.mimetype);
//     cb(null, `${uuidV4()}-${Date.now()}.${ext}`);
//   }
// });
//
// export default (folderName, limits = { fileSize: 2 * 1024 * 1024 }) =>
//   multer({
//     storage: createStorage(folderName),
//     fileFilter,
//     limits
//   });
//











// import { v2 as cloudinary } from 'cloudinary';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import multer from 'multer';
// import mime from 'mime-types';
// import { v4 as uuidV4 } from 'uuid';
//
// const { CLOUD_NAME, API_SECRET_MULTER, API_KEY } = process.env;
//
// cloudinary.config({
//   cloud_name: CLOUD_NAME,
//   api_key: API_KEY,
//   api_secret: API_SECRET_MULTER,
// });
//
// export default function createCloudinaryUpload(folder) {
//   const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//       folder: folder, // Օգտագործում ենք ֆունկցիայի argument-ը
//       allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
//       public_id: (req, file) => {
//         const ext = mime.extension(file.mimetype);
//         const name = `${uuidV4()}-${Date.now()}`;
//         return name; // Cloudinary-ն ինքնուրույն կավելացնի .jpg/.png
//       },
//     },
//   });
//
//   return multer({ storage });
// }



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
    params: {
      folder,

      allowed_formats: ["jpg", "jpeg", "png", "webp"],

      public_id: () => {
        return `${folder}_${Date.now()}_${uuidV4()}`;
      },

      transformation: [
        {
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    },
  });

  return multer({ storage });
}

export { cloudinary };




// import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import multer from "multer";
// import { v4 as uuidV4 } from "uuid";
//
// const {
//   CLOUDINARY_CLOUD_NAME,
//   CLOUDINARY_API_SECRET,
//   CLOUDINARY_API_KEY,
// } = process.env;
//
// cloudinary.config({
//   cloud_name: CLOUDINARY_CLOUD_NAME,
//   api_key: CLOUDINARY_API_KEY,
//   api_secret: CLOUDINARY_API_SECRET,
// });
//
// const fileFilter = (req, file, cb) => {
//   const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
//
//   if (allowed.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Միայն image ֆայլեր են թույլատրված"), false);
//   }
// };
//
// export default function createCloudinaryUpload(folder) {
//   const storage = new CloudinaryStorage({
//     cloudinary,
//     params: {
//       folder,
//       allowed_formats: ["jpg", "jpeg", "png", "webp"],
//       public_id: () => `${uuidV4()}-${Date.now()}`,
//     },
//   });
//
//   return multer({
//     storage,
//     fileFilter,
//   });
// }
