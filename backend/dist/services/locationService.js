"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationService = exports.LocationService = void 0;
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("..//utils/errorHandler");
const cache_1 = require("..//config/cache");
/**
 * 地理位置服务类
 * 提供地址解析、逆地址解析等地理位置相关功能
 */
class LocationService {
    constructor() {
        // 使用高德地图API
        this.apiKey = process.env.AMAP_API_KEY || '';
        this.baseUrl = 'https://restapi.amap.com/v3';
        if (!this.apiKey) {
            console.warn('高德地图API密钥未配置，地理位置功能将受限');
        }
    }
    /**
     * 地址解析（地址转坐标）
     * @param address 地址字符串
     * @returns 坐标信息
     */
    async geocode(address) {
        try {
            // 检查缓存
            const cacheKey = `${cache_1.CACHE_KEYS.SEARCH_RESULTS}geocode:${address}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            if (!this.apiKey) {
                throw new errorHandler_1.AppError('地理位置服务未配置', 500);
            }
            // 调用高德地图API
            const response = await axios_1.default.get(`${this.baseUrl}/geocode/geo`, {
                params: {
                    key: this.apiKey,
                    address: address,
                    output: 'json'
                },
                timeout: 5000
            });
            if (response.data.status !== '1') {
                throw new errorHandler_1.AppError('地址解析失败', 400);
            }
            const geocodes = response.data.geocodes;
            if (!geocodes || geocodes.length === 0) {
                throw new errorHandler_1.AppError('未找到匹配的地址', 404);
            }
            const result = {
                address: geocodes[0].formatted_address,
                location: geocodes[0].location,
                level: geocodes[0].level,
                province: geocodes[0].province,
                city: geocodes[0].city,
                district: geocodes[0].district
            };
            // 缓存结果
            await cache_1.cache.set(cacheKey, result, cache_1.CACHE_TTL.LONG);
            return result;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError) {
                throw error;
            }
            console.error('地址解析错误:', error);
            throw new errorHandler_1.AppError('地址解析服务异常', 500);
        }
    }
    /**
     * 逆地址解析（坐标转地址）
     * @param longitude 经度
     * @param latitude 纬度
     * @returns 地址信息
     */
    async reverseGeocode(longitude, latitude) {
        try {
            // 检查缓存
            const cacheKey = `${cache_1.CACHE_KEYS.SEARCH_RESULTS}reverse:${longitude},${latitude}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            if (!this.apiKey) {
                throw new errorHandler_1.AppError('地理位置服务未配置', 500);
            }
            // 调用高德地图API
            const response = await axios_1.default.get(`${this.baseUrl}/geocode/regeo`, {
                params: {
                    key: this.apiKey,
                    location: `${longitude},${latitude}`,
                    output: 'json',
                    extensions: 'all'
                },
                timeout: 5000
            });
            if (response.data.status !== '1') {
                throw new errorHandler_1.AppError('坐标解析失败', 400);
            }
            const regeocode = response.data.regeocode;
            if (!regeocode) {
                throw new errorHandler_1.AppError('未找到匹配的地址', 404);
            }
            const result = {
                address: regeocode.formatted_address,
                province: regeocode.addressComponent.province,
                city: regeocode.addressComponent.city,
                district: regeocode.addressComponent.district,
                township: regeocode.addressComponent.township,
                neighborhood: regeocode.addressComponent.neighborhood?.name,
                building: regeocode.addressComponent.building?.name,
                pois: regeocode.pois?.slice(0, 5) || [] // 返回前5个POI
            };
            // 缓存结果
            await cache_1.cache.set(cacheKey, result, cache_1.CACHE_TTL.LONG);
            return result;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError) {
                throw error;
            }
            console.error('逆地址解析错误:', error);
            throw new errorHandler_1.AppError('逆地址解析服务异常', 500);
        }
    }
    /**
     * 获取当前位置（基于IP）
     * @param ip IP地址
     * @returns 位置信息
     */
    async getCurrentLocation(ip) {
        try {
            // 检查缓存
            const cacheKey = `${cache_1.CACHE_KEYS.SEARCH_RESULTS}ip:${ip || 'auto'}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            if (!this.apiKey) {
                throw new errorHandler_1.AppError('地理位置服务未配置', 500);
            }
            // 调用高德地图IP定位API
            const response = await axios_1.default.get(`${this.baseUrl}/ip`, {
                params: {
                    key: this.apiKey,
                    ip: ip || '',
                    output: 'json'
                },
                timeout: 5000
            });
            if (response.data.status !== '1') {
                throw new errorHandler_1.AppError('IP定位失败', 400);
            }
            const result = {
                province: response.data.province,
                city: response.data.city,
                adcode: response.data.adcode,
                rectangle: response.data.rectangle
            };
            // 缓存结果（较短时间）
            await cache_1.cache.set(cacheKey, result, cache_1.CACHE_TTL.MEDIUM);
            return result;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError) {
                throw error;
            }
            console.error('IP定位错误:', error);
            throw new errorHandler_1.AppError('IP定位服务异常', 500);
        }
    }
    /**
     * 计算两点间距离
     * @param lon1 起点经度
     * @param lat1 起点纬度
     * @param lon2 终点经度
     * @param lat2 终点纬度
     * @returns 距离（米）
     */
    calculateDistance(lon1, lat1, lon2, lat2) {
        const R = 6371000; // 地球半径（米）
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    /**
     * 角度转弧度
     * @param degrees 角度
     * @returns 弧度
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    /**
     * 验证坐标格式
     * @param longitude 经度
     * @param latitude 纬度
     * @returns 是否有效
     */
    validateCoordinates(longitude, latitude) {
        return longitude >= -180 && longitude <= 180 &&
            latitude >= -90 && latitude <= 90;
    }
}
exports.LocationService = LocationService;
// 导出服务实例
exports.locationService = new LocationService();
//# sourceMappingURL=locationService.js.map