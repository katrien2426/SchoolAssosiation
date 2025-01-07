<template>
  <div class="user-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Plus />
        </el-icon>新增用户
      </el-button>

      <div class="filter-section">
      <el-input v-model="filter.keyword" placeholder="请输入用户名" clearable @keyup.enter="handleFilter" style="width: 200px;">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>

      <el-select v-model="filter.role" placeholder="角色" clearable style="width: 120px;">
        <el-option label="管理员" value="admin" />
        <el-option label="社长" value="club_president" />
      </el-select>

      <el-button type="primary" @click="handleFilter">
        <el-icon>
          <Search />
        </el-icon>查询
      </el-button>
      <el-button @click="resetFilter">
        <el-icon>
          <Refresh />
        </el-icon>重置
      </el-button>
      </div>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="users.slice((currentPage - 1) * pageSize, currentPage * pageSize)" style="width: 100%" v-loading="loading" row-key="userId"
        :header-cell-style="{ background: '#f5f7fa' }">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="realName" label="姓名" />
        <el-table-column prop="role" label="角色">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : ''">
              {{ scope.row.role === 'admin' ? '管理员' : '社长' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="电话" />
        <el-table-column prop="createdAt" label="创建时间">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button-group>
              <el-button type="primary" @click="handleEdit(scope.row)">
                <el-icon>
                  <Edit />
                </el-icon>编辑
              </el-button>
              <el-button type="danger" @click="handleDelete(scope.row)">
                <el-icon>
                  <Delete />
                </el-icon>删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="users.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
        />
      </div>

      <!-- 用户表单对话框 -->
      <el-dialog :title="editingUser ? '编辑用户' : '新增用户'" v-model="dialogVisible" width="500px">
        <el-form ref="userFormRef" :model="userForm" :rules="rules" label-width="100px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="userForm.username" :disabled="!!editingUser" />
          </el-form-item>
          <el-form-item label="姓名" prop="realName">
            <el-input v-model="userForm.realName" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="userForm.email" type="email" />
          </el-form-item>
          <el-form-item label="电话" prop="phone">
            <el-input v-model="userForm.phone" />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="userForm.role" placeholder="请选择角色">
              <el-option label="管理员" value="admin" />
              <el-option label="社长" value="club_president" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属社团" prop="clubId" v-if="userForm.role === 'club_president'">
            <el-select v-model="userForm.clubId" placeholder="请选择社团" @change="userFormRef?.clearValidate('clubId')">
              <el-option v-for="club in clubs" :key="club.clubId" :label="club.clubName" :value="club.clubId" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="!editingUser" label="密码" prop="password">
            <el-input v-model="userForm.password" type="password" show-password />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh } from '@element-plus/icons-vue'
import axios from '../../utils/axios'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingUser = ref(null)
const userFormRef = ref(null)
const clubs = ref([]) // 存储社团列表

const filter = ref({
  keyword: '',
  role: ''
})

const userForm = ref({
  username: '',
  realName: '',
  email: '',
  phone: '',
  role: 'club_president',
  password: '',
  clubId: undefined // 添加社团ID字段
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 获取社团列表
const fetchClubs = async () => {
  try {
    const response = await axios.get('/api/clubs/active')
    if (response.data.code === 200) {
      clubs.value = response.data.data
      console.log('获取到的社团列表:', clubs.value)
    }
  } catch (error) {
    console.error('获取社团列表失败:', error)
    ElMessage.error('获取社团列表失败')
  }
}

// 邮箱验证函数
const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入邮箱'))
  } else if (userForm.value.role === 'club_president') {
    // 社长必须使用学校邮箱：8位数字@czu.cn
    if (!/^\d{8}@czu\.cn$/.test(value)) {
      callback(new Error('社长必须使用学校邮箱（8位数字@czu.cn）'))
    } else {
      callback()
    }
  } else {
    // 管理员使用普通邮箱格式验证
    if (!/^[A-Za-z0-9+_.-]+@(.+)$/.test(value)) {
      callback(new Error('请输入有效的邮箱地址'))
    } else {
      callback()
    }
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  clubId: [
    {
      required: true,
      message: '请选择所属社团',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (userForm.value.role === 'club_president' && !value && value !== 0) {
          callback(new Error('请选择所属社团'))
        } else {
          callback()
        }
      }
    }
  ]
}

// 监听角色变化，自动清空邮箱和社团
watch(() => userForm.value.role, (newRole) => {
  userForm.value.email = ''
  if (newRole === 'club_president') {
    // 当角色变为社长时，重新获取社团列表
    fetchClubs()
  } else {
    userForm.value.clubId = undefined
  }
})

// 监听社团ID变化
watch(() => userForm.value.clubId, (newValue) => {
  if (newValue || newValue === 0) {
    // 清除表单项的验证错误
    userFormRef.value?.clearValidate('clubId')
  }
})

// 监听对话框关闭
watch(dialogVisible, (val) => {
  if (val && userForm.value.role === 'club_president') {
    fetchClubs()
  }
  if (!val) {
    userFormRef.value?.resetFields()
  }
})

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {}
    if (filter.value.keyword) {
      params.keyword = filter.value.keyword
    }
    if (filter.value.role) {
      params.role = filter.value.role
    }
    const response = await axios.get('/api/users', { params })
    if (response.data.code === 200) {
      users.value = Array.isArray(response.data.data) ? response.data.data : []
    }
  } catch (error) {
    console.error('获取用户列表错误:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 处理过滤
const handleFilter = () => {
  currentPage.value = 1 // 重置页码到第一页
  fetchUsers() // 直接调用 fetchUsers，它会使用 filter 中的值
}

// 重置过滤
const resetFilter = () => {
  filter.value = {
    keyword: '',
    role: ''
  }
  currentPage.value = 1 // 重置页码到第一页
  fetchUsers()
}

// 处理添加用户
const handleAdd = () => {
  editingUser.value = null
  userForm.value = {
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: 'club_president',
    password: '',
    clubId: undefined
  }
  dialogVisible.value = true
  // 打开对话框时获取社团列表
  fetchClubs()
}

// 处理编辑用户
const handleEdit = (row) => {
  editingUser.value = row
  userForm.value = {
    ...row,
    password: ''
  }
  dialogVisible.value = true
  // 如果是社长，打开对话框时获取社团列表
  if (row.role === 'club_president') {
    fetchClubs()
  }
}

// 处理删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该用户吗？此操作不可恢复',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/users/${row.userId}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchUsers()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

// 处理表单提交
const handleSubmit = async () => {
  if (!userFormRef.value) return

  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const formData = { ...userForm.value }

        // 处理空字符串
        if (!formData.phone) {
          delete formData.phone
        }

        // 如果不是社长，删除 clubId
        if (formData.role !== 'club_president') {
          formData.clubId = null
        }

        // 确保密码字段正确
        if (!editingUser.value && formData.password) {
          // 对于新用户，使用password字段
          formData.password = formData.password
        } else {
          // 编辑时不发送密码字段
          delete formData.password
        }

        // 处理日期字段
        formData.createdAt = new Date().toISOString()

        const url = editingUser.value
          ? `/api/users/${editingUser.value.userId}`
          : '/api/users/register'
        const method = editingUser.value ? 'put' : 'post'

        console.log('Sending form data:', formData)
        const response = await axios[method](url, formData)

        if (response.data.code === 200) {
          ElMessage.success(`${editingUser.value ? '编辑' : '新增'}成功`)
          dialogVisible.value = false
          fetchUsers()
        } else {
          ElMessage.error(response.data.message || `${editingUser.value ? '编辑' : '新增'}失败`)
        }
      } catch (error) {
        console.error(`${editingUser.value ? '编辑' : '新增'}用户失败:`, error)
        ElMessage.error(error.response?.data?.message || `${editingUser.value ? '编辑' : '新增'}失败`)
      }
    }
  })
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

onMounted(() => {
  fetchUsers()
  fetchClubs()
})
</script>

<style scoped>
.user-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  display: flex;
  gap: 10px;
  align-items: center;
}

.el-input {
  width: 200px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.custom-pagination :deep(.el-select) {
  width: 100px !important;
}

.custom-pagination :deep(.el-input__wrapper) {
  width: 100px !important;
}
</style>
