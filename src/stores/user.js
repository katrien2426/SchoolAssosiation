import { defineStore } from 'pinia'
import axios from '../utils/axios'
import { ElMessage } from 'element-plus'
import router from '../router'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token')
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => {
      console.log('Checking admin status:', state.user?.role)
      return state.user?.role?.toUpperCase() === 'ADMIN'
    },
    username: (state) => state.user?.username,
    userInfo: (state) => state.user,
    isClubPresident: (state) => {
      console.log('Role check in store:', state.user?.role)
      return state.user?.role === 'club_president'
    }
  },
  
  actions: {
    // 添加初始化方法
    init() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        this.fetchUserProfile();  // 获取用户信息
      }
    },

    async login(username, password) {
      try {
        console.log('=== Login Debug Info ===')
        console.log('Attempting login with username:', username)
        
        const response = await axios.post('/api/users/login', {
          username,
          password
        });
        
        console.log('Login response:', response.data)
        
        if (response.data.code === 200) {
          // 后端直接返回用户对象
          this.user = response.data.data;
          console.log('User object:', this.user)
          
          // 使用用户ID作为token，不添加Bearer前缀
          this.token = `user_${this.user.userId}`;
          console.log('Generated token:', this.token)
          
          localStorage.setItem('token', this.token);
          localStorage.setItem('userId', this.user.userId);
          
          console.log('Stored in localStorage:')
          console.log('- token:', localStorage.getItem('token'))
          console.log('- userId:', localStorage.getItem('userId'))
          
          ElMessage.success('登录成功');
          await router.push('/dashboard');
          return true;
        } else {
          console.log('Login failed:', response.data.message)
          ElMessage.error(response.data.message || '登录失败');
          return false;
        }
      } catch (error) {
        console.error('Login error:', error);
        ElMessage.error('登录失败，请稍后重试');
        return false;
      }
    },
    
    async logout() {
      try {
        console.log('=== Logout Debug Info ===')
        console.log('Before logout:')
        console.log('- token:', localStorage.getItem('token'))
        console.log('- userId:', localStorage.getItem('userId'))
        
        this.user = null;
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        
        console.log('After logout:')
        console.log('- token:', localStorage.getItem('token'))
        console.log('- userId:', localStorage.getItem('userId'))
        
        ElMessage.success('退出登录成功');
        router.push('/login');
      } catch (error) {
        console.error('Logout failed:', error);
        ElMessage.error('退出登录失败');
      }
    },

    async fetchUserProfile() {
      try {
        console.log('=== Fetch User Profile Debug Info ===')
        const userId = localStorage.getItem('userId')
        console.log('userId from localStorage:', userId)
        
        if (!userId) {
          console.log('No userId found in localStorage')
          return false
        }
        
        console.log('Fetching user profile for userId:', userId)
        const response = await axios.get(`/api/users/${userId}`)
        console.log('Profile response:', response.data)
        
        if (response.data.code === 200) {
          // 确保所有字段都有值，并且正确映射字段名
          const userData = response.data.data || {}
          this.user = {
            userId: userData.userId || '',
            username: userData.username || '',
            realName: userData.realName || '',  // 保持和后端一致
            role: userData.role || '',
            email: userData.email || '',
            phone: userData.phone || '',
            createdAt: userData.createdAt || '',
            updatedAt: userData.updatedAt || ''
          }
          console.log('Updated user in store:', this.user)
          return true
        }
        console.log('Failed to fetch profile:', response.data)
        return false
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        return false
      }
    },

    async register({ username, password, email }) {
      try {
        const response = await axios.post('/api/users/register', {
          username,
          password,
          email,
          role: 'club_president', // 默认注册为社长
          realName: username, // 默认使用用户名作为真实姓名
          phone: '未设置'
        });
        
        if (response.data.code === 200) {
          ElMessage.success('注册成功，请登录');
          router.push('/login');
          return true;
        } else {
          ElMessage.error(response.data.message || '注册失败');
          return false;
        }
      } catch (error) {
        console.error('Register error:', error);
        ElMessage.error('注册失败，请稍后重试');
        return false;
      }
    }
  }
})
