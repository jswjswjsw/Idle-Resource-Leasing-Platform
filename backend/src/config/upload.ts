import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 阿里云OSS配置
const s3Client = new S3Client({
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  endpoint: process.env.OSS_ENDPOINT || 'https://oss-cn-hangzhou.aliyuncs.com',
  credentials: {
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || '',
  },
});

// 存储配置
const storage = process.env.NODE_ENV === 'production' 
  ? multerS3({
      s3: s3Client,
      bucket: process.env.OSS_BUCKET || 'your-bucket-name',
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = path.extname(file.originalname);
        const key = `resources/${req.user?.userId || 'anonymous'}/${uniqueSuffix}${ext}`;
        cb(null, key);
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    });

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (JPEG, JPG, PNG, WebP)'));
  }
};

// 导出配置
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// 上传配置
export const uploadConfig = {
  maxFiles: 10,
  maxFileSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

// 获取文件URL
export const getFileUrl = (key: string): string => {
  if (process.env.NODE_ENV === 'production') {
    return `https://${process.env.OSS_BUCKET}.oss-${process.env.OSS_REGION}.aliyuncs.com/${key}`;
  }
  return `/uploads/${key}`;
};