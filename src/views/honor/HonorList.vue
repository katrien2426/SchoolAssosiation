<template>
  <div class="honor-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Plus />
        </el-icon>新增荣誉
      </el-button>

      <div class="filter-section">
        <el-input v-model="searchQuery" placeholder="请输入荣誉名称" clearable style="width: 200px">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>

        <el-select v-model="searchLevel" placeholder="请选择荣誉级别" clearable style="width: 200px">
          <el-option label="全部" value=""></el-option>
          <el-option label="校级" value="SCHOOL"></el-option>
          <el-option label="市级" value="CITY"></el-option>
          <el-option label="省级" value="PROVINCE"></el-option>
          <el-option label="国家级" value="NATIONAL"></el-option>
        </el-select>

        <el-select v-model="searchClub" placeholder="请选择获奖社团" clearable style="width: 200px">
          <el-option label="全部" value=""></el-option>
          <el-option v-for="club in clubs" :key="club.clubId" :label="club.clubName" :value="club.clubId"></el-option>
        </el-select>

        <el-button type="primary" @click="handleSearch">
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
      <el-table :data="honors.slice((currentPage - 1) * pageSize, currentPage * pageSize)" style="width: 100%" v-loading="loading"
        :header-cell-style="{ background: '#f5f7fa' }">
        <el-table-column prop="honorName" label="荣誉名称" />
        <el-table-column prop="clubName" label="获奖社团" />
        <el-table-column prop="honorLevel" label="荣誉级别">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.honorLevel)">
              {{ getLevelText(scope.row.honorLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="awardTime" label="获奖时间">
          <template #default="scope">
            {{ formatDate(scope.row.awardTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="issuingAuthority" label="颁发单位" />
        <el-table-column prop="description" label="描述">
          <template #default="scope">
            <el-button type="text" @click="handleViewDescription(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
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
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="honors.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 荣誉表单对话框 -->
      <el-dialog v-model="dialogVisible" :title="form.honorId ? '编辑荣誉' : '新增荣誉'" width="500px">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 460px">
          <el-form-item label="荣誉名称" prop="honorName">
            <el-input v-model="form.honorName" />
          </el-form-item>
          <el-form-item label="获奖社团" prop="clubId">
            <el-select v-model="form.clubId" placeholder="请选择社团">
              <el-option v-for="club in clubs" :key="club.clubId" :label="club.clubName" :value="club.clubId" />
            </el-select>
          </el-form-item>
          <el-form-item label="荣誉级别" prop="honorLevel">
            <el-select v-model="form.honorLevel" placeholder="请选择荣誉级别">
              <el-option label="校级" value="SCHOOL" />
              <el-option label="市级" value="CITY" />
              <el-option label="省级" value="PROVINCE" />
              <el-option label="国家级" value="NATIONAL" />
            </el-select>
          </el-form-item>
          <el-form-item label="获奖时间" prop="awardTime">
            <el-date-picker v-model="form.awardTime" type="datetime" placeholder="选择获奖时间" />
          </el-form-item>
          <el-form-item label="颁发单位" prop="issuingAuthority">
            <el-input v-model="form.issuingAuthority" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
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

      <!-- 描述详情对话框 -->
      <el-dialog v-model="descriptionDialogVisible" title="描述详情" width="500px">
        <p style="white-space: pre-wrap;">{{ currentDescription }}</p>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="descriptionDialogVisible = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh } from '@element-plus/icons-vue'
import axios from '../../utils/axios'
import dayjs from 'dayjs'

const honors = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref()
const clubs = ref([])
const descriptionDialogVisible = ref(false)
const currentDescription = ref('')

const form = ref({
  honorId: '',
  honorName: '',
  clubId: '',
  honorLevel: '',
  awardTime: '',
  issuingAuthority: '',
  description: ''
})

const rules = {
  honorName: [
    { required: true, message: '请输入荣誉名称', trigger: 'blur' }
  ],
  clubId: [
    { required: true, message: '请选择获奖社团', trigger: 'change' }
  ],
  honorLevel: [
    { required: true, message: '请选择荣誉级别', trigger: 'change' }
  ],
  awardTime: [
    { required: true, message: '请选择获奖时间', trigger: 'change' }
  ],
  issuingAuthority: [
    { required: true, message: '请输入颁发单位', trigger: 'blur' }
  ]
}

const searchQuery = ref('')
const searchLevel = ref('')
const searchClub = ref('')

const currentPage = ref(1)
const pageSize = ref(10)

const fetchHonors = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/club-honors')
    if (res.data.code === 200) {
      honors.value = res.data.data
    } else {
      ElMessage.error(res.data.msg || '获取荣誉列表失败')
    }
  } catch (error) {
    console.error('获取荣誉列表失败:', error)
    ElMessage.error('获取荣誉列表失败')
  } finally {
    loading.value = false
  }
}

const fetchClubs = async () => {
  try {
    const res = await axios.get('/api/clubs')
    if (res.data.code === 200) {
      clubs.value = res.data.data
    } else {
      ElMessage.error(res.data.msg || '获取社团列表失败')
    }
  } catch (error) {
    console.error('获取社团列表失败:', error)
    ElMessage.error('获取社团列表失败')
  }
}

const handleAdd = () => {
  form.value = {
    honorId: '',
    honorName: '',
    clubId: '',
    honorLevel: '',
    awardTime: '',
    issuingAuthority: '',
    description: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该荣誉记录吗？', '提示', {
      type: 'warning'
    })
    const res = await axios.delete(`/api/club-honors/${row.honorId}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchHonors()
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除荣誉失败:', error)
      ElMessage.error('删除荣誉失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate()

  submitting.value = true
  try {
    const method = form.value.honorId ? 'put' : 'post'
    const formattedForm = {
      ...form.value,
      awardTime: dayjs(form.value.awardTime).format('YYYY-MM-DDTHH:mm:ss.SSS')
    }
    const res = await axios[method]('/api/club-honors', formattedForm)
    if (res.data.code === 200) {
      ElMessage.success(`${form.value.honorId ? '更新' : '创建'}成功`)
      dialogVisible.value = false
      fetchHonors()
    } else {
      ElMessage.error(res.data.msg || `${form.value.honorId ? '更新' : '创建'}失败`)
    }
  } catch (error) {
    console.error(`${form.value.honorId ? '更新' : '创建'}荣誉失败:`, error)
    ElMessage.error(`${form.value.honorId ? '更新' : '创建'}失败`)
  } finally {
    submitting.value = false
  }
}

const handleViewDescription = (row) => {
  currentDescription.value = row.description || '暂无描述'
  descriptionDialogVisible.value = true
}

const handleSearch = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/club-honors', {
      params: {
        honorName: searchQuery.value,
        honorLevel: searchLevel.value,
        clubId: searchClub.value
      }
    })
    if (res.data.code === 200) {
      honors.value = res.data.data
    } else {
      ElMessage.error(res.data.msg || '查询荣誉列表失败')
    }
  } catch (error) {
    console.error('查询荣誉列表失败:', error)
    ElMessage.error('查询荣誉列表失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const getLevelType = (level) => {
  switch (level) {
    case 'SCHOOL': return ''
    case 'CITY': return 'info'
    case 'PROVINCE': return 'warning'
    case 'NATIONAL': return 'success'
    default: return ''
  }
}

const getLevelText = (level) => {
  switch (level) {
    case 'SCHOOL': return '校级'
    case 'CITY': return '市级'
    case 'PROVINCE': return '省级'
    case 'NATIONAL': return '国家级'
    default: return level
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

onMounted(() => {
  fetchHonors()
  fetchClubs()
})
</script>

<style scoped>
.honor-container {
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
</style>
