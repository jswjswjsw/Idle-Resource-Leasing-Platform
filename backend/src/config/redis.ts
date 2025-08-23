import { createClient } from 'redis';

// 创建Redis客户端
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
});

// Redis连接事件处理
redisClient.on('connect', () => {
  console.log('🔗 Redis连接中...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis连接就绪');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis连接错误:', err);
});

redisClient.on('end', () => {
  console.log('🔚 Redis连接已关闭');
});

// 连接Redis
export async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('✅ Redis连接成功');
  } catch (error) {
    console.error('❌ Redis连接失败:', error);
    throw error;
  }
}

// 缓存工具函数
export const cache = {
  // 设置缓存
  async set(key: string, value: any, ttl?: number) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redisClient.setEx(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      console.error('缓存设置失败:', error);
    }
  },

  // 获取缓存
  async get(key: string): Promise<any | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('缓存获取失败:', error);
      return null;
    }
  },

  // 删除缓存
  async del(key: string) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('缓存删除失败:', error);
    }
  },

  // 批量删除缓存
  async delPattern(pattern: string) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('缓存批量删除失败:', error);
    }
  },

  // 检查键是否存在
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('缓存检查失败:', error);
      return false;
    }
  },

  // 设置过期时间
  async expire(key: string, ttl: number) {
    try {
      await redisClient.expire(key, ttl);
    } catch (error) {
      console.error('缓存过期时间设置失败:', error);
    }
  },

  // 获取TTL
  async ttl(key: string): Promise<number> {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      console.error('获取TTL失败:', error);
      return -1;
    }
  },
};

// 缓存键前缀
export const CACHE_KEYS = {
  USER: 'user:',
  RESOURCE: 'resource:',
  ORDER: 'order:',
  POPULAR_RESOURCES: 'popular:resources',
  RECOMMENDED_RESOURCES: 'recommended:resources',
  USER_RESOURCES: 'user:resources:',
  SEARCH_RESULTS: 'search:',
  CATEGORIES: 'categories',
  NOTIFICATIONS: 'notifications:',
  MESSAGES: 'messages:',
  VERIFICATION_CODE: 'verification_code:',
  VERIFICATION_SEND_COUNT: 'verification_send_count:',
  VERIFICATION_LAST_SEND: 'verification_last_send:',
  PASSWORD_RESET_TOKEN: 'password_reset_token:',
  REFRESH_TOKEN: 'refresh_token:',
};

// 缓存TTL（秒）
export const CACHE_TTL = {
  SHORT: 60,        // 1分钟
  MEDIUM: 300,      // 5分钟
  LONG: 3600,       // 1小时
  VERY_LONG: 86400, // 1天
};

// 缓存策略
export const cacheStrategy = {
  // 获取或设置缓存
  async getOrSet(key: string, fetchFunction: () => Promise<any>, ttl = CACHE_TTL.MEDIUM) {
    const cached = await cache.get(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFunction();
    await cache.set(key, fresh, ttl);
    return fresh;
  },

  // 清除相关缓存
  async invalidateRelated(keys: string[]) {
    for (const key of keys) {
      await cache.delPattern(`*${key}*`);
    }
  },

  // 缓存穿透保护
  async getWithLock(key: string, fetchFunction: () => Promise<any>, ttl = CACHE_TTL.MEDIUM) {
    const lockKey = `lock:${key}`;
    const lock = await redisClient.set(lockKey, '1', { PX: 5000, NX: true });
    
    if (!lock) {
      // 如果获取锁失败，等待并重试
      await new Promise(resolve => setTimeout(resolve, 100));
      return await cache.get(key);
    }

    try {
      const data = await fetchFunction();
      await cache.set(key, data, ttl);
      return data;
    } finally {
      await redisClient.del(lockKey);
    }
  },
};

// 优雅关闭
export async function closeRedis() {
  try {
    await redisClient.quit();
    console.log('✅ Redis连接已关闭');
  } catch (error) {
    console.error('关闭Redis连接失败:', error);
  }
}