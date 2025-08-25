"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const locationService_1 = require("@/services/locationService");
const asyncHandler_1 = require("@/middleware/asyncHandler");
const validation_1 = require("@/middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
/**
 * 地址解析（地址转坐标）
 */
router.post('/geocode', (0, validation_1.validate)({
    body: joi_1.default.object({
        address: joi_1.default.string().required().min(2).max(200).messages({
            'string.empty': '地址不能为空',
            'string.min': '地址长度至少2个字符',
            'string.max': '地址长度不能超过200个字符',
            'any.required': '地址是必需的'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { address } = req.body;
    const result = await locationService_1.locationService.geocode(address);
    res.json({
        success: true,
        message: '地址解析成功',
        data: result
    });
}));
/**
 * 逆地址解析（坐标转地址）
 */
router.post('/reverse-geocode', (0, validation_1.validate)({
    body: joi_1.default.object({
        longitude: joi_1.default.number().required().min(-180).max(180).messages({
            'number.base': '经度必须是数字',
            'number.min': '经度不能小于-180',
            'number.max': '经度不能大于180',
            'any.required': '经度是必需的'
        }),
        latitude: joi_1.default.number().required().min(-90).max(90).messages({
            'number.base': '纬度必须是数字',
            'number.min': '纬度不能小于-90',
            'number.max': '纬度不能大于90',
            'any.required': '纬度是必需的'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { longitude, latitude } = req.body;
    const result = await locationService_1.locationService.reverseGeocode(longitude, latitude);
    res.json({
        success: true,
        message: '坐标解析成功',
        data: result
    });
}));
/**
 * 获取当前位置（基于IP）
 */
router.get('/current', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const result = await locationService_1.locationService.getCurrentLocation(ip);
    res.json({
        success: true,
        message: 'IP定位成功',
        data: result
    });
}));
/**
 * POI搜索
 */
router.get('/search/poi', (0, validation_1.validate)({
    query: joi_1.default.object({
        keyword: joi_1.default.string().required().min(1).max(50).messages({
            'string.empty': '搜索关键词不能为空',
            'string.min': '搜索关键词至少1个字符',
            'string.max': '搜索关键词不能超过50个字符',
            'any.required': '搜索关键词是必需的'
        }),
        city: joi_1.default.string().optional().max(50).messages({
            'string.max': '城市名称不能超过50个字符'
        }),
        page: joi_1.default.number().optional().min(1).default(1).messages({
            'number.base': '页码必须是数字',
            'number.min': '页码不能小于1'
        }),
        limit: joi_1.default.number().optional().min(1).max(50).default(20).messages({
            'number.base': '每页数量必须是数字',
            'number.min': '每页数量不能小于1',
            'number.max': '每页数量不能超过50'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { keyword, city, page, limit } = req.query;
    const result = await locationService_1.locationService.searchPOI(keyword, city, page, limit);
    res.json({
        success: true,
        message: 'POI搜索成功',
        data: result
    });
}));
/**
 * 地址搜索建议
 */
router.get('/search/address', (0, validation_1.validate)({
    query: joi_1.default.object({
        input: joi_1.default.string().required().min(1).max(100).messages({
            'string.empty': '搜索输入不能为空',
            'string.min': '搜索输入至少1个字符',
            'string.max': '搜索输入不能超过100个字符',
            'any.required': '搜索输入是必需的'
        }),
        city: joi_1.default.string().optional().max(50).messages({
            'string.max': '城市名称不能超过50个字符'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { input, city } = req.query;
    const result = await locationService_1.locationService.searchAddress(input, city);
    res.json({
        success: true,
        message: '地址搜索成功',
        data: result
    });
}));
/**
 * 获取附近POI
 */
router.get('/nearby', (0, validation_1.validate)({
    query: joi_1.default.object({
        longitude: joi_1.default.number().required().min(-180).max(180).messages({
            'number.base': '经度必须是数字',
            'number.min': '经度不能小于-180',
            'number.max': '经度不能大于180',
            'any.required': '经度是必需的'
        }),
        latitude: joi_1.default.number().required().min(-90).max(90).messages({
            'number.base': '纬度必须是数字',
            'number.min': '纬度不能小于-90',
            'number.max': '纬度不能大于90',
            'any.required': '纬度是必需的'
        }),
        radius: joi_1.default.number().optional().min(100).max(10000).default(1000).messages({
            'number.base': '搜索半径必须是数字',
            'number.min': '搜索半径不能小于100米',
            'number.max': '搜索半径不能超过10000米'
        }),
        type: joi_1.default.string().optional().max(50).messages({
            'string.max': 'POI类型不能超过50个字符'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { longitude, latitude, radius, type } = req.query;
    const result = await locationService_1.locationService.getNearbyPOI(longitude, latitude, radius, type);
    res.json({
        success: true,
        message: '附近POI搜索成功',
        data: result
    });
}));
/**
 * 计算两点间距离
 */
router.post('/distance', (0, validation_1.validate)({
    body: joi_1.default.object({
        point1: joi_1.default.object({
            longitude: joi_1.default.number().required().min(-180).max(180),
            latitude: joi_1.default.number().required().min(-90).max(90)
        }).required(),
        point2: joi_1.default.object({
            longitude: joi_1.default.number().required().min(-180).max(180),
            latitude: joi_1.default.number().required().min(-90).max(90)
        }).required()
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { point1, point2 } = req.body;
    const distance = locationService_1.locationService.calculateDistance(point1, point2);
    res.json({
        success: true,
        message: '距离计算成功',
        data: {
            distance: Math.round(distance), // 距离（米）
            distanceKm: Math.round(distance / 1000 * 100) / 100, // 距离（公里，保留2位小数）
            point1,
            point2
        }
    });
}));
/**
 * 计算多点中心坐标
 */
router.post('/center', (0, validation_1.validate)({
    body: joi_1.default.object({
        coordinates: joi_1.default.array().items(joi_1.default.object({
            longitude: joi_1.default.number().required().min(-180).max(180),
            latitude: joi_1.default.number().required().min(-90).max(90)
        })).min(1).max(100).required().messages({
            'array.min': '至少需要1个坐标点',
            'array.max': '坐标点不能超过100个',
            'any.required': '坐标点数组是必需的'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { coordinates } = req.body;
    const center = locationService_1.locationService.calculateCenter(coordinates);
    res.json({
        success: true,
        message: '中心点计算成功',
        data: {
            center,
            inputCount: coordinates.length
        }
    });
}));
/**
 * 验证坐标
 */
router.post('/validate', (0, validation_1.validate)({
    body: joi_1.default.object({
        longitude: joi_1.default.number().required(),
        latitude: joi_1.default.number().required()
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { longitude, latitude } = req.body;
    const isValid = locationService_1.locationService.validateCoordinates(longitude, latitude);
    res.json({
        success: true,
        message: '坐标验证完成',
        data: {
            isValid,
            longitude,
            latitude,
            validRange: {
                longitude: '(-180, 180)',
                latitude: '(-90, 90)'
            }
        }
    });
}));
/**
 * 获取服务状态
 */
router.get('/status', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const status = locationService_1.locationService.getStatus();
    res.json({
        success: true,
        message: '服务状态获取成功',
        data: status
    });
}));
exports.default = router;
//# sourceMappingURL=location.js.map