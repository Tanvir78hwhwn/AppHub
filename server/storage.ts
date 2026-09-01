import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const APKS_DIR = path.join(UPLOADS_DIR, 'apks');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// Ensure upload directories exist
[UPLOADS_DIR, APKS_DIR, THUMBNAILS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Seed sample dummy APK files if they don't exist for test downloads
const sampleApks = [
  'sample-codeflow-v2.4.1.apk',
  'sample-netguard-v3.0.0.apk',
  'sample-focustrack-v1.8.apk',
  'sample-audiomaster-v4.2.apk'
];

sampleApks.forEach(filename => {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    // Generate a minimal valid binary zip header simulation for demo apk
    const dummyBuffer = Buffer.concat([
      Buffer.from('PK\x03\x04\x14\x00\x00\x00\x08\x00'), // Zip magic header
      Buffer.from(`AppHub Verified APK Package - ${filename}\nVersion: Release Build\nSigner: AppHub Developer Authority\nSecurity: SHA-256 Validated\n`),
      crypto.randomBytes(1024 * 64) // 64KB dummy payload
    ]);
    fs.writeFileSync(filePath, dummyBuffer);
  }
});

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'apkFile') {
      cb(null, APKS_DIR);
    } else {
      cb(null, THUMBNAILS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  }
});

// Multer upload middleware
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024 // 150MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'apkFile') {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.apk' || ext === '.zip' || ext === '.bin') {
        cb(null, true);
      } else {
        cb(new Error('Only .apk or .zip files are allowed for APK uploads.'));
      }
    } else if (file.fieldname === 'thumbnail') {
      const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (allowedImageMimes.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (PNG, JPG, WEBP, SVG, GIF) are allowed for thumbnails.'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Compute SHA256 checksum of a file
export function computeFileChecksum(filePath: string): string {
  try {
    if (!fs.existsSync(filePath)) return '';
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (err) {
    return '';
  }
}

// Format bytes into readable format
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
