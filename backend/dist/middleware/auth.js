"use strict";
/**
 * 认证和权限中间件
 * @description 处理JWT认证和基于角色的权限控制
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateToken = exports.requireOwnerOrAdmin = exports.requireTeacher = exports.requireAdmin = exports.requireRoles = exports.requirePermission = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * 权限配置映射
 */
const ROLE_PERMISSIONS = {
    SUPER_ADMIN: ['*'], // 超级管理员拥有所有权限
    SCHOOL_ADMIN: [
        'user:read', 'user:create', 'user:update',
        'student:*',
        'teacher:*',
        'course:*',
        'enrollment:*',
        'attendance:*',
        'analysis:read',
        'setting:read', 'setting:update'
    ],
    TEACHER: [
        'student:read', 'student:create', 'student:update',
        'course:read',
        'enrollment:read', 'enrollment:create', 'enrollment:update',
        'attendance:*',
        'profile:read', 'profile:update'
    ],
    STUDENT: [
        'profile:read', 'profile:update',
        'course:read',
        'enrollment:read', 'enrollment:create'
    ]
};
/**
 * 验证JWT Token
 * @param token JWT Token字符串
 * @returns 解码后的用户信息
 */
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errorHandler_1.AuthError('Token已过期，请重新登录');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errorHandler_1.AuthError('Token无效，请重新登录');
        }
        else {
            throw new errorHandler_1.AuthError('Token验证失败');
        }
    }
};
/**
 * 从请求中提取Token
 * @param req Express请求对象
 * @returns Token字符串或null
 */
const extractToken = (req) => {
    // 从Authorization header中提取
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // 从查询参数中提取（用于某些特殊场景）
    if (req.query.token && typeof req.query.token === 'string') {
        return req.query.token;
    }
    return null;
};
/**
 * 认证中间件
 * @description 验证用户身份，将用户信息附加到req.user
 */
const authMiddleware = async (req, res, next) => {
    try {
        console.log('🔐 认证中间件开始处理:', req.method, req.url);
        // 提取Token
        const token = extractToken(req);
        console.log('🔍 Token提取结果:', token ? `存在(${token.substring(0, 20)}...)` : '不存在');
        if (!token) {
            console.log('❌ 认证失败: 缺少Token');
            throw new errorHandler_1.AuthError('缺少认证Token，请先登录');
        }
        // 验证Token
        console.log('🔍 开始验证Token...');
        const payload = verifyToken(token);
        console.log('✅ Token验证成功, 用户ID:', payload.userId);
        // 从数据库获取最新用户信息
        console.log('🔍 开始查询用户信息...');
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                phone: true,
                email: true,
                realName: true,
                role: true,
                isActive: true,
                lastLoginAt: true
            }
        });
        if (!user) {
            console.log('❌ 认证失败: 用户不存在');
            throw new errorHandler_1.AuthError('用户不存在，请重新登录');
        }
        if (!user.isActive) {
            console.log('❌ 认证失败: 账号已被禁用');
            throw new errorHandler_1.AuthError('账号已被禁用，请联系管理员');
        }
        console.log('✅ 用户信息验证成功:', user.realName, user.role);
        // 将用户信息附加到请求对象
        req.user = {
            ...user,
            email: user.email || undefined
        };
        // 记录用户访问日志
        logger_1.businessLogger.userAction(user.id, 'API_ACCESS', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        console.log('✅ 认证中间件处理完成，传递给下一个处理器');
        next();
    }
    catch (error) {
        console.log('❌ 认证中间件发生错误:', error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
/**
 * 可选认证中间件
 * @description 如果有Token则验证，没有则继续执行（不抛出错误）
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (token) {
            const payload = verifyToken(token);
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: {
                    id: true,
                    phone: true,
                    email: true,
                    realName: true,
                    role: true,
                    isActive: true
                }
            });
            if (user && user.isActive) {
                req.user = {
                    ...user,
                    email: user.email || undefined
                };
            }
        }
        next();
    }
    catch (error) {
        // 可选认证模式下，认证失败不抛出错误
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
/**
 * 检查用户是否有指定权限
 * @param userRole 用户角色
 * @param requiredPermission 需要的权限
 * @returns 是否有权限
 */
const hasPermission = (userRole, requiredPermission) => {
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    // 检查通配符权限
    if (userPermissions.includes('*')) {
        return true;
    }
    // 检查精确权限匹配
    if (userPermissions.includes(requiredPermission)) {
        return true;
    }
    // 检查资源级通配符权限 (如 student:*)
    const [resource] = requiredPermission.split(':');
    if (userPermissions.includes(`${resource}:*`)) {
        return true;
    }
    return false;
};
/**
 * 权限验证中间件工厂函数
 * @param requiredPermission 需要的权限
 * @returns 权限验证中间件
 */
const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthError('请先登录');
            }
            if (!hasPermission(req.user.role, requiredPermission)) {
                logger_1.logger.warn('权限验证失败', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredPermission,
                    url: req.url,
                    method: req.method
                });
                throw new errorHandler_1.PermissionError(`权限不足，需要权限: ${requiredPermission}`);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requirePermission = requirePermission;
/**
 * 角色验证中间件工厂函数
 * @param allowedRoles 允许的角色列表
 * @returns 角色验证中间件
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthError('请先登录');
            }
            if (!allowedRoles.includes(req.user.role)) {
                logger_1.logger.warn('角色验证失败', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    allowedRoles,
                    url: req.url,
                    method: req.method
                });
                throw new errorHandler_1.PermissionError(`权限不足，需要角色: ${allowedRoles.join(' 或 ')}`);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireRoles = requireRoles;
/**
 * 管理员权限验证中间件
 */
exports.requireAdmin = (0, exports.requireRoles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SCHOOL_ADMIN);
/**
 * 教师及以上权限验证中间件
 */
exports.requireTeacher = (0, exports.requireRoles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SCHOOL_ADMIN, client_1.UserRole.TEACHER);
/**
 * 资源所有者验证中间件工厂函数
 * @description 验证用户是否为资源的所有者或管理员
 * @param getResourceUserId 获取资源所有者ID的函数
 */
const requireOwnerOrAdmin = (getResourceUserId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthError('请先登录');
            }
            // 管理员跳过所有者检查
            if (req.user.role === client_1.UserRole.SUPER_ADMIN || req.user.role === client_1.UserRole.SCHOOL_ADMIN) {
                return next();
            }
            const resourceUserId = await getResourceUserId(req);
            if (!resourceUserId) {
                throw new errorHandler_1.PermissionError('资源不存在或无法访问');
            }
            if (resourceUserId !== req.user.id) {
                throw new errorHandler_1.PermissionError('只能访问自己的资源');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireOwnerOrAdmin = requireOwnerOrAdmin;
/**
 * 生成JWT Token
 * @param user 用户信息
 * @returns Token字符串
 */
const generateToken = (user) => {
    const payload = {
        userId: user.id,
        phone: user.phone,
        role: user.role
    };
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, {
        expiresIn: config_1.config.jwtExpiresIn
    });
};
exports.generateToken = generateToken;
/**
 * 生成刷新Token
 * @param user 用户信息
 * @returns 刷新Token字符串
 */
const generateRefreshToken = (user) => {
    const payload = {
        userId: user.id,
        phone: user.phone,
        role: user.role
    };
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, {
        expiresIn: config_1.config.jwtRefreshExpiresIn
    });
};
exports.generateRefreshToken = generateRefreshToken;
//# sourceMappingURL=auth.js.map