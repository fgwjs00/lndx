# 共享权限管理包设计方案

## 📁 目录结构
```
shared-auth/
├── package.json
├── tsconfig.json
├── src/
│   ├── types/
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── permissions.ts
│   │   ├── roles.ts
│   │   └── validators.ts
│   ├── store/
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── composables/
│   │   ├── useAuth.ts
│   │   └── usePermissions.ts
│   └── index.ts
├── dist/
└── README.md
```

## 🔧 核心功能

### 1. 权限配置管理
```typescript
// src/utils/permissions.ts
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
  }
}

export const ROLE_PERMISSIONS = {
  admin: [PERMISSIONS.SYSTEM.ALL],
  teacher: [
    PERMISSIONS.STUDENT.READ,
    PERMISSIONS.STUDENT.CREATE,
    PERMISSIONS.STUDENT.UPDATE,
    PERMISSIONS.COURSE.ALL,
    PERMISSIONS.APPLICATION.ALL
  ],
  student: [
    PERMISSIONS.PROFILE.READ,
    PERMISSIONS.PROFILE.UPDATE,
    PERMISSIONS.COURSE.READ,
    PERMISSIONS.APPLICATION.CREATE
  ]
}
```

### 2. 通用权限检查
```typescript
// src/utils/validators.ts
export class PermissionValidator {
  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // 直接匹配
    if (userPermissions.includes(requiredPermission)) return true
    
    // 通配符匹配
    const [resource] = requiredPermission.split(':')
    const wildcardPermission = `${resource}:*`
    if (userPermissions.includes(wildcardPermission)) return true
    
    // 超级权限
    if (userPermissions.includes('system:*')) return true
    
    return false
  }

  static hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole)
  }

  static canAccess(user: UserInfo, requiredRoles?: UserRole[], requiredPermissions?: string[]): boolean {
    if (!user) return false
    
    if (requiredRoles && !this.hasRole(user.role, requiredRoles)) {
      return false
    }
    
    if (requiredPermissions) {
      const userPermissions = ROLE_PERMISSIONS[user.role] || []
      if (!requiredPermissions.every(perm => this.hasPermission(userPermissions, perm))) {
        return false
      }
    }
    
    return true
  }
}
```

### 3. 平台适配器
```typescript
// src/adapters/web.ts
export class WebAuthAdapter {
  static saveToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  static getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  static clearToken(): void {
    localStorage.removeItem('auth_token')
  }
}

// src/adapters/mobile.ts
export class MobileAuthAdapter {
  static async saveToken(token: string): Promise<void> {
    // 移动端可能使用SecureStore等
    await SecureStore.setItemAsync('auth_token', token)
  }

  static async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token')
  }

  static async clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token')
  }
}
```

## 📱 使用方式

### PC端使用
```typescript
// frontend/src/composables/useAuth.ts
import { createAuthStore } from '@shared/auth-package'
import { WebAuthAdapter } from '@shared/auth-package/adapters'

export const useAuth = () => {
  return createAuthStore({
    adapter: WebAuthAdapter,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL
  })
}
```

### 移动端使用
```typescript
// mobile/src/composables/useAuth.ts
import { createAuthStore } from '@shared/auth-package'
import { MobileAuthAdapter } from '@shared/auth-package/adapters'

export const useAuth = () => {
  return createAuthStore({
    adapter: MobileAuthAdapter,
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL
  })
}
```

## 🏗️ 优点
- **代码复用**: 权限逻辑完全共享
- **一致性**: 保证两端权限行为一致
- **维护性**: 只需维护一套权限代码
- **类型安全**: 完整的TypeScript支持
- **灵活性**: 支持不同平台的适配

## 🔧 缺点
- **初期投入**: 需要重构现有代码
- **依赖管理**: 需要管理包版本
- **调试复杂**: 跨包调试稍复杂 