"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileUrl = exports.uploadConfig = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
// 阿里云OSS配置
const s3Client = new client_s3_1.S3Client({
    region: process.env.OSS_REGION || 'oss-cn-hangzhou',
    endpoint: process.env.OSS_ENDPOINT || 'https://oss-cn-hangzhou.aliyuncs.com',
    credentials: {
        accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || '',
    },
});
// 存储配置
const storage = process.env.NODE_ENV === 'production'
    ? (0, multer_s3_1.default)({
        s3: s3Client,
        bucket: process.env.OSS_BUCKET || 'your-bucket-name',
        acl: 'public-read',
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const uniqueSuffix = (0, uuid_1.v4)();
            const ext = path_1.default.extname(file.originalname);
            const key = `resources/${req.user?.userId || 'anonymous'}/${uniqueSuffix}${ext}`;
            cb(null, key);
        },
    })
    : multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = (0, uuid_1.v4)();
            const ext = path_1.default.extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
        },
    });
// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('只允许上传图片文件 (JPEG, JPG, PNG, WebP)'));
    }
};
// 导出配置
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});
// 上传配置
exports.uploadConfig = {
    maxFiles: 10,
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};
// 获取文件URL
const getFileUrl = (key) => {
    if (process.env.NODE_ENV === 'production') {
        return `https://${process.env.OSS_BUCKET}.oss-${process.env.OSS_REGION}.aliyuncs.com/${key}`;
    }
    return `/uploads/${key}`;
};
exports.getFileUrl = getFileUrl;
//# sourceMappingURL=upload.js.map