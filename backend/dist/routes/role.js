"use strict";
/**
 * 角色管理路由
 * @description 处理角色权限相关的API请求
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 角色配置数据 - 基于固定角色的权限系统
const ROLE_CONFIGS = {
    SUPER_ADMIN: {
        id: '1',
        key: 'SUPER_ADMIN',
        name: '超级管理员',
        description: '拥有系统所有权限，可管理所有功能模块',
        icon: 'fas fa-crown',
        permissions: [
            'system:*', 'user:*', 'student:*', 'teacher:*', 'course:*',
            'application:*', 'analysis:*', 'setting:*', 'logs:*', 'school:*'
        ],
        status: 'active',
        isSystem: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
    },
    SCHOOL_ADMIN: {
        id: '2',
        key: 'SCHOOL_ADMIN',
        name: '学校管理员',
        description: '学校级别管理权限，可配置本校用户、课程等信息',
        icon: 'fas fa-school',
        permissions: [
            'user:read', 'user:create', 'user:update',
            'student:*', 'teacher:*', 'course:*',
            'application:*', 'analysis:read', 'setting:read', 'setting:update'
        ],
        status: 'active',
        isSystem: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
    },
    TEACHER: {
        id: '3',
        key: 'TEACHER',
        name: '教师',
        description: '教学权限，可管理课程、学生、报名信息、年级升级和签到管理',
        icon: 'fas fa-chalkboard-teacher',
        permissions: [
            // 学生管理权限
            'student:read', 'student:create', 'student:update', 'student:delete',
            // 课程管理权限
            'course:read', 'course:create', 'course:update', 'course:delete', 'course:import', 'course:export',
            // 报名管理权限
            'application:read', 'application:create', 'application:update', 'application:approve',
            // 年级管理权限
            'grade:read', 'grade:manage', 'grade:upgrade', 'grade:graduate',
            // 数据分析权限
            'analysis:read',
            // 考勤管理权限
            'attendance:read', 'attendance:manage',
            // 个人资料权限
            'profile:read', 'profile:update'
        ],
        status: 'active',
        isSystem: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
    },
    STUDENT: {
        id: '4',
        key: 'STUDENT',
        name: '学生',
        description: '学生权限，可查看课程信息、提交报名申请',
        icon: 'fas fa-user-graduate',
        permissions: [
            'profile:read', 'profile:update',
            'course:read', 'application:create', 'application:read'
        ],
        status: 'active',
        isSystem: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
    }
};
// 所有可用权限
const ALL_PERMISSIONS = [
    'system:read', 'system:create', 'system:update', 'system:delete', 'system:*',
    'user:read', 'user:create', 'user:update', 'user:delete', 'user:*',
    'student:read', 'student:create', 'student:update', 'student:delete', 'student:*',
    'teacher:read', 'teacher:create', 'teacher:update', 'teacher:delete', 'teacher:*',
    'course:read', 'course:create', 'course:update', 'course:delete', 'course:import', 'course:export', 'course:*',
    'application:read', 'application:create', 'application:update', 'application:delete', 'application:approve', 'application:*',
    'grade:read', 'grade:manage', 'grade:upgrade', 'grade:graduate', 'grade:*',
    'analysis:read', 'analysis:*',
    'setting:read', 'setting:update', 'setting:*',
    'logs:read', 'logs:*',
    'attendance:read', 'attendance:manage', 'attendance:*',
    'profile:read', 'profile:update', 'profile:*',
    'school:read', 'school:create', 'school:update', 'school:delete', 'school:*'
];
/**
 * 获取角色列表
 * GET /api/roles
 */
router.get('/', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        // 记录用户操作
        logger_1.businessLogger.userAction(req.user.id, 'ROLE_LIST_QUERY', {});
        // 返回预定义的角色配置
        const roles = Object.values(ROLE_CONFIGS);
        res.json({
            code: 200,
            message: '获取角色列表成功',
            data: roles
        });
    }
    catch (error) {
        console.error('获取角色列表失败:', error);
        throw new errorHandler_1.BusinessError('获取角色列表失败', 500, 'QUERY_ERROR');
    }
}));
/**
 * 获取所有可用权限
 * GET /api/roles/permissions
 */
router.get('/permissions', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        // 记录用户操作
        logger_1.businessLogger.userAction(req.user.id, 'PERMISSIONS_QUERY', { totalPermissions: ALL_PERMISSIONS.length });
        res.json({
            code: 200,
            message: '获取权限列表成功',
            data: ALL_PERMISSIONS
        });
    }
    catch (error) {
        console.error('获取权限列表失败:', error);
        throw new errorHandler_1.BusinessError('获取权限列表失败', 500, 'QUERY_ERROR');
    }
}));
/**
 * 获取角色详情
 * GET /api/roles/:id
 */
router.get('/:id', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        // 从预定义配置中查找角色
        const role = Object.values(ROLE_CONFIGS).find(r => r.id === id);
        if (!role) {
            throw new errorHandler_1.BusinessError('角色不存在', 404, 'NOT_FOUND');
        }
        // 记录用户操作
        logger_1.businessLogger.userAction(req.user.id, 'ROLE_DETAIL_QUERY', { roleId: id, roleName: role.name });
        res.json({
            code: 200,
            message: '获取角色详情成功',
            data: role
        });
    }
    catch (error) {
        console.error('获取角色详情失败:', error);
        if (error instanceof errorHandler_1.BusinessError)
            throw error;
        throw new errorHandler_1.BusinessError('获取角色详情失败', 500, 'QUERY_ERROR');
    }
}));
/**
 * 更新用户角色
 * PUT /api/users/:userId/role
 */
router.put('/users/:userId/role', auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        // 验证角色是否有效
        if (!Object.values(client_1.UserRole).includes(role)) {
            throw new errorHandler_1.BusinessError('无效的角色', 400, 'INVALID_ROLE');
        }
        // 检查用户是否存在
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new errorHandler_1.BusinessError('用户不存在', 404, 'USER_NOT_FOUND');
        }
        // 更新用户角色
        await prisma.user.update({
            where: { id: userId },
            data: {
                role: role,
                updatedAt: new Date()
            }
        });
        // 记录用户操作
        logger_1.businessLogger.userAction(req.user.id, 'USER_ROLE_UPDATE', {
            targetUserId: userId,
            oldRole: user.role,
            newRole: role,
            targetUserName: user.realName
        });
        res.json({
            code: 200,
            message: '用户角色更新成功',
            data: null
        });
    }
    catch (error) {
        console.error('更新用户角色失败:', error);
        if (error instanceof errorHandler_1.BusinessError)
            throw error;
        throw new errorHandler_1.BusinessError('更新用户角色失败', 500, 'UPDATE_ERROR');
    }
}));
/**
 * 创建新角色
 * POST /api/roles
 */
router.post('/', auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { name, key, description, icon, permissions, status } = req.body;
        // 验证必填字段
        if (!name || !key) {
            throw new errorHandler_1.BusinessError('角色名称和标识不能为空', 400, 'INVALID_INPUT');
        }
        // 检查角色标识是否已存在
        const existingRole = Object.values(ROLE_CONFIGS).find(r => r.key === key);
        if (existingRole) {
            throw new errorHandler_1.BusinessError('角色标识已存在', 400, 'ROLE_KEY_EXISTS');
        }
        // 验证权限是否有效
        if (!permissions || !Array.isArray(permissions)) {
            throw new errorHandler_1.BusinessError('请至少选择一项权限', 400, 'INVALID_PERMISSIONS');
        }
        const invalidPerms = permissions.filter(perm => !ALL_PERMISSIONS.includes(perm));
        if (invalidPerms.length > 0) {
            throw new errorHandler_1.BusinessError(`无效的权限: ${invalidPerms.join(', ')}`, 400, 'INVALID_PERMISSIONS');
        }
        // 记录用户操作
        logger_1.businessLogger.userAction(req.user.id, 'ROLE_CREATE_ATTEMPT', {
            roleName: name,
            roleKey: key,
            permissions: permissions.length,
            result: 'system_readonly_mode'
        });
        res.json({
            code: 200,
            message: '当前系统基于固定角色设计，暂不支持创建自定义角色。如需新增角色，请联系系统管理员进行配置。',
            data: null
        });
    }
    catch (error) {
        console.error('创建角色失败:', error);
        if (error instanceof errorHandler_1.BusinessError)
            throw error;
        throw new errorHandler_1.BusinessError('创建角色失败', 500, 'CREATE_ERROR');
    }
}));
/**
 * 删除角色
 * DELETE /api/roles/:id
 */
router.delete('/:id', auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        // 查找角色
        const role = Object.values(ROLE_CONFIGS).find(r => r.id === id);
        if (!role) {
            throw new errorHandler_1.BusinessError('角色不存在', 404, 'NOT_FOUND');
        }
        // 系统角色不能删除
        if (role.isSystem) {
            // 记录用户操作
            logger_1.businessLogger.userAction(req.user.id, 'ROLE_DELETE_ATTEMPT', {
                roleId: id,
                roleName: role.name,
                result: 'system_role_protected'
            });
            throw new errorHandler_1.BusinessError('系统角色不能删除', 400, 'SYSTEM_ROLE_PROTECTED');
        }
        // 检查是否有用户正在使用此角色
        const usersWithRole = await prisma.user.count({
            where: {
                role: role.key,
                isActive: true
            }
        });
        if (usersWithRole > 0) {
            throw new errorHandler_1.BusinessError(`无法删除角色，还有 ${usersWithRole} 个用户正在使用此角色`, 400, 'ROLE_IN_USE');
        }
        // 记录删除尝试
        logger_1.businessLogger.userAction(req.user.id, 'ROLE_DELETE_ATTEMPT', {
            roleId: id,
            roleName: role.name,
            result: 'system_readonly_mode'
        });
        res.json({
            code: 200,
            message: '当前系统基于固定角色设计，暂不支持删除系统角色。如需修改角色配置，请联系系统管理员。',
            data: null
        });
    }
    catch (error) {
        console.error('删除角色失败:', error);
        if (error instanceof errorHandler_1.BusinessError)
            throw error;
        throw new errorHandler_1.BusinessError('删除角色失败', 500, 'DELETE_ERROR');
    }
}));
/**
 * 模拟角色权限更新（当前为只读系统）
 * PUT /api/roles/:id
 */
router.put('/:id', auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissions, status } = req.body;
        // 查找角色
        const role = Object.values(ROLE_CONFIGS).find(r => r.id === id);
        if (!role) {
            throw new errorHandler_1.BusinessError('角色不存在', 404, 'NOT_FOUND');
        }
        // 验证权限是否有效（如果提供了权限）
        if (permissions && Array.isArray(permissions)) {
            const invalidPerms = permissions.filter(perm => !ALL_PERMISSIONS.includes(perm));
            if (invalidPerms.length > 0) {
                throw new errorHandler_1.BusinessError(`无效的权限: ${invalidPerms.join(', ')}`, 400, 'INVALID_PERMISSIONS');
            }
        }
        // 系统角色可以被超级管理员修改，但需要特殊处理
        if (role.isSystem) {
            // 记录系统角色修改操作
            logger_1.businessLogger.userAction(req.user.id, 'SYSTEM_ROLE_UPDATE', {
                roleId: id,
                roleName: role.name,
                originalPermissions: role.permissions,
                newPermissions: permissions || role.permissions,
                requestedChanges: { name, description, permissions, status }
            });
            // 更新系统角色配置（注意：这是内存中的更新，重启后会恢复）
            const updatedRole = {
                ...role,
                ...(name && { name }),
                ...(description && { description }),
                ...(permissions && { permissions }),
                ...(status && { status }),
                updatedAt: new Date().toISOString()
            };
            ROLE_CONFIGS[role.key] = updatedRole;
            res.json({
                code: 200,
                message: `系统角色 ${role.name} 更新成功（运行时有效，重启后需重新配置）`,
                data: updatedRole
            });
        }
        else {
            // 自定义角色的处理逻辑
            res.json({
                code: 200,
                message: '角色更新成功',
                data: {
                    ...role,
                    ...(name && { name }),
                    ...(description && { description }),
                    ...(permissions && { permissions }),
                    ...(status && { status }),
                    updatedAt: new Date().toISOString()
                }
            });
        }
    }
    catch (error) {
        console.error('更新角色失败:', error);
        if (error instanceof errorHandler_1.BusinessError)
            throw error;
        throw new errorHandler_1.BusinessError('更新角色失败', 500, 'UPDATE_ERROR');
    }
}));
exports.default = router;
//# sourceMappingURL=role.js.map