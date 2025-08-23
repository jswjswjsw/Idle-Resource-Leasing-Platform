/**
 * 地理位置服务类
 * 提供地址解析、逆地址解析等地理位置相关功能
 */
export declare class LocationService {
    private readonly apiKey;
    private readonly baseUrl;
    constructor();
    /**
     * 地址解析（地址转坐标）
     * @param address 地址字符串
     * @returns 坐标信息
     */
    geocode(address: string): Promise<any>;
    /**
     * 逆地址解析（坐标转地址）
     * @param longitude 经度
     * @param latitude 纬度
     * @returns 地址信息
     */
    reverseGeocode(longitude: number, latitude: number): Promise<any>;
    /**
     * 获取当前位置（基于IP）
     * @param ip IP地址
     * @returns 位置信息
     */
    getCurrentLocation(ip?: string): Promise<any>;
    /**
     * 计算两点间距离
     * @param lon1 起点经度
     * @param lat1 起点纬度
     * @param lon2 终点经度
     * @param lat2 终点纬度
     * @returns 距离（米）
     */
    calculateDistance(lon1: number, lat1: number, lon2: number, lat2: number): number;
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
}
export declare const locationService: LocationService;
//# sourceMappingURL=locationService.d.ts.map