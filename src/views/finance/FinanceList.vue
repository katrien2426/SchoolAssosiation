<template>
  <div class="finance-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="left-section">
        <el-button type="primary" @click="handleAdd" v-if="canManageFinance">
          <el-icon>
            <Plus />
          </el-icon>新增财务记录
        </el-button>
      </div>

      <div class="filter-section">
        <el-form :inline="true" :model="filter" class="filter-form">
          <el-form-item label="收支类型">
            <el-select v-model="filter.type" placeholder="收支类型" clearable style="width: 100px;">
              <el-option label="收入" value="income" />
              <el-option label="支出" value="expense" />
            </el-select>
          </el-form-item>

          <el-form-item label="日期范围">
            <el-date-picker v-model="filter.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
              end-placeholder="结束日期" :shortcuts="dateShortcuts" value-format="YYYY-MM-DD" />
          </el-form-item>

          <el-form-item label="社团" width>
            <el-select v-model="filter.clubId" placeholder="选择社团" clearable style="width: 150px;">
              <el-option v-for="club in clubs" :key="club.clubId" :label="club.clubName" :value="club.clubId" />
            </el-select>
          </el-form-item>

          <el-form-item>
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
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 财务汇总 -->
    <div class="summary-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="summary-card income" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon>
                  <ArrowUp />
                </el-icon>
              </div>
              <div class="card-info">
                <div class="label">总收入</div>
                <div class="amount">¥ {{ formatAmount(summary.totalIncome) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="summary-card expense" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon>
                  <ArrowDown />
                </el-icon>
              </div>
              <div class="card-info">
                <div class="label">总支出</div>
                <div class="amount">¥ {{ formatAmount(summary.totalExpense) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="summary-card balance" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <el-icon>
                  <Money />
                </el-icon>
              </div>
              <div class="card-info">
                <div class="label">结余</div>
                <div class="amount">¥ {{ formatAmount(summary.balance) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 财务记录表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="records" style="width: 100%" v-loading="loading" :header-cell-style="{ background: '#f5f7fa' }">
        <el-table-column prop="transactionDate" label="日期" width="150">
          <template #default="scope">
            {{ formatDate(scope.row.transactionDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'income' ? 'success' : 'danger'" effect="dark">
              {{ scope.row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="150">
          <template #default="scope">
            <span :class="['amount-text', scope.row.type === 'income' ? 'income-text' : 'expense-text']">
              {{ scope.row.type === 'income' ? '+' : '-' }} ¥{{ formatAmount(scope.row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="clubName" label="相关社团" width="150" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip min-width="200" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button type="primary" @click="handleEdit(scope.row)" :icon="Edit">
                编辑
              </el-button>
              <el-button type="danger" @click="handleDelete(scope.row)" :icon="Delete">
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 财务记录表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑财务记录' : '新增财务记录'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 460px">
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="income">收入</el-radio>
            <el-radio label="expense">支出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :precision="2" :step="100" :min="0" style="width: 180px" />
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker v-model="form.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD"
            style="width: 180px" />
        </el-form-item>
        <el-form-item label="相关社团" prop="clubId">
          <el-select v-model="form.clubId" placeholder="请选择社团" style="width: 180px">
            <el-option v-for="club in clubs" :key="club.clubId" :label="club.clubName" :value="club.clubId" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入详细描述" />
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  Edit,
  Delete,
  Plus,
  Search,
  Refresh,
  ArrowUp,
  ArrowDown,
  Money
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

// 检查是否是管理员
const isAdmin = computed(() => userStore.isAdmin)
const currentUserId = computed(() => userStore.user?.userId)

// 如果不是管理员，重定向到首页
onMounted(() => {
  if (!isAdmin.value) {
    ElMessage.error('您没有权限访问此页面')
    router.push('/')
    return
  }
  fetchRecords()
  fetchClubs()
})

// 权限控制
const canManageFinance = computed(() => isAdmin.value)
const canEditRecord = computed(() => isAdmin.value)
const canDeleteRecord = computed(() => isAdmin.value)

// 数据
const records = ref([])
const clubs = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref()

// 筛选条件
const filter = ref({
  type: '',
  dateRange: null,
  clubId: null
})

// 分页
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 汇总数据
const summary = ref({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0
})

// 表单数据
const form = ref({
  id: '',
  type: 'income',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  clubId: '',
  description: ''
})

// 表单验证规则
const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  clubId: [{ required: true, message: '请选择相关社团', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
}

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 1)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 3)
      return [start, end]
    }
  }
]

// 方法
const fetchRecords = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (filter.value.type) params.append('type', filter.value.type)
    if (filter.value.dateRange) {
      params.append('startDate', filter.value.dateRange[0])
      params.append('endDate', filter.value.dateRange[1])
    }
    if (filter.value.clubId) params.append('clubId', filter.value.clubId)
    params.append('page', pagination.value.currentPage.toString())
    params.append('size', pagination.value.pageSize.toString())

    const response = await request.get(`/api/finances?${params.toString()}`)

    if (response.data.code === 200) {
      records.value = Array.isArray(response.data.data.records) ? response.data.data.records : []
      pagination.value.total = response.data.data.total || 0
      summary.value = response.data.data.summary || {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0
      }
    }
  } catch (error) {
    console.error('获取财务记录失败:', error)
    ElMessage.error('获取财务记录失败')
    records.value = []
    pagination.value.total = 0
    summary.value = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0
    }
  } finally {
    loading.value = false
  }
}

const fetchClubs = async () => {
  try {
    const response = await request.get('/api/clubs')
    if (response.data.code === 200) {
      clubs.value = Array.isArray(response.data.data) ? response.data.data : []
    }
  } catch (error) {
    console.error('获取社团列表失败:', error)
    ElMessage.error('获取社团列表失败')
    clubs.value = []
  }
}

const handleFilter = () => {
  pagination.value.currentPage = 1
  fetchRecords()
}

const resetFilter = () => {
  filter.value = {
    type: '',
    dateRange: null,
    clubId: null
  }
  handleFilter()
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  fetchRecords()
}

const handleCurrentChange = (page) => {
  pagination.value.currentPage = page
  fetchRecords()
}

const handleAdd = () => {
  form.value = {
    id: '',
    type: 'income',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    clubId: '',
    description: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  form.value = {
    id: row.recordId,
    type: row.type,
    amount: row.amount,
    date: row.transactionDate ? row.transactionDate.split(' ')[0] : '',
    clubId: row.clubId,
    description: row.description
  }
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该财务记录吗？此操作不可恢复！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await request.delete(`/api/finances/${row.id}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchRecords()
      }
    } catch (error) {
      console.error('删除财务记录失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const url = form.value.id ?
          `/api/finances/${form.value.id}` : '/api/finances'
        const method = form.value.id ? 'put' : 'post'

        // 将日期转换为日期时间格式
        const formData = {
          ...form.value,
          recordedBy: currentUserId.value,
          transactionDate: form.value.date ? `${form.value.date} 00:00:00` : null
        }

        const response = await request[method](url, formData)

        if (response.data.code === 200) {
          ElMessage.success(form.value.id ? '更新成功' : '创建成功')
          dialogVisible.value = false
          fetchRecords()
        } else {
          ElMessage.error(response.data.message || '操作失败')
        }
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('提交失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const formatDate = (date) => {
  if (!date) return ''
  // 只返回日期部分 YYYY-MM-DD
  return date.split(' ')[0]
}

const formatAmount = (amount) => {
  return amount?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0.00'
}

const getClubName = (clubId) => {
  const club = clubs.value.find(club => club.clubId === clubId)
  return club ? club.clubName : ''
}
</script>

<style scoped>
.finance-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.filter-section {
  flex-grow: 1;
  margin-left: 20px;
}

.summary-section {
  margin-bottom: 20px;
}

.summary-card {
  height: 100px;
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.income .card-icon {
  background-color: #f0f9eb;
  color: #67c23a;
}

.expense .card-icon {
  background-color: #fef0f0;
  color: #f56c6c;
}

.balance .card-icon {
  background-color: #f4f4f5;
  color: #909399;
}

.card-info {
  flex-grow: 1;
}

.label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.amount {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.amount-text {
  font-weight: bold;
}

.income-text {
  color: #67c23a;
}

.expense-text {
  color: #f56c6c;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

:deep(.el-table .cell) {
  white-space: nowrap;
}

:deep(.el-table) {
  margin-top: 10px; 
}


.selected-option {
  margin-top: 5px;
  color: #409EFF;
}
</style>