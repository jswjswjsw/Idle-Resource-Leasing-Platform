"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingle = exports.uploadFiles = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const errorHandler_1 = require("..//utils/errorHandler");
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/avi',
        'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError('不支持的文件类型', 400, 'INVALID_FILE_TYPE'), false);
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10
    }
});
exports.uploadFiles = exports.upload.array('files', 10);
exports.uploadSingle = exports.upload.single('file');
//# sourceMappingURL=upload.js.map