"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const locationService_1 = require("..//services/locationService");
const errorHandler_1 = require("..//utils/errorHandler");
const router = express_1.default.Router();
// 地址解析
router.get('/geocode', async (req, res, next) => {
    try {
        const { address } = req.query;
        if (!address || typeof address !== 'string') {
            throw new errorHandler_1.AppError('缺少地址参数', 400, 'MISSING_ADDRESS');
        }
        const locations = await locationService_1.locationService.geocode(address);
        res.json({
            success: true,
            data: locations
        });
    }
    catch (error) {
        next(error);
    }
});
// 逆地理编码
router.get('/reverse-geocode', async (req, res, next) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            throw new errorHandler_1.AppError('缺少经纬度参数', 400, 'MISSING_COORDINATES');
        }
        const location = await locationService_1.locationService.reverseGeocode(parseFloat(lat), parseFloat(lng));
        res.json({
            success: true,
            data: location
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取当前位置（基于IP）
router.get('/current', async (req, res, next) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        const location = await locationService_1.locationService.getCurrentLocation(clientIP);
        res.json({
            success: true,
            data: location
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=location.js.map