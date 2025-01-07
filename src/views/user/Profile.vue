<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人资料</span>
          <div>
            <el-button type="warning" @click="handleResetPassword" style="margin-right: 10px">
              重置密码
            </el-button>
            <el-button type="primary" @click="handleEdit">编辑资料</el-button>
          </div>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">
          {{ userInfo.username || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="姓名">
          {{ userInfo.realName || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="userInfo.role === 'admin' ? 'danger' : 'primary'">
            {{ userInfo.role === 'admin' ? '管理员' : '社团主席' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ userInfo.email || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ userInfo.phone || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(userInfo.createdAt) || '未知' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      title="编辑个人资料"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="right"
        label-width="100px"
        style="max-width: 460px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="重置密码"
      width="500px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="right"
        label-width="100px"
        style="max-width: 460px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submittingPassword"
            @click="handlePasswordSubmit"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'
import router from '../../router'
import axios from '../../utils/axios'

const userStore = useUserStore()
const userInfo = ref({})
const dialogVisible = ref(false)
const formRef = ref(null)
const submitting = ref(false)

const form = ref({
  username: '',
  realName: '',
  email: '',
  phone: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

const handleEdit = () => {
  form.value = {
    username: userInfo.value.username,
    realName: userInfo.value.realName,
    email: userInfo.value.email,
    phone: userInfo.value.phone
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  submitting.value = true
  try {
    const data = {
      userId: userStore.user.userId,
      username: form.value.username,
      realName: form.value.realName,
      email: form.value.email,
      phone: form.value.phone
    }
    await axios.put(`/api/users/${userStore.user.userId}`, data)
    ElMessage.success('更新成功')
    dialogVisible.value = false
    // 重新获取用户信息
    await userStore.fetchUserProfile()
    userInfo.value = userStore.user
  } catch (error) {
    console.error('更新用户信息失败:', error)
    ElMessage.error('更新失败')
  } finally {
    submitting.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)
const submittingPassword = ref(false)

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleResetPassword = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordDialogVisible.value = true
}

const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate()
  
  submittingPassword.value = true
  try {
    await axios.put(`/api/users/${userStore.user.userId}/password`, {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
    // 清空表单
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.response?.data?.message || '修改失败')
  } finally {
    submittingPassword.value = false
  }
}

onMounted(async () => {
  console.log('=== Profile Component Mounted ===')
  console.log('Current userStore state:')
  console.log('- user:', userStore.user)
  
  // 获取用户信息
  await userStore.fetchUserProfile()
  userInfo.value = userStore.user
  console.log('Updated userInfo:', userInfo.value)
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer {
  padding-top: 20px;
}
</style>
