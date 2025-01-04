<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="login-title">
          <h1>校园社团管理系统</h1>
          <p class="subtitle">Campus Association Management System</p>
        </div>
      </div>
      
      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-button"
            size="large"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <span>还没有账号？</span>
          <el-link type="primary" @click="router.push('/register')">立即注册</el-link>
        </div>
      </el-form>

      <div class="login-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const form = reactive({
  username: '',
  password: ''
})
const loading = ref(false)

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  loading.value = true
  try {
    const success = await userStore.login(form.username, form.password)
    if (success) {
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } catch (error) {
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  position: relative;
  overflow: hidden;
}

.login-box {
  width: 440px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.login-title h1 {
  margin: 0;
  font-size: 28px;
  color: #1a1a1a;
  font-weight: 600;
  letter-spacing: 1px;
}

.subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.login-form {
  width: 100%;
  position: relative;
  z-index: 1;
}

.login-button {
  width: 100%;
  margin-top: 16px;
  height: 44px;
  font-size: 16px;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  border: none;
  transition: transform 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #606266;
  position: relative;
  z-index: 1;
}

.login-footer .el-link {
  margin-left: 8px;
  font-weight: 500;
}

.login-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.circle-1 {
  width: 160px;
  height: 160px;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  top: -80px;
  right: -80px;
}

.circle-2 {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #36cfc9 0%, #1890ff 100%);
  bottom: -60px;
  left: -60px;
}

.circle-3 {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  bottom: 40px;
  right: -40px;
}

:deep(.el-input__wrapper) {
  background-color: #f5f7fa;
  border: none;
  box-shadow: none !important;
  transition: all 0.3s ease;
  height: 44px;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #1890ff !important;
}

:deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
  color: #333;
}

:deep(.el-input__prefix) {
  color: #909399;
}

:deep(.el-form-item__error) {
  padding-top: 4px;
  font-size: 13px;
}
</style>
