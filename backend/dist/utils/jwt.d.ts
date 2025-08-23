/**
 * 生成访问令牌和刷新令牌
 * @param userId 用户ID
 * @returns 包含访问令牌和刷新令牌的对象
 */
export declare function generateToken(userId: string): {
    accessToken: string;
    refreshToken: string;
};
/**
 * 验证访问令牌
 * @param token 访问令牌
 * @returns 解码后的令牌数据
 */
export declare function verifyAccessToken(token: string): {
    userId: string;
    type: string;
    iat: number;
    exp: number;
};
/**
 * 验证刷新令牌
 * @param token 刷新令牌
 * @returns 解码后的令牌数据
 */
export declare function verifyRefreshToken(token: string): {
    userId: string;
    type: string;
    iat: number;
    exp: number;
};
/**
 * 从请求头中提取Bearer令牌
 * @param authHeader Authorization请求头
 * @returns 提取的令牌，如果没有则返回null
 */
export declare function extractBearerToken(authHeader: string | undefined): string | null;
/**
 * 检查令牌是否即将过期（在指定时间内）
 * @param token 令牌
 * @param thresholdMinutes 阈值分钟数，默认30分钟
 * @returns 是否即将过期
 */
export declare function isTokenExpiringSoon(token: string, thresholdMinutes?: number): boolean;
/**
 * 生成用于OAuth状态验证的随机字符串
 * @param length 字符串长度，默认32
 * @returns 随机字符串
 */
export declare function generateOAuthState(length?: number): string;
/**
 * 令牌类型枚举
 */
export declare enum TokenType {
    ACCESS = "access",
    REFRESH = "refresh"
}
/**
 * JWT令牌接口
 */
export interface JWTPayload {
    userId: string;
    type: TokenType;
    iat: number;
    exp: number;
}
/**
 * 令牌对接口
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
//# sourceMappingURL=jwt.d.ts.map