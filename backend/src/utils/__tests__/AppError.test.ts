import { AppError, ErrorFactory } from '@/utils/AppError';

describe('AppError 类', () => {
  describe('构造函数', () => {
    it('应该创建基本的 AppError 实例', () => {
      const error = new AppError('测试错误');
      
      expect(error.message).toBe('测试错误');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
      expect(error.name).toBe('AppError');
    });

    it('应该创建自定义参数的 AppError 实例', () => {
      const details = { userId: '123' };
      const error = new AppError(
        '用户不存在',
        404,
        'USER_NOT_FOUND',
        true,
        details
      );
      
      expect(error.message).toBe('用户不存在');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual(details);
    });

    it('应该正确设置错误堆栈', () => {
      const error = new AppError('测试错误');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('toJSON 方法', () => {
    it('应该返回正确的 JSON 格式', () => {
      const details = { field: 'email' };
      const error = new AppError('验证失败', 400, 'VALIDATION_ERROR', true, details);
      
      const json = error.toJSON();
      
      expect(json).toEqual({
        success: false,
        error: '验证失败',
        code: 'VALIDATION_ERROR',
        timestamp: error.timestamp,
        details: details
      });
    });

    it('应该在没有 details 时不包含 details 字段', () => {
      const error = new AppError('简单错误');
      
      const json = error.toJSON();
      
      expect(json).toEqual({
        success: false,
        error: '简单错误',
        code: 'INTERNAL_ERROR',
        timestamp: error.timestamp
      });
      expect(json.details).toBeUndefined();
    });
  });
});

describe('ErrorFactory 类', () => {
  describe('badRequest', () => {
    it('应该创建 400 错误', () => {
      const error = ErrorFactory.badRequest('参数错误');
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('参数错误');
      expect(error.isOperational).toBe(true);
    });

    it('应该使用默认消息', () => {
      const error = ErrorFactory.badRequest();
      
      expect(error.message).toBe('请求参数错误');
    });

    it('应该包含详细信息', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = ErrorFactory.badRequest('邮箱格式错误', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('unauthorized', () => {
    it('应该创建 401 错误', () => {
      const error = ErrorFactory.unauthorized('登录已过期');
      
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('登录已过期');
    });
  });

  describe('forbidden', () => {
    it('应该创建 403 错误', () => {
      const error = ErrorFactory.forbidden('权限不足');
      
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('权限不足');
    });
  });

  describe('notFound', () => {
    it('应该创建 404 错误', () => {
      const error = ErrorFactory.notFound('用户');
      
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('用户不存在');
    });
  });

  describe('conflict', () => {
    it('应该创建 409 错误', () => {
      const error = ErrorFactory.conflict('邮箱已存在');
      
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('邮箱已存在');
    });
  });

  describe('validation', () => {
    it('应该创建 422 错误', () => {
      const details = ['邮箱格式错误', '密码长度不够'];
      const error = ErrorFactory.validation('数据验证失败', details);
      
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('数据验证失败');
      expect(error.details).toEqual(details);
    });
  });

  describe('tooManyRequests', () => {
    it('应该创建 429 错误', () => {
      const error = ErrorFactory.tooManyRequests('请求过于频繁，请稍后再试');
      
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('TOO_MANY_REQUESTS');
      expect(error.message).toBe('请求过于频繁，请稍后再试');
    });
  });

  describe('internal', () => {
    it('应该创建 500 错误', () => {
      const details = { originalError: 'Database connection failed' };
      const error = ErrorFactory.internal('服务器内部错误', details);
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('服务器内部错误');
      expect(error.isOperational).toBe(false);
      expect(error.details).toEqual(details);
    });
  });

  describe('serviceUnavailable', () => {
    it('应该创建 503 错误', () => {
      const error = ErrorFactory.serviceUnavailable('服务暂时不可用');
      
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.message).toBe('服务暂时不可用');
    });
  });

  describe('businessError', () => {
    it('应该创建自定义业务错误', () => {
      const details = { orderId: '123', reason: 'insufficient balance' };
      const error = ErrorFactory.businessError(
        '余额不足',
        'INSUFFICIENT_BALANCE',
        details
      );
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INSUFFICIENT_BALANCE');
      expect(error.message).toBe('余额不足');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual(details);
    });
  });
});

describe('错误继承', () => {
  it('AppError 应该是 Error 的实例', () => {
    const error = new AppError('测试');
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('ErrorFactory 创建的错误应该是 AppError 的实例', () => {
    const error = ErrorFactory.badRequest('测试');
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('时间戳', () => {
  it('应该生成有效的 ISO 时间戳', () => {
    const error = new AppError('测试');
    
    expect(error.timestamp).toMatch(
      /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$/
    );
    
    const date = new Date(error.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });

  it('不同错误应该有不同的时间戳', async () => {
    const error1 = new AppError('测试1');
    
    // 等待一毫秒确保时间戳不同
    await new Promise(resolve => setTimeout(resolve, 1));
    
    const error2 = new AppError('测试2');
    
    expect(error1.timestamp).not.toBe(error2.timestamp);
  });
});