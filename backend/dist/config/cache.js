"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.CACHE_TTL = exports.CACHE_KEYS = exports.getRedisStatus = void 0;
/*
 * 模块: 缓存配置与抽象层（支持 Redis 可选连接与内存降级）
 * 说明:
 * - 提供统一的缓存操作接口 cache，调用方无需关心底层使用 Redis 还是内存 Map。
 * - 当 Redis 连接成功时使用 Redis；当连接失败或中断时，自动降级为内存缓存。
 * - 暴露 getRedisStatus 以供健康检查与启动日志展示缓存模式。
 * 注意:
 * - 内存缓存仅适用于单进程短期数据缓存，不具备跨进程/跨实例一致性；生产环境建议优先配置 Redis。
 */
const ioredis_1 = __importDefault(require("ioredis"));
// Redis 连接状态跟踪
let isRedisConnected = false;
let redis = null;
// 内存缓存降级存储
const memoryCache = new Map();
// 定期清理过期的内存缓存
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
        if (entry.expireAt && entry.expireAt < now) {
            memoryCache.delete(key); // 移除已过期的键
        }
    }
}, 60000); // 每分钟清理一次
// 尝试初始化Redis连接
try {
    // 创建 Redis 客户端，lazyConnect: true 表示仅在首次使用或手动 connect 时连接
    redis = new ioredis_1.default({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3, // 限制单次命令重试次数，避免长时间阻塞
        // retryDelayOnFailover: 100, // 重试延时（ioredis 未提供该选项，移除避免类型错误）
        lazyConnect: true, // 延迟连接，提升服务启动的鲁棒性
    });
    // Redis连接事件监听
    redis.on('connect', () => {
        isRedisConnected = true; // 标记 Redis 已连接
        console.log('✅ Redis 连接成功');
    });
    redis.on('error', (err) => {
        isRedisConnected = false; // 发生错误，标记为未连接
        console.warn('⚠️  Redis 连接失败，使用内存缓存降级:', err.message);
    });
    redis.on('close', () => {
        isRedisConnected = false; // 连接关闭，切换内存
        console.log('⚠️  Redis 连接关闭，切换到内存缓存');
    });
    redis.on('reconnecting', () => {
        console.log('🔄 Redis 重连中...');
    });
    // 尝试连接Redis（非阻塞）
    redis.connect().catch(() => {
        isRedisConnected = false; // 连接失败，继续使用内存
        console.warn('⚠️  Redis 连接失败，使用内存缓存降级');
    });
}
catch (error) {
    isRedisConnected = false; // 初始化失败，降级到内存
    console.warn('⚠️  Redis 初始化失败，使用内存缓存降级:', error);
}
// 获取连接状态的公共接口
const getRedisStatus = () => ({
    connected: isRedisConnected, // 是否处于 Redis 连接状态
    type: isRedisConnected ? 'redis' : 'memory' // 当前缓存类型
});
exports.getRedisStatus = getRedisStatus;
// 缓存键名常量
exports.CACHE_KEYS = {
    USER: 'user:',
    RESOURCE: 'resource:',
    ORDER: 'order:',
    PAYMENT: 'payment:',
    POPULAR_RESOURCES: 'popular_resources',
    RECOMMENDED_RESOURCES: 'recommended_resources:',
    USER_RESOURCES: 'user_resources:',
    SEARCH_RESULTS: 'search:',
    CATEGORIES: 'categories',
    NOTIFICATIONS: 'notifications:',
    VERIFICATION_CODE: 'verification:',
    EMAIL_CODE: 'email_code:',
    SMS_CODE: 'sms_code:',
    RESET_TOKEN: 'reset_token:',
    PASSWORD_RESET_TOKEN: 'password_reset_token:',
    VERIFICATION_SEND_COUNT: 'verification_send_count:',
    VERIFICATION_LAST_SEND: 'verification_last_send:',
    REFRESH_TOKEN: 'refresh_token:',
};
// 缓存过期时间常量（秒）
exports.CACHE_TTL = {
    SHORT: 300, // 5分钟
    MEDIUM: 1800, // 30分钟
    LONG: 3600, // 1小时
    VERY_LONG: 86400, // 24小时
    VERIFICATION_CODE: 300, // 5分钟
    EMAIL_CODE: 600, // 10分钟
    SMS_CODE: 300, // 5分钟
    RESET_TOKEN: 3600, // 1小时
    REFRESH_TOKEN: 2592000, // 30天
};
// 缓存操作接口（对外统一接口）
exports.cache = {
    // 设置缓存
    async set(key, value, ttl) {
        if (isRedisConnected && redis) { // 尝试使用 Redis
            try {
                const serializedValue = JSON.stringify(value); // 序列化存储
                if (ttl) {
                    await redis.setex(key, ttl, serializedValue); // 设置带过期时间
                }
                else {
                    await redis.set(key, serializedValue); // 普通设置
                }
                return; // 成功后返回
            }
            catch (error) {
                console.warn('Redis set 操作失败，使用内存缓存:', error); // 打印警告
                isRedisConnected = false; // 标记 Redis 状态为不可用
            }
        }
        // 内存缓存降级
        const entry = { value }; // 构造条目
        if (ttl) {
            entry.expireAt = Date.now() + (ttl * 1000); // 计算过期时间戳
        }
        memoryCache.set(key, entry); // 写入内存
    },
    // 获取缓存
    async get(key) {
        if (isRedisConnected && redis) { // 优先从 Redis 获取
            try {
                const value = await redis.get(key); // 获取字符串
                if (value === null) {
                    return null; // 不存在
                }
                try {
                    return JSON.parse(value); // 反序列化 JSON
                }
                catch {
                    return value; // 返回原始字符串
                }
            }
            catch (error) {
                console.warn('Redis get 操作失败，使用内存缓存:', error); // 打印警告
                isRedisConnected = false; // 标记 Redis 状态为不可用
            }
        }
        // 内存缓存降级
        const entry = memoryCache.get(key); // 读取内存
        if (!entry) {
            return null; // 未命中
        }
        // 检查是否过期
        if (entry.expireAt && entry.expireAt < Date.now()) {
            memoryCache.delete(key); // 删除过期项
            return null; // 返回空
        }
        return entry.value; // 返回值
    },
    // 获取或设置缓存（如果不存在则执行回调函数获取数据并缓存）
    async getOrSet(key, callback, ttl) {
        const cached = await this.get(key); // 尝试读取缓存
        if (cached !== null) {
            return cached; // 命中缓存直接返回
        }
        const value = await callback(); // 未命中则获取新值
        await this.set(key, value, ttl); // 写入缓存
        return value; // 返回新值
    },
    // 删除缓存
    async del(key) {
        if (isRedisConnected && redis) { // 尝试删除 Redis 键
            try {
                await redis.del(key); // 执行删除
                return; // 成功返回
            }
            catch (error) {
                console.warn('Redis del 操作失败，使用内存缓存:', error); // 打印警告
                isRedisConnected = false; // 标记 Redis 状态为不可用
            }
        }
        // 内存缓存降级
        memoryCache.delete(key); // 从内存中删除
    },
    // 批量删除缓存（支持模式匹配）
    async delPattern(pattern) {
        if (isRedisConnected && redis) { // 优先使用 Redis keys 匹配
            try {
                const keys = await redis.keys(pattern); // 扫描匹配的键
                if (keys.length > 0) {
                    await redis.del(...keys); // 批量删除
                }
                return; // 成功返回
            }
            catch (error) {
                console.warn('Redis delPattern 操作失败，使用内存缓存:', error); // 打印警告
                isRedisConnected = false; // 标记 Redis 状态为不可用
            }
        }
        // 内存缓存降级 - 简单的模式匹配（* 转换为任意字符）
        const regex = new RegExp(pattern.replace(/\*/g, '.*')); // 构造正则
        for (const key of memoryCache.keys()) { // 遍历内存键
            if (regex.test(key)) { // 命中则删除
                memoryCache.delete(key);
            }
        }
    },
    // 检查缓存是否存在
    async exists(key) {
        if (isRedisConnected && redis) { // 优先检查 Redis
            try {
                const result = await redis.exists(key); // 1 表示存在
                return result === 1; // 返回布尔
            }
            catch (error) {
                console.warn('Redis exists 操作失败，使用内存缓存:', error); // 打印警告
                isRedisConnected = false; // 标记 Redis 状态为不可用
            }
        }
        // 内存缓存降级
        const entry = memoryCache.get(key); // 获取内存项
        if (!entry) {
            return false; // 不存在
        }
        // 检查是否过期
        if (entry.expireAt && entry.expireAt < Date.now()) {
            memoryCache.delete(key); // 删除过期项
            return false; // 视为不存在
        }
        return true; // 仍然有效
    },
    // 设置过期时间
    async expire(key, ttl) {
        if (isRedisConnected && redis) { // 优先设置 Redis TTL
            try {
                await redis.expire(key, ttl); // 设置过期
                return; // 成功返回
            }
            catch (error) {
                console.warn('Redis expire 操作失败，使用内存缓存:', error); // 打印警告
                isRedisConnected = false; // 标记 Redis 状态为不可用
            }
        }
        // 内存缓存降级
        const entry = memoryCache.get(key); // 读取内存项
        if (entry) {
            entry.expireAt = Date.now() + (ttl * 1000); // 更新过期时间
            memoryCache.set(key, entry); // 回写
        }
    },
    // 获取剩余过期时间
    async ttl(key) {
        if (isRedisConnected && redis) { // 优先从 Redis 获取 TTL
            try {
                return await redis.ttl(key); // 返回秒
            }
            catch (error) {
                console.warn('Redis ttl 操作失败，使用内存缓存:', error); // 打印警告
                isRedisConnected = false; // 标记 Redis 状态为不可用
            }
        }
        // 内存缓存降级
        const entry = memoryCache.get(key); // 获取内存项
        if (!entry || !entry.expireAt) {
            return -1; // 无过期时间
        }
        const remainingMs = entry.expireAt - Date.now(); // 计算剩余毫秒
        return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : -2; // 已过期或负值
    },
    // 递增计数器
    async incr(key) {
        if (isRedisConnected && redis) { // 优先使用 Redis 自增
            try {
                return await redis.incr(key); // 返回自增结果
            }
            catch (error) {
                console.warn('Redis incr 操作失败，使用内存缓存:', error); // 打印警告
                isRedisConnected = false; // 标记 Redis 状态为不可用
            }
        }
        // 内存缓存降级
        const entry = memoryCache.get(key); // 获取内存项
        let currentValue = 0; // 默认值
        if (entry) {
            // 检查是否过期
            if (entry.expireAt && entry.expireAt < Date.now()) {
                memoryCache.delete(key); // 过期则移除
            }
            else {
                currentValue = typeof entry.value === 'number' ? entry.value : 0; // 读取数值
            }
        }
        const newValue = currentValue + 1; // 计算新值
        await this.set(key, newValue); // 回写
        return newValue; // 返回新值
    },
    // 递减计数器
    async decr(key) {
        if (isRedisConnected && redis) { // 优先使用 Redis 自减
            try {
                return await redis.decr(key); // 返回自减结果
            }
            catch (error) {
                console.warn('Redis decr 操作失败，使用内存缓存:', error); // 打印警告
                isRedisConnected = false; // 标记 Redis 状态为不可用
            }
        }
        // 内存缓存降级
        const entry = memoryCache.get(key); // 获取内存项
        let currentValue = 0; // 默认值
        if (entry) {
            // 检查是否过期
            if (entry.expireAt && entry.expireAt < Date.now()) {
                memoryCache.delete(key); // 过期则移除
            }
            else {
                currentValue = typeof entry.value === 'number' ? entry.value : 0; // 读取数值
            }
        }
        const newValue = currentValue - 1; // 计算新值
        await this.set(key, newValue); // 回写
        return newValue; // 返回新值
    },
};
// 默认导出 Redis 客户端（可能为 null），仅用于需要直接访问底层客户端的高级用法
exports.default = redis;
//# sourceMappingURL=cache.js.map