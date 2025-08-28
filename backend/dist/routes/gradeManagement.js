"use strict";
/**
 * 年级管理路由
 * @description 处理学生年级升级、毕业归档等操作
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const gradeManagement_1 = require("../utils/gradeManagement");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * 获取年级统计信息
 * GET /api/grade-management/statistics
 */
router.get('/statistics', async (req, res, next) => {
    try {
        console.log('📊 开始获取年级统计信息...');
        const currentSemester = (0, gradeManagement_1.getCurrentSemester)();
        // 年级分布统计
        const gradeDistribution = await prisma.student.groupBy({
            by: ['currentGrade'],
            where: {
                isActive: true,
                graduationStatus: { not: 'ARCHIVED' }
            },
            _count: { id: true }
        });
        // 毕业状态统计
        const graduationStats = await prisma.student.groupBy({
            by: ['graduationStatus'],
            where: { isActive: true },
            _count: { id: true }
        });
        // 活跃学生数量
        const activeStudents = await prisma.student.count({
            where: {
                isActive: true,
                graduationStatus: 'IN_PROGRESS'
            }
        });
        // 已毕业学生数量
        const graduatedStudents = await prisma.student.count({
            where: {
                isActive: true,
                graduationStatus: { in: ['GRADUATED', 'ARCHIVED'] }
            }
        });
        // 计算需要升级和毕业的学生
        const allActiveStudents = await prisma.student.findMany({
            where: {
                isActive: true,
                graduationStatus: 'IN_PROGRESS'
            },
            select: {
                id: true,
                name: true,
                currentGrade: true,
                enrollmentSemester: true,
                enrollmentYear: true
            }
        });
        const upgradeList = [];
        const graduationList = [];
        allActiveStudents.forEach(student => {
            if (!student.enrollmentSemester)
                return;
            const expectedGrade = (0, gradeManagement_1.calculateCurrentGrade)(student.enrollmentSemester, currentSemester);
            const shouldGrad = (0, gradeManagement_1.shouldGraduate)(student.enrollmentSemester, currentSemester);
            if (shouldGrad) {
                graduationList.push({
                    id: student.id,
                    name: student.name,
                    currentGrade: student.currentGrade || '未知',
                    enrollmentSemester: student.enrollmentSemester
                });
            }
            else if (student.currentGrade !== expectedGrade) {
                upgradeList.push({
                    id: student.id,
                    name: student.name,
                    currentGrade: student.currentGrade || '未知',
                    enrollmentSemester: student.enrollmentSemester
                });
            }
        });
        const statistics = {
            currentSemester,
            gradeDistribution,
            graduationStats,
            activeStudents,
            graduatedStudents,
            upgradeNeeded: upgradeList.length,
            graduationNeeded: graduationList.length,
            upgradeList,
            graduationList
        };
        console.log('📊 年级统计结果:', statistics);
        logger_1.businessLogger.userAction(req.user.id, 'GRADE_STATISTICS_QUERY', {
            currentSemester,
            upgradeNeeded: upgradeList.length,
            graduationNeeded: graduationList.length
        });
        res.json({
            code: 200,
            data: statistics,
            message: '获取年级统计成功'
        });
    }
    catch (error) {
        console.error('获取年级统计失败:', error);
        next(error);
    }
});
/**
 * 批量升级学生年级
 * POST /api/grade-management/upgrade-students
 */
router.post('/upgrade-students', auth_1.requireAdmin, async (req, res, next) => {
    try {
        console.log('🔄 开始批量升级学生年级...');
        const currentSemester = (0, gradeManagement_1.getCurrentSemester)();
        const { targetSemester = currentSemester } = req.body;
        // 获取所有需要升级的在读学生
        const activeStudents = await prisma.student.findMany({
            where: {
                isActive: true,
                graduationStatus: 'IN_PROGRESS',
                enrollmentSemester: { not: null }
            },
            select: {
                id: true,
                name: true,
                currentGrade: true,
                enrollmentSemester: true,
                enrollmentYear: true
            }
        });
        const upgrades = [];
        const graduations = [];
        // 使用事务批量处理
        await prisma.$transaction(async (tx) => {
            for (const student of activeStudents) {
                if (!student.enrollmentSemester)
                    continue;
                const expectedGrade = (0, gradeManagement_1.calculateCurrentGrade)(student.enrollmentSemester, targetSemester);
                const shouldGrad = (0, gradeManagement_1.shouldGraduate)(student.enrollmentSemester, targetSemester);
                if (shouldGrad) {
                    // 学生应该毕业
                    await tx.student.update({
                        where: { id: student.id },
                        data: {
                            graduationStatus: 'GRADUATED',
                            academicStatus: 'GRADUATED',
                            graduationDate: new Date()
                        }
                    });
                    graduations.push({
                        id: student.id,
                        name: student.name,
                        currentGrade: student.currentGrade || '未知'
                    });
                }
                else if (student.currentGrade !== expectedGrade && expectedGrade !== 'GRADUATED') {
                    // 学生需要升级年级
                    await tx.student.update({
                        where: { id: student.id },
                        data: {
                            currentGrade: expectedGrade
                        }
                    });
                    upgrades.push({
                        id: student.id,
                        name: student.name,
                        fromGrade: student.currentGrade || '未知',
                        toGrade: expectedGrade
                    });
                }
            }
        });
        const result = {
            upgrades,
            graduations,
            totalProcessed: upgrades.length + graduations.length
        };
        console.log('🎉 批量升级完成:', result);
        logger_1.businessLogger.userAction(req.user.id, 'BATCH_GRADE_UPGRADE', {
            targetSemester,
            upgradeCount: upgrades.length,
            graduationCount: graduations.length,
            totalProcessed: result.totalProcessed
        });
        res.json({
            success: true,
            data: result,
            message: `成功处理 ${result.totalProcessed} 名学生的年级变更`
        });
    }
    catch (error) {
        console.error('批量升级失败:', error);
        next(error);
    }
});
/**
 * 手动设置学生毕业
 * POST /api/grade-management/graduate/:studentId
 */
router.post('/graduate/:studentId', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { graduationDate, remarks } = req.body;
        console.log(`👨‍🎓 开始设置学生毕业: ${studentId}`);
        // 检查学生是否存在
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, name: true, graduationStatus: true }
        });
        if (!student) {
            throw new errorHandler_1.ValidationError('学生不存在');
        }
        if (student.graduationStatus === 'GRADUATED') {
            throw new errorHandler_1.BusinessError('学生已经毕业');
        }
        // 设置毕业
        await prisma.student.update({
            where: { id: studentId },
            data: {
                graduationStatus: 'GRADUATED',
                academicStatus: 'GRADUATED',
                graduationDate: graduationDate ? new Date(graduationDate) : new Date(),
                remarks: remarks || null
            }
        });
        console.log(`✅ 学生 ${student.name} 已设置为毕业`);
        logger_1.businessLogger.userAction(req.user.id, 'MANUAL_GRADUATION', {
            studentId,
            studentName: student.name,
            graduationDate,
            remarks
        });
        res.json({
            success: true,
            message: `学生 ${student.name} 已成功毕业`
        });
    }
    catch (error) {
        console.error('设置毕业失败:', error);
        next(error);
    }
});
/**
 * 重置学生学习周期（毕业生重新开始）
 * POST /api/grade-management/reset/:studentId
 */
router.post('/reset/:studentId', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { studentId } = req.params;
        console.log(`🔄 开始重置学生学习周期: ${studentId}`);
        const currentSemester = (0, gradeManagement_1.getCurrentSemester)();
        const currentYear = new Date().getFullYear();
        // 检查学生是否存在且已毕业
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, name: true, graduationStatus: true }
        });
        if (!student) {
            throw new errorHandler_1.ValidationError('学生不存在');
        }
        if (student.graduationStatus !== 'GRADUATED') {
            throw new errorHandler_1.BusinessError('只有已毕业的学生才能重置学习周期');
        }
        // 重置学习周期
        await prisma.student.update({
            where: { id: studentId },
            data: {
                currentGrade: '一年级',
                enrollmentYear: currentYear,
                enrollmentSemester: currentSemester,
                graduationStatus: 'IN_PROGRESS',
                academicStatus: 'ACTIVE',
                graduationDate: null
            }
        });
        console.log(`✅ 学生 ${student.name} 学习周期已重置`);
        logger_1.businessLogger.userAction(req.user.id, 'RESET_LEARNING_CYCLE', {
            studentId,
            studentName: student.name,
            newSemester: currentSemester
        });
        res.json({
            success: true,
            message: `学生 ${student.name} 学习周期已重置，现为一年级`
        });
    }
    catch (error) {
        console.error('重置学习周期失败:', error);
        next(error);
    }
});
/**
 * 获取年级升级预览
 * GET /api/grade-management/upgrade-preview
 */
router.get('/upgrade-preview', async (req, res, next) => {
    try {
        console.log('🔍 获取年级升级预览...');
        const currentSemester = (0, gradeManagement_1.getCurrentSemester)();
        const { targetSemester = currentSemester } = req.query;
        const activeStudents = await prisma.student.findMany({
            where: {
                isActive: true,
                graduationStatus: 'IN_PROGRESS',
                enrollmentSemester: { not: null }
            },
            select: {
                id: true,
                name: true,
                currentGrade: true,
                enrollmentSemester: true,
                enrollmentYear: true
            }
        });
        const preview = [];
        activeStudents.forEach(student => {
            if (!student.enrollmentSemester)
                return;
            const expectedGrade = (0, gradeManagement_1.calculateCurrentGrade)(student.enrollmentSemester, targetSemester);
            const shouldGrad = (0, gradeManagement_1.shouldGraduate)(student.enrollmentSemester, targetSemester);
            let action;
            if (shouldGrad) {
                action = 'graduate';
            }
            else if (student.currentGrade !== expectedGrade) {
                action = 'upgrade';
            }
            else {
                action = 'no_change';
            }
            preview.push({
                id: student.id,
                name: student.name,
                currentGrade: student.currentGrade || '未知',
                expectedGrade: shouldGrad ? '毕业' : expectedGrade,
                action
            });
        });
        logger_1.businessLogger.userAction(req.user.id, 'GRADE_UPGRADE_PREVIEW', {
            targetSemester,
            totalStudents: preview.length,
            upgradeCount: preview.filter(p => p.action === 'upgrade').length,
            graduationCount: preview.filter(p => p.action === 'graduate').length
        });
        res.json({
            success: true,
            data: {
                targetSemester,
                preview,
                summary: {
                    total: preview.length,
                    upgrades: preview.filter(p => p.action === 'upgrade').length,
                    graduations: preview.filter(p => p.action === 'graduate').length,
                    noChange: preview.filter(p => p.action === 'no_change').length
                }
            },
            message: '获取升级预览成功'
        });
    }
    catch (error) {
        console.error('获取升级预览失败:', error);
        next(error);
    }
});
/**
 * 获取学生年级详情
 * GET /api/grade-management/student/:studentId
 */
router.get('/student/:studentId', async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                enrollments: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true,
                                level: true,
                                semester: true
                            }
                        }
                    }
                }
            }
        });
        if (!student) {
            throw new errorHandler_1.ValidationError('学生不存在');
        }
        // 计算年级信息
        const currentSemester = (0, gradeManagement_1.getCurrentSemester)();
        let gradeAnalysis = null;
        if (student.enrollmentSemester) {
            const expectedGrade = (0, gradeManagement_1.calculateCurrentGrade)(student.enrollmentSemester, currentSemester);
            const shouldGrad = (0, gradeManagement_1.shouldGraduate)(student.enrollmentSemester, currentSemester);
            gradeAnalysis = {
                currentGrade: student.currentGrade,
                expectedGrade: shouldGrad ? 'GRADUATED' : expectedGrade,
                isUpToDate: student.currentGrade === expectedGrade && !shouldGrad,
                shouldGraduate: shouldGrad,
                enrollmentSemester: student.enrollmentSemester,
                yearsInSchool: new Date().getFullYear() - (student.enrollmentYear || 0)
            };
        }
        logger_1.businessLogger.userAction(req.user.id, 'STUDENT_GRADE_DETAIL_QUERY', {
            studentId,
            studentName: student.name
        });
        res.json({
            success: true,
            data: {
                ...student,
                gradeAnalysis
            },
            message: '获取学生年级详情成功'
        });
    }
    catch (error) {
        console.error('获取学生年级详情失败:', error);
        next(error);
    }
});
/**
 * 手动调整学生年级
 * POST /api/grade-management/adjust/:studentId
 */
router.post('/adjust/:studentId', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { newGrade, reason } = req.body;
        console.log(`📝 手动调整学生年级: ${studentId} -> ${newGrade}`);
        // 验证新年级
        const validGrades = ['一年级', '二年级', '三年级'];
        if (!validGrades.includes(newGrade)) {
            throw new errorHandler_1.ValidationError('无效的年级');
        }
        // 检查学生是否存在
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, name: true, currentGrade: true, graduationStatus: true }
        });
        if (!student) {
            throw new errorHandler_1.ValidationError('学生不存在');
        }
        if (student.graduationStatus !== 'IN_PROGRESS') {
            throw new errorHandler_1.BusinessError('只能调整在读学生的年级');
        }
        const oldGrade = student.currentGrade;
        // 更新年级
        await prisma.student.update({
            where: { id: studentId },
            data: {
                currentGrade: newGrade,
                updatedAt: new Date()
            }
        });
        console.log(`✅ 学生 ${student.name} 年级已调整: ${oldGrade} -> ${newGrade}`);
        logger_1.businessLogger.userAction(req.user.id, 'MANUAL_GRADE_ADJUSTMENT', {
            studentId,
            studentName: student.name,
            fromGrade: oldGrade,
            toGrade: newGrade,
            reason: reason || '手动调整'
        });
        res.json({
            success: true,
            message: `学生 ${student.name} 年级已调整为 ${newGrade}`
        });
    }
    catch (error) {
        console.error('调整学生年级失败:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=gradeManagement.js.map