"use strict";
/**
 * 日志工具
 * @description 基于winston的日志记录系统
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.businessLogger = exports.logRequest = exports.logger = void 0;
const tslib_1 = require("tslib");
const winston_1 = require("winston");
const config_1 = require("../config");
const path_1 = tslib_1.__importDefault(require("path"));
/**
 * 自定义日志格式
 */
const customFormat = winston_1.format.combine(winston_1.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.format.errors({ stack: true }), winston_1.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    // 添加堆栈信息（错误时）
    if (stack) {
        log += `\n${stack}`;
    }
    // 添加元数据
    if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
/**
 * 控制台输出格式（开发模式带颜色）
 */
const consoleFormat = winston_1.format.combine(winston_1.format.colorize(), customFormat);
/**
 * 创建logger实例
 */
exports.logger = (0, winston_1.createLogger)({
    level: config_1.config.log.level,
    format: customFormat,
    transports: [
        // 控制台输出
        new winston_1.transports.Console({
            format: config_1.config.nodeEnv === 'development' ? consoleFormat : customFormat
        }),
        // 所有日志文件
        new winston_1.transports.File({
            filename: path_1.default.join('logs', 'app.log'),
            maxsize: parseSize(config_1.config.log.maxSize),
            maxFiles: parseInt(config_1.config.log.maxFiles) || 14,
            tailable: true
        }),
        // 错误日志文件
        new winston_1.transports.File({
            filename: path_1.default.join('logs', 'error.log'),
            level: 'error',
            maxsize: parseSize(config_1.config.log.maxSize),
            maxFiles: parseInt(config_1.config.log.maxFiles) || 14,
            tailable: true
        })
    ],
    // 退出时不等待日志写入完成
    exitOnError: false
});
/**
 * 解析文件大小字符串
 * @param sizeStr 大小字符串 (如: '20m', '100k', '1g')
 * @returns 字节数
 */
function parseSize(sizeStr) {
    const match = sizeStr.match(/^(\d+)([kmg])?$/i);
    if (!match)
        return 20 * 1024 * 1024; // 默认20MB
    const [, num, unit] = match;
    const size = parseInt(num, 10);
    switch (unit?.toLowerCase()) {
        case 'k': return size * 1024;
        case 'm': return size * 1024 * 1024;
        case 'g': return size * 1024 * 1024 * 1024;
        default: return size;
    }
}
/**
 * 请求日志中间件辅助函数
 * @param req Express请求对象
 * @param res Express响应对象
 * @param responseTime 响应时间（毫秒）
 */
const logRequest = (req, res, responseTime) => {
    const { method, url, ip, headers } = req;
    const { statusCode } = res;
    const logData = {
        method,
        url,
        ip: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
        userAgent: headers['user-agent'],
        statusCode,
        responseTime: responseTime ? `${responseTime}ms` : undefined
    };
    if (statusCode >= 400) {
        exports.logger.warn('HTTP请求异常', logData);
    }
    else {
        exports.logger.info('HTTP请求', logData);
    }
};
exports.logRequest = logRequest;
/**
 * 业务日志记录器
 */
exports.businessLogger = {
    /**
     * 用户操作日志
     */
    userAction: (userId, action, details) => {
        exports.logger.info('用户操作', {
            userId,
            action,
            details,
            timestamp: new Date().toISOString()
        });
    },
    /**
     * 系统操作日志
     */
    systemAction: (action, details) => {
        exports.logger.info('系统操作', {
            action,
            details,
            timestamp: new Date().toISOString()
        });
    },
    /**
     * 数据库操作日志
     */
    dbOperation: (operation, table, details) => {
        exports.logger.info('数据库操作', {
            operation,
            table,
            details,
            timestamp: new Date().toISOString()
        });
    },
    /**
     * API调用日志
     */
    apiCall: (service, endpoint, success, details) => {
        const level = success ? 'info' : 'error';
        exports.logger[level]('外部API调用', {
            service,
            endpoint,
            success,
            details,
            timestamp: new Date().toISOString()
        });
    }
};
/**
 * 错误日志记录器
 */
exports.errorLogger = {
    /**
     * 业务错误
     */
    business: (error, context) => {
        exports.logger.error('业务错误', {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
    },
    /**
     * 系统错误
     */
    system: (error, context) => {
        exports.logger.error('系统错误', {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
    },
    /**
     * 数据库错误
     */
    database: (error, query, params) => {
        exports.logger.error('数据库错误', {
            message: error.message,
            stack: error.stack,
            query,
            params,
            timestamp: new Date().toISOString()
        });
    },
    /**
     * 外部服务错误
     */
    external: (service, error, details) => {
        exports.logger.error('外部服务错误', {
            service,
            message: error.message,
            stack: error.stack,
            details,
            timestamp: new Date().toISOString()
        });
    }
};
// 创建logs目录（如果不存在）
const fs = require('fs');
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map