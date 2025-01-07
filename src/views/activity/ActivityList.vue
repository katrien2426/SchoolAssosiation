<template>
  <div class="activity-container">
    <div class="toolbar">
      <!-- 修改添加按钮的显示逻辑 -->
      <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="isAdmin || isClubPresident">
        新增活动
      </el-button>

      <div class="filter-section">
        <el-input v-model="searchForm.activityName" placeholder="请输入活动名称" clearable style="width: 200px">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>

        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
          <el-option label="全部" value=""></el-option>
          <el-option label="草稿" value="draft"></el-option>
          <el-option label="待审核" value="pending"></el-option>
          <el-option label="已通过" value="approved"></el-option>
          <el-option label="已拒绝" value="rejected"></el-option>
          <el-option label="进行中" value="ongoing"></el-option>
          <el-option label="已完成" value="completed"></el-option>
        </el-select>

        <el-button type="primary" @click="handleSearch">
          <el-icon>
            <Search />
          </el-icon>查找
        </el-button>
        <el-button @click="resetFilter">
          <el-icon>
            <Refresh />
          </el-icon>重置
        </el-button>
      </div>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="activities.slice((currentPage - 1) * pageSize, currentPage * pageSize)" border style="width: 100%" v-loading="loading"
        :header-cell-style="{ background: '#f5f7fa' }">
        <el-table-column prop="activityName" label="活动名称" style width="130"/>
        <el-table-column prop="clubName" label="举办社团" style width="100"/>
        <el-table-column prop="location" label="活动地点" style width="100"/>
        <el-table-column prop="startDate" label="开始时间" style width="100">
          <template #default="scope">
            {{ formatDate(scope.row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="endDate" label="结束时间" style width="100">
          <template #default="scope">
            {{ formatDate(scope.row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxParticipants" label="最大人数限制" />
        <el-table-column prop="description" label="活动描述">
          <template #default="scope">
            <el-button type="text" @click="handleViewDescription(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="350">
          <template #default="{ row }">
            <el-button-group>
              <template v-if="row.status === 'draft' && canManageActivity(row)">
                <el-button type="primary" @click="handleSubmitDraft(row)">
                  提交
                </el-button>
                <el-button type="primary" :icon="Edit" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button type="danger" :icon="Delete" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
              <template v-else-if="row.status === 'pending' && isAdmin">
                <el-button type="success" @click="handleApprove(row)">
                  通过
                </el-button>
                <el-button type="danger" @click="handleReject(row)">
                  拒绝
                </el-button>
              </template>
              <template v-else-if="canManageActivity(row)">
                <el-button type="primary" :icon="Edit" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button type="danger" :icon="Delete" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
              <el-button type="info" @click="handleViewAuditLogs(row)" v-if="canManageActivity(row)">
                审核记录
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
          :total="activities.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 活动表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.activityId ? '编辑活动' : '新增活动'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 650px">
        <el-form-item label="活动名称" prop="activityName">
          <el-input v-model="form.activityName" />
        </el-form-item>
        <el-form-item label="举办社团" prop="clubId">
          <el-select 
            v-model="form.clubId" 
            placeholder="请选择社团"
            :disabled="currentUserRole === 'club_president'"
          >
            <el-option 
              v-for="club in filteredClubs" 
              :key="club.clubId" 
              :label="club.clubName" 
              :value="club.clubId" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="活动时间" prop="dateRange">
          <el-date-picker v-model="form.dateRange" type="datetimerange" range-separator="至" start-placeholder="开始时间"
            end-placeholder="结束时间" />
        </el-form-item>
        <el-form-item label="最大人数限制" prop="maxParticipants">
          <el-input-number v-model="form.maxParticipants" :min="1" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 拒绝理由对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="500px">
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="100px">
        <el-form-item label="拒绝理由" prop="comments">
          <el-input v-model="rejectForm.comments" type="textarea" :rows="3" placeholder="请输入拒绝理由" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="submitReject" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 审核记录对话框 -->
    <el-dialog v-model="auditLogsDialogVisible" title="审核记录" width="600px">
      <el-table :data="auditLogs" style="width: 100%" :header-cell-style="{ background: '#f5f7fa' }">
        <el-table-column prop="date" label="日期" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="审核人" width="150" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="comments" label="备注" />
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditLogsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 活动描述对话框 -->
    <el-dialog v-model="descriptionDialogVisible" title="活动描述" width="500px">
      <span>{{ currentDescription }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="descriptionDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Edit, Delete, Plus, Check, Close, Upload, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const userStore = useUserStore()
const currentUserRole = computed(() => userStore.userInfo?.role)
const currentUserId = computed(() => userStore.userInfo?.userId)
const activities = ref([])
const clubs = ref([])
const loading = ref(false)
const submitting = ref(false)

// 搜索表单
const searchForm = ref({
  activityName: '',
  status: ''
})

const dialogVisible = ref(false)
const formRef = ref(null)
const form = ref({
  activityId: null,
  activityName: '',
  description: '',
  dateRange: [],
  location: '',
  maxParticipants: 30,
  clubId: null,
  status: 'draft'
})

const rules = {
  activityName: [
    { required: true, message: '请输入活动名称', trigger: 'blur' }
  ],
  clubId: [
    { required: true, message: '请选择举办社团', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入活动地点', trigger: 'blur' }
  ],
  dateRange: [
    { required: true, message: '请选择活动时间', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入活动描述', trigger: 'blur' }
  ],
  maxParticipants: [
    { required: true, message: '请输入最大人数限制', trigger: 'blur' }
  ]
}

const isAdmin = computed(() => {
  console.log('User object:', userStore.user)
  console.log('User role:', userStore.user?.role)
  console.log('Is admin?', userStore.isAdmin)
  return userStore.isAdmin
})

const isClubPresident = computed(() => {
  // 直接从 store 获取角色判断
  const role = userStore.userInfo?.role
  const isPresident = role === 'club_president'
  console.log('Club president check:', { role, isPresident })
  return isPresident
})

const filteredClubs = computed(() => {
  if (currentUserRole.value === 'club_president') {
    return clubs.value.filter(club => String(club.presidentId) === String(currentUserId.value))
  }
  return clubs.value
})

const canManageActivity = (activity) => {
  // 管理员可以管理所有活动
  if (userStore.isAdmin) return true
  
  // 社长只能管理自己社团的活动
  if (isClubPresident.value) {
    const currentUserId = userStore.user?.userId

    // 如果是新增活动，检查用户是否是某个社团的社长
    if (!activity) {
      // 需要检查clubs列表中是否有当前用户作为社长的社团
      return clubs.value.some(club => String(club.presidentId) === String(currentUserId))
    }

    // 如果是已有活动，先找到对应的社团
    const club = clubs.value.find(c => String(c.clubId) === String(activity.clubId))
    if (!club) return false

    // 检查用户是否是该社团的社长
    return String(club.presidentId) === String(currentUserId)
  }
  
  return false
}

const handleSearch = () => {
  currentPage.value = 1  // 搜索时重置到第一页
  fetchActivities()
}

const resetFilter = () => {  // 更改方法名以匹配模板中的调用
  searchForm.value = {
    activityName: '',
    status: ''
  }
  currentPage.value = 1  // 重置到第一页
  pageSize.value = 10   // 重置每页显示条数
  fetchActivities()
}

const fetchActivities = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    
    let url = '/api/activities'
    let params = {}
    
    if (searchForm.value.activityName) {
      params.activityName = searchForm.value.activityName
    }
    
    if (searchForm.value.status) {
      if (searchForm.value.activityName) {
        // 如果同时有活动名称和状态，使用原来的接口
        params.status = searchForm.value.status
      } else {
        // 如果只有状态，使用新的状态查询接口
        url = `/api/activities/status/${searchForm.value.status}`
      }
    }
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params
    })
    
    if (response.data.code === 200) {
      activities.value = response.data.data
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
    ElMessage.error('获取活动列表失败')
  } finally {
    loading.value = false
  }
}

const fetchClubs = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/clubs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (response.data.code === 200) {
      clubs.value = response.data.data
      console.log('Fetched clubs:', clubs.value)
    }
  } catch (error) {
    console.error('获取社团列表失败:', error)
    ElMessage.error('获取社团列表失败')
  }
}

const handleAdd = () => {
  const userClub = currentUserRole.value === 'club_president' 
    ? clubs.value.find(club => String(club.presidentId) === String(currentUserId.value))
    : null

  if (currentUserRole.value === 'club_president' && !userClub) {
    ElMessage.warning('你没有管理的社团，无法添加活动')
    return
  }

  form.value = {
    activityId: null,
    activityName: '',
    description: '',
    dateRange: [],
    location: '',
    maxParticipants: 30,
    clubId: userClub ? userClub.clubId : null,
    status: 'draft'
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  if (currentUserRole.value === 'club_president') {
    const userClub = clubs.value.find(club => 
      String(club.presidentId) === String(currentUserId.value))
    if (!userClub || row.clubId !== userClub.clubId) {
      ElMessage.warning('你只能编辑自己社团的活动')
      return
    }
  }
  
  form.value = {
    ...row,
    // 在设置日期时添加8小时的时区调整
    dateRange: [
      dayjs(row.startDate).add(8, 'hour').toDate(),
      dayjs(row.endDate).add(8, 'hour').toDate()
    ]
  }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  if (!canManageActivity(row)) {
    ElMessage.warning('你只能删除自己社团的活动')
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除该活动吗？', '提示', {
      type: 'warning'
    })
    const token = localStorage.getItem('token')
    await axios.delete(`/api/activities/${row.activityId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    ElMessage.success('删除成功')
    fetchActivities()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除活动失败:', error)
      ElMessage.error('删除活动失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const token = localStorage.getItem('token')
        const userId = localStorage.getItem('userId')

        const formData = {
          ...form.value,
          startDate: form.value.dateRange[0],
          endDate: form.value.dateRange[1],
          createdBy: parseInt(userId),
          status: 'draft' // 新增活动时状态为草稿
        }
        delete formData.dateRange

        const url = form.value.activityId ?
          `/api/activities/${form.value.activityId}` : '/api/activities'
        const method = form.value.activityId ? 'put' : 'post'

        const response = await axios[method](url, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.data.code === 200) {
          ElMessage.success(form.value.activityId ? '更新成功' : '创建成功')
          dialogVisible.value = false
          fetchActivities()
        }
      } catch (error) {
        console.error('提交活动表单失败:', error)
        ElMessage.error('提交失败')
      }
    }
  })
}

const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).add(8, 'hour').format('YYYY-MM-DD HH:mm')
}

const getStatusType = (status) => {
  const types = {
    'draft': 'info',
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'ongoing': 'primary',
    'completed': '',
    'cancelled': 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    'draft': '草稿',
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已拒绝',
    'ongoing': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return texts[status] || status
}

const handleSubmitDraft = async (row) => {
  try {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    const response = await axios.put(`/api/activities/${row.activityId}/status`,
      {
        status: 'pending',
        userId: parseInt(userId)
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.data.code === 200) {
      ElMessage.success('提交成功')
      fetchActivities()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  }
}

const handleApprove = async (row) => {
  try {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    const response = await axios.put(`/api/activities/${row.activityId}/approve`,
      { userId: parseInt(userId) },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.data.code === 200) {
      ElMessage.success('审批通过')
      fetchActivities()
    }
  } catch (error) {
    console.error('审批失败:', error)
    ElMessage.error('审批失败')
  }
}

const handleReject = (row) => {
  rejectForm.value = {
    activityId: row.activityId,
    comments: ''
  }
  rejectDialogVisible.value = true
}

const rejectDialogVisible = ref(false)
const rejectFormRef = ref(null)
const rejectForm = ref({
  activityId: null,
  comments: ''
})
const rejectRules = {
  comments: [
    { required: true, message: '请输入拒绝理由', trigger: 'blur' },
    { min: 5, message: '拒绝理由至少5个字符', trigger: 'blur' }
  ]
}

const submitReject = async () => {
  if (!rejectFormRef.value) return

  await rejectFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true
        const token = localStorage.getItem('token')
        const userId = localStorage.getItem('userId')

        const response = await axios.put(
          `/api/activities/${rejectForm.value.activityId}/reject`,
          {
            userId: parseInt(userId),
            comments: rejectForm.value.comments,
            status: 'draft' // 将活动状态变成草稿
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.data.code === 200) {
          ElMessage.success('已拒绝')
          rejectDialogVisible.value = false
          fetchActivities()
        }
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const auditLogsDialogVisible = ref(false)
const auditLogs = ref([])

const handleViewAuditLogs = async (row) => {
  if (!canManageActivity(row)) {
    ElMessage.warning('你只能查看自己社团活动的审核记录')
    return
  }
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`/api/activities/${row.activityId}/audit-logs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (response.data.code === 200) {
      auditLogs.value = response.data.data
      auditLogsDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取审核记录失败:', error)
    ElMessage.error('获取审核记录失败')
  }
}

const descriptionDialogVisible = ref(false)
const currentDescription = ref('')

const handleViewDescription = (row) => {
  currentDescription.value = row.description
  descriptionDialogVisible.value = true
}

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

onMounted(async () => {
  if (!userStore.user) {
    await userStore.init()
  }
  await fetchClubs() // 先获取社团列表
  fetchActivities() // 再获取活动列表
})
</script>

<style scoped>
.activity-container {
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

.el-tag {
  margin-right: 5px;
}

.status-tag {
  text-transform: capitalize;
}

.operation-buttons {
  display: flex;
  gap: 5px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
