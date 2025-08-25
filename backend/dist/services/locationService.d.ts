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
 * 地理位置服务类
 * 支持多个免费地图服务提供商，自动降级处理
 */
export declare class LocationService {
    private providers;
    private currentProvider;
    constructor();
    /**
     * 选择可用的地图服务提供商
     */
    private selectProvider;
    /**
     * 获取当前使用的提供商信息
     */
    getCurrentProvider(): string | null;
    /**
     * 检查服务是否可用
     */
    isAvailable(): boolean;
    /**
     * 地址解析（地址转坐标）
     * @param address 地址字符串
     * @returns 坐标信息
     */
    geocode(address: string): Promise<AddressInfo>;
    /**
     * 逆地址解析（坐标转地址）
     * @param longitude 经度
     * @param latitude 纬度
     * @returns 地址信息
     */
    reverseGeocode(longitude: number, latitude: number): Promise<AddressInfo>;
    /**
     * 获取当前位置（基于IP）
     * @param ip IP地址
     * @returns 位置信息
     */
    getCurrentLocation(ip?: string): Promise<AddressInfo>;
    /**
     * POI搜索
     * @param keyword 搜索关键词
     * @param city 城市（可选）
     * @param page 页码
     * @param limit 每页数量
     * @returns POI列表
     */
    searchPOI(keyword: string, city?: string, page?: number, limit?: number): Promise<{
        pois: POIInfo[];
        total: number;
    }>;
    /**
     * 地址搜索建议
     * @param input 输入文本
     * @param city 城市（可选）
     * @returns 地址建议列表
     */
    searchAddress(input: string, city?: string): Promise<AddressInfo[]>;
    /**
     * 计算两点间距离
     * @param point1 起点坐标
     * @param point2 终点坐标
     * @returns 距离（米）
     */
    calculateDistance(point1: Coordinate, point2: Coordinate): number;
    /**
     * 计算多个坐标点的中心点
     * @param coordinates 坐标点数组
     * @returns 中心点坐标
     */
    calculateCenter(coordinates: Coordinate[]): Coordinate;
    /**
     * 检查点是否在多边形内
     * @param point 检查的点
     * @param polygon 多边形顶点数组
     * @returns 是否在内部
     */
    isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean;
    /**
     * 获取附近的POI
     * @param longitude 经度
     * @param latitude 纬度
     * @param radius 搜索半径（米）
     * @param type POI类型
     * @returns 附近POI列表
     */
    getNearbyPOI(longitude: number, latitude: number, radius?: number, type?: string): Promise<POIInfo[]>;
    /**
     * 角度转弧度
     * @param degrees 角度
     * @returns 弧度
     */
    private toRadians;
    /**
     * 验证坐标格式
     * @param longitude 经度
     * @param latitude 纬度
     * @returns 是否有效
     */
    validateCoordinates(longitude: number, latitude: number): boolean;
    /**
     * 获取服务状态信息
     */
    getStatus(): {
        available: boolean;
        provider: string | null;
        providers: {
            name: string;
            configured: boolean;
        }[];
    };
}
export declare const locationService: LocationService;
//# sourceMappingURL=locationService.d.ts.map