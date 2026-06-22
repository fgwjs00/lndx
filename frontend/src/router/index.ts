import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/auth'
import { useAuthStore } from '@/store/auth'

const routes: RouteRecordRaw[] = [
  // 登录页
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { 
      title: '登录',
      requiresAuth: false,
      hidden: true
    }
  },
  // 强制修改密码页
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('@/views/ChangePasswordPage.vue'),
    meta: { 
      title: '修改密码',
      requiresAuth: true,
      hidden: true
    }
  },
  // 手机端报名页面
  {
    path: '/mobile-registration',
    name: 'MobileRegistration',
    component: () => import('@/views/MobileRegistration.vue'),
    meta: { 
      title: '学员报名',
      requiresAuth: false, // 允许匿名访问，便于学员自主报名
      hidden: true // 不显示在主导航菜单中
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
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT],
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
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
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
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
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
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
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
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT],
          permissions: ['application:read'],
          icon: 'fas fa-file-alt'
        }
      },
      {
        path: 'rosters',
        name: 'RosterManagement',
        component: () => import('@/views/RosterManagement.vue'),
        meta: {
          title: '花名册管理',
          requiresAuth: true,
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
          permissions: ['application:read'],
          icon: 'fas fa-clipboard-list'
        }
      },
      {
        path: 'insurance-review',
        name: 'InsuranceReview',
        component: () => import('@/views/InsuranceReview.vue'),
        meta: {
          title: '保险审核',
          requiresAuth: true,
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
          icon: 'fas fa-shield-alt'
        }
      },
      {
        path: 'registration',
        name: 'Registration',
        component: () => import('@/views/Registration.vue'),
        meta: { 
          title: '报名登记',
          requiresAuth: true,
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT],
          permissions: ['application:create'],
          icon: 'fas fa-edit'
        }
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: () => import('@/views/Attendance.vue'),
        meta: { 
          title: '学员签到',
          requiresAuth: true,
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
          permissions: ['attendance:manage'],
          icon: 'fas fa-user-check'
        }
      },
      {
        path: 'analysis',
        name: 'Analysis',
        component: () => import('@/views/Analysis.vue'),
        meta: { 
          title: '数据分析',
          requiresAuth: true,
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
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
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
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
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT],
          permissions: ['setting:read'],
          icon: 'fas fa-cog'
        }
      },
      {
        path: 'role-management',
        name: 'RoleManagement',
        component: () => import('@/views/RoleManagement.vue'),
        meta: { 
          title: '角色权限管理',
          requiresAuth: true,
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
          permissions: ['system:*'],
          icon: 'fas fa-user-shield'
        }
      },
      {
        path: 'grade-management',
        name: 'GradeManagement',
        component: () => import('@/views/GradeManagementSimple.vue'),
        meta: { 
          title: '年级管理',
          requiresAuth: true,
          roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
          permissions: ['grade:read'],
          icon: 'fas fa-graduation-cap'
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
  console.log('🛡️ 路由守卫检查:', { to: to.path, from: from.path })
  
  const authStore = useAuthStore()
  
  // 如果还未初始化认证状态，先初始化
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    console.log('🔄 路由守卫：检测到未初始化的认证状态，重新初始化...')
    await authStore.initializeAuth()
  }
  
  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated
  const mustChangePassword = authStore.mustChangePassword
  
  console.log('🔍 权限检查:', { requiresAuth, isAuthenticated, mustChangePassword, userRole: authStore.user?.role })
  
  // 如果需要认证但用户未登录，跳转到登录页
  if (requiresAuth && !isAuthenticated) {
    console.log('❌ 需要认证但未登录，跳转到登录页')
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // 如果已登录但访问登录页，跳转到首页
  if (to.path === '/login' && isAuthenticated) {
    console.log('✅ 已登录用户访问登录页，跳转到首页')
    next('/')
    return
  }
  
  // 检查是否需要强制修改密码
  if (isAuthenticated && mustChangePassword && to.path !== '/change-password') {
    console.log('🔒 用户需要强制修改密码，跳转到修改密码页面')
    next('/change-password')
    return
  }
  
  // 如果在修改密码页面且不需要强制修改密码，跳转到首页
  if (to.path === '/change-password' && isAuthenticated && !mustChangePassword) {
    console.log('✅ 密码已修改，跳转到首页')
    next('/')
    return
  }
  
  // 检查角色权限
  if (requiresAuth && isAuthenticated) {
    const requiredRoles = to.meta.roles as UserRole[]
    const requiredPermissions = to.meta.permissions as string[]
    
    console.log('🔐 检查权限:', { requiredRoles, requiredPermissions, userRole: authStore.user?.role })
    
    if (!authStore.canAccess(requiredRoles, requiredPermissions)) {
      console.log('❌ 权限不足，跳转到首页')
      // 权限不足，跳转到403页面或首页
      next('/')
      return
    }
  }
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 学生报名及档案管理系统`
  }
  
  console.log('✅ 路由检查通过，允许访问')
  next()
})

export default router
