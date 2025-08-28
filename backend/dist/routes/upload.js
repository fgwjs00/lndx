"use strict";
/**
 * 文件上传路由
 * @description 处理文件上传相关操作（身份证识别、头像上传等）
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
/**
 * 身份证识别上传
 * POST /api/upload/id-card
 */
router.post('/id-card', rateLimiter_1.uploadLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // TODO: 实现身份证识别
    res.json({
        code: 200,
        message: '身份证识别成功',
        data: {
            name: '张三',
            idCard: '123456789012345678',
            address: '北京市朝阳区',
            imageFront: 'http://example.com/id-front.jpg',
            imageBack: 'http://example.com/id-back.jpg'
        }
    });
}));
/**
 * 头像上传
 * POST /api/upload/avatar
 */
router.post('/avatar', rateLimiter_1.uploadLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // TODO: 实现头像上传
    res.json({
        code: 200,
        message: '头像上传成功',
        data: {
            url: 'http://example.com/avatar.jpg'
        }
    });
}));
exports.default = router;
//# sourceMappingURL=upload.js.map