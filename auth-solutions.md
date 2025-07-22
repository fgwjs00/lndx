# 统一权限管理方案对比

## 🎯 方案对比

### 方案一：共享权限管理包 (推荐)
**特点**: 抽取公共权限逻辑到独立npm包
- ✅ 完全统一的权限逻辑
- ✅ 代码复用率最高
- ✅ 类型安全保证
- ❌ 需要重构现有代码
- ❌ 包版本管理复杂

### 方案二：共享API + 各端独立实现
**特点**: 后端统一权限API，前端各自实现
- ✅ 实现简单，改动最小
- ✅ 各端可以独立优化
- ✅ 维护相对独立
- ❌ 代码重复
- ❌ 一致性难保证

### 方案三：权限管理微服务
**特点**: 独立的权限管理服务
- ✅ 完全解耦
- ✅ 可独立扩展
- ✅ 支持更多系统接入
- ❌ 架构复杂度高
- ❌ 网络开销大

## 🚀 推荐实施方案

基于您的项目现状，推荐**方案二**作为过渡方案，长期考虑**方案一**。

## 📋 实施计划

### 阶段一：共享API方案 (1-2周)
1. 统一后端权限API设计
2. 移动端复用现有权限逻辑
3. 保持两端权限配置一致

### 阶段二：权限配置提取 (2-3周)
1. 创建共享权限配置文件
2. 抽取公共权限工具函数
3. 统一权限检查逻辑

### 阶段三：共享包重构 (3-4周)
1. 创建独立权限管理包
2. 重构PC端和移动端
3. 完善测试和文档

## 🏗️ 架构设计

### 后端API设计
```typescript
// 权限相关API
interface AuthAPI {
  // 用户登录
  login(credentials: LoginRequest): Promise<LoginResponse>
  
  // 获取用户信息和权限
  getUserInfo(): Promise<UserInfoResponse>
  
  // 刷新token
  refreshToken(refreshToken: string): Promise<TokenResponse>
  
  // 获取角色权限配置
  getRolePermissions(role: UserRole): Promise<PermissionResponse>
  
  // 检查权限
  checkPermission(permission: string): Promise<boolean>
}
```

### 前端权限管理
```typescript
// 共享权限配置
export const SHARED_PERMISSIONS = {
  SYSTEM: {
    ALL: 'system:*',
    READ: 'system:read',
    WRITE: 'system:write'
  },
  USER: {
    ALL: 'user:*',
    READ: 'user:read',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete'
  },
  STUDENT: {
    ALL: 'student:*',
    READ: 'student:read',
    CREATE: 'student:create',
    UPDATE: 'student:update',
    DELETE: 'student:delete'
  },
  COURSE: {
    ALL: 'course:*',
    READ: 'course:read',
    CREATE: 'course:create',
    UPDATE: 'course:update',
    DELETE: 'course:delete'
  },
  APPLICATION: {
    ALL: 'application:*',
    READ: 'application:read',
    CREATE: 'application:create',
    UPDATE: 'application:update',
    APPROVE: 'application:approve',
    DELETE: 'application:delete'
  }
}

// 角色权限映射
export const ROLE_PERMISSIONS = {
  admin: [
    SHARED_PERMISSIONS.SYSTEM.ALL,
    SHARED_PERMISSIONS.USER.ALL,
    SHARED_PERMISSIONS.STUDENT.ALL,
    SHARED_PERMISSIONS.COURSE.ALL,
    SHARED_PERMISSIONS.APPLICATION.ALL
  ],
  teacher: [
    SHARED_PERMISSIONS.STUDENT.READ,
    SHARED_PERMISSIONS.STUDENT.CREATE,
    SHARED_PERMISSIONS.STUDENT.UPDATE,
    SHARED_PERMISSIONS.COURSE.ALL,
    SHARED_PERMISSIONS.APPLICATION.ALL
  ],
  student: [
    SHARED_PERMISSIONS.STUDENT.READ, // 只能查看自己
    SHARED_PERMISSIONS.COURSE.READ,
    SHARED_PERMISSIONS.APPLICATION.CREATE,
    SHARED_PERMISSIONS.APPLICATION.READ // 只能查看自己的
  ]
}
```

## 📱 移动端实现

### 目录结构
```
mobile/
├── src/
│   ├── auth/
│   │   ├── AuthContext.tsx
│   │   ├── AuthProvider.tsx
│   │   ├── useAuth.ts
│   │   └── permissions.ts
│   ├── utils/
│   │   ├── storage.ts
│   │   └── permissions.ts
│   └── components/
│       ├── PermissionGuard.tsx
│       └── ProtectedRoute.tsx
```

### 权限存储 (移动端)
```typescript
// mobile/src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

export class AuthStorage {
  static async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token)
  }

  static async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token')
  }

  static async clearToken(): Promise<void> {
    await AsyncStorage.removeItem('auth_token')
  }

  static async saveUser(user: UserInfo): Promise<void> {
    await AsyncStorage.setItem('user_info', JSON.stringify(user))
  }

  static async getUser(): Promise<UserInfo | null> {
    const userStr = await AsyncStorage.getItem('user_info')
    return userStr ? JSON.parse(userStr) : null
  }
}
```

### 权限Hook (移动端)
```typescript
// mobile/src/auth/useAuth.ts
import { useContext } from 'react'
import { AuthContext } from './AuthContext'
import { SHARED_PERMISSIONS, ROLE_PERMISSIONS } from './permissions'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  const hasPermission = (permission: string): boolean => {
    const userPermissions = ROLE_PERMISSIONS[context.user?.role] || []
    return checkPermission(userPermissions, permission)
  }

  const hasRole = (roles: UserRole[]): boolean => {
    return context.user ? roles.includes(context.user.role) : false
  }

  const canAccess = (requiredRoles?: UserRole[], requiredPermissions?: string[]): boolean => {
    if (!context.isAuthenticated) return false
    
    if (requiredRoles && !hasRole(requiredRoles)) return false
    
    if (requiredPermissions && !requiredPermissions.every(hasPermission)) {
      return false
    }
    
    return true
  }

  return {
    ...context,
    hasPermission,
    hasRole,
    canAccess
  }
}
```

### 权限组件 (移动端)
```typescript
// mobile/src/components/PermissionGuard.tsx
import React from 'react'
import { View, Text } from 'react-native'
import { useAuth } from '../auth/useAuth'
import { UserRole } from '../types/auth'

interface PermissionGuardProps {
  children: React.ReactNode
  roles?: UserRole[]
  permissions?: string[]
  fallback?: React.ReactNode
  showFallback?: boolean
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  roles,
  permissions,
  fallback,
  showFallback = false
}) => {
  const { canAccess } = useAuth()

  if (!canAccess(roles, permissions)) {
    if (showFallback) {
      return fallback || (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>权限不足</Text>
        </View>
      )
    }
    return null
  }

  return <>{children}</>
}
```

## 🔧 配置文件共享

### 创建共享配置包
```bash
# 创建共享配置包
mkdir packages/shared-config
cd packages/shared-config
npm init -y
```

```typescript
// packages/shared-config/src/permissions.ts
export const PERMISSIONS = {
  SYSTEM: {
    ALL: 'system:*',
    READ: 'system:read',
    WRITE: 'system:write'
  },
  USER: {
    ALL: 'user:*',
    READ: 'user:read',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete'
  },
  STUDENT: {
    ALL: 'student:*',
    READ: 'student:read',
    CREATE: 'student:create',
    UPDATE: 'student:update',
    DELETE: 'student:delete'
  },
  COURSE: {
    ALL: 'course:*',
    READ: 'course:read',
    CREATE: 'course:create',
    UPDATE: 'course:update',
    DELETE: 'course:delete'
  },
  APPLICATION: {
    ALL: 'application:*',
    READ: 'application:read',
    CREATE: 'application:create',
    UPDATE: 'application:update',
    APPROVE: 'application:approve',
    DELETE: 'application:delete'
  }
}

export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.SYSTEM.ALL,
    PERMISSIONS.USER.ALL,
    PERMISSIONS.STUDENT.ALL,
    PERMISSIONS.COURSE.ALL,
    PERMISSIONS.APPLICATION.ALL
  ],
  teacher: [
    PERMISSIONS.STUDENT.READ,
    PERMISSIONS.STUDENT.CREATE,
    PERMISSIONS.STUDENT.UPDATE,
    PERMISSIONS.COURSE.ALL,
    PERMISSIONS.APPLICATION.ALL
  ],
  student: [
    PERMISSIONS.STUDENT.READ,
    PERMISSIONS.COURSE.READ,
    PERMISSIONS.APPLICATION.CREATE,
    PERMISSIONS.APPLICATION.READ
  ]
}

export const checkPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  if (userPermissions.includes(requiredPermission)) return true
  
  const [resource] = requiredPermission.split(':')
  const wildcardPermission = `${resource}:*`
  if (userPermissions.includes(wildcardPermission)) return true
  
  if (userPermissions.includes('system:*')) return true
  
  return false
}
```

## 📝 实施建议

1. **立即实施**: 创建共享配置包，保证两端权限配置一致
2. **短期目标**: 移动端复用现有权限逻辑，减少重复开发
3. **长期规划**: 考虑完全的权限管理包重构

您倾向于哪种方案？我可以立即开始实施相应的权限管理架构。 