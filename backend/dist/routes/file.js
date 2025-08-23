"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("..//middleware/auth");
const fileService_1 = require("..//services/fileService");
const AppError_1 = require("..//utils/AppError");
const router = express_1.default.Router();
// 配置multer
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/') ||
            file.mimetype.startsWith('application/pdf')) {
            cb(null, true);
        }
        else {
            cb(new AppError_1.AppError('不支持的文件类型', 400, 'INVALID_FILE_TYPE'));
        }
    }
});
// 上传单个文件
router.post('/upload', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError_1.AppError('未上传文件', 400, 'NO_FILE_UPLOADED');
        }
        const { type = 'image', purpose = 'resource' } = req.body;
        const result = await fileService_1.fileService.uploadFile({
            file: req.file,
            type,
            purpose
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
// 上传多个文件
router.post('/upload-multiple', auth_1.authenticate, upload.array('files', 10), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            throw new AppError_1.AppError('未上传文件', 400, 'NO_FILES_UPLOADED');
        }
        const { type = 'image', purpose = 'resource' } = req.body;
        const results = await fileService_1.fileService.uploadMultipleFiles(req.files, type, purpose);
        res.json({
            success: true,
            data: results
        });
    }
    catch (error) {
        next(error);
    }
});
// 删除文件
router.delete('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { fileUrl } = req.body;
        if (!fileUrl) {
            throw new AppError_1.AppError('缺少文件URL', 400, 'MISSING_FILE_URL');
        }
        await fileService_1.fileService.deleteFile(fileUrl);
        res.json({
            success: true,
            message: '文件删除成功'
        });
    }
    catch (error) {
        next(error);
    }
});
// 上传用户头像
router.post('/avatar', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError_1.AppError('未上传头像', 400, 'NO_FILE_UPLOADED');
        }
        const result = await fileService_1.fileService.uploadAvatar(req.file, req.user.userId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=file.js.map