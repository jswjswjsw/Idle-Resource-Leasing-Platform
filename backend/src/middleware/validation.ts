import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ErrorFactory } from '@/utils/AppError';

/**
 * Joi验证中间件
 * 支持验证请求体、查询参数、路径参数和请求头
 */
export interface ValidationSchemas {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // 验证请求体
    if (schemas.body) {
      const { error } = schemas.body.validate(req.body);
      if (error) {
        errors.push(`请求体: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证查询参数
    if (schemas.query) {
      const { error } = schemas.query.validate(req.query);
      if (error) {
        errors.push(`查询参数: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证路径参数
    if (schemas.params) {
      const { error } = schemas.params.validate(req.params);
      if (error) {
        errors.push(`路径参数: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证请求头
    if (schemas.headers) {
      const { error } = schemas.headers.validate(req.headers);
      if (error) {
        errors.push(`请求头: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      const error = ErrorFactory.validation(errors.join('; '), { validationErrors: errors });
      return next(error);
    }

    next();
  };
};

/**
 * 常用验证规则
 */
export const CommonValidations = {
  // ID验证
  id: Joi.string().pattern(/^[a-zA-Z0-9]{25}$/).required().messages({
    'string.pattern.base': 'ID格式不正确',
    'any.required': 'ID不能为空'
  }),

  // 可选ID验证
  optionalId: Joi.string().pattern(/^[a-zA-Z0-9]{25}$/).optional().messages({
    'string.pattern.base': 'ID格式不正确'
  }),

  // 邮箱验证
  email: Joi.string().email().required().messages({
    'string.email': '邮箱格式不正确',
    'any.required': '邮箱不能为空'
  }),

  // 密码验证
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': '密码至少8位',
    'string.max': '密码最多128位',
    'any.required': '密码不能为空'
  }),

  // 用户名验证
  username: Joi.string().min(2).max(50).required().messages({
    'string.min': '用户名至少2位',
    'string.max': '用户名最多50位',
    'any.required': '用户名不能为空'
  }),

  // 手机号验证
  phone: Joi.string().pattern(/^1[3-9]\\d{9}$/).required().messages({
    'string.pattern.base': '手机号格式不正确',
    'any.required': '手机号不能为空'
  }),

  // 可选手机号验证
  optionalPhone: Joi.string().pattern(/^1[3-9]\\d{9}$/).optional().messages({
    'string.pattern.base': '手机号格式不正确'
  }),

  // 价格验证
  price: Joi.number().positive().precision(2).required().messages({
    'number.positive': '价格必须为正数',
    'any.required': '价格不能为空'
  }),

  // 日期验证
  date: Joi.date().iso().required().messages({
    'date.format': '日期格式不正确',
    'any.required': '日期不能为空'
  }),

  // 经纬度验证
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.min': '纬度范围为-90到90',
    'number.max': '纬度范围为-90到90',
    'any.required': '纬度不能为空'
  }),

  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.min': '经度范围为-180到180',
    'number.max': '经度范围为-180到180',
    'any.required': '经度不能为空'
  }),

  // 分页验证
  page: Joi.number().integer().min(1).default(1).messages({
    'number.integer': '页码必须为整数',
    'number.min': '页码必须大于0'
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.integer': '每页数量必须为整数',
    'number.min': '每页数量必须大于0',
    'number.max': '每页数量不能超过100'
  }),

  // 排序验证
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'price', 'rating').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),

  // 状态验证
  resourceStatus: Joi.string().valid('AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE').required(),
  orderStatus: Joi.string().valid('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED').required(),
  paymentStatus: Joi.string().valid('PENDING', 'PAID', 'REFUNDED', 'FAILED').required(),

  // 文件验证
  imageUrl: Joi.string().uri().optional().messages({
    'string.uri': '图片URL格式不正确'
  }),

  // 评分验证
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.integer': '评分必须为整数',
    'number.min': '评分不能低于1分',
    'number.max': '评分不能超过5分',
    'any.required': '评分不能为空'
  }),

  // 文本验证
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': '标题不能为空',
    'string.max': '标题最多200字',
    'any.required': '标题不能为空'
  }),

  description: Joi.string().min(10).max(2000).required().messages({
    'string.min': '描述至少10字',
    'string.max': '描述最多2000字',
    'any.required': '描述不能为空'
  }),

  optionalDescription: Joi.string().max(2000).optional().messages({
    'string.max': '描述最多2000字'
  }),

  // 标签验证
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional().messages({
    'array.max': '标签最多10个',
    'string.max': '标签最多50字'
  })
};

/**
 * 业务特定验证规则
 */
export const BusinessValidations = {
  // 用户注册
  userRegister: {
    body: Joi.object({
      username: CommonValidations.username,
      email: CommonValidations.email,
      password: CommonValidations.password,
      phone: CommonValidations.optionalPhone
    })
  },

  // 用户登录
  userLogin: {
    body: Joi.object({
      email: CommonValidations.email,
      password: Joi.string().required().messages({
        'any.required': '密码不能为空'
      })
    })
  },

  // 资源创建
  resourceCreate: {
    body: Joi.object({
      title: CommonValidations.title,
      description: CommonValidations.description,
      categoryId: CommonValidations.id,
      price: CommonValidations.price,
      priceUnit: Joi.string().valid('HOUR', 'DAY', 'WEEK', 'MONTH').default('DAY'),
      location: Joi.string().required(),
      latitude: CommonValidations.latitude,
      longitude: CommonValidations.longitude,
      deposit: Joi.number().min(0).default(0),
      tags: CommonValidations.tags
    })
  },

  // 资源更新
  resourceUpdate: {
    params: Joi.object({
      id: CommonValidations.id
    }),
    body: Joi.object({
      title: Joi.string().min(1).max(200).optional(),
      description: Joi.string().min(10).max(2000).optional(),
      price: Joi.number().positive().precision(2).optional(),
      priceUnit: Joi.string().valid('HOUR', 'DAY', 'WEEK', 'MONTH').optional(),
      location: Joi.string().optional(),
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional(),
      status: Joi.string().valid('AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE').optional(),
      deposit: Joi.number().min(0).optional(),
      tags: CommonValidations.tags
    })
  },

  // 订单创建
  orderCreate: {
    body: Joi.object({
      resourceId: CommonValidations.id,
      startDate: CommonValidations.date,
      endDate: CommonValidations.date,
      notes: Joi.string().max(500).optional(),
      deliveryMethod: Joi.string().valid('PICKUP', 'DELIVERY', 'EXPRESS').default('PICKUP'),
      deliveryAddress: Joi.when('deliveryMethod', {
        is: Joi.valid('DELIVERY', 'EXPRESS'),
        then: Joi.string().required(),
        otherwise: Joi.string().optional()
      })
    })
  },

  // 评价创建
  reviewCreate: {
    body: Joi.object({
      orderId: CommonValidations.id,
      rating: CommonValidations.rating,
      comment: Joi.string().max(1000).optional()
    })
  },

  // 分页查询
  pagination: {
    query: Joi.object({
      page: CommonValidations.page,
      limit: CommonValidations.limit,
      sortBy: CommonValidations.sortBy,
      sortOrder: CommonValidations.sortOrder
    })
  },

  // 资源搜索
  resourceSearch: {
    query: Joi.object({
      keyword: Joi.string().max(100).optional(),
      categoryId: CommonValidations.optionalId,
      minPrice: Joi.number().min(0).optional(),
      maxPrice: Joi.number().min(0).optional(),
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional(),
      radius: Joi.number().min(0).max(100).default(10), // km
      page: CommonValidations.page,
      limit: CommonValidations.limit,
      sortBy: Joi.string().valid('createdAt', 'price', 'rating', 'distance').default('createdAt'),
      sortOrder: CommonValidations.sortOrder
    })
  },

  // ID参数验证
  idParam: {
    params: Joi.object({
      id: CommonValidations.id
    })
  }
};

/**
 * 文件上传验证
 */
export const validateFileUpload = (allowedTypes: string[], maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;
    
    if (!file) {
      return next(ErrorFactory.badRequest('请选择要上传的文件'));
    }

    // 检查文件类型
    if (!allowedTypes.includes(file.mimetype)) {
      return next(ErrorFactory.badRequest(`不支持的文件类型，仅支持: ${allowedTypes.join(', ')}`));
    }

    // 检查文件大小
    if (file.size > maxSize) {
      return next(ErrorFactory.badRequest(`文件过大，最大支持 ${Math.round(maxSize / 1024 / 1024)}MB`));
    }

    next();
  };
};

/**
 * 条件验证中间件
 * 根据条件动态选择验证规则
 */
export const conditionalValidate = (
  condition: (req: Request) => boolean,
  schemas: ValidationSchemas
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      return validate(schemas)(req, res, next);
    }
    next();
  };
};

/**
 * 自定义验证函数类型
 */
export type CustomValidator = (value: any, req: Request) => Promise<boolean> | boolean;

/**
 * 自定义验证中间件
 */
export const customValidate = (
  field: string,
  validator: CustomValidator,
  errorMessage: string,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const value = req[source][field];
      const isValid = await validator(value, req);
      
      if (!isValid) {
        return next(ErrorFactory.validation(errorMessage));
      }
      
      next();
    } catch (error) {
      next(ErrorFactory.internal('验证过程中发生错误'));
    }
  };
};