"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStrategy = exports.CACHE_TTL = exports.CACHE_KEYS = exports.cache = exports.redisClient = void 0;
exports.connectRedis = connectRedis;
exports.closeRedis = closeRedis;
const redis_1 = require("redis");
// 创建Redis客户端
exports.redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
});
// Redis连接事件处理
exports.redisClient.on('connect', () => {
    console.log('🔗 Redis连接中...');
});
exports.redisClient.on('ready', () => {
    console.log('✅ Redis连接就绪');
});
exports.redisClient.on('error', (err) => {
    console.error('❌ Redis连接错误:', err);
});
exports.redisClient.on('end', () => {
    console.log('🔚 Redis连接已关闭');
});
// 连接Redis
async function connectRedis() {
    try {
        await exports.redisClient.connect();
        console.log('✅ Redis连接成功');
    }
    catch (error) {
        console.error('❌ Redis连接失败:', error);
        throw error;
    }
}
// 缓存工具函数
exports.cache = {
    // 设置缓存
    async set(key, value, ttl) {
        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await exports.redisClient.setEx(key, ttl, serialized);
            }
            else {
                await exports.redisClient.set(key, serialized);
            }
        }
        catch (error) {
            console.error('缓存设置失败:', error);
        }
    },
    // 获取缓存
    async get(key) {
        try {
            const value = await exports.redisClient.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error('缓存获取失败:', error);
            return null;
        }
    },
    // 删除缓存
    async del(key) {
        try {
            await exports.redisClient.del(key);
        }
        catch (error) {
            console.error('缓存删除失败:', error);
        }
    },
    // 批量删除缓存
    async delPattern(pattern) {
        try {
            const keys = await exports.redisClient.keys(pattern);
            if (keys.length > 0) {
                await exports.redisClient.del(keys);
            }
        }
        catch (error) {
            console.error('缓存批量删除失败:', error);
        }
    },
    // 检查键是否存在
    async exists(key) {
        try {
            const result = await exports.redisClient.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error('缓存检查失败:', error);
            return false;
        }
    },
    // 设置过期时间
    async expire(key, ttl) {
        try {
            await exports.redisClient.expire(key, ttl);
        }
        catch (error) {
            console.error('缓存过期时间设置失败:', error);
        }
    },
    // 获取TTL
    async ttl(key) {
        try {
            return await exports.redisClient.ttl(key);
        }
        catch (error) {
            console.error('获取TTL失败:', error);
            return -1;
        }
    },
};
// 缓存键前缀
exports.CACHE_KEYS = {
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
exports.CACHE_TTL = {
    SHORT: 60, // 1分钟
    MEDIUM: 300, // 5分钟
    LONG: 3600, // 1小时
    VERY_LONG: 86400, // 1天
};
// 缓存策略
exports.cacheStrategy = {
    // 获取或设置缓存
    async getOrSet(key, fetchFunction, ttl = exports.CACHE_TTL.MEDIUM) {
        const cached = await exports.cache.get(key);
        if (cached !== null) {
            return cached;
        }
        const fresh = await fetchFunction();
        await exports.cache.set(key, fresh, ttl);
        return fresh;
    },
    // 清除相关缓存
    async invalidateRelated(keys) {
        for (const key of keys) {
            await exports.cache.delPattern(`*${key}*`);
        }
    },
    // 缓存穿透保护
    async getWithLock(key, fetchFunction, ttl = exports.CACHE_TTL.MEDIUM) {
        const lockKey = `lock:${key}`;
        const lock = await exports.redisClient.set(lockKey, '1', { PX: 5000, NX: true });
        if (!lock) {
            // 如果获取锁失败，等待并重试
            await new Promise(resolve => setTimeout(resolve, 100));
            return await exports.cache.get(key);
        }
        try {
            const data = await fetchFunction();
            await exports.cache.set(key, data, ttl);
            return data;
        }
        finally {
            await exports.redisClient.del(lockKey);
        }
    },
};
// 优雅关闭
async function closeRedis() {
    try {
        await exports.redisClient.quit();
        console.log('✅ Redis连接已关闭');
    }
    catch (error) {
        console.error('关闭Redis连接失败:', error);
    }
}
//# sourceMappingURL=redis.js.map