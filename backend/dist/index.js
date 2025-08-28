"use strict";
/**
 * 学生报名及档案管理系统后端服务
 * @description 基于Express + TypeScript + Prisma的后端API服务
 * @author LNDX Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const morgan_1 = tslib_1.__importDefault(require("morgan"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const path_1 = tslib_1.__importDefault(require("path"));
// 导入配置和中间件
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const auth_1 = require("./middleware/auth");
const logger_1 = require("./utils/logger");
const swagger_1 = require("./utils/swagger");
// 导入路由
const auth_2 = tslib_1.__importDefault(require("./routes/auth"));
const user_1 = tslib_1.__importDefault(require("./routes/user"));
const student_1 = tslib_1.__importDefault(require("./routes/student"));
const course_1 = tslib_1.__importDefault(require("./routes/course"));
const enrollment_1 = tslib_1.__importDefault(require("./routes/enrollment"));
const application_1 = tslib_1.__importDefault(require("./routes/application"));
const applicationV2_1 = tslib_1.__importDefault(require("./routes/applicationV2"));
const gradeManagement_1 = tslib_1.__importDefault(require("./routes/gradeManagement"));
const attendance_1 = tslib_1.__importDefault(require("./routes/attendance"));
const upload_1 = tslib_1.__importDefault(require("./routes/upload"));
const search_1 = tslib_1.__importDefault(require("./routes/search"));
const role_1 = tslib_1.__importDefault(require("./routes/role"));
const analysis_1 = tslib_1.__importDefault(require("./routes/analysis"));
// 加载环境变量
dotenv_1.default.config();
/**
 * 创建Express应用实例
 */
const app = (0, express_1.default)();
/**
 * 基础中间件配置
 */
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // 安全头设置
app.use((0, compression_1.default)()); // 响应压缩
app.use((0, cors_1.default)({
    origin: config_1.config.corsOrigin,
    credentials: true
})); // 跨域配置
app.use(express_1.default.json({ limit: '10mb' })); // JSON解析
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析
app.use((0, morgan_1.default)('combined', { stream: { write: message => logger_1.logger.info(message.trim()) } })); // 日志记录
/**
 * 安全中间件
 */
app.use(rateLimiter_1.rateLimiter); // API限流
/**
 * API路由配置
 */
const apiPrefix = config_1.config.apiPrefix || '/api';
/**
 * API文档设置
 */
(0, swagger_1.setupSwagger)(app);
/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
// API前缀下的健康检查
app.get(`${apiPrefix}/health`, (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
            database: 'healthy',
            api: 'healthy'
        }
    });
});
/**
 * 静态文件服务 - 用于提供上传的图片文件
 */
app.use('/uploads', (0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000', config_1.config.corsOrigin].filter(Boolean),
    credentials: true,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}), express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// 公开路由（不需要认证）
app.use(`${apiPrefix}/auth`, auth_2.default);
app.use(`${apiPrefix}/upload`, upload_1.default); // 文件上传（身份证识别等）
// 需要认证的路由
app.use(`${apiPrefix}/users`, auth_1.authMiddleware, user_1.default);
app.use(`${apiPrefix}/students`, auth_1.authMiddleware, student_1.default);
app.use(`${apiPrefix}/courses`, auth_1.authMiddleware, course_1.default);
app.use(`${apiPrefix}/enrollments`, auth_1.authMiddleware, enrollment_1.default);
app.use(`${apiPrefix}/applications`, auth_1.authMiddleware, application_1.default); // 报名申请路由
app.use(`${apiPrefix}/applications-v2`, applicationV2_1.default); // 新版报名申请路由（含年级管理）
app.use(`${apiPrefix}/attendance`, auth_1.authMiddleware, attendance_1.default);
app.use(`${apiPrefix}/analysis`, auth_1.authMiddleware, analysis_1.default); // 数据分析路由
app.use(`${apiPrefix}/roles`, auth_1.authMiddleware, role_1.default); // 角色管理路由
app.use(`${apiPrefix}/grade-management`, auth_1.authMiddleware, gradeManagement_1.default); // 年级管理路由
app.use(`${apiPrefix}/search`, search_1.default);
/**
 * 404处理
 */
app.use('*', (req, res) => {
    res.status(404).json({
        code: 404,
        message: `API接口 ${req.method} ${req.originalUrl} 不存在`,
        timestamp: new Date().toISOString()
    });
});
/**
 * 全局错误处理
 */
app.use(errorHandler_1.errorHandler);
/**
 * 启动服务器
 */
const port = config_1.config.port || 3000;
const server = app.listen(port, () => {
    logger_1.logger.info(`🚀 服务器启动成功！`);
    logger_1.logger.info(`📍 服务地址: http://localhost:${port}`);
    logger_1.logger.info(`🌍 环境模式: ${config_1.config.nodeEnv}`);
    logger_1.logger.info(`📁 API前缀: ${apiPrefix}`);
    logger_1.logger.info(`⏰ 启动时间: ${new Date().toISOString()}`);
});
/**
 * 优雅关闭处理
 */
process.on('SIGTERM', () => {
    logger_1.logger.info('收到SIGTERM信号，开始优雅关闭服务器...');
    server.close(() => {
        logger_1.logger.info('服务器已关闭');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('收到SIGINT信号，开始优雅关闭服务器...');
    server.close(() => {
        logger_1.logger.info('服务器已关闭');
        process.exit(0);
    });
});
/**
 * 未捕获异常处理
 */
process.on('uncaughtException', (error) => {
    logger_1.logger.error('未捕获的异常:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('未处理的Promise拒绝:', { reason, promise });
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map