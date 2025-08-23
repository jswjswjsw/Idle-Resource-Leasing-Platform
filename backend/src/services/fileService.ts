import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '..//utils/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database'; // 统一Prisma实例

// OSS配置
const s3Client = new S3Client({
  region: process.env.OSS_REGION || 'cn-hangzhou',
  credentials: {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OSS_ACCESS_KEY_SECRET!,
  },
  endpoint: process.env.OSS_ENDPOINT || 'https://oss-cn-hangzhou.aliyuncs.com',
});

const bucketName = process.env.OSS_BUCKET_NAME || 'idle-resource-rental';

export const fileService = {
  // 上传文件
  async uploadFile(data: {
    file: Express.Multer.File;
    type: 'image' | 'video' | 'document';
    purpose: 'resource' | 'user' | 'review';
  }) {
    const { file, type, purpose } = data;

    if (!file) {
      throw new AppError('文件不能为空', 400, 'FILE_REQUIRED');
    }

    // 验证文件类型和大小
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for others
    if (file.size > maxSize) {
      throw new AppError(`文件大小超过限制: ${maxSize / 1024 / 1024}MB`, 400, 'FILE_TOO_LARGE');
    }

    // 生成唯一文件名
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${purpose}/${type}/${uuidv4()}.${fileExtension}`;

    try {
      // 上传文件到OSS
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await s3Client.send(command);

      // 生成访问URL
      const url = `https://${bucketName}.oss-cn-hangzhou.aliyuncs.com/${fileName}`;

      return {
        url,
        fileName,
        originalName: file.originalname,
        size: file.size,
        type: file.mimetype,
      };
    } catch (error) {
      throw new AppError('文件上传失败', 500, 'UPLOAD_FAILED');
    }
  },

  // 上传多个文件
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    type: 'image' | 'video' | 'document',
    purpose: 'resource' | 'user' | 'review'
  ) {
    const results = await Promise.all(
      files.map(file => this.uploadFile({ file, type, purpose }))
    );

    return results;
  },

  // 删除文件
  async deleteFile(fileUrl: string) {
    try {
      // 从URL中提取文件名
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // 去掉开头的/

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(command);

      return { success: true };
    } catch (error) {
      throw new AppError('文件删除失败', 500, 'DELETE_FAILED');
    }
  },

  // 上传用户头像
  async uploadAvatar(file: Express.Multer.File, userId: string) {
    const result = await this.uploadFile({
      file,
      type: 'image',
      purpose: 'user'
    });

    // 更新用户头像
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: result.url }
    });

    return result;
  },

  // 生成临时上传URL
  async generateUploadUrl(params: {
    fileName: string;
    fileType: string;
    purpose: string;
  }) {
    const { fileName, fileType, purpose } = params;

    // 生成唯一文件名
    const extension = fileName.split('.').pop();
    const key = `${purpose}/${uuidv4()}.${extension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
        ACL: 'public-read',
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return {
        uploadUrl,
        fileUrl: `https://${bucketName}.oss-cn-hangzhou.aliyuncs.com/${key}`,
        fileName: key,
      };
    } catch (error) {
      throw new AppError('生成上传URL失败', 500, 'GENERATE_URL_FAILED');
    }
  },

  // 验证文件类型
  validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    const typeMap: { [key: string]: string[] } = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      video: ['video/mp4', 'video/avi', 'video/mov'],
      document: ['application/pdf', 'text/plain', 'application/msword'],
    };

    return allowedTypes.some(type => typeMap[type]?.includes(mimetype));
  },

  // 获取文件信息
  async getFileInfo(fileUrl: string) {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      // 从URL解析文件信息
      const parts = key.split('/');
      const fileName = parts[parts.length - 1];
      const [purpose, type] = parts;

      return {
        fileName,
        purpose,
        type,
        url: fileUrl,
      };
    } catch (error) {
      throw new AppError('获取文件信息失败', 400, 'INVALID_URL');
    }
  },

  // 批量删除文件
  async deleteMultipleFiles(fileUrls: string[]) {
    const results = await Promise.allSettled(
      fileUrls.map(url => this.deleteFile(url))
    );

    const successes = results.filter(result => result.status === 'fulfilled');
    const failures = results.filter(result => result.status === 'rejected');

    return {
      success: failures.length === 0,
      deletedCount: successes.length,
      failedCount: failures.length,
      results,
    };
  },

  // 压缩图片（使用第三方服务）
  async compressImage(imageUrl: string, options: { width?: number; height?: number; quality?: number } = {}) {
    const { width = 800, height = 600, quality = 80 } = options;

    // 使用OSS的图片处理功能
    const compressedUrl = `${imageUrl}?x-oss-process=image/resize,m_lfit,w_${width},h_${height}/quality,q_${quality}`;

    return {
      original: imageUrl,
      compressed: compressedUrl,
    };
  },

  // 获取临时访问URL
  async getTemporaryUrl(fileUrl: string, expiresIn = 3600) {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      throw new AppError('获取临时访问URL失败', 500, 'GET_URL_FAILED');
    }
  },
};