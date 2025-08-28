"use strict";
/**
 * 学生年级管理工具
 * @description 处理学生年级升级、毕业归档等业务逻辑
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSemester = parseSemester;
exports.calculateYearDifference = calculateYearDifference;
exports.calculateCurrentGrade = calculateCurrentGrade;
exports.shouldGraduate = shouldGraduate;
exports.canEnrollCourse = canEnrollCourse;
exports.canEnrollSameCourseInDifferentSemester = canEnrollSameCourseInDifferentSemester;
exports.getCurrentSemester = getCurrentSemester;
exports.getNextSemester = getNextSemester;
/**
 * 解析学期字符串
 * @param semester 学期字符串，如："2025年度"
 * @returns 学期信息对象
 */
function parseSemester(semester) {
    const match = semester.match(/(\d{4})年度/);
    if (!match) {
        throw new Error(`无效的学期格式: ${semester}`);
    }
    const year = parseInt(match[1]);
    return {
        year,
        season: 'autumn', // 默认为秋季，因为每年只有一个学期
        displayName: semester
    };
}
/**
 * 计算年份差值
 * @param fromSemester 起始学期
 * @param toSemester 目标学期
 * @returns 年份数量差值
 */
function calculateYearDifference(fromSemester, toSemester) {
    const from = parseSemester(fromSemester);
    const to = parseSemester(toSemester);
    return to.year - from.year;
}
/**
 * 计算学生当前应该的年级
 * @param enrollmentSemester 入学学期
 * @param currentSemester 当前学期
 * @returns 应该的年级
 */
function calculateCurrentGrade(enrollmentSemester, currentSemester) {
    const yearsPassed = calculateYearDifference(enrollmentSemester, currentSemester);
    // 每年升一年级（每年只有一个学期）
    if (yearsPassed >= 3) {
        return 'GRADUATED';
    }
    const grades = ['一年级', '二年级', '三年级'];
    return grades[yearsPassed] || '一年级';
}
/**
 * 检查学生是否应该毕业
 * @param enrollmentSemester 入学学期
 * @param currentSemester 当前学期
 * @returns 是否应该毕业
 */
function shouldGraduate(enrollmentSemester, currentSemester) {
    const yearsPassed = calculateYearDifference(enrollmentSemester, currentSemester);
    return yearsPassed >= 3; // 3年毕业
}
/**
 * 检查学生是否可以报名特定课程
 * @param studentGrade 学生当前年级
 * @param courseLevel 课程年级要求
 * @param studentGraduationStatus 学生毕业状态
 * @param courseRequiresGrades 课程是否需要年级管理
 * @param hasApprovedCourses 学生是否已有通过审核的课程
 * @returns 是否可以报名
 */
function canEnrollCourse(studentGrade, courseLevel, studentGraduationStatus, courseRequiresGrades = true, hasApprovedCourses = false) {
    // 如果课程不需要年级管理，任何人都可以报名
    if (!courseRequiresGrades) {
        return { canEnroll: true };
    }
    // 毕业生可以报名任何课程（作为新的学习周期）
    if (studentGraduationStatus === 'GRADUATED' || studentGraduationStatus === 'ARCHIVED') {
        return { canEnroll: true };
    }
    // 如果学生没有任何通过审核的课程，可以报名任何年级课程（首次报名更灵活）
    if (!hasApprovedCourses) {
        return { canEnroll: true };
    }
    // 在读学生年级检查（仅当有通过审核课程时严格执行）
    if (!studentGrade) {
        return { canEnroll: false, reason: '学生年级信息缺失' };
    }
    // 定义年级等级
    const gradeLevel = {
        '一年级': 1,
        '二年级': 2,
        '三年级': 3
    };
    const studentLevel = gradeLevel[studentGrade];
    const courseGradeLevel = gradeLevel[courseLevel];
    if (!studentLevel || !courseGradeLevel) {
        return { canEnroll: true }; // 如果年级不在定义范围内，允许报名
    }
    // 高年级学生可以报名低年级课程，但低年级不能报名高年级课程
    if (studentLevel < courseGradeLevel) {
        return {
            canEnroll: false,
            reason: `该课程面向${courseLevel}学生，您当前是${studentGrade}，年级不够`
        };
    }
    // 高年级或同年级学生可以报名
    return { canEnroll: true };
}
/**
 * 检查是否允许跨学期重复报名
 * @param existingEnrollments 现有报名记录
 * @param newCourseId 新课程ID
 * @param newSemester 新学期
 * @returns 是否允许报名
 */
function canEnrollSameCourseInDifferentSemester(existingEnrollments, newCourseId, newSemester) {
    const sameCourseDifferentSemester = existingEnrollments.find(enrollment => enrollment.courseId === newCourseId &&
        enrollment.course.semester !== newSemester);
    if (sameCourseDifferentSemester) {
        return {
            canEnroll: true,
            reason: `您在${sameCourseDifferentSemester.course.semester}已报名过此课程，当前为不同学期可以重复报名`
        };
    }
    // 检查同学期同课程重复报名
    const sameCoursesSameSemester = existingEnrollments.find(enrollment => enrollment.courseId === newCourseId &&
        enrollment.course.semester === newSemester);
    if (sameCoursesSameSemester) {
        return {
            canEnroll: false,
            reason: `您在${newSemester}已经报名过此课程`
        };
    }
    return { canEnroll: true };
}
/**
 * 获取当前学期（每年只有一个学期）
 * @returns 当前学期字符串
 */
function getCurrentSemester() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    // 每年只有一个学期，根据月份判断是当前年度还是下一年度
    // 假设学期从9月开始，到次年7月结束
    if (month >= 9) {
        return `${year}年度`;
    }
    else {
        return `${year - 1}年度`;
    }
}
/**
 * 获取下一个学期
 * @param currentSemester 当前学期
 * @returns 下一个学期字符串
 */
function getNextSemester(currentSemester) {
    const year = parseInt(currentSemester.match(/(\d{4})年度/)?.[1] || '2025');
    return `${year + 1}年度`;
}
//# sourceMappingURL=gradeManagement.js.map