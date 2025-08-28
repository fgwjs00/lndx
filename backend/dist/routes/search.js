"use strict";
/**
 * 搜索API路由
 * @description 提供全文搜索功能的API接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const searchService_1 = require("../services/searchService");
const logger_1 = require("../utils/logger");
const joi_1 = tslib_1.__importDefault(require("joi"));
const router = (0, express_1.Router)();
// 搜索专用限流器
const searchLimiter = (0, rateLimiter_1.createLimiter)(60 * 1000, // 1分钟
30, // 最多30次搜索
'搜索过于频繁，请稍后再试');
/**
 * @swagger
 * /search/global:
 *   get:
 *     tags: [搜索功能]
 *     summary: 全局搜索
 *     description: 在学生、课程、教师中进行全文搜索
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *         description: 搜索关键词
 *         example: "舞蹈"
 *       - in: query
 *         name: types
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [student, course, teacher]
 *         description: 搜索类型
 *         example: ["student", "course"]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: 结果数量限制
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含已停用的记录
 *     responses:
 *       200:
 *         description: 搜索成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "搜索完成"
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [student, course, teacher]
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           subtitle:
 *                             type: string
 *                           description:
 *                             type: string
 *                           relevanceScore:
 *                             type: number
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalResults:
 *                           type: integer
 *                         searchTime:
 *                           type: integer
 *                           description: 搜索耗时（毫秒）
 *                         breakdown:
 *                           type: object
 *                           properties:
 *                             students:
 *                               type: integer
 *                             courses:
 *                               type: integer
 *                             teachers:
 *                               type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/TooManyRequestsError'
 */
router.get('/global', auth_1.authMiddleware, searchLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // 参数验证
    const schema = joi_1.default.object({
        q: joi_1.default.string().min(2).max(50).required().messages({
            'string.min': '搜索关键词至少2个字符',
            'string.max': '搜索关键词不能超过50个字符',
            'any.required': '搜索关键词不能为空'
        }),
        types: joi_1.default.array()
            .items(joi_1.default.string().valid('student', 'course', 'teacher'))
            .default(['student', 'course', 'teacher'])
            .messages({
            'array.includes': '搜索类型只能是student、course或teacher'
        }),
        limit: joi_1.default.number().integer().min(1).max(50).default(20).messages({
            'number.min': '结果数量不能少于1',
            'number.max': '结果数量不能超过50'
        }),
        includeInactive: joi_1.default.boolean().default(false)
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
        throw new errorHandler_1.ValidationError('参数验证失败', error.details);
    }
    const { q: keyword, types, limit, includeInactive } = value;
    // 执行搜索
    const { results, stats } = await searchService_1.searchService.globalSearch(keyword, {
        types,
        limit,
        includeInactive
    });
    // 记录搜索日志
    logger_1.businessLogger.userAction(req.user.id, 'GLOBAL_SEARCH', {
        keyword,
        types,
        totalResults: stats.totalResults,
        searchTime: stats.searchTime
    });
    res.json({
        code: 200,
        message: '搜索完成',
        data: {
            results,
            stats
        }
    });
}));
/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     tags: [搜索功能]
 *     summary: 搜索建议
 *     description: 获取搜索关键词建议
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 20
 *         description: 搜索前缀
 *         example: "舞"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: 建议数量
 *     responses:
 *       200:
 *         description: 获取建议成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "获取搜索建议成功"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["舞蹈基础", "舞蹈进阶", "舞蹈表演"]
 */
router.get('/suggestions', auth_1.authMiddleware, searchLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schema = joi_1.default.object({
        q: joi_1.default.string().min(1).max(20).required().messages({
            'string.min': '搜索前缀至少1个字符',
            'string.max': '搜索前缀不能超过20个字符',
            'any.required': '搜索前缀不能为空'
        }),
        limit: joi_1.default.number().integer().min(1).max(20).default(10)
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
        throw new errorHandler_1.ValidationError('参数验证失败', error.details);
    }
    const { q: keyword, limit } = value;
    const suggestions = await searchService_1.searchService.searchSuggestions(keyword, limit);
    res.json({
        code: 200,
        message: '获取搜索建议成功',
        data: suggestions
    });
}));
/**
 * @swagger
 * /search/hot-terms:
 *   get:
 *     tags: [搜索功能]
 *     summary: 热门搜索词
 *     description: 获取热门搜索关键词
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: 热门词数量
 *     responses:
 *       200:
 *         description: 获取热门搜索词成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "获取热门搜索词成功"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["舞蹈", "钢琴", "声乐", "美术"]
 */
router.get('/hot-terms', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schema = joi_1.default.object({
        limit: joi_1.default.number().integer().min(1).max(20).default(10)
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
        throw new errorHandler_1.ValidationError('参数验证失败', error.details);
    }
    const { limit } = value;
    const hotTerms = await searchService_1.searchService.getHotSearchTerms(limit);
    res.json({
        code: 200,
        message: '获取热门搜索词成功',
        data: hotTerms
    });
}));
/**
 * @swagger
 * /search/students:
 *   get:
 *     tags: [搜索功能]
 *     summary: 学生专项搜索
 *     description: 在学生信息中进行专项搜索
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: 搜索关键词
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 结果数量
 *     responses:
 *       200:
 *         description: 学生搜索成功
 */
router.get('/students', auth_1.authMiddleware, searchLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schema = joi_1.default.object({
        q: joi_1.default.string().min(2).required(),
        limit: joi_1.default.number().integer().min(1).max(50).default(20)
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
        throw new errorHandler_1.ValidationError('参数验证失败', error.details);
    }
    const { q: keyword, limit } = value;
    const { results, stats } = await searchService_1.searchService.globalSearch(keyword, {
        types: ['student'],
        limit
    });
    logger_1.businessLogger.userAction(req.user.id, 'STUDENT_SEARCH', {
        keyword,
        totalResults: stats.totalResults
    });
    res.json({
        code: 200,
        message: '学生搜索完成',
        data: {
            results,
            stats
        }
    });
}));
/**
 * @swagger
 * /search/courses:
 *   get:
 *     tags: [搜索功能]
 *     summary: 课程专项搜索
 *     description: 在课程信息中进行专项搜索
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: 搜索关键词
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 课程分类过滤
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 结果数量
 *     responses:
 *       200:
 *         description: 课程搜索成功
 */
router.get('/courses', auth_1.authMiddleware, searchLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schema = joi_1.default.object({
        q: joi_1.default.string().min(2).required(),
        category: joi_1.default.string().optional(),
        limit: joi_1.default.number().integer().min(1).max(50).default(20)
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
        throw new errorHandler_1.ValidationError('参数验证失败', error.details);
    }
    const { q: keyword, category, limit } = value;
    // 如果指定了分类，可以在这里添加分类过滤逻辑
    const { results, stats } = await searchService_1.searchService.globalSearch(keyword, {
        types: ['course'],
        limit
    });
    logger_1.businessLogger.userAction(req.user.id, 'COURSE_SEARCH', {
        keyword,
        category,
        totalResults: stats.totalResults
    });
    res.json({
        code: 200,
        message: '课程搜索完成',
        data: {
            results,
            stats
        }
    });
}));
exports.default = router;
//# sourceMappingURL=search.js.map