import express from 'express';
import { locationService } from '@/services/locationService';
import { asyncHandler } from '@/middleware/asyncHandler';
import { authenticate } from '@/middleware/auth';
import { validate, CommonValidations } from '@/middleware/validation';
import Joi from 'joi';
import { winstonLogger } from '@/middleware/logger';

const router = express.Router();

/**
 * 地址解析（地址转坐标）
 */
router.post('/geocode',
  validate({
    body: Joi.object({
      address: Joi.string().required().min(2).max(200).messages({
        'string.empty': '地址不能为空',
        'string.min': '地址长度至少2个字符',
        'string.max': '地址长度不能超过200个字符',
        'any.required': '地址是必需的'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { address } = req.body;
    
    const result = await locationService.geocode(address);
    
    res.json({
      success: true,
      message: '地址解析成功',
      data: result
    });
  })
);

/**
 * 逆地址解析（坐标转地址）
 */
router.post('/reverse-geocode',
  validate({
    body: Joi.object({
      longitude: Joi.number().required().min(-180).max(180).messages({
        'number.base': '经度必须是数字',
        'number.min': '经度不能小于-180',
        'number.max': '经度不能大于180',
        'any.required': '经度是必需的'
      }),
      latitude: Joi.number().required().min(-90).max(90).messages({
        'number.base': '纬度必须是数字',
        'number.min': '纬度不能小于-90',
        'number.max': '纬度不能大于90',
        'any.required': '纬度是必需的'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { longitude, latitude } = req.body;
    
    const result = await locationService.reverseGeocode(longitude, latitude);
    
    res.json({
      success: true,
      message: '坐标解析成功',
      data: result
    });
  })
);

/**
 * 获取当前位置（基于IP）
 */
router.get('/current',
  asyncHandler(async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    const result = await locationService.getCurrentLocation(ip);
    
    res.json({
      success: true,
      message: 'IP定位成功',
      data: result
    });
  })
);

/**
 * POI搜索
 */
router.get('/search/poi',
  validate({
    query: Joi.object({
      keyword: Joi.string().required().min(1).max(50).messages({
        'string.empty': '搜索关键词不能为空',
        'string.min': '搜索关键词至少1个字符',
        'string.max': '搜索关键词不能超过50个字符',
        'any.required': '搜索关键词是必需的'
      }),
      city: Joi.string().optional().max(50).messages({
        'string.max': '城市名称不能超过50个字符'
      }),
      page: Joi.number().optional().min(1).default(1).messages({
        'number.base': '页码必须是数字',
        'number.min': '页码不能小于1'
      }),
      limit: Joi.number().optional().min(1).max(50).default(20).messages({
        'number.base': '每页数量必须是数字',
        'number.min': '每页数量不能小于1',
        'number.max': '每页数量不能超过50'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { keyword, city, page, limit } = req.query as any;
    
    const result = await locationService.searchPOI(keyword, city, page, limit);
    
    res.json({
      success: true,
      message: 'POI搜索成功',
      data: result
    });
  })
);

/**
 * 地址搜索建议
 */
router.get('/search/address',
  validate({
    query: Joi.object({
      input: Joi.string().required().min(1).max(100).messages({
        'string.empty': '搜索输入不能为空',
        'string.min': '搜索输入至少1个字符',
        'string.max': '搜索输入不能超过100个字符',
        'any.required': '搜索输入是必需的'
      }),
      city: Joi.string().optional().max(50).messages({
        'string.max': '城市名称不能超过50个字符'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { input, city } = req.query as any;
    
    const result = await locationService.searchAddress(input, city);
    
    res.json({
      success: true,
      message: '地址搜索成功',
      data: result
    });
  })
);

/**
 * 获取附近POI
 */
router.get('/nearby',
  validate({
    query: Joi.object({
      longitude: Joi.number().required().min(-180).max(180).messages({
        'number.base': '经度必须是数字',
        'number.min': '经度不能小于-180',
        'number.max': '经度不能大于180',
        'any.required': '经度是必需的'
      }),
      latitude: Joi.number().required().min(-90).max(90).messages({
        'number.base': '纬度必须是数字',
        'number.min': '纬度不能小于-90',
        'number.max': '纬度不能大于90',
        'any.required': '纬度是必需的'
      }),
      radius: Joi.number().optional().min(100).max(10000).default(1000).messages({
        'number.base': '搜索半径必须是数字',
        'number.min': '搜索半径不能小于100米',
        'number.max': '搜索半径不能超过10000米'
      }),
      type: Joi.string().optional().max(50).messages({
        'string.max': 'POI类型不能超过50个字符'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { longitude, latitude, radius, type } = req.query as any;
    
    const result = await locationService.getNearbyPOI(longitude, latitude, radius, type);
    
    res.json({
      success: true,
      message: '附近POI搜索成功',
      data: result
    });
  })
);

/**
 * 计算两点间距离
 */
router.post('/distance',
  validate({
    body: Joi.object({
      point1: Joi.object({
        longitude: Joi.number().required().min(-180).max(180),
        latitude: Joi.number().required().min(-90).max(90)
      }).required(),
      point2: Joi.object({
        longitude: Joi.number().required().min(-180).max(180),
        latitude: Joi.number().required().min(-90).max(90)
      }).required()
    })
  }),
  asyncHandler(async (req, res) => {
    const { point1, point2 } = req.body;
    
    const distance = locationService.calculateDistance(point1, point2);
    
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
  })
);

/**
 * 计算多点中心坐标
 */
router.post('/center',
  validate({
    body: Joi.object({
      coordinates: Joi.array().items(
        Joi.object({
          longitude: Joi.number().required().min(-180).max(180),
          latitude: Joi.number().required().min(-90).max(90)
        })
      ).min(1).max(100).required().messages({
        'array.min': '至少需要1个坐标点',
        'array.max': '坐标点不能超过100个',
        'any.required': '坐标点数组是必需的'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { coordinates } = req.body;
    
    const center = locationService.calculateCenter(coordinates);
    
    res.json({
      success: true,
      message: '中心点计算成功',
      data: {
        center,
        inputCount: coordinates.length
      }
    });
  })
);

/**
 * 验证坐标
 */
router.post('/validate',
  validate({
    body: Joi.object({
      longitude: Joi.number().required(),
      latitude: Joi.number().required()
    })
  }),
  asyncHandler(async (req, res) => {
    const { longitude, latitude } = req.body;
    
    const isValid = locationService.validateCoordinates(longitude, latitude);
    
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
  })
);

/**
 * 获取服务状态
 */
router.get('/status',
  asyncHandler(async (req, res) => {
    const status = locationService.getStatus();
    
    res.json({
      success: true,
      message: '服务状态获取成功',
      data: status
    });
  })
);

export default router;