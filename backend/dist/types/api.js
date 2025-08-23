"use strict";
/**
 * API响应类型定义
 * 统一API响应格式，确保前后端数据交互的一致性
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = exports.HttpStatus = void 0;
/**
 * 常用HTTP状态码
 */
var HttpStatus;
(function (HttpStatus) {
    HttpStatus[HttpStatus["OK"] = 200] = "OK";
    HttpStatus[HttpStatus["CREATED"] = 201] = "CREATED";
    HttpStatus[HttpStatus["NO_CONTENT"] = 204] = "NO_CONTENT";
    HttpStatus[HttpStatus["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatus[HttpStatus["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatus[HttpStatus["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatus[HttpStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatus[HttpStatus["CONFLICT"] = 409] = "CONFLICT";
    HttpStatus[HttpStatus["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
    HttpStatus[HttpStatus["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    HttpStatus[HttpStatus["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(HttpStatus || (exports.HttpStatus = HttpStatus = {}));
/**
 * 常用错误代码
 */
var ErrorCode;
(function (ErrorCode) {
    // 认证相关
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["TOKEN_INVALID"] = "TOKEN_INVALID";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    // 用户相关
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["USER_ALREADY_EXISTS"] = "USER_ALREADY_EXISTS";
    ErrorCode["EMAIL_ALREADY_EXISTS"] = "EMAIL_ALREADY_EXISTS";
    ErrorCode["PHONE_ALREADY_EXISTS"] = "PHONE_ALREADY_EXISTS";
    // 资源相关
    ErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCode["RESOURCE_UNAVAILABLE"] = "RESOURCE_UNAVAILABLE";
    ErrorCode["RESOURCE_ALREADY_RENTED"] = "RESOURCE_ALREADY_RENTED";
    // 订单相关
    ErrorCode["ORDER_NOT_FOUND"] = "ORDER_NOT_FOUND";
    ErrorCode["ORDER_CANNOT_BE_CANCELLED"] = "ORDER_CANNOT_BE_CANCELLED";
    ErrorCode["ORDER_ALREADY_PAID"] = "ORDER_ALREADY_PAID";
    // 支付相关
    ErrorCode["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    ErrorCode["PAYMENT_ALREADY_PROCESSED"] = "PAYMENT_ALREADY_PROCESSED";
    ErrorCode["INSUFFICIENT_BALANCE"] = "INSUFFICIENT_BALANCE";
    // 文件相关
    ErrorCode["FILE_TOO_LARGE"] = "FILE_TOO_LARGE";
    ErrorCode["INVALID_FILE_TYPE"] = "INVALID_FILE_TYPE";
    ErrorCode["FILE_UPLOAD_FAILED"] = "FILE_UPLOAD_FAILED";
    // 验证相关
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_PHONE_NUMBER"] = "INVALID_PHONE_NUMBER";
    ErrorCode["INVALID_EMAIL"] = "INVALID_EMAIL";
    ErrorCode["VERIFICATION_CODE_EXPIRED"] = "VERIFICATION_CODE_EXPIRED";
    ErrorCode["VERIFICATION_CODE_INVALID"] = "VERIFICATION_CODE_INVALID";
    // OAuth相关
    ErrorCode["OAUTH_ERROR"] = "OAUTH_ERROR";
    ErrorCode["OAUTH_ACCOUNT_ALREADY_BOUND"] = "OAUTH_ACCOUNT_ALREADY_BOUND";
    ErrorCode["OAUTH_ACCOUNT_NOT_FOUND"] = "OAUTH_ACCOUNT_NOT_FOUND";
    // 系统相关
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
//# sourceMappingURL=api.js.map