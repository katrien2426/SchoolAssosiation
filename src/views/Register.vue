<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <div class="register-title">
          <h1>注册账号</h1>
          <p class="subtitle">Create Your Account</p>
        </div>
      </div>
      
      <el-form
        ref="registerForm"
        :model="form"
        :rules="rules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入学号"
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
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请确认密码"
            :prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入学校邮箱"
            :prefix-icon="Message"
            size="large"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="register-button"
            size="large"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>

        <div class="register-footer">
          <span>已有账号？</span>
          <el-link type="primary" @click="router.push('/login')">立即登录</el-link>
        </div>
      </el-form>

      <div class="register-decoration">
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
import { User, Lock, Message } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: ''
})
const loading = ref(false)

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (form.confirmPassword !== '') {
      if (form.confirmPassword !== value) {
        callback(new Error('两次输入密码不一致'))
      }
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const validateUsername = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入学号'))
  } else if (!/^\d{8}$/.test(value)) {
    callback(new Error('请输入8位学号'))
  } else {
    callback()
  }
}

const validateEmail = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入邮箱'))
  } else {
    // 社长必须使用学校邮箱：8位数字@czu.cn
    const schoolEmailPattern = /^\d{8}@czu\.cn$/
    if (!schoolEmailPattern.test(value)) {
      callback(new Error('请使用学校邮箱（8位学号@czu.cn）'))
    } else if (value.substring(0, 8) !== form.username) {
      callback(new Error('邮箱前缀必须与学号相同'))
    } else {
      callback()
    }
  }
}

const rules = {
  username: [
    { required: true, validator: validateUsername, trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePass, trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ],
  email: [
    { required: true, validator: validateEmail, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!form.username || !form.password || !form.email) {
    ElMessage.error('请填写完整信息')
    return
  }

  loading.value = true
  try {
    const success = await userStore.register({
      username: form.username,
      password: form.password,
      email: form.email
    })
    if (success) {
      ElMessage.success('注册成功')
      router.push('/login')
    }
  } catch (error) {
    console.error('Register error:', error)
    ElMessage.error('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  position: relative;
  overflow: hidden;
}

.register-box {
  width: 440px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-title h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #666;
}

.register-form {
  margin-top: 20px;
}

.register-button {
  width: 100%;
  margin-top: 20px;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.register-footer .el-link {
  margin-left: 8px;
}

.register-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.circle-1 {
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #409eff, #3a8ee6);
  top: -100px;
  left: -100px;
}

.circle-2 {
  width: 150px;
  height: 150px;
  background: linear-gradient(45deg, #67c23a, #4caf50);
  bottom: -75px;
  right: -75px;
}

.circle-3 {
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, #e6a23c, #ffc107);
  top: 50%;
  right: -50px;
  transform: translateY(-50%);
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
</style>
