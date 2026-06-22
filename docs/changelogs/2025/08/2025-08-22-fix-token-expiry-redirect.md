# 修复Token过期后不跳转登录页面问题

**日期**: 2025-08-22  
**类型**: 缺陷修复  
**影响范围**: 用户认证、会话管理

## 📋 问题描述

### 当前问题
1. **Token过期时间**: 当前JWT token过期时间为7天，刷新token为30天
2. **跳转失败**: Token过期后用户无法自动跳转到登录页面，导致用户体验不佳
3. **认证状态异常**: 用户可能停留在需要认证的页面但无法正常操作

### 根本原因
1. **logout方法缺陷**: `authStore.logout()` 方法只清除认证状态，缺少路由跳转逻辑
2. **请求拦截器问题**: HTTP请求拦截器在检测到token过期后调用logout，但logout不会触发页面跳转

## 🔧 修复方案

### 1. 增强logout方法功能

**文件**: `frontend/src/store/auth.ts`

**修改内容**:
- 为logout方法添加可选参数 `redirectToLogin: boolean = true`
- 增加自动跳转到登录页面的逻辑
- 使用动态导入避免循环依赖问题
- 添加降级方案确保跳转成功

```typescript
/**
 * 用户登出
 * @param redirectToLogin 是否跳转到登录页，默认true
 */
const logout = async (redirectToLogin: boolean = true): Promise<void> => {
  // ... 原有清除认证状态的逻辑 ...

  // 新增：跳转到登录页面
  if (redirectToLogin) {
    console.log('🔄 跳转到登录页面...')
    // 动态导入router避免循环依赖
    import('@/router').then(({ default: router }) => {
      const currentRoute = router.currentRoute.value
      // 如果当前不在登录页面，则跳转到登录页面
      if (currentRoute.path !== '/login') {
        router.push({
          path: '/login',
          query: { redirect: currentRoute.fullPath }
        })
      }
    }).catch(error => {
      console.error('❌ 跳转到登录页面失败:', error)
      // 降级方案：直接修改location
      window.location.href = '/login'
    })
  }
}
```

### 2. 更新请求拦截器

**文件**: `frontend/src/api/request.ts`

**修改内容**:
- 在token过期检测时明确调用 `logout(true)` 确保跳转
- 改进日志输出，明确指示跳转动作

```typescript
if (isTokenExpired) {
  console.log('🔑 Token确实已过期，清除认证信息并跳转到登录页')
  // 通过authStore来处理logout，并跳转到登录页面
  import('@/store/auth').then(({ useAuthStore }) => {
    const authStore = useAuthStore()
    authStore.logout(true) // 参数true表示跳转到登录页
  })
}
```

## 🎯 修复效果

### 用户体验改进
1. **自动跳转**: Token过期后用户自动跳转到登录页面，无需手动刷新
2. **保留跳转路径**: 跳转时保存当前页面路径，登录后可返回原页面
3. **降级保障**: 即使动态导入失败，也会通过 `window.location.href` 确保跳转成功

### 技术优化
1. **避免循环依赖**: 使用动态导入 `import('@/router')` 避免模块循环依赖
2. **灵活控制**: logout方法支持可选跳转，适应不同使用场景
3. **错误处理**: 完善的错误处理和降级方案

## 🔍 Token配置说明

### 当前配置
- **JWT Token过期时间**: 7天 (`JWT_EXPIRES_IN=7d`)
- **刷新Token过期时间**: 30天 (`JWT_REFRESH_EXPIRES_IN=30d`)

### 配置位置
- **后端配置**: `backend/src/config/index.ts`
- **环境变量**: `backend/env.example`
- **生产环境**: `backend/env.production.template`

### 建议优化
如需调整token过期时间，可以修改环境变量：
```bash
# 调整为更短的过期时间（如1天）
JWT_EXPIRES_IN=1d

# 或更长的过期时间（如30天）
JWT_EXPIRES_IN=30d
```

## 📊 测试验证

### 测试场景
1. **Token自然过期**: 等待token过期后访问需要认证的页面
2. **API调用过期**: 在token过期时进行API调用
3. **手动登出**: 验证手动登出功能正常
4. **页面跳转**: 验证跳转后能保留原页面路径

### 预期结果
- ✅ Token过期后自动跳转到登录页面
- ✅ 保留原页面路径在redirect参数中
- ✅ 登录成功后可返回原页面
- ✅ 降级方案在异常情况下正常工作

## 🚀 部署说明

### 部署步骤
1. 更新前端代码
2. 重新构建前端项目
3. 部署到生产环境
4. 验证token过期跳转功能

### 兼容性
- ✅ 向后兼容：现有的手动logout调用不受影响
- ✅ 参数可选：新增的redirectToLogin参数有默认值
- ✅ 无破坏性：不影响现有的认证流程

## 📝 相关文档

- JWT认证机制说明
- 用户会话管理文档
- 前端路由守卫配置

---

**修复人**: AI Assistant  
**审核状态**: 待审核  
**相关Issue**: Token过期跳转问题修复
