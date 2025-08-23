import express from 'express';
import multer from 'multer';
import { authenticate } from '..//middleware/auth';
import { fileService } from '..//services/fileService';
import { AppError } from '..//utils/AppError';

const router = express.Router();

// 配置multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype.startsWith('application/pdf')) {
      cb(null, true);
    } else {
      cb(new AppError('不支持的文件类型', 400, 'INVALID_FILE_TYPE'));
    }
  }
});

// 上传单个文件
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('未上传文件', 400, 'NO_FILE_UPLOADED');
    }

    const { type = 'image', purpose = 'resource' } = req.body;
    
    const result = await fileService.uploadFile({
      file: req.file,
      type,
      purpose
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 上传多个文件
router.post('/upload-multiple', authenticate, upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new AppError('未上传文件', 400, 'NO_FILES_UPLOADED');
    }

    const { type = 'image', purpose = 'resource' } = req.body;
    
    const results = await fileService.uploadMultipleFiles(
      req.files as Express.Multer.File[],
      type,
      purpose
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// 删除文件
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      throw new AppError('缺少文件URL', 400, 'MISSING_FILE_URL');
    }

    await fileService.deleteFile(fileUrl);

    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// 上传用户头像
router.post('/avatar', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('未上传头像', 400, 'NO_FILE_UPLOADED');
    }

    const result = await fileService.uploadAvatar(req.file, req.user!.userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;