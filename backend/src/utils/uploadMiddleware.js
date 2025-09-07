import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // carpeta temporal
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".csv", ".xlsx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error("Formato no permitido"));
    cb(null, true);
  },
});
