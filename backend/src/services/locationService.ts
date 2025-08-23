import axios from 'axios';
import { ErrorFactory } from '@/utils/AppError';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/config/cache';
import { winstonLogger } from '@/middleware/logger';

/**
 * 地图服务提供商配置
 */
interface MapProvider {
  name: string;
  isConfigured: boolean;
  geocode: (address: string) => Promise<any>;
  reverseGeocode: (longitude: number, latitude: number) => Promise<any>;
  getCurrentLocation: (ip?: string) => Promise<any>;
  searchPOI: (keyword: string, city?: string) => Promise<any>;
}

/**
 * 坐标点接口
 */
export interface Coordinate {
  longitude: number;
  latitude: number;
}

/**
 * 地址信息接口
 */
export interface AddressInfo {
  address: string;
  province?: string;
  city?: string;
  district?: string;
  township?: string;
  neighborhood?: string;
  building?: string;
  location?: Coordinate;
  level?: string;
  adcode?: string;
}

/**
 * POI信息接口
 */
export interface POIInfo {
  id: string;
  name: string;
  type: string;
  address: string;
  location: Coordinate;
  distance?: number;
  tel?: string;
}

/**
 * 高德地图服务提供商
 */
class AmapProvider implements MapProvider {
  name = '高德地图';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://restapi.amap.com/v3';

  constructor() {
    this.apiKey = process.env.AMAP_API_KEY || '';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async geocode(address: string): Promise<AddressInfo> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('高德地图API未配置');
    }

    const response = await axios.get(`${this.baseUrl}/geocode/geo`, {
      params: {
        key: this.apiKey,
        address: address,
        output: 'json'
      },
      timeout: 5000
    });

    if (response.data.status !== '1') {
      throw ErrorFactory.badRequest('地址解析失败');
    }

    const geocodes = response.data.geocodes;
    if (!geocodes || geocodes.length === 0) {
      throw ErrorFactory.notFound('未找到匹配的地址');
    }

    const geocode = geocodes[0];
    const [longitude, latitude] = geocode.location.split(',').map(Number);

    return {
      address: geocode.formatted_address,
      location: { longitude, latitude },
      level: geocode.level,
      province: geocode.province,
      city: geocode.city,
      district: geocode.district,
      adcode: geocode.adcode
    };
  }

  async reverseGeocode(longitude: number, latitude: number): Promise<AddressInfo> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('高德地图API未配置');
    }

    const response = await axios.get(`${this.baseUrl}/geocode/regeo`, {
      params: {
        key: this.apiKey,
        location: `${longitude},${latitude}`,
        output: 'json',
        extensions: 'all'
      },
      timeout: 5000
    });

    if (response.data.status !== '1') {
      throw ErrorFactory.badRequest('坐标解析失败');
    }

    const regeocode = response.data.regeocode;
    if (!regeocode) {
      throw ErrorFactory.notFound('未找到匹配的地址');
    }

    return {
      address: regeocode.formatted_address,
      province: regeocode.addressComponent.province,
      city: regeocode.addressComponent.city,
      district: regeocode.addressComponent.district,
      township: regeocode.addressComponent.township,
      neighborhood: regeocode.addressComponent.neighborhood?.name,
      building: regeocode.addressComponent.building?.name,
      location: { longitude, latitude }
    };
  }

  async getCurrentLocation(ip?: string): Promise<AddressInfo> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('高德地图API未配置');
    }

    const response = await axios.get(`${this.baseUrl}/ip`, {
      params: {
        key: this.apiKey,
        ip: ip || '',
        output: 'json'
      },
      timeout: 5000
    });

    if (response.data.status !== '1') {
      throw ErrorFactory.badRequest('IP定位失败');
    }

    return {
      address: `${response.data.province}${response.data.city}`,
      province: response.data.province,
      city: response.data.city,
      adcode: response.data.adcode
    };
  }

  async searchPOI(keyword: string, city?: string): Promise<POIInfo[]> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('高德地图API未配置');
    }

    const response = await axios.get(`${this.baseUrl}/place/text`, {
      params: {
        key: this.apiKey,
        keywords: keyword,
        city: city || '',
        output: 'json',
        page: 1,
        offset: 20
      },
      timeout: 5000
    });

    if (response.data.status !== '1') {
      throw ErrorFactory.badRequest('POI搜索失败');
    }

    const pois = response.data.pois || [];
    return pois.map((poi: any) => {
      const [longitude, latitude] = poi.location.split(',').map(Number);
      return {
        id: poi.id,
        name: poi.name,
        type: poi.type,
        address: poi.address,
        location: { longitude, latitude },
        tel: poi.tel
      };
    });
  }
}

/**
 * 百度地图服务提供商
 */
class BaiduProvider implements MapProvider {
  name = '百度地图';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.map.baidu.com';

  constructor() {
    this.apiKey = process.env.BAIDU_MAP_API_KEY || '';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async geocode(address: string): Promise<AddressInfo> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('百度地图API未配置');
    }

    const response = await axios.get(`${this.baseUrl}/geocoding/v3`, {
      params: {
        ak: this.apiKey,
        address: address,
        output: 'json'
      },
      timeout: 5000
    });

    if (response.data.status !== 0) {
      throw ErrorFactory.badRequest('地址解析失败');
    }

    const result = response.data.result;
    if (!result) {
      throw ErrorFactory.notFound('未找到匹配的地址');
    }

    return {
      address: address,
      location: {
        longitude: result.location.lng,
        latitude: result.location.lat
      },
      level: result.level?.toString()
    };
  }

  async reverseGeocode(longitude: number, latitude: number): Promise<AddressInfo> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('百度地图API未配置');
    }

    const response = await axios.get(`${this.baseUrl}/reverse_geocoding/v3`, {
      params: {
        ak: this.apiKey,
        location: `${latitude},${longitude}`,
        output: 'json',
        extensions_poi: 1
      },
      timeout: 5000
    });

    if (response.data.status !== 0) {
      throw ErrorFactory.badRequest('坐标解析失败');
    }

    const result = response.data.result;
    if (!result) {
      throw ErrorFactory.notFound('未找到匹配的地址');
    }

    const addressComponent = result.addressComponent;
    return {
      address: result.formatted_address,
      province: addressComponent.province,
      city: addressComponent.city,
      district: addressComponent.district,
      location: { longitude, latitude }
    };
  }

  async getCurrentLocation(ip?: string): Promise<AddressInfo> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('百度地图API未配置');
    }

    const response = await axios.get(`${this.baseUrl}/location/ip`, {
      params: {
        ak: this.apiKey,
        ip: ip || '',
        coor: 'bd09ll'
      },
      timeout: 5000
    });

    if (response.data.status !== 0) {
      throw ErrorFactory.badRequest('IP定位失败');
    }

    const content = response.data.content;
    return {
      address: content.address,
      province: content.address_detail.province,
      city: content.address_detail.city,
      location: {
        longitude: content.point.x,
        latitude: content.point.y
      }
    };
  }

  async searchPOI(keyword: string, city?: string): Promise<POIInfo[]> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('百度地图API未配置');
    }

    const response = await axios.get(`${this.baseUrl}/place/v2/search`, {
      params: {
        ak: this.apiKey,
        query: keyword,
        region: city || '全国',
        output: 'json',
        page_size: 20,
        page_num: 0
      },
      timeout: 5000
    });

    if (response.data.status !== 0) {
      throw ErrorFactory.badRequest('POI搜索失败');
    }

    const results = response.data.results || [];
    return results.map((poi: any) => ({
      id: poi.uid,
      name: poi.name,
      type: poi.detail_info?.tag || '未知',
      address: poi.address,
      location: {
        longitude: poi.location.lng,
        latitude: poi.location.lat
      },
      tel: poi.telephone
    }));
  }
}

/**
 * 地理位置服务类
 * 支持多个免费地图服务提供商，自动降级处理
 */
export class LocationService {
  private providers: MapProvider[];
  private currentProvider: MapProvider | null = null;

  constructor() {
    // 初始化地图服务提供商（按优先级排序）
    this.providers = [
      new AmapProvider(),
      new BaiduProvider()
    ];
    
    // 选择第一个可用的提供商
    this.selectProvider();
  }

  /**
   * 选择可用的地图服务提供商
   */
  private selectProvider(): void {
    this.currentProvider = this.providers.find(provider => provider.isConfigured) || null;
    
    if (this.currentProvider) {
      winstonLogger.info(`地理位置服务已启用: ${this.currentProvider.name}`);
    } else {
      winstonLogger.warn('未配置任何地图服务API，地理位置功能将受限');
    }
  }

  /**
   * 获取当前使用的提供商信息
   */
  getCurrentProvider(): string | null {
    return this.currentProvider?.name || null;
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return !!this.currentProvider;
  }

  /**
   * 地址解析（地址转坐标）
   * @param address 地址字符串
   * @returns 坐标信息
   */
  async geocode(address: string): Promise<AddressInfo> {
    if (!this.isAvailable()) {
      throw ErrorFactory.serviceUnavailable('地理位置服务未配置');
    }

    // 检查缓存
    const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}geocode:${address}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.currentProvider!.geocode(address);
      
      // 缓存结果
      await cache.set(cacheKey, result, CACHE_TTL.LONG);
      
      winstonLogger.info('地址解析成功', {
        provider: this.currentProvider!.name,
        address,
        location: result.location
      });
      
      return result;
    } catch (error) {
      winstonLogger.error('地址解析失败', {
        provider: this.currentProvider!.name,
        address,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 逆地址解析（坐标转地址）
   * @param longitude 经度
   * @param latitude 纬度
   * @returns 地址信息
   */
  async reverseGeocode(longitude: number, latitude: number): Promise<AddressInfo> {
    if (!this.isAvailable()) {
      throw ErrorFactory.serviceUnavailable('地理位置服务未配置');
    }

    // 验证坐标格式
    if (!this.validateCoordinates(longitude, latitude)) {
      throw ErrorFactory.badRequest('坐标格式不正确');
    }

    // 检查缓存
    const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}reverse:${longitude},${latitude}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.currentProvider!.reverseGeocode(longitude, latitude);
      
      // 缓存结果
      await cache.set(cacheKey, result, CACHE_TTL.LONG);
      
      winstonLogger.info('逆地址解析成功', {
        provider: this.currentProvider!.name,
        coordinates: { longitude, latitude },
        address: result.address
      });
      
      return result;
    } catch (error) {
      winstonLogger.error('逆地址解析失败', {
        provider: this.currentProvider!.name,
        coordinates: { longitude, latitude },
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 获取当前位置（基于IP）
   * @param ip IP地址
   * @returns 位置信息
   */
  async getCurrentLocation(ip?: string): Promise<AddressInfo> {
    if (!this.isAvailable()) {
      throw ErrorFactory.serviceUnavailable('地理位置服务未配置');
    }

    // 检查缓存
    const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}ip:${ip || 'auto'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.currentProvider!.getCurrentLocation(ip);
      
      // 缓存结果（较短时间）
      await cache.set(cacheKey, result, CACHE_TTL.MEDIUM);
      
      winstonLogger.info('IP定位成功', {
        provider: this.currentProvider!.name,
        ip: ip || 'auto',
        location: result
      });
      
      return result;
    } catch (error) {
      winstonLogger.error('IP定位失败', {
        provider: this.currentProvider!.name,
        ip: ip || 'auto',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * POI搜索
   * @param keyword 搜索关键词
   * @param city 城市（可选）
   * @param page 页码
   * @param limit 每页数量
   * @returns POI列表
   */
  async searchPOI(
    keyword: string, 
    city?: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ pois: POIInfo[]; total: number }> {
    if (!this.isAvailable()) {
      throw ErrorFactory.serviceUnavailable('地理位置服务未配置');
    }

    // 检查缓存
    const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}poi:${keyword}:${city || 'all'}:${page}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const pois = await this.currentProvider!.searchPOI(keyword, city);
      
      // 分页处理
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const pagedPois = pois.slice(startIndex, endIndex);
      
      const result = {
        pois: pagedPois,
        total: pois.length
      };
      
      // 缓存结果
      await cache.set(cacheKey, result, CACHE_TTL.MEDIUM);
      
      winstonLogger.info('POI搜索成功', {
        provider: this.currentProvider!.name,
        keyword,
        city,
        total: pois.length
      });
      
      return result;
    } catch (error) {
      winstonLogger.error('POI搜索失败', {
        provider: this.currentProvider!.name,
        keyword,
        city,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 地址搜索建议
   * @param input 输入文本
   * @param city 城市（可选）
   * @returns 地址建议列表
   */
  async searchAddress(
    input: string, 
    city?: string
  ): Promise<AddressInfo[]> {
    if (!this.isAvailable()) {
      throw ErrorFactory.serviceUnavailable('地理位置服务未配置');
    }

    // 检查缓存
    const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}address:${input}:${city || 'all'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 使用POI搜索实现地址搜索
      const { pois } = await this.searchPOI(input, city, 1, 10);
      
      const addresses = pois.map(poi => ({
        address: poi.address,
        province: poi.address.split(/省|市|区|县/)[0] || '',
        city: city || poi.address.split(/省|市|区|县/)[1] || '',
        location: poi.location
      }));
      
      // 缓存结果
      await cache.set(cacheKey, addresses, CACHE_TTL.MEDIUM);
      
      return addresses;
    } catch (error) {
      winstonLogger.error('地址搜索失败', {
        provider: this.currentProvider!.name,
        input,
        city,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 计算两点间距离
   * @param point1 起点坐标
   * @param point2 终点坐标
   * @returns 距离（米）
   */
  calculateDistance(
    point1: Coordinate, 
    point2: Coordinate
  ): number {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 计算多个坐标点的中心点
   * @param coordinates 坐标点数组
   * @returns 中心点坐标
   */
  calculateCenter(coordinates: Coordinate[]): Coordinate {
    if (coordinates.length === 0) {
      throw ErrorFactory.badRequest('坐标点数组不能为空');
    }

    if (coordinates.length === 1) {
      return coordinates[0];
    }

    let totalLat = 0;
    let totalLon = 0;
    
    coordinates.forEach(coord => {
      totalLat += coord.latitude;
      totalLon += coord.longitude;
    });

    return {
      latitude: totalLat / coordinates.length,
      longitude: totalLon / coordinates.length
    };
  }

  /**
   * 检查点是否在多边形内
   * @param point 检查的点
   * @param polygon 多边形顶点数组
   * @returns 是否在内部
   */
  isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude;
      const yi = polygon[i].latitude;
      const xj = polygon[j].longitude;
      const yj = polygon[j].latitude;
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * 获取附近的POI
   * @param longitude 经度
   * @param latitude 纬度
   * @param radius 搜索半径（米）
   * @param type POI类型
   * @returns 附近POI列表
   */
  async getNearbyPOI(
    longitude: number,
    latitude: number,
    radius: number = 1000,
    type?: string
  ): Promise<POIInfo[]> {
    if (!this.isAvailable()) {
      throw ErrorFactory.serviceUnavailable('地理位置服务未配置');
    }

    // 验证坐标格式
    if (!this.validateCoordinates(longitude, latitude)) {
      throw ErrorFactory.badRequest('坐标格式不正确');
    }

    // 检查缓存
    const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}nearby:${longitude},${latitude}:${radius}:${type || 'all'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 先进行逆地理编码获取地址信息
      const addressInfo = await this.reverseGeocode(longitude, latitude);
      
      // 然后在附近搜索POI
      const keyword = type || '生活服务';
      const { pois } = await this.searchPOI(keyword, addressInfo.city);
      
      // 计算距离并过滤
      const nearbyPois = pois
        .map(poi => {
          const distance = this.calculateDistance(
            { longitude, latitude },
            poi.location
          );
          return { ...poi, distance };
        })
        .filter(poi => poi.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
      
      // 缓存结果
      await cache.set(cacheKey, nearbyPois, CACHE_TTL.MEDIUM);
      
      winstonLogger.info('附近POI搜索成功', {
        provider: this.currentProvider!.name,
        coordinates: { longitude, latitude },
        radius,
        type,
        count: nearbyPois.length
      });
      
      return nearbyPois;
    } catch (error) {
      winstonLogger.error('附近POI搜索失败', {
        provider: this.currentProvider!.name,
        coordinates: { longitude, latitude },
        radius,
        type,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 角度转弧度
   * @param degrees 角度
   * @returns 弧度
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 验证坐标格式
   * @param longitude 经度
   * @param latitude 纬度
   * @returns 是否有效
   */
  validateCoordinates(longitude: number, latitude: number): boolean {
    return longitude >= -180 && longitude <= 180 && 
           latitude >= -90 && latitude <= 90;
  }

  /**
   * 获取服务状态信息
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      provider: this.getCurrentProvider(),
      providers: this.providers.map(p => ({
        name: p.name,
        configured: p.isConfigured
      }))
    };
  }
}

// 导出服务实例
export const locationService = new LocationService();