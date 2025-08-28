# 添加课程年龄限制验证功能

**日期：** 2025-08-22  
**类型：** 功能增强  
**影响范围：** 报名流程、课程选择、用户体验  

## 功能描述

根据课程设置的年龄限制，在报名流程中自动验证学生年龄，确保只有符合年龄要求的学生才能报名相应课程。

## 主要变更

### 1. 新增年龄工具函数 (frontend/src/utils/ageUtils.ts)

#### 核心功能
- **年龄计算**：`calculateAge()` - 根据出生日期精确计算周岁年龄
- **年龄验证**：`checkAgeRestriction()` - 检查年龄是否符合课程要求
- **显示格式化**：`formatAgeRestriction()` 和 `getAgeRestrictionHint()` - 格式化年龄限制显示

#### 主要方法
```typescript
// 计算年龄
calculateAge(birthDate: string | Date | Dayjs, baseDate?: string | Date | Dayjs): number

// 检查年龄限制
checkAgeRestriction(studentAge: number, ageRestriction: AgeRestriction): { 
  isEligible: boolean; 
  message?: string 
}

// 格式化年龄限制显示
formatAgeRestriction(ageRestriction: AgeRestriction): string
getAgeRestrictionHint(ageRestriction: AgeRestriction): string
```

### 2. PC端报名页面增强 (frontend/src/views/Registration.vue)

#### 年龄验证集成
- **实时验证**：监听出生日期变化，自动重新验证课程可用性
- **智能过滤**：在课程选择列表中自动禁用不符合年龄要求的课程
- **友好提示**：显示年龄限制信息和不可选原因

#### 核心逻辑更新
```typescript
// 课程选项生成时加入年龄验证
const updateCourseOptionsAvailability = () => {
  const studentAge = formData.birthDate ? calculateAge(formData.birthDate) : 0
  
  courseOptions.value = availableCourses.value.map(course => {
    // 检查年龄限制
    const ageCheck = checkAgeRestriction(studentAge, {
      enabled: course.hasAgeRestriction,
      minAge: course.minAge,
      maxAge: course.maxAge,
      description: course.ageDescription
    })
    
    // 设置禁用状态和原因
    let disabled = !ageCheck.isEligible
    let disabledReason = disabled ? '年龄不符' : ''
    
    // 添加年龄限制提示到标签
    const ageHint = getAgeRestrictionHint(course)
    let label = `${course.name}${ageHint ? ` (${ageHint})` : ''}`
    
    return { label, value: course.id.toString(), disabled, ... }
  })
}
```

#### 动态监听和自动移除
- **出生日期监听**：当用户修改出生日期时，自动重新验证所有已选课程
- **自动移除**：如果已选课程不再符合年龄要求，自动移除并提示用户
- **选择验证**：在用户选择新课程时，立即验证年龄要求

### 3. 移动端报名页面增强 (frontend/src/views/MobileRegistration.vue)

#### 视觉优化
- **状态指示**：年龄不符的课程卡片显示红色边框和半透明效果
- **信息展示**：在课程卡片中显示年龄限制信息
- **交互优化**：点击不符合年龄要求的课程时显示具体原因

#### 课程卡片增强
```vue
<!-- 年龄限制显示 -->
<div v-if="getAgeRestrictionHint(course)" class="mt-1 text-xs text-orange-600">
  <i class="fas fa-exclamation-triangle mr-1"></i>{{ getAgeRestrictionHint(course) }}
</div>

<!-- 年龄不符提示 -->
<div v-if="!isCourseAgeEligible(course)" class="mt-1 text-xs text-red-600">
  <i class="fas fa-ban mr-1"></i>年龄不符合要求
</div>
```

#### 交互逻辑优化
- **智能点击**：符合年龄要求的课程正常选择，不符合的显示详细提示
- **提前验证**：在课程选择前就进行年龄验证，避免无效操作

### 4. 课程API类型更新 (frontend/src/api/course.ts)

#### 类型定义增强
为Course、CreateCourseRequest、UpdateCourseRequest接口添加年龄限制字段：

```typescript
export interface Course {
  // ... 其他字段
  // 年龄限制相关字段
  hasAgeRestriction?: boolean
  minAge?: number | null
  maxAge?: number | null
  ageDescription?: string | null
  ageRestriction?: {
    enabled: boolean
    minAge?: number | null
    maxAge?: number | null
    description?: string | null
  }
}
```

## 技术实现

### 1. 年龄计算算法
使用dayjs库精确计算周岁年龄：
```typescript
export const calculateAge = (birthDate: string | Date | Dayjs, baseDate?: string | Date | Dayjs): number => {
  const birth = dayjs(birthDate)
  const base = baseDate ? dayjs(baseDate) : dayjs()
  return base.diff(birth, 'year') // 精确到年
}
```

### 2. 年龄限制验证逻辑
支持多种年龄限制场景：
- **最小年龄限制**：适用于需要一定身体素质的课程
- **最大年龄限制**：适用于高强度或特定人群的课程
- **年龄范围限制**：同时设置最小和最大年龄
- **自定义说明**：提供详细的年龄限制原因

### 3. 实时验证机制
- **响应式验证**：使用Vue3的watch监听出生日期变化
- **智能更新**：自动更新课程可用性，无需手动刷新
- **批量处理**：同时验证多个已选课程，批量移除不符合条件的课程

### 4. 用户体验优化
- **视觉反馈**：通过颜色和图标明确显示课程状态
- **友好提示**：使用具体的年龄要求说明而非技术错误信息
- **操作引导**：引导用户先填写出生日期再选择课程

## 用户体验改进

### 1. 智能课程过滤
- **自动禁用**：年龄不符的课程在选择列表中自动置灰
- **清晰标识**：通过颜色和图标区分可选和不可选课程
- **原因说明**：明确显示不可选的具体原因

### 2. 实时反馈机制
- **即时验证**：出生日期输入后立即更新课程可用性
- **自动调整**：已选课程在年龄不符时自动移除
- **友好提示**：使用温和的警告信息而非错误信息

### 3. 移动端优化
- **触控友好**：大尺寸的课程卡片便于移动设备操作
- **视觉层次**：使用颜色和透明度区分课程状态
- **信息密度**：在有限空间内展示关键的年龄限制信息

## 功能特点

### 1. 精确的年龄计算
- **周岁计算**：使用标准的周岁计算方法
- **日期兼容**：支持多种日期格式输入
- **边界处理**：正确处理生日当天的年龄计算

### 2. 灵活的限制配置
- **可选启用**：课程可以选择是否启用年龄限制
- **多种模式**：支持最小年龄、最大年龄或范围限制
- **自定义说明**：允许添加具体的年龄限制原因

### 3. 智能的用户引导
- **操作顺序**：引导用户先填写基本信息再选择课程
- **错误预防**：在用户操作前就过滤不合适的选项
- **清晰沟通**：使用用户易懂的语言说明限制原因

## 验证要点

### 功能验证
- [ ] 出生日期填写后课程列表正确更新
- [ ] 年龄不符的课程正确禁用
- [ ] 年龄限制信息正确显示
- [ ] 已选课程在年龄变化时正确移除
- [ ] 移动端和PC端行为一致

### 边界情况测试
- [ ] 生日当天的年龄计算正确
- [ ] 未填写出生日期时不限制课程选择
- [ ] 课程无年龄限制时正常显示
- [ ] 年龄刚好达到边界值时的处理

### 用户体验验证
- [ ] 提示信息清晰友好
- [ ] 视觉效果直观明了
- [ ] 操作流程顺畅自然
- [ ] 错误处理用户友好

## 技术架构

### 1. 分层设计
- **工具层**：ageUtils.ts 提供核心年龄计算和验证逻辑
- **业务层**：各页面组件实现具体的验证和UI逻辑
- **类型层**：TypeScript接口保证类型安全

### 2. 响应式架构
- **Vue3 Composition API**：使用watch监听数据变化
- **自动更新**：响应式地更新UI状态
- **性能优化**：避免不必要的重新计算

### 3. 可扩展设计
- **模块化**：年龄验证逻辑独立于具体页面
- **配置化**：年龄限制规则由数据驱动
- **通用化**：工具函数可在其他页面复用

## 维护指南

### 1. 年龄限制配置
- 在课程管理页面设置年龄限制
- 使用合理的年龄范围（0-120岁）
- 提供清晰的年龄限制说明

### 2. 错误处理
- 确保年龄计算的边界情况处理
- 为无效日期提供友好的错误提示
- 处理网络异常等边界情况

### 3. 性能优化
- 避免频繁的年龄计算
- 缓存计算结果
- 优化大量课程时的过滤性能
