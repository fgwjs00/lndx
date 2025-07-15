/**
 * 路由配置
 * @module router/index
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { UserRole } from '@/types/auth'
import type { RouteMeta } from '@/types/auth'

const routes: RouteRecordRaw[] = [
  // 登录页面
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { 
      title: '用户登录',
      requiresAuth: false,
      hidden: true
    }
  },
  // 主应用路由
  {
    path: '/',
    component: () => import('@/components/BaseLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { 
          title: '控制面板',
          requiresAuth: true,
          roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
          icon: 'fas fa-home'
        }
      },
      {
        path: 'student',
        name: 'Student',
        component: () => import('@/views/Student.vue'),
        meta: { 
          title: '学生管理',
          requiresAuth: true,
          roles: [UserRole.ADMIN, UserRole.TEACHER],
          permissions: ['student:read'],
          icon: 'fas fa-user-graduate'
        }
      },

      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/User.vue'),
        meta: { 
          title: '用户管理',
          requiresAuth: true,
          roles: [UserRole.ADMIN],
          permissions: ['user:read'],
          icon: 'fas fa-users'
        }
      },
      {
        path: 'course',
        name: 'Course',
        component: () => import('@/views/Course.vue'),
        meta: { 
          title: '课程管理',
          requiresAuth: true,
          roles: [UserRole.ADMIN, UserRole.TEACHER],
          permissions: ['course:read'],
          icon: 'fas fa-book'
        }
      },
      {
        path: 'application',
        name: 'Application',
        component: () => import('@/views/Application.vue'),
        meta: { 
          title: '报名管理',
          requiresAuth: true,
          roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
          permissions: ['application:read'],
          icon: 'fas fa-file-alt'
        }
      },
      {
        path: 'analysis',
        name: 'Analysis',
        component: () => import('@/views/Analysis.vue'),
        meta: { 
          title: '数据分析',
          requiresAuth: true,
          roles: [UserRole.ADMIN, UserRole.TEACHER],
          permissions: ['analysis:read'],
          icon: 'fas fa-chart-bar'
        }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/Logs.vue'),
        meta: { 
          title: '系统日志',
          requiresAuth: true,
          roles: [UserRole.ADMIN],
          permissions: ['logs:read'],
          icon: 'fas fa-file-alt'
        }
      },
      {
        path: 'setting',
        name: 'Setting',
        component: () => import('@/views/Setting.vue'),
        meta: { 
          title: '系统设置',
          requiresAuth: true,
          roles: [UserRole.ADMIN],
          permissions: ['setting:read'],
          icon: 'fas fa-cog'
        }
      }
    ]
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { 
      title: '页面不存在',
      requiresAuth: false,
      hidden: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 如果还未初始化认证状态，先初始化
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    await authStore.initializeAuth()
  }
  
  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated
  
  // 如果需要认证但用户未登录，跳转到登录页
  if (requiresAuth && !isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // 如果已登录但访问登录页，跳转到首页
  if (to.path === '/login' && isAuthenticated) {
    next('/')
    return
  }
  
  // 检查角色权限
  if (requiresAuth && isAuthenticated) {
    const requiredRoles = to.meta.roles as UserRole[]
    const requiredPermissions = to.meta.permissions as string[]
    
    if (!authStore.canAccess(requiredRoles, requiredPermissions)) {
      // 权限不足，跳转到403页面或首页
      next('/')
      return
    }
  }
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 学生报名及档案管理系统`
  }
  
  next()
})

export default router 