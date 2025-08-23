import Redis from 'ioredis';
declare let redis: Redis | null;
export declare const getRedisStatus: () => {
    connected: boolean;
    type: string;
};
export declare const CACHE_KEYS: {
    USER: string;
    RESOURCE: string;
    ORDER: string;
    PAYMENT: string;
    POPULAR_RESOURCES: string;
    RECOMMENDED_RESOURCES: string;
    USER_RESOURCES: string;
    SEARCH_RESULTS: string;
    CATEGORIES: string;
    NOTIFICATIONS: string;
    VERIFICATION_CODE: string;
    EMAIL_CODE: string;
    SMS_CODE: string;
    RESET_TOKEN: string;
    PASSWORD_RESET_TOKEN: string;
    VERIFICATION_SEND_COUNT: string;
    VERIFICATION_LAST_SEND: string;
    REFRESH_TOKEN: string;
};
export declare const CACHE_TTL: {
    SHORT: number;
    MEDIUM: number;
    LONG: number;
    VERY_LONG: number;
    VERIFICATION_CODE: number;
    EMAIL_CODE: number;
    SMS_CODE: number;
    RESET_TOKEN: number;
    REFRESH_TOKEN: number;
};
export declare const cache: {
    set(key: string, value: any, ttl?: number): Promise<void>;
    get(key: string): Promise<any>;
    getOrSet<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
    ttl(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
};
export default redis;
//# sourceMappingURL=cache.d.ts.map