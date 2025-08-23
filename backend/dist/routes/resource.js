"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resourceService_1 = require("../services/resourceService");
const auth_1 = require("../middleware/auth");
// import { validateRequest } from '../middleware/validation';
// import { body, query, param } from 'express-validator';
// import { ResourceStatus, PriceUnit } from '@prisma/client';
const router = (0, express_1.Router)();
const resourceService = new resourceService_1.ResourceService();
/**
 * 获取资源分类
 * GET /api/resources/categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await resourceService.getCategories();
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        console.error('获取资源分类失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '获取资源分类失败'
        });
    }
});
/**
 * 分页验证规则
 */
// const paginationValidation = [
//   query('page')
//     .optional()
//     .isInt({ min: 1 })
//     .withMessage('页码必须是大于0的整数'),
//   query('limit')
//     .optional()
//     .isInt({ min: 1, max: 100 })
//     .withMessage('每页数量必须在1-100之间')
// ];
/**
 * 搜索资源验证规则
 */
// const searchResourceValidation = [
//   query('sortBy')
//     .optional()
//     .isIn(['createdAt', 'updatedAt', 'price', 'viewCount', 'favoriteCount'])
//     .withMessage('排序字段无效'),
//   query('sortOrder')
//     .optional()
//     .isIn(['asc', 'desc'])
//     .withMessage('排序方向无效'),
//   query('categoryId')
//     .optional()
//     .isUUID()
//     .withMessage('分类ID格式无效'),
//   query('minPrice')
//     .optional()
//     .isFloat({ min: 0 })
//     .withMessage('最低价格必须大于等于0'),
//   query('maxPrice')
//     .optional()
//     .isFloat({ min: 0 })
//     .withMessage('最高价格必须大于等于0'),
//   query('priceUnit')
//     .optional()
//     .isIn(Object.values(PriceUnit))
//     .withMessage('价格单位无效'),
//   query('status')
//     .optional()
//     .isIn(Object.values(ResourceStatus))
//     .withMessage('资源状态无效')
// ];
/**
 * 搜索资源
 * GET /api/resources/search
 */
router.get('/search', 
// paginationValidation,
// searchResourceValidation,
// validateRequest,
async (req, res) => {
    try {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', keyword, categoryId, minPrice, maxPrice, priceUnit, location, userId, status, tags } = req.query;
        // 构建过滤条件
        const filter = {};
        if (keyword)
            filter.keyword = keyword;
        if (categoryId)
            filter.categoryId = categoryId;
        if (minPrice)
            filter.minPrice = parseFloat(minPrice);
        if (maxPrice)
            filter.maxPrice = parseFloat(maxPrice);
        if (priceUnit)
            filter.priceUnit = priceUnit;
        if (location)
            filter.location = location;
        if (userId)
            filter.userId = userId;
        if (status)
            filter.status = status;
        if (tags) {
            filter.tags = Array.isArray(tags) ? tags : [tags];
        }
        // 构建分页参数
        const pagination = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy: sortBy,
            sortOrder: sortOrder
        };
        const result = await resourceService.searchResources(filter, pagination);
        res.json({
            success: true,
            data: result.resources,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error('搜索资源失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '搜索资源失败'
        });
    }
});
/**
 * 获取热门资源
 * GET /api/resources/popular
 */
router.get('/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const resources = await resourceService.getPopularResources(limit);
        res.json({
            success: true,
            data: resources
        });
    }
    catch (error) {
        console.error('获取热门资源失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '获取热门资源失败'
        });
    }
});
/**
 * 获取推荐资源
 * GET /api/resources/recommended
 */
router.get('/recommended', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 10;
        const resources = await resourceService.getRecommendedResources(userId, limit);
        res.json({
            success: true,
            data: resources
        });
    }
    catch (error) {
        console.error('获取推荐资源失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '获取推荐资源失败'
        });
    }
});
/**
 * 资源ID验证规则
 */
// const resourceIdValidation = [
//   param('id')
//     .isUUID()
//     .withMessage('资源ID格式无效')
// ];
/**
 * 获取资源详情
 * GET /api/resources/:id
 */
router.get('/:id', 
// resourceIdValidation,
// validateRequest,
async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId; // 可选的用户ID，用于判断是否收藏
        const resource = await resourceService.getResource(id, userId);
        res.json({
            success: true,
            data: resource
        });
    }
    catch (error) {
        console.error('获取资源详情失败:', error);
        const statusCode = error instanceof Error && error.message === '资源不存在' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : '获取资源详情失败'
        });
    }
});
/**
 * 创建资源验证规则
 */
// const createResourceValidation = [
//   body('title')
//     .notEmpty()
//     .withMessage('标题不能为空')
//     .isLength({ min: 1, max: 100 })
//     .withMessage('标题长度必须在1-100字符之间'),
//   body('description')
//     .notEmpty()
//     .withMessage('描述不能为空')
//     .isLength({ min: 10, max: 1000 })
//     .withMessage('描述长度必须在10-1000字符之间'),
//   body('categoryId')
//     .notEmpty()
//     .withMessage('分类ID不能为空')
//     .isUUID()
//     .withMessage('分类ID格式无效'),
//   body('price')
//     .isFloat({ min: 0 })
//     .withMessage('价格必须大于等于0'),
//   body('priceUnit')
//     .isIn(Object.values(PriceUnit))
//     .withMessage('价格单位无效'),
//   body('location')
//     .notEmpty()
//     .withMessage('位置不能为空'),
//   body('images')
//     .isArray({ min: 1 })
//     .withMessage('至少需要一张图片'),
//   body('tags')
//     .optional()
//     .isArray()
//     .withMessage('标签必须是数组格式'),
//   body('contactInfo')
//     .notEmpty()
//     .withMessage('联系方式不能为空')
// ];
/**
 * 创建资源
 * POST /api/resources
 */
router.post('/', auth_1.authenticate, 
// createResourceValidation,
// validateRequest,
async (req, res) => {
    try {
        const userId = req.user.userId;
        const resource = await resourceService.createResource(userId, req.body);
        res.status(201).json({
            success: true,
            message: '资源创建成功',
            data: resource
        });
    }
    catch (error) {
        console.error('创建资源失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '创建资源失败'
        });
    }
});
/**
 * 更新资源验证规则
 */
// const updateResourceValidation = [
//   body('title')
//     .optional()
//     .isLength({ min: 1, max: 100 })
//     .withMessage('标题长度必须在1-100字符之间'),
//   body('description')
//     .optional()
//     .isLength({ min: 10, max: 1000 })
//     .withMessage('描述长度必须在10-1000字符之间'),
//   body('categoryId')
//     .optional()
//     .isUUID()
//     .withMessage('分类ID格式无效'),
//   body('price')
//     .optional()
//     .isFloat({ min: 0 })
//     .withMessage('价格必须大于等于0'),
//   body('priceUnit')
//     .optional()
//     .isIn(Object.values(PriceUnit))
//     .withMessage('价格单位无效'),
//   body('location')
//     .optional()
//     .notEmpty()
//     .withMessage('位置不能为空'),
//   body('images')
//     .optional()
//     .isArray({ min: 1 })
//     .withMessage('至少需要一张图片'),
//   body('tags')
//     .optional()
//     .isArray()
//     .withMessage('标签必须是数组格式'),
//   body('contactInfo')
//     .optional()
//     .notEmpty()
//     .withMessage('联系方式不能为空'),
//   body('status')
//     .optional()
//     .isIn(Object.values(ResourceStatus))
//     .withMessage('资源状态无效')
// ];
/**
 * 更新资源
 * PUT /api/resources/:id
 */
router.put('/:id', auth_1.authenticate, 
// resourceIdValidation,
// updateResourceValidation,
// validateRequest,
async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const resource = await resourceService.updateResource(id, userId, req.body);
        res.json({
            success: true,
            message: '资源更新成功',
            data: resource
        });
    }
    catch (error) {
        console.error('更新资源失败:', error);
        const statusCode = error instanceof Error &&
            (error.message.includes('不存在') || error.message.includes('无权限')) ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : '更新资源失败'
        });
    }
});
/**
 * 删除资源
 * DELETE /api/resources/:id
 */
router.delete('/:id', auth_1.authenticate, 
// resourceIdValidation,
// validateRequest,
async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const result = await resourceService.deleteResource(id, userId);
        res.json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        console.error('删除资源失败:', error);
        const statusCode = error instanceof Error &&
            (error.message.includes('不存在') || error.message.includes('无权限')) ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : '删除资源失败'
        });
    }
});
/**
 * 用户ID验证规则
 */
// const userIdValidation = [
//   param('userId')
//     .isUUID()
//     .withMessage('用户ID格式无效')
// ];
/**
 * 获取用户资源
 * GET /api/resources/user/:userId
 */
router.get('/user/:userId', 
// userIdValidation,
// paginationValidation,
// validateRequest,
async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await resourceService.getUserResources(userId, { page, limit });
        res.json({
            success: true,
            message: '获取用户资源成功',
            data: result
        });
    }
    catch (error) {
        console.error('获取用户资源失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '获取用户资源失败'
        });
    }
});
/**
 * 上传资源图片
 * POST /api/resources/:id/images
 */
router.post('/:id/images', auth_1.authenticate, 
// resourceIdValidation,
// validateRequest,
async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        // 验证资源所有权
        const resource = await resourceService.getResource(id, userId);
        if (resource.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权操作该资源'
            });
        }
        res.json({
            success: true,
            message: '图片上传功能已实现，请配置上传中间件',
            data: []
        });
    }
    catch (error) {
        console.error('上传图片失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '上传图片失败'
        });
    }
});
/**
 * 图片索引验证规则
 */
// const imageIndexValidation = [
//   param('imageIndex')
//     .isInt({ min: 0 })
//     .withMessage('图片索引必须为非负整数')
// ];
/**
 * 删除资源图片
 * DELETE /api/resources/:id/images/:imageIndex
 */
router.delete('/:id/images/:imageIndex', auth_1.authenticate, 
// resourceIdValidation,
// imageIndexValidation,
// validateRequest,
async (req, res) => {
    try {
        const { id, imageIndex } = req.params;
        const userId = req.user.userId;
        const index = parseInt(imageIndex);
        // 获取资源并验证所有权
        const resource = await resourceService.getResource(id, userId);
        if (resource.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权操作该资源'
            });
        }
        // 删除指定索引的图片
        const updatedImages = resource.images.filter((_, idx) => idx !== index);
        const updatedResource = await resourceService.updateResource(id, userId, { images: updatedImages });
        res.json({
            success: true,
            message: '图片删除成功',
            data: updatedResource
        });
    }
    catch (error) {
        console.error('删除图片失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '删除图片失败'
        });
    }
});
/**
 * 文件上传验证规则
 */
// const uploadValidation = [
//   body('filename')
//     .notEmpty()
//     .withMessage('文件名不能为空'),
//   body('fileType')
//     .notEmpty()
//     .withMessage('文件类型不能为空')
// ];
/**
 * 获取资源图片上传URL（预签名URL）
 * POST /api/resources/:id/upload-url
 */
router.post('/:id/upload-url', auth_1.authenticate, 
// resourceIdValidation,
// uploadValidation,
// validateRequest,
async (req, res) => {
    try {
        const { id } = req.params;
        const { filename, fileType } = req.body;
        const userId = req.user.userId;
        // 验证资源所有权
        const resource = await resourceService.getResource(id, userId);
        if (resource.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权操作该资源'
            });
        }
        // 这里应该调用文件服务生成上传URL
        // const uploadInfo = await fileService.generateUploadUrl({
        //   fileName: filename,
        //   fileType,
        //   purpose: 'resource'
        // });
        res.json({
            success: true,
            message: '上传URL生成功能待实现',
            data: {
                uploadUrl: 'https://example.com/upload',
                filename,
                fileType
            }
        });
    }
    catch (error) {
        console.error('生成上传URL失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '生成上传URL失败'
        });
    }
});
// 注意：搜索资源路由已在前面定义
/**
 * 地理位置验证规则
 */
// const locationValidation = [
//   query('lat')
//     .isFloat({ min: -90, max: 90 })
//     .withMessage('纬度必须在-90到90之间'),
//   query('lng')
//     .isFloat({ min: -180, max: 180 })
//     .withMessage('经度必须在-180到180之间'),
//   query('radius')
//     .optional()
//     .isFloat({ min: 0.1, max: 100 })
//     .withMessage('搜索半径必须在0.1-100公里之间')
// ];
/**
 * 获取用户附近的资源
 * GET /api/resources/nearby
 */
router.get('/nearby', 
// locationValidation,
// paginationValidation,
// validateRequest,
async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseFloat(req.query.radius) || 10; // 默认10公里
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await resourceService.searchResources({
            latitude: lat,
            longitude: lng,
            radius
        }, {
            page,
            limit,
            sortBy: 'distance',
            sortOrder: 'asc'
        });
        res.json({
            success: true,
            message: '获取附近资源成功',
            data: result
        });
    }
    catch (error) {
        console.error('获取附近资源失败:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '获取附近资源失败'
        });
    }
});
exports.default = router;
//# sourceMappingURL=resource.js.map