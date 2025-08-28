-- 学生年级管理系统迁移脚本
-- 添加学生年级、学期、毕业状态管理

-- 1. 为Student表添加年级管理字段
ALTER TABLE students ADD COLUMN currentGrade TEXT;           -- 当前年级：一年级、二年级、三年级
ALTER TABLE students ADD COLUMN enrollmentYear INTEGER;      -- 入学年份
ALTER TABLE students ADD COLUMN enrollmentSemester TEXT;     -- 入学学期
ALTER TABLE students ADD COLUMN graduationStatus TEXT DEFAULT 'IN_PROGRESS'; -- 毕业状态：IN_PROGRESS, GRADUATED, ARCHIVED
ALTER TABLE students ADD COLUMN graduationDate DATETIME;     -- 毕业时间
ALTER TABLE students ADD COLUMN academicStatus TEXT DEFAULT 'ACTIVE'; -- 学籍状态：ACTIVE, SUSPENDED, GRADUATED

-- 2. 为Enrollment表添加学期信息（如果还没有）
-- 注意：schema中Course已经有semester字段，但Enrollment可能需要单独的semester字段用于约束

-- 3. 创建索引优化查询性能
CREATE INDEX idx_students_graduation_status ON students(graduationStatus);
CREATE INDEX idx_students_academic_status ON students(academicStatus); 
CREATE INDEX idx_students_current_grade ON students(currentGrade);
CREATE INDEX idx_students_enrollment_year ON students(enrollmentYear);

-- 4. 为现有数据设置默认值
UPDATE students 
SET 
  currentGrade = '一年级',
  enrollmentYear = 2025,
  enrollmentSemester = '2025年秋季',
  graduationStatus = 'IN_PROGRESS',
  academicStatus = 'ACTIVE'
WHERE currentGrade IS NULL;
