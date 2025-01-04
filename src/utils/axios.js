import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const instance = axios.create({
    baseURL: 'http://localhost:9090',
    timeout: 5000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器
instance.interceptors.request.use(
    config => {
        console.log('=== Request Debug Info ===');
        console.log('Request URL:', config.url);
        console.log('Request Method:', config.method);
        console.log('Request Base URL:', config.baseURL);
        console.log('Full URL:', config.baseURL + config.url);
        
        // 每次请求都从localStorage获取最新的token
        console.log('Checking localStorage for token...');
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token);
        
        if (token) {
            console.log('Token found, processing...');
            // 确保添加Bearer前缀
            config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            console.log('Final token:', config.headers.Authorization);
        } else {
            console.log('No token found in localStorage');
        }
        
        console.log('Final request headers:', JSON.stringify(config.headers, null, 2));
        console.log('Request body:', config.data);
        console.log('========================');
        
        return config;
    },
    error => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
)

// 响应拦截器
instance.interceptors.response.use(
    response => {
        console.log('=== Response Debug Info ===');
        console.log('Response Status:', response.status);
        console.log('Response Headers:', response.headers);
        console.log('Response Data:', response.data);
        console.log('=========================');

        // 如果是登录接口，直接返回响应
        if (response.config.url.includes('/api/users/login')) {
            console.log('Login response detected, skipping token check');
            return response;
        }

        // 处理401未登录状态
        if (response.data.code === 401) {
            console.log('Unauthorized access detected (401)');
            // 清除token
            localStorage.removeItem('token');
            
            // 如果不是登录页面，才跳转到登录页面
            if (!window.location.pathname.includes('/login')) {
                console.log('Not on login page, redirecting...');
                ElMessage.error('登录已过期，请重新登录');
                router.push('/login');
            }
            return Promise.reject(new Error(response.data.message || '未登录'));
        }

        return response;
    },
    error => {
        console.error('=== Response Error Debug ===');
        console.error('Error:', error);
        console.error('Error Response:', error.response);
        console.error('Error Config:', error.config);
        console.error('=====================');

        if (error.response?.status === 401 || (error.response?.data?.code === 401)) {
            console.log('401 error detected, clearing token');
            // 清除token
            localStorage.removeItem('token');
            
            // 如果不是登录页面，才跳转到登录页面
            if (!window.location.pathname.includes('/login')) {
                console.log('Not on login page, redirecting to login');
                ElMessage.error('登录已过期，请重新登录');
                router.push('/login');
            }
        }
        return Promise.reject(error);
    }
)

export default instance
