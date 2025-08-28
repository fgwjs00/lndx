"use strict";
/**
 * 全局错误处理中间件
 * @description 统一处理应用中的所有错误
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.ValidationError = exports.PermissionError = exports.AuthError = exports.BusinessError = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
/**
 * 自定义业务错误类
 */
class BusinessError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 400, code, details) {
        super(message);
        this.name = 'BusinessError';
        this.statusCode = statusCode;
        this.code = code || 'BUSINESS_ERROR';
        this.details = details;
    }
}
exports.BusinessError = BusinessError;
/**
 * 认证错误类
 */
class AuthError extends Error {
    statusCode = 401;
    code = 'AUTH_ERROR';
    constructor(message = '认证失败') {
        super(message);
        this.name = 'AuthError';
    }
}
exports.AuthError = AuthError;
/**
 * 权限错误类
 */
class PermissionError extends Error {
    statusCode = 403;
    code = 'PERMISSION_ERROR';
    constructor(message = '权限不足') {
        super(message);
        this.name = 'PermissionError';
    }
}
exports.PermissionError = PermissionError;
/**
 * 验证错误类
 */
class ValidationError extends Error {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    details;
    constructor(message, details) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
/**
 * 处理Prisma数据库错误
 * @param error Prisma错误对象
 * @returns 格式化的错误响应
 */
const handlePrismaError = (error) => {
    let message = '数据库操作失败';
    let statusCode = 500;
    let code = 'DATABASE_ERROR';
    switch (error.code) {
        case 'P2000':
            message = '输入数据过长';
            statusCode = 400;
            code = 'DATA_TOO_LONG';
            break;
        case 'P2002':
            message = '数据已存在，不能重复创建';
            statusCode = 409;
            code = 'DUPLICATE_ERROR';
            break;
        case 'P2014':
            message = '数据关系约束错误';
            statusCode = 400;
            code = 'RELATION_ERROR';
            break;
        case 'P2003':
            message = '外键约束失败';
            statusCode = 400;
            code = 'FOREIGN_KEY_ERROR';
            break;
        case 'P2025':
            message = '记录不存在';
            statusCode = 404;
            code = 'RECORD_NOT_FOUND';
            break;
        default:
            message = '数据库操作失败';
            break;
    }
    return { message, statusCode, code, details: error.meta };
};
/**
 * 处理Joi验证错误
 * @param error Joi验证错误
 * @returns 格式化的错误响应
 */
const handleJoiError = (error) => {
    const message = error.details.map((detail) => detail.message).join('; ');
    return {
        message: `参数验证失败: ${message}`,
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        details: error.details
    };
};
/**
 * 全局错误处理中间件
 */
const errorHandler = (error, req, res, next) => {
    // 记录错误日志
    logger_1.errorLogger.system(error, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query
    });
    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = '服务器内部错误';
    let details = undefined;
    // 处理不同类型的错误
    if (error instanceof BusinessError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        details = error.details;
    }
    else if (error instanceof AuthError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
    }
    else if (error instanceof PermissionError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
    }
    else if (error instanceof ValidationError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        details = error.details;
    }
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const prismaError = handlePrismaError(error);
        statusCode = prismaError.statusCode;
        code = prismaError.code;
        message = prismaError.message;
        details = prismaError.details;
    }
    else if (error.name === 'ValidationError' && error.isJoi) {
        const joiError = handleJoiError(error);
        statusCode = joiError.statusCode;
        code = joiError.code;
        message = joiError.message;
        details = joiError.details;
    }
    else if (error.name === 'MulterError') {
        statusCode = 400;
        code = 'FILE_UPLOAD_ERROR';
        message = '文件上传失败: ' + error.message;
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'TOKEN_INVALID';
        message = 'Token无效';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token已过期';
    }
    // 构造错误响应
    const errorResponse = {
        code: statusCode,
        message,
        error: code,
        timestamp: new Date().toISOString(),
        path: req.url
    };
    // 开发环境下返回详细错误信息
    if (config_1.config.nodeEnv === 'development') {
        errorResponse.details = details;
        errorResponse.stack = error.stack;
    }
    // 发送错误响应
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
/**
 * 404错误处理中间件
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        code: 404,
        message: `API接口 ${req.method} ${req.originalUrl} 不存在`,
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
        path: req.url
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * 异步错误包装器
 * @description 包装异步路由处理器，自动捕获Promise rejected
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map