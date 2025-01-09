import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    redirect: '/login'  // 修改这里，将根路径重定向到登录页面
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/clubs',
    name: 'Clubs',
    component: () => import('../views/club/ClubList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: () => import('../views/activity/ActivityList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/honors',
    name: 'Honors',
    component: () => import('../views/honor/HonorList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/finance',
    name: 'Finance',
    component: () => import('../views/finance/FinanceList.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/users',
    name: 'UserList',
    component: () => import('../views/user/UserList.vue'),
    meta: { 
      requiresAuth: true,
      title: '用户管理'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/user/Profile.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 如果用户已登录且尝试访问登录页面，重定向到仪表盘
  if (userStore.isLoggedIn && to.path === '/login') {
    next('/dashboard')
    return
  }
  
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!userStore.isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 检查是否需要管理员权限
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      if (!userStore.isAdmin) {
        ElMessage.error('您没有权限访问此页面')
        next('/dashboard')
        return
      }
    }
  }
  
  next()
})

export default router
