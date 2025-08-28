"use strict";
/**
 * 考勤管理路由
 * @description 处理学生签到考勤相关的操作
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * 获取考勤记录列表
 * GET /api/attendance
 */
router.get('/', auth_1.requireTeacher, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // TODO: 实现考勤记录查询
    res.json({
        code: 200,
        message: '考勤记录查询成功',
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
 * 创建签到记录
 * POST /api/attendance
 */
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // TODO: 实现学生签到
    res.json({
        code: 200,
        message: '签到成功',
        data: {}
    });
}));
/**
 * 人脸识别签到
 * POST /api/attendance/face-recognition
 */
router.post('/face-recognition', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // TODO: 实现人脸识别签到
    res.json({
        code: 200,
        message: '人脸识别签到成功',
        data: {}
    });
}));
exports.default = router;
//# sourceMappingURL=attendance.js.map