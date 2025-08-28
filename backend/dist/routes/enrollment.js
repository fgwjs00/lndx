"use strict";
/**
 * 报名管理路由
 * @description 处理学生报名相关的操作
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * 获取报名列表
 * GET /api/enrollments
 */
router.get('/', auth_1.requireTeacher, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // TODO: 实现报名列表查询
    res.json({
        code: 200,
        message: '报名列表查询成功',
        data: {
            list: [],
            pagination: {
                page: 1,
                pageSize: 10,
                total: 0,
                totalPages: 0
            }
        }
    });
}));
/**
 * 创建报名
 * POST /api/enrollments
 */
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // TODO: 实现学生报名
    res.json({
        code: 200,
        message: '报名成功',
        data: {}
    });
}));
/**
 * 审核报名
 * PATCH /api/enrollments/:id/approve
 */
router.patch('/:id/approve', auth_1.requireTeacher, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // TODO: 实现报名审核
    res.json({
        code: 200,
        message: '报名审核成功',
        data: {}
    });
}));
exports.default = router;
//# sourceMappingURL=enrollment.js.map