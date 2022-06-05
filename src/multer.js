import multer from "multer";
import fs from "fs";
import path from "path";

const MIME_TYPES = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/tiff",
  "image/bmp",
  "image/webp",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg+xml",
  "tiff",
  "bmp",
  "webp",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg+xml",
  ".tiff",
  ".bmp",
  ".webp",
];
const ROOT_DIR = "uploads";

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const folder = new Date().getFullYear() + "-" + new Date().getMonth();
    const saveIn = path.join(ROOT_DIR, folder);

    // If folder not exist create one - this method does not throw error
    const exists = await checkFileExists(saveIn);

    if (!exists) {
      await fs.promises.mkdir(saveIn, { mode: "0755", recursive: true });
    }

    cb(null, saveIn);
  },
  filename: async (req, file, cb) => {
    const folder = new Date().getFullYear() + "-" + new Date().getMonth();

    // Clean up name from unwanted characters
    const fileInfo = path.parse(file.originalname);
    const name = fileInfo.name.replace(/[^a-z0-9]+/gi, "-");

    // Extension
    const extention = fileInfo.ext || `.${file.mimetype.split("/")[1]}`;
    const fileWithExt = name + extention;

    // Final folder + filename
    const saveIn = path.join(ROOT_DIR, folder, fileWithExt);

    // Check if exists - this method does not throw error
    const exists = await checkFileExists(saveIn);

    if (exists) {
      // Add date signature to prevent repeated file name
      cb(null, `${Date.now()}_${fileWithExt}`);
    } else {
      cb(null, fileWithExt);
    }
  },
});
const fileFilter = (req, file, cb) => {
  if (MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

/**
 * Helper method to check if file/folder name already exists
 * Prevent overrides/duplicates
 * @returns boolean. True if file name exists
 */
const checkFileExists = async (filepath) => {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.constants.F_OK, (error) => {
      resolve(!error);
    });
  });
};

export default multer({
  storage,
  fileFilter,
  // limits: { fileSize: 100},
});
